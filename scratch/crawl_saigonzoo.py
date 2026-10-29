import requests
import re
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

all_animals = {}

page = 1
while True:
    url = f"https://www.saigonzoo.vn/dong-vat?page={page}" if page > 1 else "https://www.saigonzoo.vn/dong-vat"
    print(f"Crawling page {page}: {url}...")
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code != 200:
            print(f"Page {page} returned {resp.status_code}, stopping.")
            break
        
        # Find links to detail pages
        links = re.findall(r'href=["\'](https://www\.saigonzoo\.vn/dong-vat/[^"\']+\.html)["\']', resp.text)
        unique_links = list(dict.fromkeys(links))
        print(f"  Found {len(unique_links)} animal links on page {page}")
        if not unique_links:
            break
        
        new_found = 0
        for l in unique_links:
            if l not in all_animals:
                all_animals[l] = None
                new_found += 1
        
        if new_found == 0:
            print("No new animal links found on this page, stopping.")
            break
            
        page += 1
        if page > 10: # safeguard
            break
    except Exception as e:
        print(f"Error on page {page}: {e}")
        break

print(f"\nTotal unique animal pages found: {len(all_animals)}")

# Now fetch details for each animal
catalog = []
for idx, link in enumerate(all_animals.keys(), 1):
    print(f"[{idx}/{len(all_animals)}] Fetching {link}...")
    try:
        r = requests.get(link, headers=headers, timeout=15)
        if r.status_code != 200:
            continue
        html = r.text
        
        # Extract title/name
        m_title = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
        title = m_title.group(1).strip() if m_title else ""
        # Clean title tags
        title = re.sub(r'<[^>]+>', '', title).strip()
        
        # Extract image
        # Look for og:image or featured image inside content
        m_img = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html)
        img_url = m_img.group(1) if m_img else ""
        if not img_url:
            m_img2 = re.search(r'<div class=["\'][^"\']*detail[^"\']*["\'].*?<img[^>]+src=["\']([^"\']+)["\']', html, re.DOTALL)
            if m_img2:
                img_url = m_img2.group(1)
                
        # Extract body text/content
        # Find article or content div
        m_content = re.search(r'<div class=["\'][^"\']*content[^"\']*["\']>(.*?)</div>', html, re.DOTALL)
        content_text = ""
        if m_content:
            raw = m_content.group(1)
            content_text = re.sub(r'<[^>]+>', ' ', raw)
            content_text = re.sub(r'\s+', ' ', content_text).strip()
            
        catalog.append({
            "url": link,
            "title": title,
            "image": img_url,
            "content_snippet": content_text[:400]
        })
        print(f"  Title: {title} | Image: {img_url}")
    except Exception as e:
        print(f"  Failed: {e}")

with open("scratch/saigonzoo_catalog.json", "w", encoding="utf-8") as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)

print(f"\nSuccessfully saved {len(catalog)} animals to scratch/saigonzoo_catalog.json")
