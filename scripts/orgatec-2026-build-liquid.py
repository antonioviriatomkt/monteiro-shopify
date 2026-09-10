#!/usr/bin/env python3
"""Generate sections/orgatec-2026.liquid from the prototype (single source for markup + CSS + copy).

Rules:
- CSS: the `.orgatec` block from the prototype <style>, minus prototype chrome and the font aliases.
- Markup: the <section class="orgatec"> … </section> block.
- Copy: every element with data-i18n="key" gets `{% if og_de %}DE{% else %}EN{% endif %}` from the I18N dict.
- Links with data-path get `{{ og_root }}<path>`; the meeting <form> becomes a native `{% form 'contact' %}`.
- Product swatches: real featured images when the product exists, placeholder otherwise.
"""
import re, json, sys, pathlib

SRC = pathlib.Path(__file__).with_name("orgatec-lp.html")
html = SRC.read_text()

# ---------- copy dict (parse the JS object literal loosely → JSON) ----------
m = re.search(r"const I18N = (\{.*?\n\});", html, re.S)
js = m.group(1)
js = re.sub(r"(?m)^\s*//.*$", "", js)
js = re.sub(r"([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:", r'\1"\2":', js)   # quote keys
js = re.sub(r",(\s*[}\]])", r"\1", js)                                    # trailing commas
I18N = json.loads(js)
EN, DE = I18N["en"], I18N["de"]

def liq(key):
    en, de = EN[key], DE[key]
    if en == de:
        return en
    return "{%% if og_de %%}%s{%% else %%}%s{%% endif %%}" % (de, en)

# ---------- CSS ----------
css = re.search(r"/\* =+\n\s+ORGATEC 2026 — section styles.*?\n\*/(.*?)</style>", html, re.S)
if not css:
    css = re.search(r"(/\* ={10,}.*?)</style>", html, re.S)
css_block = css.group(1) if css else ""
# keep everything from the ORGATEC banner onwards (drop prototype chrome above it)
start = html.find("/* ============================================================\n   ORGATEC 2026")
end = html.find("</style>")
css_block = html[start:end].strip()
# headings: make the overrides win against the live theme's forced centre/colour
css_block = css_block.replace(
    ".orgatec h1,.orgatec h2,.orgatec h3,.orgatec h4{font-family:inherit;color:inherit;text-align:inherit;margin:0;font-style:normal}",
    ".orgatec h1,.orgatec h2,.orgatec h3,.orgatec h4{font-family:inherit;color:inherit!important;text-align:inherit!important;margin:0;font-style:normal}\n.orgatec .og-hero h1,.orgatec .og-band h2,.orgatec .og-faq .og-h2{text-align:center!important}")

# ---------- markup ----------
s = html.find('<section class="orgatec"')
e = html.find("</section>", s) + len("</section>")
body = html[s:e]

# i18n elements: <tag ... data-i18n="key" ...>INNER</tag>
def repl_i18n(mo):
    open_tag, tag, key, inner, close = mo.group(1), mo.group(2), mo.group(3), mo.group(4), mo.group(5)
    if key not in EN:
        sys.exit("missing key " + key)
    open_tag = open_tag.replace(' data-i18n="%s"' % key, "")
    return open_tag + liq(key) + close
body = re.sub(r'(<([a-z0-9]+)\b[^>]*\bdata-i18n="([a-z0-9_]+)"[^>]*>)(.*?)(</\2>)', repl_i18n, body, flags=re.S)

# placeholders
def repl_ph(mo):
    key = mo.group(1)
    return 'placeholder="%s"' % liq(key)
body = re.sub(r'data-ph="([a-z0-9_]+)" placeholder="[^"]*"', repl_ph, body)

# locale-aware paths
body = re.sub(r'data-path="([^"]+)" href="#"', lambda mo: 'href="{{ og_root }}%s"' % mo.group(1), body)

# section attributes
body = body.replace('<section class="orgatec" id="orgatec-2026" data-phase="pre">',
                    '<section class="orgatec" id="orgatec-2026" data-phase="{{ og_phase }}" data-section-id="{{ section.id }}">')

