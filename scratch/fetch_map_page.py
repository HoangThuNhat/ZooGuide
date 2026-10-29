import requests
import re

url = "https://saigonzoo.vn/ban-do-duong-di"
resp = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
print('Status:', resp.status_code)
html = resp.text

imgs = re.findall(r'<img[^>]+src=[\'"]([^\'"]+)[\'"]', html)
print('Images found:', len(imgs))
for img in imgs:
    if 'map' in img.lower() or 'ban-do' in img.lower() or 'uploads' in img.lower():
        print('  Img:', img)

text_clean = re.sub(r'<[^>]+>', ' ', html)
lines = [l.strip() for l in text_clean.splitlines() if l.strip()]
print('Text lines:')
for line in lines[:40]:
    print(' ', line)
