import os, sys
from supabase import create_client

# Read credentials from appsettings.json or env
import json
with open('src/API/appsettings.json', 'r', encoding='utf-8') as f:
    app_settings = json.load(f)

url = app_settings.get('Supabase', {}).get('Url')
key = app_settings.get('Supabase', {}).get('ServiceKey') or app_settings.get('Supabase', {}).get('Key')

client = create_client(url, key)

langs = client.table('LANGUAGES').select('*').order('DisplayOrder').execute()
print(f"Total LANGUAGES: {len(langs.data)}")
for l in langs.data:
    code = l.get('LanguageCode')
    name = l.get('LanguageName')
    native = l.get('NativeName')
    active = l.get('IsActive')
    print(f"  {code}: {name} ({native}) - Active: {active}")

trans_count = client.table('CONTENT_TRANSLATIONS').select('TranslationId', count='exact').execute()
print(f"Total CONTENT_TRANSLATIONS: {trans_count.count}")

narr_count = client.table('NARRATIONS').select('NarrationId', count='exact').execute()
print(f"Total NARRATIONS: {narr_count.count}")

poi_count = client.table('POINTS_OF_INTEREST').select('PoiId', count='exact').execute()
print(f"Total POINTS_OF_INTEREST: {poi_count.count}")
