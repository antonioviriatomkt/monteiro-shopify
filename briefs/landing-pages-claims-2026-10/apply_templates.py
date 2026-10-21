#!/usr/bin/env python3
"""Fix 1 (claims) — rewrite sector collection templates. Run from REPOS/APP.
Usage: python3 apply_templates.py [--dry]  (prints every change)."""
import json, re, sys
DRY = '--dry' in sys.argv
T = 'theme-sandbox/templates/'

def load(fn):
    raw = open(T + fn, encoding='utf-8').read()
    m = re.match(r'\s*(/\*.*?\*/)\s*', raw, re.S)
    head = m.group(1) if m else ''
    return head, json.loads(raw[m.end():] if m else raw)

def save(fn, head, j):
    out = (head + '\n' if head else '') + json.dumps(j, indent=2, ensure_ascii=False) + '\n'
    if not DRY:
        open(T + fn, 'w', encoding='utf-8').write(out)

def S(j, sec, key, val, block=None):
    tgt = j['sections'][sec]
    if block: tgt = tgt['blocks'][block]
    old = tgt['settings'].get(key)
    assert old is not None, (sec, block, key)
    if old != val:
        print(f'  {sec}{"/"+block if block else ""}.{key}\n    - {old}\n    + {val}')
        tgt['settings'][key] = val

def ICON(j, block, icon, label):
    S(j, 'credentials', 'icon', icon, block); S(j, 'credentials', 'label', label, block)

def DEL(j, sec, block):
    s = j['sections'][sec]
    print(f'  {sec}/{block} REMOVED ({s["blocks"][block]["settings"].get("label")}: {s["blocks"][block]["settings"].get("value","")})')
    del s['blocks'][block]; s['block_order'].remove(block)

def ADD(j, sec, block, after, settings, btype='spec'):
    s = j['sections'][sec]
    assert block not in s['blocks']
    s['blocks'][block] = {'type': btype, 'settings': settings}
    s['block_order'].insert(s['block_order'].index(after) + 1, block)
    print(f'  {sec}/{block} ADDED {settings}')

def REPL(j, sec, key, old, new, block=None):
    tgt = j['sections'][sec]
    if block: tgt = tgt['blocks'][block]
    v = tgt['settings'][key]
    assert v.count(old) == 1, (sec, block, key, old)
    S(j, sec, key, v.replace(old, new), block)

BROWSE = '<p>Browse the collection below, or speak to a specialist for project specifications and free samples.</p>'

# ---------------- HEALTHCARE (16 products) ----------------
fn = 'collection.healthcare.json'; print('##', fn); h, j = load(fn)
S(j, 'intro', 'text',
  "<p>Monteiro's healthcare upholstery fabrics are coated fabrics for hospitals, clinics, care homes and patient seating. "
  "Every collection here carries Sanitized® antimicrobial and antifungal protection, is tested to EN 1021 and resists alcohol-based disinfectants — "
  "REACH-compliant and made in Portugal. For bleach-based cleaning, choose a bleach-tested collection such as CHANCE Mediflex, MARA or FURNA.</p>"
  "<p>Specifying for medical devices or clinical equipment? See our <a href='/collections/medical' title='Fabrics for medical equipment'>fabrics for medical equipment</a>.</p>"
  + BROWSE)
