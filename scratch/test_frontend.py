import requests
import re

r = requests.get('http://localhost:3001')
html = r.text
print('HTML length:', len(html))
scripts = re.findall(r'src="([^"]+)"', html)
print('Scripts:', scripts)
for s in scripts:
    s_url = f'http://localhost:3001{s}'
    r_js = requests.get(s_url)
    print(f'Script {s}: length={len(r_js.text)}, status={r_js.status_code}')
    has_stop = 'btn-audio-stop' in r_js.text
    has_close = 'btn-close-audio-bar' in r_js.text
    has_enc_animals = 'enclosureAnimals' in r_js.text or 'Chuồng nuôi hiện chưa có cá thể động vật' in r_js.text
    print(f'Bundle checks -> has_stop={has_stop}, has_close={has_close}, has_enc_animals={has_enc_animals}')
