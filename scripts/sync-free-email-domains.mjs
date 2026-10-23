// Deploy the free-email blocklist (FREE in leads-lib.mjs) to Supabase.
//
// leads-lib.mjs stays the only place the list is edited. Supabase holds a copy in
// public.signals_free_email_domains so the SQL lead rules (signals_leads) apply the
// same filter; this script is the only thing that writes that copy.
//
// There is no Supabase key in this repo, so the script does not connect: it prints
// the SQL, and you run it with the Supabase connector (execute_sql).
//
// Usage:
//   node scripts/sync-free-email-domains.mjs                 -> SQL to run
//   node scripts/sync-free-email-domains.mjs --fingerprint   -> md5 to compare with
//       select public.signals_free_email_domains_fingerprint();
//
// The fingerprint is md5 of the sorted domains joined by "\n" (byte order, which is
// what `collate "C"` gives on the SQL side). Equal fingerprints = no drift.

import { createHash } from 'node:crypto';
import { FREE } from './leads-lib.mjs';

const domains = [...FREE].map((d) => d.trim().toLowerCase()).sort();

if (process.argv.includes('--fingerprint')) {
  console.log(createHash('md5').update(domains.join('\n')).digest('hex'));
} else {
  const list = domains.map((d) => `'${d.replace(/'/g, "''")}'`).join(',');
  console.log(`select public.signals_set_free_email_domains(array[${list}]);`);
}
