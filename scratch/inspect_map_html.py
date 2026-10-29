import requests
import re

url = "https://saigonzoo.vn/p/ban-do-duong-di-hp13.html"
resp = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
html = resp.text

idx = html.find('ban-do-tcv.jpg')
if idx != -1:
    print(html[max(0, idx - 500): min(len(html), idx + 1000)])
else:
    print("Not found")