# hall / stand from settings (event bar, practical block keep literal Q059 in copy strings — settings override the bar)
body = body.replace('<span data-i18n="bar_stand">Hall 10.2 · Stand Q059</span>', '')  # (already replaced by liq; safety)
body = body.replace("{% if og_de %}Halle 10.2 · Stand Q059{% else %}Hall 10.2 · Stand Q059{% endif %}",
                    "{% if og_de %}{{ og_hall_de }} · {{ og_stand_de }}{% else %}{{ og_hall }} · {{ og_stand }}{% endif %}")

# hero: phase-dependent title/lead + image from settings
hero_media = '''<div class="og-hero__media"{% unless section.settings.hero_image %} data-label="Hero image · to come from Ivana"{% endunless %}>
      {%- if section.settings.hero_image -%}
        {{ section.settings.hero_image | image_url: width: 2200 | image_tag: loading: 'eager', widths: '800, 1200, 1600, 2200', sizes: '100vw', alt: section.settings.hero_image.alt | default: 'ORGATEC 2026 – Monteiro Fabrics' }}
      {%- endif -%}
    </div>'''
body = re.sub(r'<div class="og-hero__media" data-label="[^"]*"></div>', hero_media, body)

hero_title_en, hero_title_de = EN["hero_title"], DE["hero_title"]
hero_lead_en, hero_lead_de = EN["hero_lead"], DE["hero_lead"]
body = body.replace("<h1>%s</h1>" % liq("hero_title"),
    "<h1>{{ og_hero_title }}</h1>")
body = body.replace('<p class="og-lead">%s</p>' % liq("hero_lead"),
    '<p class="og-lead">{{ og_hero_lead }}</p>')
# hero secondary CTA → contact page in post phase
body = body.replace('<a class="button og-ghost" href="#meeting" data-cta="orgatec_meeting_scroll">%s</a>' % liq("hero_cta2"),
    '{%% if og_phase == "post" %%}<a class="button og-ghost" href="{{ og_root }}/pages/contact" data-cta="orgatec_contact">{%% if og_de %%}Kontakt aufnehmen{%% else %%}Get in touch{%% endif %%}</a>{%% else %%}<a class="button og-ghost" href="#meeting" data-cta="orgatec_meeting_scroll">%s</a>{%% endif %%}' % liq("hero_cta2"))

# CTA band title: phase-aware
body = body.replace("<h2>%s</h2>" % liq("band_title"), "<h2>{{ og_band_title }}</h2>")
body = body.replace('<span class="og-eyebrow">%s</span>\n        <h2>{{ og_band_title }}</h2>' % liq("band_eyebrow"),
    '<span class="og-eyebrow">{{ og_band_eyebrow }}</span>\n        <h2>{{ og_band_title }}</h2>')

# product swatches → live featured images with placeholder fallback
def swatch(handle, label_cls, cls_extra=""):
    return ('{%%- assign og_p = all_products["%s"] -%%}'
            '<div class="og-card__img og-placeholder %s"{%% unless og_p.featured_image %%} data-label="Swatch · %s"{%% endunless %%}>'
            '{%% if og_p.featured_image %%}{{ og_p.featured_image | image_url: width: 900 | image_tag: loading: "lazy", widths: "400, 600, 900", sizes: "(min-width: 1024px) 360px, (min-width: 768px) 45vw, 90vw", alt: og_p.title }}{%% endif %%}</div>'
            % (handle, label_cls, handle.replace("-collection","").capitalize()))
body = re.sub(r'<div class="og-card__img og-placeholder (og-placeholder--[a-e])" data-label="Swatch · (Electra|Straw|Origin) · 1000×1000"></div>',
              lambda mo: swatch(mo.group(2).lower() + "-collection", mo.group(1)), body)

# mini swatches in group cards: <a href="{{ og_root }}/products/x" ...><i style="…"></i><span>Name</span>…
def mini(mo):
    handle, attrs, style = mo.group(1), mo.group(2), mo.group(3)
    return ('href="{{ og_root }}/products/%s"%s>{%%- assign og_p = all_products["%s"] -%%}<i style="%s">'
            '{%% if og_p.featured_image %%}{{ og_p.featured_image | image_url: width: 400 | image_tag: loading: "lazy", alt: og_p.title }}{%% endif %%}</i>'
            % (handle, attrs, handle, style))
