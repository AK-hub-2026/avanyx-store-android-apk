import re

with open('/tmp/web_bundle.js', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

collections = set(re.findall(r'collection\([^,]+,\s*["\']([^"\']+)["\']\)', text))
print('Unique collections in web bundle:', collections)

# Check banner submission or requests
banner_mentions = [m.start() for m in re.finditer(r'banner', text, re.IGNORECASE)]
print('Banner mentions count:', len(banner_mentions))
for idx in banner_mentions[:10]:
    print('---')
    print(text[max(0, idx-100):min(len(text), idx+150)])
