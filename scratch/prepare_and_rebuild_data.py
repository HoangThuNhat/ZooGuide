import os
import json
import hashlib
import asyncio
import requests
import datetime
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
import edge_tts

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "narration-audio")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

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

# 12 Supported Languages in ZooGuide
LANG_VOICE_MAP = {
    "vi": ("vi-VN-HoaiMyNeural", 1),
    "en": ("en-US-JennyNeural", 2),
    "zh": ("zh-CN-XiaoxiaoNeural", 3),
    "ja": ("ja-JP-NanamiNeural", 4),
    "ko": ("ko-KR-SunHiNeural", 9),
    "th": ("th-TH-NiwatNeural", 10),
    "fr": ("fr-FR-DeniseNeural", 11),
    "es": ("es-ES-ElviraNeural", 12),
    "de": ("de-DE-KatjaNeural", 13),
    "ru": ("ru-RU-SvetlanaNeural", 14),
    "pt": ("pt-BR-FranciscaNeural", 15),
    "id": ("id-ID-GadisNeural", 16)
}

print("Script template created, ready to populate species data.")
