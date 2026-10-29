import os
import json
import hashlib
import asyncio
import requests
import datetime
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
import edge_tts

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "narration-audio")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

conn_str = os.getenv("SUPABASE_CONNECTION_STRING")
params = {}
for part in conn_str.split(";"):
    if "=" in part:
        k, v = part.split("=", 1)
        k = k.strip().lower()
        v = v.strip()
        if k == "host": params["host"] = v
        elif k == "port": params["port"] = int(v)
        elif k == "database": params["dbname"] = v
        elif k == "username": params["user"] = v
        elif k == "password": params["password"] = v
        elif k == "ssl mode": params["sslmode"] = v.lower()

from load_species import SPECIES_DATA
from narrations_data import FEATURED_NARRATIONS

CACHE_DIR = os.path.join("scratch", "audio_cache")
os.makedirs(CACHE_DIR, exist_ok=True)

LANG_VOICE_MAP = {
    "vi": ("vi-VN-HoaiMyNeural", 1),
    "en": ("en-US-JennyNeural", 2),
    "zh": ("zh-CN-XiaoxiaoNeural", 3),
    "ja": ("ja-JP-NanamiNeural", 4),
    "ko": ("ko-KR-SunHiNeural", 9),
    "th": ("th-TH-NiwatNeural", 10),
    "fr": ("fr-FR-DeniseNeural", 11),
    "es": ("es-ES-ElviraNeural", 12),
    "de": ("de-DE-KatjaNeural", 13),
    "ru": ("ru-RU-SvetlanaNeural", 14),
    "pt": ("pt-BR-FranciscaNeural", 15),
    "id": ("id-ID-GadisNeural", 16)
}

async def generate_speech_with_retry(text, voice, cache_path, max_retries=3):
    meta_path = cache_path + ".meta.json"
    if os.path.exists(cache_path) and os.path.getsize(cache_path) > 1000 and os.path.exists(meta_path):
        with open(cache_path, "rb") as f:
            audio_bytes = f.read()
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
        return audio_bytes, meta.get("duration", max(10, round(len(text) / 18)))

    for attempt in range(1, max_retries + 1):
        try:
            comm = edge_tts.Communicate(text, voice)
            audio_data = bytearray()
            max_duration = 0.0
            async for chunk in comm.stream():
                if chunk["type"] == "audio":
                    audio_data.extend(chunk["data"])
                elif chunk["type"] == "SentenceBoundary":
                    dur = (chunk["offset"] + chunk["duration"]) / 10000000.0
                    if dur > max_duration:
                        max_duration = dur
            duration_sec = round(max_duration)
            if duration_sec <= 0:
                duration_sec = max(10, round(len(text) / 18))
            
            audio_bytes = bytes(audio_data)
            with open(cache_path, "wb") as f:
                f.write(audio_bytes)
            with open(meta_path, "w", encoding="utf-8") as f:
                json.dump({"duration": duration_sec, "size": len(audio_bytes)}, f)
            return audio_bytes, duration_sec
        except Exception as e:
            print(f"    [Retry {attempt}/{max_retries}] ({type(e).__name__}): {e}")
            if attempt < max_retries:
                await asyncio.sleep(2 * attempt)
            else:
                raise

def upload_to_supabase(object_path, audio_bytes):
    endpoint = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{object_path}"
    headers = {
        "Authorization": f"Bearer {SERVICE_KEY}",
        "apikey": SERVICE_KEY,
        "x-upsert": "true",
        "Content-Type": "audio/mpeg"
    }
    resp = requests.post(endpoint, headers=headers, data=audio_bytes, timeout=30)
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Upload failed: HTTP {resp.status_code} - {resp.text}")
    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{object_path}"

def save_local_mirror(object_path, audio_bytes):
    target_dirs = [
        os.path.join("src", "API", "wwwroot", "storage", BUCKET),
        os.path.join("web", "public", "storage", BUCKET),
        os.path.join("web", "dist", "storage", BUCKET)
    ]
    for base in target_dirs:
        full_path = os.path.join(base, object_path.replace("/", os.sep))
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "wb") as f:
            f.write(audio_bytes)

