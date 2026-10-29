import requests
import re
import html
import json

headers = {'User-Agent': 'Mozilla/5.0'}

with open("scratch/saigonzoo_catalog.json", "r", encoding="utf-8") as f:
    items = json.load(f)

parsed_species = []

for item in items:
    url = item["url"]
    if "he-thong-phan-loai" in url:
        continue # skip general classification article
    print(f"Parsing {url}...")
    try:
        r = requests.get(url, headers=headers, timeout=10)
        text = r.text
        
        # Title from <title> or <h1>
        m_title = re.search(r'<title>(.*?)(?: - Thảo Cầm Viên.*)?</title>', text)
        title = m_title.group(1).strip() if m_title else ""
        title = html.unescape(title)
        
        # og:image
        m_img = re.search(r'<meta property="og:image" content="(.*?)"', text)
        img = m_img.group(1).strip() if m_img else item.get("image", "")
        
        # Find article text
        # look for detail content
        m_body = re.search(r'<div class="[^"]*content-detail[^"]*"[^>]*>(.*?)</div>\s*</div>', text, re.DOTALL)
        if not m_body:
            m_body = re.search(r'<div class="box-content[^"]*"[^>]*>(.*?)</div>', text, re.DOTALL)
        if not m_body:
            # fallback
            idx = text.find('Phân loại học')
            if idx == -1: idx = text.find('Ph&acirc;n loại học')
            if idx != -1:
                body_raw = text[idx:idx+4000]
            else:
                body_raw = text[:4000]
        else:
            body_raw = m_body.group(1)
            
        clean_text = html.unescape(re.sub(r'<[^>]+>', ' ', body_raw))
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        
        # Extract scientific name (Loài / Scientific name)
        # e.g. "Loài: Elephas maximus" or "Loài / Species: ..."
        sci_match = re.search(r'(?:Loài|Species|Tên khoa học)[:\s]+([A-Z][a-z]+(?:\s+[a-z]+)+)', clean_text)
        sci_name = sci_match.group(1).strip() if sci_match else None
        
        parsed_species.append({
            "url": url,
            "vietnamese_name": title.title(),
            "scientific_name": sci_name,
            "image_url": img,
            "raw_text": clean_text
        })
        print(f" -> {title} | Sci: {sci_name} | Img: {img}")
    except Exception as e:
        print(f" -> Error {url}: {e}")

with open("scratch/parsed_saigonzoo.json", "w", encoding="utf-8") as f:
    json.dump(parsed_species, f, ensure_ascii=False, indent=2)

print(f"\nParsed {len(parsed_species)} species.")