S(j, 'credentials', 'label', 'Resists alcohol disinfectants', 'c2')
S(j, 'credentials', 'label', 'EN 1021 fire tested', 'c3')
S(j, 'credentials', 'label', 'Up to 400,000 Martindale', 'c4')
S(j, 'specs', 'value', 'Sanitized® antibacterial and antifungal protection', 's2')
S(j, 'specs', 'value', 'Resists alcohol-based disinfectants; bleach-tested collections available', 's3')
DEL(j, 'specs', 's4'); DEL(j, 'specs', 's5')
S(j, 'specs', 'value', 'Up to 400,000 Martindale, by collection', 's6')
S(j, 'specs', 'label', 'Fire performance', 's7')
S(j, 'specs', 'value', 'EN 1021-1+2, NFPA 260 and Cal TB 117 on every collection; BS 5852 Crib 5 on CHANCE Crib 5, MARA, FURNA, GARBE and ELEFANTE', 's7')
DEL(j, 'specs', 's8'); DEL(j, 'specs', 's10')
S(j, 'faq', 'cp_description', 'Coated upholstery fabrics for hospitals, clinics, care homes and patient seating: Sanitized® antimicrobial, EN 1021 fire tested, resistant to alcohol-based disinfectants, REACH-compliant. Made in Portugal by Monteiro Fabrics.')
S(j, 'faq', 'answer', "<p>Healthcare upholstery fabrics must withstand repeated disinfection, inhibit microbial growth and meet fire-safety requirements — while staying comfortable for patients. Monteiro's healthcare fabrics are coated fabrics with Sanitized® antimicrobial and antifungal protection and REACH compliance.</p>", 'q1')
S(j, 'faq', 'answer', '<p>Every collection here resists alcohol-based disinfectants. For bleach-based protocols, choose a bleach-tested collection such as CHANCE Mediflex, MARA or FURNA — ask us for the test reports. Avoid abrasive pads and undiluted solvents.</p>', 'q2')
S(j, 'faq', 'answer', '<p>Yes — every collection here carries Sanitized® antibacterial and antifungal protection. CHANCE Mediflex is also tested for antiviral activity (ISO 18184) and to ISO 10993 for cytotoxicity, skin sensitisation and irritation.</p>', 'q3')
REPL(j, 'faq', 'answer', 'hygienic, hard-wearing, easy-to-clean surfaces', 'hygienic, hard-wearing surfaces', 'q4')
S(j, 'faq', 'question', 'Which fire standards do the fabrics meet?', 'q5')
S(j, 'faq', 'answer', '<p>Every collection here is tested to EN 1021-1+2, NFPA 260 and Cal TB 117. CHANCE Crib 5, MARA, FURNA, GARBE and ELEFANTE are also tested to BS 5852 Crib 5. All are REACH-compliant. Ask our team for the certificates your project requires.</p>', 'q5')
save(fn, h, j)

# ---------------- MARINE (11 + SIESTA) ----------------
fn = 'collection.marine.json'; print('##', fn); h, j = load(fn)
S(j, 'intro', 'text',
  "<p>Monteiro's marine interior upholstery fabrics are coated fabrics for yacht and boat interiors. Every fabric in the collection is tested to IMO 2010 FTP Code Part 8, "
  "light-resistant and mould-resistant (Sanitized® antifungal) — REACH-compliant and made in Portugal. For seating on deck, choose LIMA, MARINA, SIESTA or CHANCE Outdoor.</p>" + BROWSE)
ICON(j, 'c1', 'flame', 'IMO 2010 FTP Code Part 8')
ICON(j, 'c2', 'light-resistant', 'Light resistant')
ICON(j, 'c3', 'anti-microbial', 'Mould resistant')
ICON(j, 'c4', 'long-lasting', 'Long lasting')
DEL(j, 'credentials', 'c5'); S(j, 'credentials', 'columns', 4)
S(j, 'specs', 'label', 'Light fastness', 's2'); S(j, 'specs', 'value', 'Light-resistant', 's2')
S(j, 'specs', 'label', 'Sea water', 's3'); S(j, 'specs', 'value', 'Colour-fast to water and sea water on MARINA, SIESTA, CHANCE Classic and CHANCE Outdoor', 's3')
S(j, 'specs', 'label', 'Mould', 's4'); S(j, 'specs', 'value', 'Sanitized® antifungal protection', 's4')
DEL(j, 'specs', 's5')
S(j, 'specs', 'value', 'Up to 400,000 Martindale, by collection', 's6')
S(j, 'specs', 'label', 'Fire performance', 's7'); S(j, 'specs', 'value', 'IMO 2010 FTP Code Part 8 on every collection', 's7')
DEL(j, 'specs', 's8')
S(j, 'faq', 'cp_description', 'Coated upholstery fabrics for yacht and boat interiors: IMO 2010 FTP Code Part 8 tested, light-resistant and mould-resistant. Made in Portugal by Monteiro Fabrics.')
S(j, 'faq', 'answer', "<p>Marine interior fabrics must cope with strong sunlight, salt air, humidity and frequent cleaning while staying comfortable on board. Monteiro's marine fabrics are coated fabrics that are tested to IMO 2010 FTP Code Part 8, light-resistant and mould-resistant (Sanitized® antifungal).</p>", 'q1')
S(j, 'faq', 'question', 'Are these fabrics light-resistant?', 'q2')
S(j, 'faq', 'answer', '<p>Yes — every collection is light-resistant. For exterior seating, choose a collection made for inside and outside use: LIMA, MARINA, SIESTA or CHANCE Outdoor.</p>', 'q2')
S(j, 'faq', 'question', 'Do they resist mould and sea water?', 'q3')
S(j, 'faq', 'answer', '<p>Every collection has Sanitized® antifungal protection against mould. MARINA, SIESTA, CHANCE Classic and CHANCE Outdoor are also colour-fast to water and sea water.</p>', 'q3')
S(j, 'faq', 'answer', '<p>Every collection is tested to IMO 2010 FTP Code Part 8 and is REACH-compliant. Ask our team for the marine certificates your project requires.</p>', 'q4')
REPL(j, 'faq', 'answer', 'durable, UV- and water-resistant, easy-to-clean upholstery', 'durable, light-resistant upholstery', 'q5')
S(j, 'cta', 'text', "<p>Tell us about your vessel or project and we'll recommend the right fabric for inside or on deck, share the relevant certificates and send samples.</p>")
save(fn, h, j)

