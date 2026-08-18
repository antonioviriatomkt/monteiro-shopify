// Probes the Sender account to find anything related to MEDIFLEX or ELECTRA:
// groups, campaigns (by title/subject), and automations.

import { paginate, api } from './sender-lib.mjs';

const KEYWORDS = ['mediflex', 'electra'];
const matches = (text) => {
  if (!text) return false;
  const t = String(text).toLowerCase();
  return KEYWORDS.some((k) => t.includes(k));
};

console.log('Fetching groups...');
const groups = await paginate('/groups');
console.log(`Total groups: ${groups.length}\n`);

console.log('Groups matching mediflex/electra:');
const matchingGroups = groups.filter((g) => matches(g.title));
for (const g of matchingGroups) {
  console.log(`  - ${g.id}  "${g.title}"  active=${g.active_subscribers}  total=${g.recipient_count}`);
}
if (!matchingGroups.length) console.log('  (none)');

console.log('\n--- All group titles (so you can spot relevant ones I missed) ---');
for (const g of groups) {
  console.log(`  ${g.id}  ${String(g.active_subscribers).padStart(5)} active  "${g.title}"`);
}

console.log('\nFetching campaigns...');
const campaigns = await paginate('/campaigns');
console.log(`Total campaigns: ${campaigns.length}\n`);

console.log('Campaigns matching mediflex/electra (by title/subject):');
const matchingCampaigns = campaigns.filter((c) => matches(c.title) || matches(c.subject));
for (const c of matchingCampaigns) {
  console.log(`  - ${c.id}  status=${c.status}  sent=${c.sent_time || '-'}  opens=${c.opens}  clicks=${c.clicks}`);
  console.log(`     title:   "${c.title}"`);
  console.log(`     subject: "${c.subject}"`);
}
if (!matchingCampaigns.length) console.log('  (none)');

console.log('\nFetching automations...');
let automations = [];
try {
  automations = await paginate('/automations');
} catch (err) {
  console.log('  (automations endpoint failed: ' + err.message.slice(0, 200) + ')');
}
if (automations.length) {
  const matchingAutomations = automations.filter((a) => matches(a.title) || matches(a.name));
  console.log(`Total automations: ${automations.length}, matching: ${matchingAutomations.length}`);
  for (const a of matchingAutomations) console.log(`  - ${a.id}  "${a.title || a.name}"`);
}
