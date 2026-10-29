import requests

langs = ['vi', 'en', 'zh', 'ja', 'ko', 'th', 'fr', 'es', 'de', 'ru', 'pt', 'id']
print('Testing 12-language responses for Animal 1 (Asian Elephant):')
for lang in langs:
    r = requests.get(f'http://localhost:5142/api/animals/1?lang={lang}').json()
    sp = r['data']['species']
    name = sp.get('name', '')
    has_trans = sp.get('hasTranslation', False)
    print(f"[{lang:>2}] Name: {name:<25} | Trans: {has_trans} | Code: {sp.get('languageCode')}")