async def main():
    print("=================================================================")
    print("ZOOGUIDE - EXECUTING DATA CLEANING & REBUILDING PIPELINE")
    print("=================================================================\n")

    # Step 1: Pre-generate & upload all audio files for 12 languages
    print(f"--- STEP 1: Generating and Uploading Audio for {len(FEATURED_NARRATIONS)} Featured Animals x 12 Languages = {len(FEATURED_NARRATIONS) * 12} files ---")
    audio_manifest = {} # key: (animal_id, lang) -> metadata dict

    for a_idx, item in enumerate(FEATURED_NARRATIONS, 1):
        slug = item["slug"]
        animal_id = item["animal_id"]
        print(f"\n[{a_idx}/{len(FEATURED_NARRATIONS)}] Processing animal: {slug} (AnimalId={animal_id})...")

        for lang, (voice, lang_id) in LANG_VOICE_MAP.items():
            trans = item["translations"].get(lang)
            if not trans:
                print(f"  [WARN] Missing translation for lang {lang}")
                continue
            
            content = trans["content"]
            title = trans["title"]
            obj_path = f"{lang}/animal_{animal_id}_{lang}.mp3"
            cache_file = os.path.join(CACHE_DIR, f"{slug}_{lang}.mp3")
            
            print(f"  -> [{lang}] Generating/Caching voice {voice}...")
            try:
                audio_bytes, duration_sec = await generate_speech_with_retry(content, voice, cache_file)
                sha256 = hashlib.sha256(audio_bytes).hexdigest()
                file_size = len(audio_bytes)
                
                print(f"     File size: {file_size} bytes, Duration: {duration_sec}s. Uploading to Supabase Storage: {obj_path}...")
                public_url = upload_to_supabase(obj_path, audio_bytes)
                save_local_mirror(obj_path, audio_bytes)
                
                audio_manifest[(animal_id, lang)] = {
                    "lang_id": lang_id,
                    "voice": voice,
                    "title": title,
                    "content": content,
                    "duration_sec": duration_sec,
                    "file_size": file_size,
                    "sha256": sha256,
                    "public_url": public_url,
                    "object_path": obj_path,
                    "file_name": f"animal_{animal_id}_{lang}.mp3"
                }
            except Exception as e:
                print(f"     [ERROR] Failed to process audio for {slug}_{lang}: {e}")
                raise

    print(f"\nSuccessfully generated, uploaded and mirrored all {len(audio_manifest)} audio files!")

    # Step 2: Database cleaning and transactional replacement
    print("\n--- STEP 2: Database Atomic Migration in PostgreSQL ---")
    conn = psycopg2.connect(**params)
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Check current counts
        cur.execute('SELECT count(*) FROM "AUDIOS";')
        old_audios = cur.fetchone()['count']
        cur.execute('SELECT count(*) FROM "NARRATIONS";')
        old_narrations = cur.fetchone()['count']
        cur.execute('SELECT count(*) FROM "ANIMALS";')
        old_animals = cur.fetchone()['count']
        cur.execute('SELECT count(*) FROM "SPECIES";')
        old_species = cur.fetchone()['count']
        cur.execute('SELECT count(*) FROM "CONTENT_TRANSLATIONS" WHERE "EntityType" IN (\'Species\', \'Animal\');')
        old_translations = cur.fetchone()['count']

        print(f"Pre-cleaning counts in Supabase:")
        print(f"  - SPECIES: {old_species}")
        print(f"  - ANIMALS: {old_animals}")
        print(f"  - NARRATIONS: {old_narrations}")
        print(f"  - AUDIOS: {old_audios}")
        print(f"  - CONTENT_TRANSLATIONS (Species/Animal): {old_translations}")

        # Delete in foreign key safe order
        print("\nCleaning old animal/species mock data from Supabase...")
        cur.execute('DELETE FROM "AUDIOS";')
        cur.execute('DELETE FROM "NARRATIONS";')
        cur.execute('DELETE FROM "CONTENT_TRANSLATIONS" WHERE "EntityType" IN (\'Species\', \'Animal\');')
        cur.execute('DELETE FROM "ANIMALS";')
        cur.execute('DELETE FROM "SPECIES";')

        # Reset identities
        cur.execute('ALTER SEQUENCE IF EXISTS "SPECIES_SpeciesId_seq" RESTART WITH 1;')
        cur.execute('ALTER SEQUENCE IF EXISTS "ANIMALS_AnimalId_seq" RESTART WITH 1;')
        cur.execute('ALTER SEQUENCE IF EXISTS "NARRATIONS_NarrationId_seq" RESTART WITH 1;')
        cur.execute('ALTER SEQUENCE IF EXISTS "AUDIOS_AudioId_seq" RESTART WITH 1;')

        # Insert new SPECIES
        print(f"\nInserting {len(SPECIES_DATA)} verified Saigon Zoo species...")
        species_id_map = {} # old_id -> new_id
        for sp in SPECIES_DATA:
            cur.execute("""
                INSERT INTO "SPECIES" ("Name", "ScientificName", "Description", "ConservationStatus", "ImageUrl", "Habitat", "Diet", "Lifespan", "ReferenceSource", "CreatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, now())
                RETURNING "SpeciesId";
            """, (
                sp["name"],
                sp["scientific_name"],
                sp["description"],
                sp["conservation_status"],
                sp["image_url"],
                sp["habitat"],
                sp["diet"],
                sp["lifespan"],
                sp["reference_source"]
            ))
            new_sp_id = cur.fetchone()["SpeciesId"]
            species_id_map[sp["id"]] = new_sp_id
            sp["new_id"] = new_sp_id
            print(f"  + Species #{new_sp_id}: {sp['name']} ({sp['scientific_name']})")

        # Insert new ANIMALS
        print(f"\nInserting {len(SPECIES_DATA)} verified Saigon Zoo resident animals...")
        animal_id_map = {} # sp_id -> animal_id
        for sp in SPECIES_DATA:
            sp_id = sp["new_id"]
            cur.execute("""
                INSERT INTO "ANIMALS" ("SpeciesId", "AreaId", "EnclosureId", "Name", "Description", "Gender", "DateOfBirth", "Origin", "HealthStatus", "ConservationNote", "ImageUrl", "ReferenceSource", "Status", "CreatedAt")
                VALUES (%s, %s, %s, %s, %s, 'Unknown', NULL, 'Thảo Cầm Viên Sài Gòn', 'Khỏe mạnh - Theo dõi định kỳ', 'Nằm trong chương trình bảo tồn loài', %s, %s, 'Active', now())
                RETURNING "AnimalId";
            """, (
                sp_id,
                sp["area_id"],
                sp["enclosure_id"],
                sp["animal_name"],
                sp["animal_desc"],
                sp["image_url"],
                sp["animal_ref"]
            ))
            new_a_id = cur.fetchone()["AnimalId"]
            animal_id_map[sp["id"]] = new_a_id
            sp["new_animal_id"] = new_a_id
            print(f"  + Animal #{new_a_id}: {sp['animal_name']} -> Species #{sp_id} (Area #{sp['area_id']})")

        # Insert new NARRATIONS & AUDIOS
        print(f"\nInserting NARRATIONS & AUDIOS for 12 languages...")
        narr_count = 0
        audio_count = 0

        for item in FEATURED_NARRATIONS:
            orig_sp_id = item["species_id"]
            new_animal_id = animal_id_map[orig_sp_id]
            slug = item["slug"]

            for lang, (voice, lang_id) in LANG_VOICE_MAP.items():
                m = audio_manifest.get((item["animal_id"], lang))
                if not m: continue

                # Insert NARRATION
                cur.execute("""
                    INSERT INTO "NARRATIONS" ("AnimalId", "LanguageId", "Title", "Content", "AudioUrl", "DurationSeconds", "Status", "ReferenceSource", "CreatedBy", "CreatedAt")
                    VALUES (%s, %s, %s, %s, %s, %s, 'Published', %s, 1, now())
                    RETURNING "NarrationId";
                """, (
                    new_animal_id,
                    lang_id,
                    m["title"],
                    m["content"],
                    m["public_url"],
                    m["duration_sec"],
                    SPECIES_DATA[orig_sp_id - 1]["reference_source"]
                ))
                new_narr_id = cur.fetchone()["NarrationId"]
                narr_count += 1

                # Insert AUDIO
                cur.execute("""
                    INSERT INTO "AUDIOS" ("NarrationId", "FileUrl", "FileName", "MimeType", "DurationSeconds", "FileSize", "StorageBucket", "ObjectPath", "PublicUrl", "LanguageCode", "VoiceName", "TtsProvider", "Sha256Hash", "IsVerified", "Status", "CreatedAt")
                    VALUES (%s, %s, %s, 'audio/mpeg', %s, %s, %s, %s, %s, %s, %s, 'Azure-EdgeTTS', %s, TRUE, 'Active', now())
                    RETURNING "AudioId";
                """, (
                    new_narr_id,
                    m["public_url"],
                    m["file_name"],
                    m["duration_sec"],
                    m["file_size"],
                    BUCKET,
                    m["object_path"],
                    m["public_url"],
                    lang,
                    m["voice"],
                    m["sha256"]
                ))
                new_audio_id = cur.fetchone()["AudioId"]
                audio_count += 1

        print(f"Inserted {narr_count} NARRATIONS and {audio_count} AUDIOS.")

        # Insert CONTENT_TRANSLATIONS for 12 languages for all 22 species
        print(f"\nInserting CONTENT_TRANSLATIONS for {len(SPECIES_DATA)} species across 12 languages...")
        ct_count = 0
        for sp in SPECIES_DATA:
            new_sp_id = sp["new_id"]
            sp_name_vi = sp["name"]
            sci_name = sp["scientific_name"]
            
            for lang, (_, _) in LANG_VOICE_MAP.items():
                cur.execute("""
                    INSERT INTO "CONTENT_TRANSLATIONS" ("EntityType", "EntityId", "EntityKey", "LanguageCode", "Title", "Summary", "Description", "TranslationStatus", "IsPublished", "SourceReference", "CreatedAt")
                    VALUES ('Species', %s, %s, %s, %s, %s, %s, 'Published', TRUE, %s, now())
                    ON CONFLICT DO NOTHING;
                """, (
                    new_sp_id,
                    f"species_{new_sp_id}",
                    lang,
                    sp_name_vi if lang == 'vi' else f"{sp_name_vi} ({sci_name})",
                    sp["description"],
                    f"Tên khoa học: {sci_name}. Sinh cảnh: {sp['habitat']}. Thức ăn: {sp['diet']}. Tình trạng: {sp['conservation_status']}",
                    sp["reference_source"]
                ))
                ct_count += 1

        print(f"Inserted {ct_count} CONTENT_TRANSLATIONS.")

        # Commit transaction
        conn.commit()
        print("\n>>> TRANSACTION COMMITTED SUCCESSFULLY! <<<")

        # Step 3: Verification queries
        print("\n--- STEP 3: Verification of Database Records ---")
        cur.execute('SELECT count(*) FROM "SPECIES";')
        cnt_sp = cur.fetchone()['count']
        cur.execute('SELECT count(*) FROM "ANIMALS";')
        cnt_an = cur.fetchone()['count']
        cur.execute('SELECT count(*) FROM "NARRATIONS";')
        cnt_na = cur.fetchone()['count']
        cur.execute('SELECT count(*) FROM "AUDIOS";')
        cnt_au = cur.fetchone()['count']
        cur.execute('SELECT count(*) FROM "CONTENT_TRANSLATIONS";')
        cnt_ct = cur.fetchone()['count']

        print(f"Post-migration counts:")
        print(f"  - SPECIES: {cnt_sp} (expected {len(SPECIES_DATA)})")
        print(f"  - ANIMALS: {cnt_an} (expected {len(SPECIES_DATA)})")
        print(f"  - NARRATIONS: {cnt_na} (expected {narr_count})")
        print(f"  - AUDIOS: {cnt_au} (expected {audio_count})")
        print(f"  - CONTENT_TRANSLATIONS: {cnt_ct}")

        # Check sample narrations & audios
        cur.execute("""
            SELECT n."NarrationId", a."Name" as animal, s."ScientificName", l."Code" as lang, n."Title", a."ImageUrl", au."PublicUrl", au."IsVerified"
            FROM "NARRATIONS" n
            JOIN "ANIMALS" a ON n."AnimalId" = a."AnimalId"
            JOIN "SPECIES" s ON a."SpeciesId" = s."SpeciesId"
            JOIN "LANGUAGES" l ON n."LanguageId" = l."LanguageId"
            LEFT JOIN "AUDIOS" au ON au."NarrationId" = n."NarrationId"
            ORDER BY n."NarrationId" LIMIT 12;
        """)
        samples = cur.fetchall()
        print("\nSample verified narrations and audio files in Supabase:")
        for sm in samples:
            print(f"  [{sm['lang']}] {sm['animal']} ({sm['ScientificName']}) - Title: '{sm['Title'][:35]}' - Verified: {sm['IsVerified']}")

    except Exception as e:
        conn.rollback()
        print(f"\n[CRITICAL ERROR] Transaction rolled back: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    asyncio.run(main())
