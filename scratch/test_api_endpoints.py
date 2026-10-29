import requests
import json

try:
    health = requests.get('http://localhost:5142/api/health', timeout=10).json()
    print('=== HEALTH CHECK ===')
    print(json.dumps(health, indent=2, ensure_ascii=False))
except Exception as e:
    print('Health check error:', e)

try:
    species = requests.get('http://localhost:5142/api/species', timeout=10).json()
    print(f'\n=== SPECIES COUNT: {len(species)} ===')
    for sp in species[:6]:
        print(f" - ID {sp.get('speciesId')}: {sp.get('name')} ({sp.get('scientificName')})")
except Exception as e:
    print('Species endpoint error:', e)

try:
    animals = requests.get('http://localhost:5142/api/animals', timeout=10).json()
    print(f'\n=== ANIMALS COUNT: {len(animals)} ===')
    for a in animals[:6]:
        print(f" - ID {a.get('animalId')}: {a.get('name')} (SpeciesId: {a.get('speciesId')})")
except Exception as e:
    print('Animals endpoint error:', e)

# Also test translation endpoint if available
try:
    trans = requests.get('http://localhost:5142/api/translations/species?lang=en', timeout=10)
    print(f'\nTranslations HTTP status: {trans.status_code}')
except Exception as e:
    print('Translations error:', e)
