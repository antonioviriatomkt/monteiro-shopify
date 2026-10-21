#!/usr/bin/env python3
"""Icons in fabric-spec-icons carry their text INSIDE the SVG (label = alt text only).
Keep only icons whose printed text the KB supports for every product on the page."""
import json, re
T = 'theme-sandbox/templates/'
def load(fn):
    raw = open(T+fn, encoding='utf-8').read(); m = re.match(r'\s*(/\*.*?\*/)\s*', raw, re.S)
    return (m.group(1) if m else ''), json.loads(raw[m.end():] if m else raw)
def save(fn, h, j): open(T+fn,'w',encoding='utf-8').write((h+'\n' if h else '')+json.dumps(j, indent=2, ensure_ascii=False)+'\n')
LABEL = {'anti-microbial':'Antimicrobial & antifungal','flame':'Flame retardant','reach':'REACH compliant','vegan':'100% vegan',
         'light-resistant':'Light resistant','long-lasting':'Long lasting','easy-clean':'Easy clean','abrasion':'Abrasion resistant'}
def icons(fn, wanted):
    h, j = load(fn); s = j['sections']['credentials']
    s['blocks'] = {f'c{i+1}': {'type':'icon','settings':{'icon':ic,'label':LABEL[ic]}} for i, ic in enumerate(wanted)}
    s['block_order'] = list(s['blocks']); s['settings']['columns'] = max(2, len(wanted))
    save(fn, h, j); print(fn, wanted)
def disable(fn):
    h, j = load(fn); j['sections']['credentials']['disabled'] = True; save(fn, h, j); print(fn, 'credentials disabled')
icons('collection.healthcare.json', ['anti-microbial','flame','reach','vegan'])
icons('collection.marine.json',     ['anti-microbial','light-resistant','long-lasting','reach'])
icons('collection.outdoor.json',    ['anti-microbial','light-resistant','easy-clean','long-lasting','abrasion'])
icons('collection.fire-retardant.json', ['flame','vegan'])
for f in ['collection.contract.json','collection.hospitality-fabrics.json','collection.coated-fabrics.json']: disable(f)