# ---------------- OUTDOOR (SIESTA, LIMA, MARINA, CHANCE Outdoor) ----------------
fn = 'collection.outdoor.json'; print('##', fn); h, j = load(fn)
S(j, 'intro', 'text',
  "<p>Monteiro's outdoor upholstery fabrics are coated fabrics made for outdoor and patio furniture. Every fabric in the collection is light-resistant, mould-resistant (Sanitized® antifungal) "
  "and easy to clean — REACH-compliant and made in Portugal. MARINA, SIESTA and CHANCE Outdoor are also colour-fast to water.</p>" + BROWSE)
ICON(j, 'c1', 'anti-microbial', 'Mould resistant')
ICON(j, 'c2', 'light-resistant', 'Light resistant')
S(j, 'specs', 'label', 'Light fastness', 's2'); S(j, 'specs', 'value', 'Light-resistant', 's2')
S(j, 'specs', 'label', 'Water', 's3'); S(j, 'specs', 'value', 'Colour-fast to water on MARINA, SIESTA and CHANCE Outdoor', 's3')
S(j, 'specs', 'value', 'Sanitized® antifungal protection', 's4')
S(j, 'specs', 'value', 'Easy clean', 's5')
S(j, 'specs', 'value', 'Up to 400,000 Martindale, by collection', 's6')
DEL(j, 'specs', 's7'); DEL(j, 'specs', 's9')
S(j, 'faq', 'cp_description', 'Coated upholstery fabrics for outdoor and patio furniture: light-resistant, mould-resistant and easy to clean. Made in Portugal by Monteiro Fabrics.')
S(j, 'faq', 'answer', "<p>Outdoor upholstery fabrics must withstand sun, rain and humidity while staying easy to clean and hard-wearing. Monteiro's outdoor fabrics are coated fabrics that are light-resistant, mould-resistant (Sanitized® antifungal), easy to clean and REACH-compliant.</p>", 'q1')
S(j, 'faq', 'question', 'Do these fabrics hold their colour in the sun?', 'q2')
S(j, 'faq', 'answer', '<p>Every collection is light-resistant. CHANCE Outdoor is designed to withstand extreme conditions and offers excellent light fastness.</p>', 'q2')
S(j, 'faq', 'question', 'Do they resist mould and water?', 'q3')
S(j, 'faq', 'answer', '<p>Every collection carries Sanitized® antifungal protection against mould, and the coated surface is easy to clean. MARINA, SIESTA and CHANCE Outdoor are also colour-fast to water.</p>', 'q3')
S(j, 'faq', 'answer', "<p>The coated surface is easy to clean. Ask us for each collection's care instructions.</p>", 'q4')
S(j, 'faq', 'answer', '<p>They are specified for terraces, patios, garden furniture, outdoor hospitality and balconies — anywhere that demands light-resistant, hard-wearing, easy-to-clean upholstery.</p>', 'q5')
REPL(j, 'cta', 'text', 'right weatherproof fabric', 'right outdoor fabric')
save(fn, h, j)

