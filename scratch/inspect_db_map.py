import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()
conn_str = os.getenv('SUPABASE_CONNECTION_STRING')
params = {}
for part in conn_str.split(';'):
    if '=' in part:
        k, v = part.split('=', 1)
        k = k.strip().lower()
        v = v.strip()
        if k == 'host': params['host'] = v
        elif k == 'port': params['port'] = int(v)
        elif k == 'database': params['dbname'] = v
        elif k == 'username': params['user'] = v
        elif k == 'password': params['password'] = v
        elif k == 'ssl mode': params['sslmode'] = v.lower()

conn = psycopg2.connect(**params)
cur = conn.cursor(cursor_factory=RealDictCursor)

for table in ['AREAS', 'ENCLOSURES', 'POINTS_OF_INTEREST', 'SPECIES', 'ANIMALS']:
    cur.execute(f'SELECT count(*) FROM "{table}"')
    cnt = cur.fetchone()['count']
    print(f'Table {table}: {cnt} rows')

print('\n=== CURRENT AREAS ===')
cur.execute('SELECT "AreaId", "Name", "Description", "Latitude", "Longitude", "RadiusMeters", "Status" FROM "AREAS" ORDER BY "AreaId";')
for r in cur.fetchall():
    print(r)

print('\n=== CURRENT ENCLOSURES ===')
cur.execute('SELECT "EnclosureId", "AreaId", "Code", "Name", "Latitude", "Longitude", "Status" FROM "ENCLOSURES" ORDER BY "EnclosureId";')
for r in cur.fetchall():
    print(r)

print('\n=== CURRENT POINTS OF INTEREST ===')
cur.execute('SELECT "PoiId", "AreaId", "Code", "Name", "Latitude", "Longitude", "Category", "IsActive" FROM "POINTS_OF_INTEREST" ORDER BY "PoiId";')
for r in cur.fetchall():
    print(r)

print('\n=== CURRENT ANIMALS AND ENCLOSURE / AREA MAPPING ===')
cur.execute('SELECT "AnimalId", "Name", "SpeciesId", "AreaId", "EnclosureId" FROM "ANIMALS" ORDER BY "AnimalId";')
for r in cur.fetchall():
    print(r)

conn.close()
