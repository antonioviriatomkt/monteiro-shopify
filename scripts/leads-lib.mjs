// Shared lead-qualification rules for the B2B lead jobs (daily + weekly).
//
// One place for the free-email blocklist so the Sender path (pull-leads.mjs) and
// the Shopify sample-order path (filter-orders.mjs) can never drift apart.

export const FREE = new Set([
  'gmail.com','googlemail.com','hotmail.com','hotmail.fr','hotmail.co.uk','hotmail.de','hotmail.it','hotmail.es',
  'outlook.com','outlook.fr','outlook.de','outlook.es','outlook.it','live.com','live.fr','live.nl','live.co.uk',
  'msn.com','windowslive.com',
  'yahoo.com','yahoo.fr','yahoo.co.uk','yahoo.de','yahoo.es','yahoo.it','yahoo.ca','yahoo.com.br','ymail.com',
  'icloud.com','me.com','mac.com','aol.com','gmx.com','gmx.de','gmx.net','gmx.at','gmx.ch','gmx.fr',
  'web.de','t-online.de','freenet.de','centrum.cz','seznam.cz','email.cz','proton.me','protonmail.com','pm.me',
  'mail.com','mail.ru','yandex.com','yandex.ru','qq.com','163.com','126.com','naver.com','sina.com',
  'free.fr','orange.fr','wanadoo.fr','sfr.fr','laposte.net','neuf.fr','bbox.fr','numericable.fr',
  'sapo.pt','netcabo.pt','clix.pt','iol.pt','bluewin.ch','sunrise.ch','telenet.be','skynet.be',
  'libero.it','virgilio.it','alice.it','tin.it','tiscali.it','terra.es','terra.com','telefonica.net',
  'wp.pl','onet.pl','o2.pl','interia.pl','ziggo.nl','hetnet.nl','planet.nl','bol.com.br','uol.com.br',
]);

// A lead qualifies when the address is parseable and the domain is not a
// consumer mailbox provider. Returns the domain, or null when it does not.
export function professionalDomain(email) {
  const e = String(email || '').trim().toLowerCase();
  if (!e.includes('@')) return null;
  const domain = e.split('@').pop();
  if (!domain || !domain.includes('.')) return null;
  return FREE.has(domain) ? null : domain;
}
