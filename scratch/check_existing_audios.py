import os
from dotenv import load_dotenv
import psycopg2
import requests

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
cur = conn.cursor()
cur.execute('SELECT "AudioId", "NarrationId", "LanguageCode", "PublicUrl" FROM "AUDIOS" ORDER BY "AudioId";')
rows = cur.fetchall()
conn.close()

print(f"Checking {len(rows)} audio URLs from AUDIOS table...")
pass_cnt = 0
fail_cnt = 0
for au_id, narr_id, lang, url in rows:
    try:
        r = requests.head(url, timeout=5)
        if r.status_code == 200:
            pass_cnt += 1
        else:
            print(f"FAIL Audio {au_id} ({lang}): HTTP {r.status_code} -> {url}")
            fail_cnt += 1
    except Exception as e:
        print(f"FAIL Audio {au_id} ({lang}): {e}")
        fail_cnt += 1

print(f"Results: {pass_cnt} PASS, {fail_cnt} FAIL out of {len(rows)} audios.")
