import os
import requests
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "narration-audio")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

test_path = "test/ping.mp3"
endpoint = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{test_path}"
headers = {
    "Authorization": f"Bearer {SERVICE_KEY}",
    "apikey": SERVICE_KEY,
    "x-upsert": "true",
    "Content-Type": "audio/mpeg"
}

# 100 bytes of dummy mp3
dummy_bytes = b"ID3" + b"\x00" * 97

try:
    resp = requests.post(endpoint, headers=headers, data=dummy_bytes, timeout=10)
    print(f"Upload Status: {resp.status_code}")
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{test_path}"
    chk = requests.head(public_url, timeout=5)
    print(f"Public URL check: {chk.status_code} -> {public_url}")
except Exception as e:
    print(f"Error: {e}")
