import requests
import re

headers = {'User-Agent': 'Mozilla/5.0'}

queries = [
    'https://www.saigonzoo.vn/tim-kiem?q=h%E1%BB%95',
    'https://www.saigonzoo.vn/tim-kiem?q=s%C6%B0+t%E1%BB%AD',
    'https://www.saigonzoo.vn/tim-kiem?q=voi'
]

for q in queries:
    r = requests.get(q, headers=headers, timeout=10)
    print(f"Query {q} -> HTTP {r.status_code}")
    links = list(set(re.findall(r'href=["\'](https://www\.saigonzoo\.vn/[^"\']+\.html)["\']', r.text)))
    print("Found links:", links[:5])
