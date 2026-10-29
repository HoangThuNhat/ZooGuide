import requests
import re

for url in ['https://saigonzoo.vn/dao-vuon-khu-chuong-cop-184.html', 'https://saigonzoo.vn/dong-vat-o-khu-vuon-thu-than-thien-176.html']:
    resp = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=8)
    html = resp.text
    # extract body text inside section or article
    m = re.search(r'<section[^>]*class="[^"]*introduction[^"]*"[^>]*>(.*?)</section>', html, re.DOTALL)
    if m:
        text = re.sub(r'<[^>]+>', ' ', m.group(1))
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        print('=== ' + url + ' ===')
        for l in lines[:20]:
            print(' ', l)
    else:
        print('No section found for', url)
