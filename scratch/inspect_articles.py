import requests
import re

articles = [
    'https://saigonzoo.vn/dao-vuon-khu-chuong-cop-184.html',
    'https://saigonzoo.vn/dong-vat-o-khu-vuon-thu-than-thien-176.html',
    'https://saigonzoo.vn/voi-chuong-179.html',
    'https://saigonzoo.vn/chup-hinh-rua-177.html',
]

for url in articles:
    try:
        resp = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=8)
        text = re.sub(r'<[^>]+>', ' ', resp.text)
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        print('=== ' + url.split('/')[-1] + ' ===')
        for l in lines[10:35]:
            print(' ', l)
    except Exception as e:
        print('Error:', e)
