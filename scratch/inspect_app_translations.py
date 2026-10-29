import re

with open('web/src/context/AppContext.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('export const translations = {')
end_idx = content.find('export function AppProvider', start_idx)
trans_block = content[start_idx:end_idx]

lang_dict = {}
for l in ['vi', 'en', 'zh', 'ja', 'ko', 'th', 'fr', 'es', 'de', 'ru', 'pt', 'id']:
    # extract block
    start_l = trans_block.find(f'{l}: {{')
    # find next language or end
    next_l = len(trans_block)
    for o in ['vi', 'en', 'zh', 'ja', 'ko', 'th', 'fr', 'es', 'de', 'ru', 'pt', 'id']:
        if o != l:
            idx = trans_block.find(f'{o}: {{', start_l + 4)
            if idx != -1 and idx < next_l:
                next_l = idx
    block = trans_block[start_l:next_l]
    keys = re.findall(r'(\w+):\s*[\'"`]', block)
    lang_dict[l] = set(keys)

vi_keys = lang_dict['vi']
for l, s in lang_dict.items():
    diff = vi_keys - s
    if diff:
        print(f"Language '{l}' is missing keys: {diff}")
