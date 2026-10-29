import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

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

print("="*60)
print("ZOOGUIDE PHASE 2 E2E VERIFICATION REPORT")
print("="*60)

# 1. AREAS
print("\n[1] CANONICAL AREAS (AREAS):")
cur.execute('SELECT "AreaId", "Code", "Name", "Latitude", "Longitude", "Status", "ReferenceSource" FROM "AREAS" ORDER BY "AreaId";')
areas = cur.fetchall()
for a in areas:
    print(f"  • Area {a['AreaId']} [{a['Code']}]: {a['Name']} | Lat/Lng: ({a['Latitude']}, {a['Longitude']}) | Status: {a['Status']} | Source: {a['ReferenceSource']}")

# 2. ENCLOSURES
print("\n[2] CANONICAL ENCLOSURES (ENCLOSURES):")
cur.execute("""
    SELECT e."EnclosureId", e."Code", e."Name", e."AreaId", a."Name" as area_name, e."Latitude", e."Longitude", e."Status"
    FROM "ENCLOSURES" e
    JOIN "AREAS" a ON e."AreaId" = a."AreaId"
    ORDER BY e."AreaId", e."EnclosureId";
""")
encs = cur.fetchall()
for e in encs:
    print(f"  • Enclosure {e['EnclosureId']} [{e['Code']}]: {e['Name']} (in Area {e['AreaId']}: {e['area_name']}) | Lat/Lng: ({e['Latitude']}, {e['Longitude']}) | Status: {e['Status']}")

# 3. ANIMALS MAPPING
print("\n[3] RESIDENT ANIMALS TO ENCLOSURES & AREAS (ANIMALS):")
cur.execute("""
    SELECT an."AnimalId", an."Name" as animal_name, s."Name" as species_name, s."ScientificName",
           e."EnclosureId", e."Code" as enc_code, e."Name" as enc_name,
           a."AreaId", a."Code" as area_code, a."Name" as area_name
    FROM "ANIMALS" an
    JOIN "SPECIES" s ON an."SpeciesId" = s."SpeciesId"
    JOIN "ENCLOSURES" e ON an."EnclosureId" = e."EnclosureId"
    JOIN "AREAS" a ON an."AreaId" = a."AreaId"
    ORDER BY a."AreaId", an."AnimalId";
""")
mapped = cur.fetchall()
print(f"Total fully mapped animals: {len(mapped)} / 22")
for m in mapped:
    print(f"  • Animal {m['AnimalId']}: {m['animal_name']} ({m['species_name']} / {m['ScientificName']}) -> Enclosure {m['EnclosureId']} [{m['enc_code']} - {m['enc_name']}] in Area {m['AreaId']} [{m['area_code']}]")

# 4. CHECK ORPHAN ANIMALS
cur.execute('SELECT "AnimalId", "Name" FROM "ANIMALS" WHERE "EnclosureId" IS NULL OR "AreaId" IS NULL;')
orphans = cur.fetchall()
print(f"\n[4] ORPHAN ANIMALS (Missing Enclosure or Area): {len(orphans)}")
assert len(orphans) == 0, "Found orphan animals!"

# 5. SIMULATED MAP TAB CATEGORY MARKER COUNTS
print("\n[5] SIMULATED VISITOR MAPTab CATEGORIES & COUNTS:")
categories = {
    'carnivore': 0,
    'herbivore': 0,
    'bird': 0,
    'primate': 0,
    'petting': 0,
    'reptile': 0
}
for e in encs:
    areaId = e['AreaId']
    code = e['Code'].upper()
    if areaId == 7 or code.startswith(('ENC-TIG', 'ENC-LIO', 'ENC-LEO', 'ENC-CLO', 'ENC-GCA')):
        categories['carnivore'] += 1
    elif areaId == 3 or code.startswith(('ENC-ELE', 'ENC-HIP', 'ENC-RHI', 'ENC-GIR', 'ENC-ZEB', 'ENC-HOG')):
        categories['herbivore'] += 1
    elif areaId == 4 or code.startswith(('ENC-BIR', 'ENC-WRE', 'ENC-HOR', 'ENC-PEL', 'ENC-ARG', 'ENC-COC')):
        categories['bird'] += 1
    elif areaId == 6 or code.startswith(('ENC-PRI', 'ENC-ORA', 'ENC-GIB', 'ENC-DOU')):
        categories['primate'] += 1
    elif areaId == 2 or code.startswith('ENC-PET'):
        categories['petting'] += 1
    elif areaId == 1 or code.startswith('ENC-REP'):
        categories['reptile'] += 1

gates_count = 4 # Gate A, B, C, E
landmarks_count = 4 # Hung Temple, Museum, Century Tree, Lotus Lake
total_markers = sum(categories.values()) + gates_count + landmarks_count

print(f"  • Tất cả địa điểm (All): {total_markers}")
print(f"  • Động vật ăn thịt (Carnivore): {categories['carnivore']}")
print(f"  • Động vật ăn cỏ (Herbivore): {categories['herbivore']}")
print(f"  • Vườn chim (Bird): {categories['bird']}")
print(f"  • Linh trưởng (Primate): {categories['primate']}")
print(f"  • Thú thân thiện (Petting): {categories['petting']}")
print(f"  • Bò sát & Lưỡng cư (Reptile): {categories['reptile']}")
print(f"  • Cổng ra vào (Gates): {gates_count}")
print(f"  • Di tích & Cảnh quan (Landmarks): {landmarks_count}")

for cat, count in categories.items():
    assert count > 0, f"Category {cat} has 0 markers!"
print("\n>>> ALL CATEGORIES HAVE NON-ZERO VERIFIED MARKERS! <<<")

# 6. MULTILINGUAL CONTENT TRANSLATIONS
print("\n[6] CONTENT TRANSLATIONS IN DATABASE:")
cur.execute('SELECT "EntityType", count(*) as count FROM "CONTENT_TRANSLATIONS" GROUP BY "EntityType" ORDER BY "EntityType";')
for r in cur.fetchall():
    print(f"  • EntityType {r['EntityType']}: {r['count']} translations")

cur.execute('SELECT DISTINCT "LanguageCode" FROM "CONTENT_TRANSLATIONS" ORDER BY "LanguageCode";')
langs = [r['LanguageCode'] for r in cur.fetchall()]
print(f"Supported languages in translations: {langs} (Total: {len(langs)})")

conn.close()
print("\n" + "="*60)
print("ALL E2E VERIFICATION CHECKS PASSED SUCCESSFULLY!")
print("="*60)
