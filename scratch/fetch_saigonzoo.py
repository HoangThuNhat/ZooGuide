import requests
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

urls_to_try = [
    'https://www.saigonzoo.vn/dong-vat',
    'https://www.saigonzoo.vn/dong-vat-thu',
    'https://www.saigonzoo.vn/dong-vat-chim',
    'https://www.saigonzoo.vn/dong-vat-bo-sat',
    'https://www.saigonzoo.vn/'
]

for url in urls_to_try:
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        print(f"URL: {url} -> HTTP {resp.status_code}, length={len(resp.text)}")
        links = set(re.findall(r'href=["\']([^"\']*)["\']', resp.text))
        animal_links = [l for l in links if 'dong-vat' in l]
        print(f"  Animal links ({len(animal_links)}): {animal_links[:10]}")
    except Exception as e:
        print(f"URL {url} failed: {e}")