body = re.sub(r'href="\{\{ og_root \}\}/products/([a-z-]+)"([^>]*)><i style="([^"]+)"></i>', mini, body)

# card swatch chips (3 little squares): keep as decorative CSS — they read as "colour range"; leave.

# sector tiles: image pickers with placeholder fallback
sector_map = {"office": "sector_image_office", "healthcare": "sector_image_healthcare",
              "hospitality": "sector_image_hospitality", "public spaces": "sector_image_public"}
def sector(mo):
    label = mo.group(1); setting = sector_map[label]
    return ('<div class="og-placeholder og-placeholder--dark"{%% unless section.settings.%s %%} data-label="Sector image · %s"{%% endunless %%}>'
            '{%% if section.settings.%s %%}{{ section.settings.%s | image_url: width: 800 | image_tag: loading: "lazy", alt: "" }}{%% endif %%}</div>'
            % (setting, label, setting, setting))
body = re.sub(r'<div class="og-placeholder og-placeholder--dark" data-label="Sector image · ([a-z ]+)"></div>', sector, body)

# meeting section: hide in post phase; native contact form
body = body.replace('<div class="og-section" id="meeting">', '{% unless og_phase == "post" or section.settings.show_meeting_form == false %}\n  <div class="og-section" id="meeting">')
# close the unless after the meeting section: find the practical comment
body = body.replace('  <!-- 10 · Practical -->', '  {% endunless %}\n\n  <!-- 10 · Practical -->')

form_open = re.search(r'<form class="og-form"[^>]*>', body).group(0)
body = body.replace(form_open,
    "{% form 'contact', id: 'orgatec-meeting-form', class: 'og-form', data-form: 'orgatec_meeting' %}\n"
    "          {%- if form.posted_successfully? -%}\n"
    "          <div class=\"og-form__success\" data-form-success=\"orgatec_meeting\" style=\"display:block\">F_SUCCESS</div>\n"
    "          {%- else -%}\n"
    "          {%- if form.errors -%}<div class=\"og-form__success\" style=\"display:block\">{{ form.errors | default_errors }}</div>{%- endif -%}".replace("F_SUCCESS", liq("f_success")))
body = re.sub(r'\n\s*<div class="og-form__success" data-form-success="orgatec_meeting">.*?</div>\n\s*</form>',
              "\n          {%- endif -%}\n        {% endform %}", body, flags=re.S)
body = body.replace('<input type="hidden" name="contact[Page]" value="">', '<input type="hidden" name="contact[Page]" value="{{ request.path }}">')
body = body.replace('<input type="hidden" name="contact[Locale]" value="">', '<input type="hidden" name="contact[Locale]" value="{{ request.locale.iso_code }}">')
# form field values survive a failed post
for fld in ("name", "Company", "email", "Phone"):
    body = re.sub(r'(name="contact\[%s\]"[^>]*?)>' % fld, r'\1 value="{{ form.%s }}">' % fld, body, count=1)

# FAQ visibility
body = body.replace('  <!-- 11 · FAQ (house accordion) -->\n  <div class="og-section og-alt">', '  <!-- 11 · FAQ (house accordion) -->\n  {% if section.settings.show_faq %}\n  <div class="og-section og-alt">')
body = body.replace('      </div>\n    </div>\n  </div>\n\n</section>', '      </div>\n    </div>\n  </div>\n  {% endif %}\n\n</section>')

