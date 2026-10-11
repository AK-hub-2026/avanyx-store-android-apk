import re

with open('/tmp/web_bundle.js', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

print('Bundle size:', len(text))
collections = set(re.findall(r'collection\([a-zA-Z0-9_]+,\s*[\'"`]([^\'"`]+)[\'"`]\)', text))
print('Firestore collections:', collections)

# Find banner references
banners = set(re.findall(r'[a-zA-Z0-9_]*banner[a-zA-Z0-9_]*', text, re.IGNORECASE))
print('Banner terms (sample 25):', list(banners)[:25])

# Find image URLs or assets
images = set(re.findall(r'[\'"`]([^\'"`]+\.(?:png|jpg|webp|svg))[\'"`]', text, re.IGNORECASE))
print('Image assets in bundle:', images)
