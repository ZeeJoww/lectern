#!/usr/bin/env python3
"""statics.py — rung 2 of the ladder: node --check every inline script,
html5lib-parse every deck/tool page. Exit code = failures."""
import re, subprocess, sys, os
import html5lib
fails = 0
for f in ('lectern.html', 'starter.html', 'compose.html', 'showcase.html'):
    if not os.path.exists(f):
        continue
    raw = open(f, encoding='utf-8').read()
    nc = re.sub(r'<!--.*?-->', '', raw, flags=re.S)
    for i, sc in enumerate(re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>', nc, re.S)):
        if not sc.strip():
            continue
        open('/tmp/_st.js', 'w', encoding='utf-8').write(sc)
        if subprocess.run(['node', '--check', '/tmp/_st.js']).returncode:
            print(f'FAIL {f} script {i}'); fails += 1
    try:
        html5lib.parse(raw)
    except Exception as e:
        print(f'FAIL {f} parse: {e}'); fails += 1
    print(f'  ok  {f}')
sys.exit(fails)
