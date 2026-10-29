import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
import datetime
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

timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_dir = f"scratch/backups/backup_phase2_{timestamp}"
os.makedirs(backup_dir, exist_ok=True)

tables = [
    "AREAS",
    "ENCLOSURES",
    "POINTS_OF_INTEREST",
    "POI_NARRATIONS",
    "SPECIES",
    "ANIMALS",
    "CONTENT_TRANSLATIONS"
]

snapshot = {}
sql_lines = []
sql_lines.append(f"-- ZOOGUIDE BACKUP PHASE 2 ({timestamp})")
sql_lines.append("BEGIN TRANSACTION;")

for table in tables:
    cur.execute(f'SELECT * FROM "{table}";')
    rows = cur.fetchall()
    snapshot[table] = rows
    print(f"Backed up {len(rows)} rows from {table}")

    if rows:
        cols = [f'"{k}"' for k in rows[0].keys()]
        sql_lines.append(f"\n-- DATA FOR {table}")
        for r in rows:
            vals = []
            for k in rows[0].keys():
                v = r[k]
                if v is None:
                    vals.append("NULL")
                elif isinstance(v, (int, float)):
                    vals.append(str(v))
                elif isinstance(v, bool):
                    vals.append("TRUE" if v else "FALSE")
                elif isinstance(v, (datetime.datetime, datetime.date)):
                    vals.append(f"'{v.isoformat()}'")
                else:
                    escaped = str(v).replace("'", "''")
                    vals.append(f"'{escaped}'")
            sql_lines.append(f'INSERT INTO "{table}" ({", ".join(cols)}) VALUES ({", ".join(vals)}) ON CONFLICT DO NOTHING;')

sql_lines.append("\nCOMMIT;")

def default_converter(o):
    if isinstance(o, (datetime.date, datetime.datetime)):
        return o.isoformat()
    if hasattr(o, '__str__'):
        return str(o)
    raise TypeError(f"Object of type {o.__class__.__name__} is not JSON serializable")

json_path = os.path.join(backup_dir, "backup_phase2.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(snapshot, f, ensure_ascii=False, indent=2, default=default_converter)

sql_path = os.path.join(backup_dir, "backup_phase2.sql")
with open(sql_path, "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

print(f"Backup Phase 2 completed successfully to {backup_dir}")
conn.close()
