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
    WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'AREAS';
""")
for fk in cur.fetchall():
    print(f"{fk['table_name']}.{fk['column_name']} references AREAS.{fk['foreign_column_name']}")

print("\n--- Check usage of each AreaId ---")
cur.execute('SELECT "AreaId", "Name", "Status" FROM "AREAS" ORDER BY "AreaId";')
areas = cur.fetchall()
for a in areas:
    aid = a['AreaId']
    cur.execute('SELECT count(*) as c FROM "ENCLOSURES" WHERE "AreaId" = %s;', (aid,))
    c_enc = cur.fetchone()['c']
    cur.execute('SELECT count(*) as c FROM "ANIMALS" WHERE "AreaId" = %s;', (aid,))
    c_ani = cur.fetchone()['c']
    cur.execute('SELECT count(*) as c FROM "POINTS_OF_INTEREST" WHERE "AreaId" = %s;', (aid,))
    c_poi = cur.fetchone()['c']
    print(f"Area {aid} ({a['Name']}, Status={a['Status']}): {c_enc} enclosures, {c_ani} animals, {c_poi} pois")

conn.close()
