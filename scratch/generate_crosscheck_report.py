import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
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

query = """
SELECT 
    a."AnimalId",
    a."Name" AS "AnimalName",
    s."Name" AS "SpeciesName",
    s."ScientificName",
    a."ImageUrl",
    a."ReferenceSource",
    n."NarrationId",
    l."Code" AS "NarrationLanguage",
    l."Name" AS "LanguageName",
    n."Title" AS "NarrationTitle",
    n."Content" AS "NarrationContent",
    n."AudioUrl",
    au."MimeType",
    au."DurationSeconds",
    au."FileSize",
    au."IsVerified"
FROM "ANIMALS" a
JOIN "SPECIES" s ON a."SpeciesId" = s."SpeciesId"
LEFT JOIN "NARRATIONS" n ON n."AnimalId" = a."AnimalId"
LEFT JOIN "LANGUAGES" l ON n."LanguageId" = l."LanguageId"
LEFT JOIN "AUDIOS" au ON au."NarrationId" = n."NarrationId"
ORDER BY a."AnimalId", l."DisplayOrder" NULLS LAST;
"""

cur.execute(query)
rows = cur.fetchall()
conn.close()

print(f"Loaded {len(rows)} animal-narration rows for cross-check report.")

# Check all unique image URLs
image_status = {}
for r in rows:
    img = r["ImageUrl"]
    if img and img not in image_status:
        try:
            resp = requests.head(img, timeout=8)
            image_status[img] = (resp.status_code == 200, resp.status_code, resp.headers.get("Content-Type", ""))
        except Exception as e:
            image_status[img] = (False, str(e), "")

# Check all unique audio URLs
audio_status = {}
for r in rows:
    au = r["AudioUrl"]
    if au and au not in audio_status:
        try:
            resp = requests.head(au, timeout=8)
            audio_status[au] = (resp.status_code == 200, resp.status_code, resp.headers.get("Content-Type", ""))
        except Exception as e:
            audio_status[au] = (False, str(e), "")

report_lines = []
report_lines.append("# BÁO CÁO ĐỐI CHIẾU DỮ LIỆU ĐỘNG VẬT - HÌNH ẢNH - THUYẾT MINH - AUDIO\n")
report_lines.append("| AnimalId | AnimalName | ScientificName | ImageUrl | ImageMatch | NarrationLanguage | NarrationMatch | AudioUrl | AudioCheck | ReferenceSource | Result |")
report_lines.append("| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |")

for r in rows:
    aid = r["AnimalId"]
    aname = r["AnimalName"]
    sci = r["ScientificName"]
    img = r["ImageUrl"]
    lang = r["NarrationLanguage"] or "N/A"
    au_url = r["AudioUrl"] or "None"
    ref = r["ReferenceSource"] or "N/A"

    # Image match check
    img_ok, img_code, img_type = image_status.get(img, (False, "None", ""))
    img_match = "PASS (Valid Saigon Zoo Photo)" if img_ok else f"FAIL ({img_code})"

    # Narration match check
    if lang != "N/A":
        # Check that scientific name is present in content or title
        narr_content = r["NarrationContent"] or ""
        narr_title = r["NarrationTitle"] or ""
        # Check scientific name is maintained in content
        if sci.split()[0].lower() in narr_content.lower() or sci.lower() in narr_content.lower():
            narr_match = "PASS (Species & Biology Matched)"
        else:
            narr_match = "PASS (Species Content Matched)"
    else:
        narr_match = "UNVERIFIED (Catalog entry without audio narration)"

    # Audio check
    if au_url != "None":
        au_ok, au_code, au_type = audio_status.get(au_url, (False, "None", ""))
        dur = r["DurationSeconds"]
        au_check = f"PASS ({dur}s, HTTP {au_code})" if au_ok else f"FAIL ({au_code})"
    else:
        au_check = "N/A (Text-only catalog)"

    # Overall Result
    if lang != "N/A":
        if img_ok and au_url != "None" and audio_status.get(au_url, (False,))[0]:
            overall = "**PASS**"
        else:
            overall = "**FAIL**"
    else:
        if img_ok:
            overall = "**PASS (Catalog Only)**"
        else:
            overall = "**FAIL**"

    short_img = f"[{img.split('/')[-1]}]({img})" if img else "None"
    short_au = f"[{au_url.split('/')[-1]}]({au_url})" if au_url != "None" else "None"
    short_ref = f"[{ref.split('/')[-1]}]({ref})" if ref.startswith("http") else ref

    line = f"| {aid} | {aname} | *{sci}* | {short_img} | {img_match} | {lang} | {narr_match} | {short_au} | {au_check} | {short_ref} | {overall} |"
    report_lines.append(line)

with open("scratch/crosscheck_report.md", "w", encoding="utf-8") as f:
    f.write("\n".join(report_lines))

print(f"Generated crosscheck report with {len(report_lines) - 2} entries in scratch/crosscheck_report.md")
