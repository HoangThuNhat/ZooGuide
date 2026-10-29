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

cur.execute("""
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name IN ('AREAS', 'ENCLOSURES', 'ANIMALS', 'SPECIES')
    ORDER BY table_name, ordinal_position;
""")
cols = cur.fetchall()
for c in cols:
    print(f"{c['table_name']}.{c['column_name']} ({c['data_type']}, nullable={c['is_nullable']})")

print("\n--- FOREIGN KEYS ---")
cur.execute("""
    SELECT
        tc.table_name, kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name IN ('AREAS', 'ENCLOSURES', 'ANIMALS', 'SPECIES');
""")
for fk in cur.fetchall():
    print(f"{fk['table_name']}.{fk['column_name']} -> {fk['foreign_table_name']}.{fk['foreign_column_name']}")

print("\n--- CURRENT AREAS ---")
cur.execute('SELECT * FROM "AREAS" ORDER BY "AreaId";')
for r in cur.fetchall():
    print(r)

print("\n--- CURRENT ENCLOSURES ---")
cur.execute('SELECT * FROM "ENCLOSURES" ORDER BY "EnclosureId";')
for r in cur.fetchall():
    print(r)

print("\n--- CURRENT ANIMALS ---")
cur.execute('SELECT "AnimalId", "Name", "SpeciesId", "EnclosureId", "AreaId" FROM "ANIMALS" ORDER BY "AnimalId";')
for r in cur.fetchall():
    print(r)

conn.close()
