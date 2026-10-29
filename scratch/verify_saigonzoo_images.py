import json
import requests

with open("scratch/parsed_saigonzoo.json", "r", encoding="utf-8") as f:
    items = json.load(f)

print(f"Verifying {len(items)} image URLs from saigonzoo.vn...")
headers = {'User-Agent': 'Mozilla/5.0'}

results = []
for it in items:
    url = it["image_url"]
    name = it["vietnamese_name"]
    try:
        r = requests.get(url, headers=headers, stream=True, timeout=10)
        ctype = r.headers.get("content-type", "")
        status = r.status_code
        is_ok = (status == 200 and "image" in ctype)
        print(f"[{'PASS' if is_ok else 'FAIL'}] {name}: HTTP {status} | {ctype} | {url}")
        results.append({
            "name": name,
            "url": url,
            "status": status,
            "content_type": ctype,
            "pass": is_ok
        })
    except Exception as e:
        print(f"[FAIL] {name}: {e} | {url}")
        results.append({
            "name": name,
            "url": url,
            "error": str(e),
            "pass": False
        })

print(f"\nTotal: {len(results)}, Passed: {sum(1 for r in results if r['pass'])}")