# ---------------- CONTRACT (25) ----------------
ANIMAL = {'label': 'Animal-free', 'value': 'Every collection — no animal materials'}
fn = 'collection.contract.json'; print('##', fn); h, j = load(fn)
S(j, 'intro', 'text', "<p>Monteiro's contract upholstery fabrics are commercial coated fabrics for hospitality, office, healthcare, retail and public-space projects. Every fabric in the collection is fire-certified for upholstered seating — made in Portugal.</p>" + BROWSE)
ICON(j, 'c1', 'abrasion', 'Up to 400,000 Martindale')
ICON(j, 'c2', 'flame', 'Fire certified')
ICON(j, 'c3', 'easy-clean', 'Alcohol resistant')
ICON(j, 'c5', 'vegan', 'Animal-free')
DEL(j, 'credentials', 'c4'); S(j, 'credentials', 'columns', 4)
S(j, 'specs', 'value', 'Up to 400,000 Martindale, by collection', 's2')
DEL(j, 'specs', 's3'); DEL(j, 'specs', 's4')
S(j, 'specs', 'label', 'Fire performance', 's5'); S(j, 'specs', 'value', 'Certified per collection — EN 1021, BS 5852, IMO, NF P 92-507 and more', 's5')
DEL(j, 'specs', 's6'); DEL(j, 'specs', 's7'); DEL(j, 'specs', 's8'); DEL(j, 'specs', 's9')
ADD(j, 'specs', 's11', 's5', dict(ANIMAL))
S(j, 'faq', 'cp_description', 'Commercial coated upholstery fabrics for hospitality, office, healthcare, retail and public-space projects. Fire-certified for upholstered seating. Made in Portugal by Monteiro Fabrics.')
S(j, 'faq', 'answer', "<p>Contract upholstery fabrics are commercial-grade materials made for high-use furniture in professional environments rather than the home. Monteiro's contract fabrics are coated fabrics, each fire-certified for upholstered seating. Together they cover hospitality, office, healthcare, retail and public-space projects.</p>", 'q1')
S(j, 'faq', 'answer', '<p>Contract fabrics are built for far more intensive use than residential upholstery: they are abrasion-tested and fire-certified for commercial seating.</p>', 'q2')
S(j, 'faq', 'answer', '<p>Abrasion resistance goes up to 400,000 Martindale, depending on the collection — each collection page lists its figure. Ask us which suits your traffic levels.</p>', 'q3')
S(j, 'faq', 'answer', '<p>Yes. Every collection carries fire certification for upholstered seating — EN 1021 on all but CHANCE Crib 7 | B1 (BS 5852 Crib 7), with BS 5852, IMO or NF P 92-507 on many. Ask our team for the specific certificates and test reports your project requires. For seating that must meet BS 5852 Crib 5 or Crib 7, see our <a href="/collections/fire-retardant-upholstery-fabrics">fire-retardant upholstery fabrics</a>.</p>', 'q4')
REPL(j, 'faq', 'answer', 'anywhere that demands hard-wearing, easy-to-clean upholstery', 'anywhere upholstery must meet commercial fire-safety standards', 'q5')
save(fn, h, j)

# ---------------- HOSPITALITY (18) ----------------
fn = 'collection.hospitality-fabrics.json'; print('##', fn); h, j = load(fn)
S(j, 'intro', 'text', "<p>Monteiro's hospitality upholstery fabrics are contract coated fabrics for hotels, lobbies, lounges, bars and restaurants. Every fabric in the collection is fire-certified for upholstered seating — made in Portugal.</p>" + BROWSE)
S(j, 'credentials', 'label', 'Up to 400,000 Martindale', 'c1')
S(j, 'credentials', 'label', 'Alcohol resistant', 'c2')
S(j, 'credentials', 'label', 'Fire certified', 'c3')
ICON(j, 'c4', 'vegan', 'Animal-free')
S(j, 'specs', 'value', 'Up to 400,000 Martindale, by collection', 's2')
DEL(j, 'specs', 's3'); DEL(j, 'specs', 's4')
S(j, 'specs', 'label', 'Fire performance', 's5'); S(j, 'specs', 'value', 'Certified per collection — EN 1021, BS 5852 and more', 's5')
DEL(j, 'specs', 's6'); DEL(j, 'specs', 's7'); DEL(j, 'specs', 's8'); DEL(j, 'specs', 's9')
ADD(j, 'specs', 's11', 's5', dict(ANIMAL))
S(j, 'faq', 'cp_description', 'Contract coated upholstery fabrics for hotels, lobbies, lounges, bars and restaurants. Durable and fire-certified. Made in Portugal by Monteiro Fabrics.')
S(j, 'faq', 'answer', "<p>Hospitality upholstery fabrics must stand up to heavy daily use, resist alcohol-based cleaners and meet fire-safety requirements — while still looking refined. Monteiro's hospitality fabrics are contract coated fabrics that are abrasion-tested and fire-certified.</p>", 'q1')
S(j, 'faq', 'answer', '<p>The collection is abrasion-tested to up to 400,000 Martindale, depending on the collection — each collection page lists its figure — for the constant use seen in hotels, lobbies and lounges.</p>', 'q2')
S(j, 'faq', 'question', 'How are hospitality fabrics cleaned?', 'q3')
S(j, 'faq', 'answer', "<p>Every collection resists alcohol-based cleaners. Ask us for each collection's care instructions.</p>", 'q3')
S(j, 'faq', 'answer', '<p>Yes. Every collection carries fire certification for upholstered seating. Fire-safety requirements vary by country and project, so ask our team for the specific certificates your project requires.</p>', 'q4')
REPL(j, 'faq', 'answer', 'durable, stain-resistant, easy-to-clean seating', 'durable, fire-certified seating', 'q5')
save(fn, h, j)

