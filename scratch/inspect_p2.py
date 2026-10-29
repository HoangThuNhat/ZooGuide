import requests
import re

url = 'https://saigonzoo.vn/dong-vat-o-khu-vuon-thu-than-thien-176.html'
resp = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=8)
html = resp.text

h1 = re.findall(r'<h[1-4][^>]*>(.*?)</h[1-4]>', html)
print('Headings:', h1)

p = re.findall(r'<p[^>]*>(.*?)</p>', html)
print('Paragraphs:', [re.sub(r'<[^>]+>', '', x).strip() for x in p if len(x) > 20][:10])
