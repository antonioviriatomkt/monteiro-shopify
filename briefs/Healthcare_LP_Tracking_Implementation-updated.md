# Healthcare LP — Tracking Implementation Guide

**Landing page:** https://www.monteirofabrics.com/pages/high-performance-upholstery-fabrics-for-medical-equipment
**Property:** GA4 524516546 · GTM-KWHH9H5K · Shopify
**Source of truth:** [Notion page](https://www.notion.so/3696f77101328120bd8cd8fed4953faa)

This markdown is a backup. For edits, use Notion.

---

## 0. Status

Not yet implemented. This guide will get tracking live.

---

## 1. Element map — what every button fires

| # | Element | Destination | GA4 event | Key event? |
|---|---|---|---|---|
| 1 | Hero "Speak with our specialists" | Anchor to contact form | cta_click (cta_label=speak_with_specialists) | No |
| 2 | Hero "+351 228 338 640" | tel:+351228338640 | contact_intent_click (contact_method=phone) | Secondary |
| 3 | Section 1 "Get in touch" | Anchor to contact form | cta_click (cta_label=get_in_touch) | No |
| 4 | Mediflex "download pdf" | Opens modal with embedded Sender form (form ID `eXDvAg`) | file_download_request (asset=catalogue, collection=mediflex) | No (intent) |
| 5 | Mediflex "DOWNLOAD TECHNICAL FILE" | Opens modal with embedded Sender form (form ID `e5Prqd`) | file_download_request (asset=technical_file, collection=mediflex) | No (intent) |
| 6 | Electra "download pdf" | Opens modal with embedded Sender form (form ID `b2kPAz`) | file_download_request (asset=catalogue, collection=electra) | No (intent) |
| 7 | Electra "DOWNLOAD TECHNICAL FILE" | Opens modal with embedded Sender form (form ID `aM8KD1`) | file_download_request (asset=technical_file, collection=electra) | No (intent) |
| 8 | "View collections" | /collections/healthcare?...leather | collection_view_intent | No |
| 9 | Contact form submit | /pages/thank-you | generate_lead | YES (PRIMARY) |
| 10 | Sender thank-you page | /pages/download-thank-you | file_download_complete (lead_captured=true) | YES (PRIMARY) |
| 11 | Scroll depth | n/a | scroll (built-in) | No |

**All 4 downloads are gated.** Each fires `file_download_request` on modal open (intent) and `file_download_complete` on `/pages/download-thank-you` page-view after form submit (conversion). The `asset_type` (catalogue vs technical_file) and `collection` (mediflex vs electra) are read from the URL query params, so the same GTM tag handles all 4.

---

## 2. Shopify changes required

### 2.0 Add Sender SDK to theme.liquid (NEW)

Add this snippet just before `</head>` in `theme.liquid`. It enables Sender forms to be embedded on Monteiro's pages instead of redirecting users to stats.sender.net.

```html
<script>
  (function (s, e, n, d, er) {
    s['Sender'] = er;
    s[er] = s[er] || function () { (s[er].q = s[er].q || []).push(arguments) },
    s[er].l = 1 * new Date();
    s[er].on = function(event, callback) {
      s[er].listeners = s[er].listeners || {};
      (s[er].listeners[event] = s[er].listeners[event] || []).push(callback);
    };
    var a = e.createElement(n), m = e.getElementsByTagName(n)[0];
    a.async = 1; a.src = d;
    m.parentNode.insertBefore(a, m)
  })(window, document, 'script', 'https://cdn.sender.net/accounts_resources/universal.js', 'sender');
  sender('49e7b1ca6f1106');
</script>
```

Once live, any `<div data-sender-form-id="...">` placeholder anywhere on monteirofabrics.com renders the matching Sender form inline.

### 2.1 Thank-you pages

- `/pages/thank-you` — where contact form redirects (already exists, no action needed)
- `/pages/download-thank-you` — where Sender redirects (needs to be created in Shopify Admin → Online Store → Pages; reads `?asset=`, `?collection=`, and `?pdf=` query params to auto-open the right PDF)

### 2.2 Shopify Forms contact form redirect

Apps → Forms → select the contact form on the LP. After submission → Redirect to URL:
```
https://www.monteirofabrics.com/pages/thank-you?segment=healthcare&lead_type=contact_form&source_page=lp_healthcare
```

### 2.3 Sender form redirects

Mediflex form (e5Prqd):
```
https://www.monteirofabrics.com/pages/download-thank-you?asset=technical_file&collection=mediflex&source_page=lp_healthcare
```

Electra form (TBC — does one exist?):
```
https://www.monteirofabrics.com/pages/download-thank-you?asset=technical_file&collection=electra&source_page=lp_healthcare
```

### 2.4 Optional: data-cta attributes

Ask theme dev to add `data-cta="speak_with_specialists"` and `data-cta="get_in_touch"` to the anchor buttons. Makes GTM triggers more durable to copy changes.

### 2.5 Replace "DOWNLOAD TECHNICAL FILE" links with modal-trigger buttons (NEW)

Replace each "DOWNLOAD TECHNICAL FILE" link with a button that opens a modal containing the embedded Sender form. The form renders inline because of §2.0.

Per technical file (one for Mediflex, one for Electra):

```html
<!-- Button replacing the current link -->
<button type="button" class="mf-btn" data-mf-open-modal="tf-mediflex" data-cta="download_tf_mediflex">
  DOWNLOAD TECHNICAL FILE
</button>

<!-- Modal -->
<div id="modal-tf-mediflex" class="mf-modal" hidden role="dialog">
  <div class="mf-modal__overlay" data-mf-close-modal></div>
  <div class="mf-modal__content">
    <button type="button" class="mf-modal__close" data-mf-close-modal>×</button>
    <h3>Download the Mediflex technical file</h3>
    <p>Enter your details and we'll send the PDF to your inbox.</p>
    <div class="sender-form-field" data-sender-form-id="eXDvAg"></div>
  </div>
</div>
```

Plus a tiny vanilla-JS modal controller (one block, opens/closes on data attributes) — full code in the Notion guide.

---

## 3. GTM variables

Enable built-ins: Click Element, Click URL, Click Text, Click Classes, Click ID, Page Path.

Create custom URL variables: `url - asset query`, `url - collection query`, `url - segment query`, `url - lead_type query`, `url - source_page query`.

Create constant: `const - GA4 Measurement ID` = G-XXXXXXXXXX.

---

## 4. GTM triggers

| Trigger | Type | Condition |
|---|---|---|
| Click - LP Healthcare - Phone | Click — Just Links | Click URL starts with `tel:` + Page Path = LP |
| Click - LP Healthcare - Speak with specialists | Click — All Elements | Click Text regex (case-insensitive) `^speak with our specialists$` + LP |
| Click - LP Healthcare - Get in touch | Click — All Elements | Click Text regex `^get in touch$` + LP |
| Click - LP Healthcare - Catalogue PDF (Mediflex) | Click — Just Links | Click URL contains `Medical__Mediflex.pdf` |
| Click - LP Healthcare - Catalogue PDF (Electra) | Click — Just Links | Click URL contains `Catalogue_Electra_MAR_26.pdf` |
| Click - LP Healthcare - Technical File (Mediflex) | Click — All Elements | Click Element matches CSS `[data-cta="download_tf_mediflex"]` + LP |
| Click - LP Healthcare - Technical File (Electra) | Click — All Elements | Click Element matches CSS `[data-cta="download_tf_electra"]` + LP |
| Click - LP Healthcare - View collections | Click — Just Links | Click URL contains `/collections/healthcare` + Page Path = LP |
| PV - Contact Thank You | Page View | Page Path = `/pages/thank-you` |
| PV - Download Thank You | Page View | Page Path = `/pages/download-thank-you` |

---

## 5. GTM tags

10 GA4 Event tags — full event names and parameters in the Notion page. Quick reference:

| Tag | Trigger | Event |
|---|---|---|
| GA4 - cta_click (Speak) | Click - Speak | cta_click |
| GA4 - cta_click (Get in touch) | Click - Get in touch | cta_click |
| GA4 - contact_intent_click (Phone) | Click - Phone | contact_intent_click |
| GA4 - file_download (Cat. Mediflex) | Click - Cat. Mediflex | file_download_complete |
| GA4 - file_download (Cat. Electra) | Click - Cat. Electra | file_download_complete |
| GA4 - file_download_request (TF Mediflex) | Click - TF Mediflex | file_download_request |
| GA4 - file_download_request (TF Electra) | Click - TF Electra | file_download_request |
| GA4 - collection_view_intent | Click - View collections | collection_view_intent |
| GA4 - generate_lead | PV - Contact Thank You | generate_lead |
| GA4 - file_download_complete (Sender) | PV - Download Thank You | file_download_complete |

---

## 5b. Companion sender.track events (optional)

Fire the same conversion events into Sender's CRM alongside GA4 so Sender can drive nurture automation (e.g., "requested technical file but didn't download → recovery email").

```javascript
// On "Download Technical File" button click (Mediflex)
sender('track', 'technical_file_requested', { collection: 'mediflex', source_page: 'lp_healthcare', segment: 'healthcare' });

// On /pages/download-thank-you page load
sender('track', 'technical_file_downloaded', {
  collection: new URLSearchParams(location.search).get('collection'),
  asset_type: new URLSearchParams(location.search).get('asset'),
  source_page: new URLSearchParams(location.search).get('source_page')
});

// On /pages/thank-you page load
sender('track', 'contact_form_submitted', { segment: 'healthcare', source_page: new URLSearchParams(location.search).get('source_page') });
```

Add as Custom HTML tags in GTM (same triggers as the GA4 counterparts) or inline in theme. Skip this section to launch GA4 tracking alone; add later when nurture flows are designed.

---

## 6. GA4 setup

**Custom dimensions (Event-scoped):** segment, asset_type, collection, lead_type, lead_captured, gated, cta_label, cta_location, contact_method, source_page, collection_filter.

**Key events:** generate_lead, file_download_complete, purchase. (NOT file_download_request, NOT cta_click, NOT collection_view_intent.)

---

## 7. Google Ads conversion import

| Conversion | Source | Category | Value | Primary/Secondary |
|---|---|---|---|---|
| MF - Contact form lead | generate_lead | Contact | €100 | Primary |
| MF - Technical file lead | file_download_complete WHERE asset_type=technical_file | Submit lead form | €60 | Primary |
| MF - Catalogue download | file_download_complete WHERE asset_type=catalogue | Submit lead form | €15 | Primary |
| MF - Sample order | purchase WHERE item_category=healthcare | Purchase | €25 | Primary |
| MF - Phone intent | contact_intent_click WHERE contact_method=phone | Other | €0 | Secondary |

---

## 8. QA checklist (DebugView)

Open LP with `?gtm_debug=1` and GA4 DebugView in another tab. Verify each:

- page_view fires
- Click Speak → cta_click
- Click +351 → contact_intent_click
- Click Get in touch → cta_click
- Click Mediflex PDF → file_download_complete (catalogue, mediflex, gated=false)
- Click Mediflex Tech File → modal opens on same page, file_download_request fires; submit embedded form → redirect → file_download_complete (technical_file, mediflex, lead_captured=true)
- Click Electra PDF → file_download_complete (electra)
- Click Electra Tech File + submit → file_download_complete (electra)
- Click View collections → collection_view_intent
- Submit contact form → generate_lead
- Google Ads Conversions: all 5 actions Recording within 24h
- No PII in event parameters

---

## 9. Launch order

1. Add Sender SDK to theme.liquid (§2.0)
2. Create thank-you pages
3. Configure Shopify Forms contact redirect
4. Configure Mediflex Sender redirect
5. Confirm/create Electra Sender form + redirect
6. (Optional) Add data-cta attributes
7. Replace "DOWNLOAD TECHNICAL FILE" links with modal-trigger buttons + embedded forms (§2.5)
8. GTM: create variables
9. GTM: create triggers
10. GTM: create tags
11. (Optional) Add sender.track companion events
12. GTM Preview: walk QA checklist
13. GTM: Publish
14. GA4: register custom dimensions
15. GA4: mark Key Events
16. Google Ads: import conversions
17. Soak 7 days
18. Launch Google Ads campaign

---

## 10. Open questions

1. Electra technical file Sender form URL — does one exist?
2. Gate the catalogue PDFs too, or keep them open?
3. Does Sender Basic plan expose "Redirect URL"?
4. Add data-cta attributes, or rely on click text?
5. Does this LP's Shopify Forms support "Redirect to URL"? (Confirmed for /pages/contact, need to verify here.)
6. Confirm GA4 Measurement ID (G-XXXXXXXXXX).