# ---------- Liquid head: variables ----------
head = r'''{%- comment -%}
  ORGATEC 2026 landing page — v2 (10/09/2026). Self-contained: markup + scoped CSS + JS + Event JSON-LD.
  Lives on the live theme (Showcase 7.0) at templates/page.orgatec-2026.json → /pages/orgatec-2026 (DE: /de/pages/orgatec-2026).
  Design tokens = the live theme's own: Source Sans Pro · #111 text · #464654 headings/buttons · #f5f5f5 alt bg ·
  #dbdbdb rules · .button (uppercase 13px / .13em / 18px 30px / square). Uses the theme's .button class directly.
  Copy: EN default, DE when request.locale is de (formal Sie; "beschichtete Möbelstoffe", never "Kunstleder").
  CHANCE 2.0 is promoted only — no sample CTA until it launches with the new website.
  Phases (section setting): pre (default) · live (27/10) · post (31/10: form hidden, hero/band swap to "Missed ORGATEC?").
  Tracking hooks: data-cta / data-cta-slot / data-collection on every CTA · form id orgatec-meeting-form ·
  success = ?contact_posted=true + [data-form-success="orgatec_meeting"] · hidden utm_* + gclid fields.
  Generated from Clients/Monteiro-Fabrics/prototypes/orgatec-2026/index.html by build_liquid.py — edit the prototype, regenerate.
{%- endcomment -%}
{%- liquid
  assign og_de = false
  if request.locale.iso_code == 'de'
    assign og_de = true
  endif
  assign og_root = routes.root_url
  if og_root == '/'
    assign og_root = ''
  endif
  assign og_phase = section.settings.phase | default: 'pre'
  assign og_hall = section.settings.hall | default: 'Hall 10.2'
  assign og_stand = section.settings.stand | default: 'Stand Q059'
  assign og_hall_de = og_hall | replace: 'Hall', 'Halle'
  assign og_stand_de = og_stand

  if og_phase == 'live'
    if og_de
      assign og_hero_title = 'Diese Woche auf der ORGATEC – Halle 10.2, Stand Q059'
      assign og_hero_lead = '27.–30. Oktober, Koelnmesse. Besuchen Sie uns am Stand – oder bestellen Sie kostenlose Muster direkt ins Büro.'
      assign og_band_eyebrow = 'Diese Woche in Köln'
      assign og_band_title = 'Bestellen Sie Ihre Muster – oder holen Sie sie am Stand ab.'
    else
      assign og_hero_title = "We're at ORGATEC this week – Hall 10.2, Stand Q059"
      assign og_hero_lead = '27–30 October, Koelnmesse. Come and see the collections, or order free samples straight to your office.'
      assign og_band_eyebrow = 'This week in Cologne'
      assign og_band_title = 'Order your samples, or pick them up at the stand.'
    endif
  elsif og_phase == 'post'
    if og_de
      assign og_hero_title = 'ORGATEC verpasst? Bestellen Sie kostenlose Muster.'
      assign og_hero_lead = 'Vielen Dank für Ihren Besuch in Köln. Die Kollektionen vom Stand können Sie jetzt als kostenlose Muster bestellen.'
      assign og_band_eyebrow = 'Nach der Messe'
      assign og_band_title = 'Bestellen Sie die Muster, die Sie in Köln gesehen haben.'
    else
      assign og_hero_title = 'Missed ORGATEC? Order free samples.'
      assign og_hero_lead = 'Thank you for visiting us in Cologne. The collections from the stand are available as free samples now.'
      assign og_band_eyebrow = 'After the fair'
      assign og_band_title = 'Order the samples you saw in Cologne.'
    endif
  else
    if og_de
      assign og_hero_title = 'HERO_TITLE_DE'
      assign og_hero_lead = 'HERO_LEAD_DE'
      assign og_band_eyebrow = 'BAND_EYEBROW_DE'
      assign og_band_title = 'BAND_TITLE_DE'
    else
      assign og_hero_title = 'HERO_TITLE_EN'
      assign og_hero_lead = 'HERO_LEAD_EN'
      assign og_band_eyebrow = 'BAND_EYEBROW_EN'
      assign og_band_title = 'BAND_TITLE_EN'
    endif
  endif
-%}
'''
def q(s):  # single-quote a liquid string literal
    return s.replace("'", "’")
head = (head.replace("HERO_TITLE_DE", q(DE["hero_title"])).replace("HERO_LEAD_DE", q(DE["hero_lead"]))
            .replace("BAND_EYEBROW_DE", q(DE["band_eyebrow"])).replace("BAND_TITLE_DE", q(DE["band_title"]))
            .replace("HERO_TITLE_EN", q(EN["hero_title"])).replace("HERO_LEAD_EN", q(EN["hero_lead"]))
            .replace("BAND_EYEBROW_EN", q(EN["band_eyebrow"])).replace("BAND_TITLE_EN", q(EN["band_title"])))

