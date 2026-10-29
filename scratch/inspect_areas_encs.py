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

print("--- AREAS ---")
cur.execute('SELECT "AreaId", "Name", "Latitude", "Longitude", "Status" FROM "AREAS" ORDER BY "AreaId";')
for r in cur.fetchall():
    print(r)

print("\n--- ENCLOSURES ---")
cur.execute('SELECT "EnclosureId", "AreaId", "Code", "Name", "Latitude", "Longitude", "Status" FROM "ENCLOSURES" ORDER BY "EnclosureId";')
for r in cur.fetchall():
    print(r)

conn.close()
