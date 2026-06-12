#!/usr/bin/env python3
"""Rebuilds index.html by inlining updated CSS and JSX source files."""

INDEX = 'index.html'
POCKET_CSS = 'styles/pocket.css'

SCRIPTS = [
    ('script',                   'scripts/supabase-config.js'),
    ('script',                   'scripts/data.js'),
    ('script type="text/babel"', 'scripts/cat-svgs.jsx'),
    ('script type="text/babel"', 'scripts/pocket-helpers.jsx'),
    ('script type="text/babel"', 'scripts/pocket-customer.jsx'),
    ('script type="text/babel"', 'scripts/pocket-profile.jsx'),
    ('script type="text/babel"', 'scripts/pocket-barista.jsx'),
    ('script type="text/babel"', 'scripts/pocket-app.jsx'),
]

with open(INDEX, 'r') as f:
    html = f.read()

# Extract brand token CSS (everything in <style> before pocket.css begins)
style_start = html.index('<style>\n') + len('<style>\n')
pocket_marker = '/* Pocket prototype — mobile-first layout */'
pocket_start = html.index(pocket_marker, style_start)
brand_tokens_css = html[style_start:pocket_start]

# Extract the static HTML between </style> and the first <script
style_close = '\n</style>\n'
style_block_end = html.index(style_close, pocket_start) + len(style_close)
# Find end of CDN block (the last CDN script tag before our inline scripts)
cdn_marker = 'babel.min.js'
cdn_line_end = html.index('\n', html.index(cdn_marker)) + 1
static_mid = html[style_block_end:cdn_line_end]  # </head><body>...<CDN scripts>

with open(POCKET_CSS, 'r') as f:
    pocket_css = f.read()

# Build the file section by section
parts = []
parts.append(html[:style_start])           # <!DOCTYPE...><style>\n
parts.append(brand_tokens_css)             # :root { ... } brand tokens
parts.append(pocket_css + '\n')            # pocket layout CSS
parts.append(style_close)                  # \n</style>\n
parts.append(static_mid)                   # </head><body><div id="root"><CDN>\n
parts.append('<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>\n')
parts.append('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n')

for tag, src_file in SCRIPTS:
    with open(src_file, 'r') as f:
        src = f.read()
    parts.append(f'<{tag}>\n{src}\n</script>\n')

parts.append('</body>\n</html>\n')

result = ''.join(parts)

with open(INDEX, 'w') as f:
    f.write(result)

print(f'Built {INDEX} ({len(result):,} bytes, {result.count(chr(10)):,} lines)')
