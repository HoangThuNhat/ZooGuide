import os, psycopg2
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
cur.execute('SELECT "AnimalId", "SpeciesId", "Name" FROM "ANIMALS" ORDER BY "AnimalId";')
for r in cur.fetchall():
    print(r)
cur.execute('SELECT DISTINCT "AnimalId" FROM "NARRATIONS" ORDER BY "AnimalId";')
print('Narrations AnimalIds:', [r['AnimalId'] for r in cur.fetchall()])
conn.close()
