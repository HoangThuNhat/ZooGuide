import re

with open('web/src/context/AppContext.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Let's inspect each language block and remove duplicate keys within each block
start_idx = code.find('export const translations = {')
end_idx = code.find('export function AppProvider', start_idx)

trans_block = code[start_idx:end_idx]

for lang in ['vi', 'en', 'zh', 'ja', 'ko', 'th', 'fr', 'es', 'de', 'ru', 'pt', 'id']:
    # Match lang: { ... }
    # Find start of lang
    l_start = trans_block.find(f'{lang}: {{')
    if l_start == -1:
        continue
    # find next language or end of trans_block
    l_end = len(trans_block)
    for other in ['vi', 'en', 'zh', 'ja', 'ko', 'th', 'fr', 'es', 'de', 'ru', 'pt', 'id']:
        if other != lang:
            pos = trans_block.find(f'{other}: {{', l_start + 4)
            if pos != -1 and pos < l_end:
                l_end = pos
    
    # Check lines inside this block for duplicates
    block = trans_block[l_start:l_end]
    seen_keys = set()
    cleaned_lines = []
    for line in block.split('\n'):
        m = re.match(r'^\s*(\w+):\s*', line)
        if m:
            k = m.group(1)
            if k in seen_keys:
                print(f"Removed duplicate key {k} from {lang}")
                continue
            seen_keys.add(k)
        cleaned_lines.append(line)
    
    new_block = '\n'.join(cleaned_lines)
    trans_block = trans_block[:l_start] + new_block + trans_block[l_end:]

code = code[:start_idx] + trans_block + code[end_idx:]

with open('web/src/context/AppContext.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Duplicates cleaned up!")
