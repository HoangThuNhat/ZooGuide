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
cur.execute('SELECT "LanguageId", "Code", "Name", "NativeName", "Locale", "FlagIcon", "TtsVoice", "DisplayOrder", "IsActive" FROM "LANGUAGES" ORDER BY "DisplayOrder";')
langs = cur.fetchall()
for l in langs:
    print(f"[{l['LanguageId']}] {l['Code']} - {l['Name']} ({l['NativeName']}) -> TTS Voice: {l['TtsVoice']}")
conn.close()
