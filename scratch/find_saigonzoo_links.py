import requests
import re

resp = requests.get('https://saigonzoo.vn', headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
links = re.findall(r'href=[\'"]([^\'"]+)[\'"]', resp.text)
for l in sorted(set(links)):
    if 'saigonzoo.vn' in l or l.startswith('/'):
        print(l)
