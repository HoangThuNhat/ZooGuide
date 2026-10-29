import os
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

print("=== VERIFY DATABASE COUNTS ===")
for t in ["AREAS", "ENCLOSURES", "ANIMALS", "SPECIES", "POINTS_OF_INTEREST", "CONTENT_TRANSLATIONS"]:
    cur.execute(f'SELECT count(*) as c FROM "{t}";')
    print(f"{t}: {cur.fetchone()['c']} rows")

print("\n=== ANIMALS WITH NULL ENCLOSURE ===")
cur.execute('SELECT "AnimalId", "Name" FROM "ANIMALS" WHERE "EnclosureId" IS NULL;')
rows = cur.fetchall()
print(f"Animals with NULL EnclosureId: {len(rows)}")
for r in rows:
    print(r)

print("\n=== ENCLOSURES PER AREA ===")
cur.execute("""
    SELECT a."AreaId", a."Name", a."Code", count(e."EnclosureId") as enc_count
    FROM "AREAS" a
    LEFT JOIN "ENCLOSURES" e ON a."AreaId" = e."AreaId"
    GROUP BY a."AreaId", a."Name", a."Code"
    ORDER BY a."AreaId";
""")
for r in cur.fetchall():
    print(r)

print("\n=== ANIMALS PER ENCLOSURE ===")
cur.execute("""
    SELECT e."EnclosureId", e."Code", e."Name", a."AreaId", count(an."AnimalId") as animal_count
    FROM "ENCLOSURES" e
    JOIN "AREAS" a ON e."AreaId" = a."AreaId"
    LEFT JOIN "ANIMALS" an ON e."EnclosureId" = an."EnclosureId"
    GROUP BY e."EnclosureId", e."Code", e."Name", a."AreaId"
    ORDER BY e."EnclosureId";
""")
for r in cur.fetchall():
    print(r)

conn.close()
