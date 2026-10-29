import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

conn_str = os.getenv("SUPABASE_CONNECTION_STRING")
if not conn_str:
    print("ERROR: SUPABASE_CONNECTION_STRING not set in .env")
    exit(1)

# Parse connection string if it's key=value format (Npgsql style)
params = {}
for part in conn_str.split(";"):
    if "=" in part:
        k, v = part.split("=", 1)
        k = k.strip().lower()
        v = v.strip()
        if k == "host":
            params["host"] = v
        elif k == "port":
            params["port"] = int(v)
        elif k == "database":
            params["dbname"] = v
        elif k == "username":
            params["user"] = v
        elif k == "password":
            params["password"] = v
        elif k == "ssl mode":
            params["sslmode"] = v.lower()

try:
    conn = psycopg2.connect(**params)
    cur = conn.cursor()
    cur.execute("SELECT version();")
    ver = cur.fetchone()[0]
    cur.execute("SELECT current_database(), current_user;")
    db, user = cur.fetchone()
    print(f"SUCCESS: Connected to database '{db}' as user '{user}'")
    print(f"Server version: {ver.split(',')[0]}")
    
    # Check all public tables
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """)
    tables = [r[0] for r in cur.fetchall()]
    print(f"\nPublic Tables ({len(tables)}):")
    for t in tables:
        cur.execute(f'SELECT count(*) FROM "{t}";')
        cnt = cur.fetchone()[0]
        print(f"  - {t}: {cnt} rows")
        
    conn.close()
except Exception as e:
    print(f"Connection error: {type(e).__name__}: {e}")