# ---------------- COATED FABRICS (25) ----------------
fn = 'collection.coated-fabrics.json'; print('##', fn); h, j = load(fn)
S(j, 'intro', 'text', "<p>Monteiro's coated upholstery fabrics are a durable vegan leather alternative made in Portugal. A coated fabric is a textile base finished with a protective polymer coating, giving a hard-wearing surface. Every collection is fire-tested for upholstery.</p><p>Browse the full range below, or speak to a specialist for project specifications and free samples.</p>")
ICON(j, 'c1', 'abrasion', 'Abrasion-tested')
ICON(j, 'c2', 'easy-clean', 'Alcohol resistant')
ICON(j, 'c3', 'flame', 'Fire tested')
ICON(j, 'c5', 'vegan', 'Animal-free')
DEL(j, 'credentials', 'c4'); S(j, 'credentials', 'columns', 4)
S(j, 'specs', 'value', 'Leather-like coated surface', 's2')
S(j, 'specs', 'value', 'Up to 400,000 Martindale, by collection', 's3')
DEL(j, 'specs', 's4'); DEL(j, 'specs', 's5')
S(j, 'specs', 'label', 'Fire performance', 's6'); S(j, 'specs', 'value', "Certified per collection — see each collection's standards", 's6')
DEL(j, 'specs', 's8'); DEL(j, 'specs', 's9')
S(j, 'faq', 'cp_description', 'Coated upholstery fabrics — a vegan leather alternative made in Portugal. Hard-wearing and fire-tested for upholstery. Made in Portugal by Monteiro Fabrics.')
S(j, 'faq', 'answer', '<p>Coated fabrics are textiles finished with a protective polymer coating bonded to a fabric base. The coating creates a smooth, leather-like surface — making coated fabrics a practical upholstery material across many sectors.</p>', 'q1')
S(j, 'faq', 'answer', '<p>Unlike real leather, coated fabrics are animal-free and made to a specification, without the natural variation and marks found in hides. They offer a leather-like look and feel.</p>', 'q2')
S(j, 'faq', 'question', 'How durable are coated fabrics?', 'q3')
S(j, 'faq', 'answer', '<p>Abrasion resistance goes up to 400,000 Martindale, depending on the collection, and every collection resists alcohol-based cleaners. Each collection page lists its figures.</p>', 'q3')
REPL(j, 'faq', 'answer', 'anywhere upholstery needs to be hard-wearing, easy to clean and resistant to stains and water', 'anywhere upholstery needs to be hard-wearing and fire-tested', 'q5')
save(fn, h, j)

# ---------------- FIRE-RETARDANT (9) ----------------
fn = 'collection.fire-retardant.json'; print('##', fn); h, j = load(fn)
DEL(j, 'credentials', 'c2')
ICON(j, 'c3', 'easy-clean', 'Alcohol resistant')
S(j, 'credentials', 'columns', 2)
REPL(j, 'faq', 'cp_description', ', with a 10-year warranty and free samples.', ', with free samples.')
save(fn, h, j)
print('DRY RUN' if DRY else 'WRITTEN')
