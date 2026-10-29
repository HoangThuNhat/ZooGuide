import os
import json
import datetime
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

timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_dirs = [
    os.path.join("scratch", "backups", f"backup_{timestamp}"),
    r"C:\Users\admin\.gemini\antigravity-cli\brain\86fdbbc3-b881-43ee-ab94-3eca34d4456e\backups"
]

for d in backup_dirs:
    os.makedirs(d, exist_ok=True)

conn = psycopg2.connect(**params)
cur = conn.cursor(cursor_factory=RealDictCursor)

tables = [
    "SPECIES",
    "ANIMALS",
    "NARRATIONS",
    "AUDIOS",
    "CONTENT_TRANSLATIONS",
    "AREAS",
    "ENCLOSURES",
    "LANGUAGES",
    "POINTS_OF_INTEREST",
    "POI_NARRATIONS"
]

class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime.date, datetime.datetime)):
            return obj.isoformat()
        if hasattr(obj, '__str__'):
            return str(obj)
        return super().default(obj)

full_backup = {
    "timestamp": datetime.datetime.now().isoformat(),
    "database": params.get("dbname"),
    "tables": {}
}

sql_backup_lines = [
    f"-- ZooGuide Database Backup at {timestamp}\n",
    "-- Tables in scope for audit & cleaning\n\n"
]

for tbl in tables:
    cur.execute(f'SELECT * FROM "{tbl}" ORDER BY 1;')
    rows = cur.fetchall()
    row_list = [dict(r) for r in rows]
    full_backup["tables"][tbl] = {
        "count": len(row_list),
        "data": row_list
    }
    print(f"Backed up table '{tbl}': {len(row_list)} rows")

    # Generate SQL inserts
    if row_list:
        cols = list(row_list[0].keys())
        col_names = ", ".join([f'"{c}"' for c in cols])
        sql_backup_lines.append(f"-- Table: {tbl} ({len(row_list)} rows)\n")
        for row in row_list:
            vals = []
            for c in cols:
                val = row[c]
                if val is None:
                    vals.append("NULL")
                elif isinstance(val, (int, float)):
                    vals.append(str(val))
                elif isinstance(val, bool):
                    vals.append("TRUE" if val else "FALSE")
                else:
                    escaped = str(val).replace("'", "''")
                    vals.append(f"'{escaped}'")
            sql_backup_lines.append(f'INSERT INTO "{tbl}" ({col_names}) VALUES ({", ".join(vals)});\n')
        sql_backup_lines.append("\n")

conn.close()

# Save JSON and SQL in both locations
for bdir in backup_dirs:
    json_path = os.path.join(bdir, f"zooguide_backup_{timestamp}.json")
    sql_path = os.path.join(bdir, f"zooguide_backup_{timestamp}.sql")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(full_backup, f, ensure_ascii=False, indent=2, cls=CustomEncoder)
    with open(sql_path, "w", encoding="utf-8") as f:
        f.writelines(sql_backup_lines)
    print(f"Saved backup to: {json_path}")
    print(f"Saved SQL restore script to: {sql_path}")

# Write a latest pointer
meta = {
    "latest_backup_timestamp": timestamp,
    "table_counts": {tbl: full_backup["tables"][tbl]["count"] for tbl in tables}
}
with open(os.path.join("scratch", "backups", "latest_backup.json"), "w", encoding="utf-8") as f:
    json.dump(meta, f, indent=2)

print("\nBackup completed successfully!")
