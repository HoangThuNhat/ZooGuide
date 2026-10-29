import os
import json
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()

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

conn = psycopg2.connect(**params)
cur = conn.cursor(cursor_factory=RealDictCursor)

print("--- SPECIES ---")
cur.execute('SELECT "SpeciesId", "Name", "ScientificName", "ImageUrl", "ConservationStatus" FROM "SPECIES" ORDER BY "SpeciesId";')
species = cur.fetchall()
for s in species:
    print(f"[{s['SpeciesId']}] {s['Name']} ({s['ScientificName']}) - Img: {s['ImageUrl']}")

print("\n--- ANIMALS ---")
cur.execute('SELECT "AnimalId", "SpeciesId", "AreaId", "EnclosureId", "Name", "ImageUrl", "Status" FROM "ANIMALS" ORDER BY "AnimalId";')
animals = cur.fetchall()
for a in animals:
    print(f"[{a['AnimalId']}] Species={a['SpeciesId']} | Area={a['AreaId']} | Enc={a['EnclosureId']} | Name={a['Name']} | Img={a['ImageUrl']}")

print("\n--- NARRATIONS SUMMARY ---")
cur.execute("""
    SELECT n."NarrationId", n."AnimalId", n."LanguageId", l."Code" as lang, n."Title", n."AudioUrl", n."DurationSeconds"
    FROM "NARRATIONS" n
    JOIN "LANGUAGES" l ON n."LanguageId" = l."LanguageId"
    ORDER BY n."AnimalId", n."LanguageId";
""")
narrations = cur.fetchall()
print(f"Total Narrations: {len(narrations)}")
for n in narrations[:12]:
    print(f"Narr {n['NarrationId']} | Animal={n['AnimalId']} | Lang={n['lang']} | Title={n['Title'][:40]} | Audio={n['AudioUrl']}")

print("\n--- AUDIOS SUMMARY ---")
cur.execute("""
    SELECT "AudioId", "NarrationId", "LanguageCode", "VoiceName", "ObjectPath", "PublicUrl", "DurationSeconds", "IsVerified"
    FROM "AUDIOS"
    ORDER BY "AudioId" LIMIT 12;
""")
audios = cur.fetchall()
for au in audios:
    print(f"Audio {au['AudioId']} | Narr={au['NarrationId']} | Lang={au['LanguageCode']} | Path={au['ObjectPath']} | Url={au['PublicUrl']}")

print("\n--- CONTENT_TRANSLATIONS SUMMARY ---")
cur.execute("""
    SELECT "EntityType", count(*) 
    FROM "CONTENT_TRANSLATIONS" 
    GROUP BY "EntityType";
""")
for ct in cur.fetchall():
    print(f"  {ct['EntityType']}: {ct['count']} translations")

conn.close()
