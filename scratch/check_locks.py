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
    SELECT pid, state, wait_event_type, wait_event, query 
    FROM pg_stat_activity 
    WHERE datname = current_database() AND pid <> pg_backend_pid();
""")
rows = cur.fetchall()
print(f"Active connections ({len(rows)}):")
for r in rows:
    print(f"PID {r['pid']} | State: {r['state']} | Wait: {r['wait_event_type']}:{r['wait_event']} | Query: {r['query'][:80] if r['query'] else 'None'}")

conn.close()