# ---------- JS (ics + utm + posted scroll + mosaic) ----------
js_block = re.search(r"/\* CHANCE 2\.0 colour mosaic.*?\n\}\)\(\);\n", html, re.S).group(0)
ics_block = re.search(r"/\* Add to calendar.*?\n\}\)\(\);\n", html, re.S).group(0)
utm_block = re.search(r"/\* UTM \+ gclid.*?\n\}\)\(\);\n", html, re.S).group(0)
script = "<script>\n" + js_block + ics_block + utm_block + r'''
/* after a native contact-form post Shopify reloads with ?contact_posted=true → bring the confirmation into view */
(function(){ if(location.search.indexOf("contact_posted=true")>-1){ var el=document.querySelector('[data-form-success="orgatec_meeting"]')||document.getElementById("meeting"); if(el){ setTimeout(function(){ el.scrollIntoView({behavior:"smooth",block:"center"}); },150); } } })();
</script>'''

jsonld = r'''<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "ORGATEC 2026 – Monteiro Fabrics, {{ og_hall }}, {{ og_stand }}",
  "startDate": "2026-10-27T09:00:00+01:00",
  "endDate": "2026-10-30T18:00:00+01:00",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": { "@type": "Place", "name": "Koelnmesse", "address": { "@type": "PostalAddress", "streetAddress": "Messeplatz 1", "postalCode": "50679", "addressLocality": "Köln", "addressCountry": "DE" } },
  "organizer": { "@type": "Organization", "name": "Monteiro Fabrics", "url": "https://www.monteirofabrics.com" },
  "description": "{% if og_de %}Beschichtete Möbelstoffe von Monteiro Fabrics auf der ORGATEC 2026 in Köln, {{ og_hall_de }}, {{ og_stand_de }}.{% else %}Coated upholstery fabrics by Monteiro Fabrics at ORGATEC 2026 in Cologne, {{ og_hall }}, {{ og_stand }}.{% endif %}",
  "url": "{{ shop.url }}{{ request.path }}"
}
</script>'''

schema = r'''{% schema %}
{
  "name": "ORGATEC 2026 landing page",
  "tag": "section",
  "class": "section-orgatec-2026",
  "settings": [
    { "type": "select", "id": "phase", "label": "Phase", "default": "pre",
      "options": [
        { "value": "pre", "label": "Before the fair (default)" },
        { "value": "live", "label": "During the fair (27–30 Oct)" },
        { "value": "post", "label": "After the fair (form hidden, 'Missed ORGATEC?')" }
      ],
      "info": "Switch to 'live' on 27/10 and 'post' on 31/10." },
    { "type": "image_picker", "id": "hero_image", "label": "Hero image (1920×1080 or larger)", "info": "Empty = neutral placeholder." },
    { "type": "text", "id": "hall", "label": "Hall", "default": "Hall 10.2" },
    { "type": "text", "id": "stand", "label": "Stand", "default": "Stand Q059" },
    { "type": "header", "content": "Sector tiles" },
    { "type": "image_picker", "id": "sector_image_office", "label": "Office" },
    { "type": "image_picker", "id": "sector_image_healthcare", "label": "Healthcare" },
    { "type": "image_picker", "id": "sector_image_hospitality", "label": "Hospitality" },
    { "type": "image_picker", "id": "sector_image_public", "label": "Public spaces" },
    { "type": "header", "content": "Blocks" },
    { "type": "checkbox", "id": "show_meeting_form", "label": "Show the stand-meeting form", "default": true },
    { "type": "checkbox", "id": "show_faq", "label": "Show 'Good to know'", "default": true }
  ],
  "presets": [ { "name": "ORGATEC 2026 landing page" } ]
}
{% endschema %}'''

out = head + "<style>\n" + css_block + "\n</style>\n\n" + body + "\n\n" + script + "\n\n" + jsonld + "\n\n" + schema + "\n"
dest = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(__file__).with_name("orgatec-2026.liquid")
dest.write_text(out)
left = re.findall(r'data-i18n="[a-z0-9_]+"', out)
print("wrote", dest, len(out), "bytes; leftover i18n attrs:", len(left))
