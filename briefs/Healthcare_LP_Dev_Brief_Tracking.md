# Healthcare LP — Dev brief, tracking hookup

**Page:** [https://www.monteirofabrics.com/pages/high-performance-upholstery-fabrics-for-medical-equipment](https://www.monteirofabrics.com/pages/high-performance-upholstery-fabrics-for-medical-equipment) **Estimated time:** 30–45 minutes **Prereq (done):** Sender SDK live in `theme.liquid`, modals open correctly for all 4 download buttons.

This is the second (and final) dev pass on the LP. The modal pattern you shipped is working — now we need the post-submit behavior wired so the marketing tracking can fire conversions.

---

## Context — what we have today

Four buttons, all gated behind embedded Sender forms in modals:

| Button | Sender form ID |
| :---- | :---- |
| Mediflex — download pdf | `eXDvAg` |
| Mediflex — download technical file | `e5Prqd` |
| Electra — download pdf | `b2kPAz` |
| Electra — download technical file | `aM8KD1` |

Currently after submit, the PDF opens in the same page (Sender form's "Redirect after submit" is pointing straight at the PDF URL, or equivalent JS). That works for the user, but GA4/GTM has no clean place to fire a `file_download_complete` conversion event — we need a Shopify page in the middle.

---

## What to do

### 1\. Create `/pages/download-thank-you` in Shopify

Shopify Admin → Online Store → Pages → Add page.

- **Title:** "Your download is starting"  
- **Visibility:** Visible  
- **URL handle:** `download-thank-you`  
- **Body (paste into the page's Custom Liquid section, NOT the rich-text body — `<script>` gets stripped from the rich-text body):**

\<div style="max-width:640px;margin:80px auto;padding:0 20px;text-align:center;font-family:inherit"\>

  \<h1 style="font-size:28px;margin:0 0 16px"\>Thanks — your download is starting\</h1\>

  \<p style="color:\#555;font-size:16px;margin:0 0 24px"\>

    If the file doesn't open automatically, \<a id="mf-dl-link" href="\#" style="text-decoration:underline"\>click here\</a\>.

  \</p\>

  \<p style="color:\#888;font-size:14px"\>You'll also receive a copy by email.\</p\>

\</div\>

\<script\>

(function(){

  var params \= new URLSearchParams(window.location.search);

  var pdf \= params.get('pdf');

  if (pdf){

    var link \= document.getElementById('mf-dl-link');

    if (link) link.href \= pdf;

    // Auto-trigger the download after a short delay so analytics has time to fire.

    setTimeout(function(){ window.location.href \= pdf; }, 1200);

  }

})();

\</script\>

### 2\. Configure Sender form redirects (all 4 forms)

For each form, in Sender → Forms → \[form name\] → Settings → After submission → Redirect to URL, paste the URL below exactly. The `pdf` param is already URL-encoded — do not re-encode.

**Mediflex — catalogue (form ID `eXDvAg`):**

https://www.monteirofabrics.com/pages/download-thank-you?asset=catalogue\&collection=mediflex\&source\_page=lp\_healthcare\&pdf=https%3A%2F%2Fcdn.shopify.com%2Fs%2Ffiles%2F1%2F0711%2F9801%2F5791%2Ffiles%2FMedical\_\_Mediflex.pdf%3Fv%3D1774030659

**Mediflex — technical file (form ID `e5Prqd`):**

https://www.monteirofabrics.com/pages/download-thank-you?asset=technical\_file\&collection=mediflex\&source\_page=lp\_healthcare\&pdf=https%3A%2F%2Fcdn.shopify.com%2Fs%2Ffiles%2F1%2F0711%2F9801%2F5791%2Ffiles%2FTF-MEDIFLEX.pdf%3Fv%3D1779615681

**Electra — catalogue (form ID `b2kPAz`):**

https://www.monteirofabrics.com/pages/download-thank-you?asset=catalogue\&collection=electra\&source\_page=lp\_healthcare\&pdf=https%3A%2F%2Fcdn.shopify.com%2Fs%2Ffiles%2F1%2F0711%2F9801%2F5791%2Ffiles%2FCatalogue\_Electra\_MAR\_26.pdf%3Fv%3D1774377616

**Electra — technical file (form ID `aM8KD1`):**

https://www.monteirofabrics.com/pages/download-thank-you?asset=technical\_file\&collection=electra\&source\_page=lp\_healthcare\&pdf=https%3A%2F%2Fcdn.shopify.com%2Fs%2Ffiles%2F1%2F0711%2F9801%2F5791%2Ffiles%2FTF-ELECTRA.pdf%3Fv%3D1779615692

If Sender Basic doesn't expose a "Redirect URL" field on these forms, let Antonio know — fallback is a `sender.on('form:submit', ...)` JS listener that navigates to the URL above. Slightly messier but works.

### 3\. Update the LP contact form redirect

Shopify Admin → Apps → Forms → open the contact form on the Healthcare LP → After submission → Redirect to URL:

https://www.monteirofabrics.com/pages/thank-you?segment=healthcare\&lead\_type=contact\_form\&source\_page=lp\_healthcare

(Keep the existing `/pages/thank-you` page — we're just adding the query string so the marketing tag knows where the lead came from.)

### 4\. Add a dataLayer push to the modal JS controller (optional but recommended)

In the Custom Liquid section on the LP that holds the modal JS, find the line that opens the modal (`openModal('tf-' + collection);` or similar) and add this immediately after it:

window.dataLayer \= window.dataLayer || \[\];

window.dataLayer.push({

  event: 'mf\_modal\_open',

  collection: collection,                         // 'mediflex' or 'electra'

  asset\_type: openTarget.textContent.trim().toUpperCase().indexOf('TECHNICAL') \!== \-1

              ? 'technical\_file'

              : 'catalogue',

  source\_page: 'lp\_healthcare'

});

This gives GTM a clean Custom Event hook for the "user opened a download modal" event, which is more robust than parsing click text in GTM. Without it, GTM falls back to a Click trigger on `[data-cta^="download_"]` — works, just more brittle.

---

## How to verify it's working (5-minute QA)

Open the LP in incognito with `?gtm_debug=1` appended. Open GA4 → Admin → DebugView in another tab. Then:

1. Click "DOWNLOAD TECHNICAL FILE" under Mediflex → modal opens → (if §4 done) `mf_modal_open` event lands in DebugView with `collection=mediflex, asset_type=technical_file`.  
2. Submit the form with a test email → page redirects to `/pages/download-thank-you?asset=technical_file&collection=mediflex&...` → "Your download is starting" page shows briefly → PDF opens → `page_view` for `/pages/download-thank-you` lands in DebugView.  
3. Repeat for the other 3 buttons. Confirm each shows the correct query params on the thank-you URL.  
4. Submit the bottom contact form → redirects to `/pages/thank-you?segment=healthcare&lead_type=contact_form&...` → `page_view` for `/pages/thank-you` lands in DebugView.

If all 4 thank-you redirects show the right query params, the marketing side (GTM tags \+ GA4 conversion config) takes over from there — no further dev work needed.

---

## Out of scope (handled by marketing in GTM, no dev work)

- Building GTM variables, triggers, tags  
- Registering GA4 custom dimensions  
- Marking GA4 Key Events  
- Importing conversions into Google Ads

Full reference for the marketing side: [LP Tracking Implementation Notion page](https://www.notion.so/3696f77101328120bd8cd8fed4953faa).  
