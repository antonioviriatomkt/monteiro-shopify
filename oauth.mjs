#!/usr/bin/env node
// Shopify OAuth helper for the Monteiro Fabrics app.
//
// Usage:
//   SHOPIFY_CLIENT_SECRET='shpss_...' node oauth.mjs
//   (or run without the env var and it will prompt for the secret)
//
// Starts a local server on port 3456, prints the install URL, and waits
// for the owner to authorize the app. Once Shopify redirects to the
// callback, exchanges the code for an access token and saves it to
// .shopify-token.json (chmod 600).

import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import readline from 'node:readline/promises';

const SHOP = 'monteiro-fabrics.myshopify.com';
const CLIENT_ID = '9ab2a52bd90e65dde15c2d1ab8242e71';
const PORT = 3456;
const REDIRECT_URI = `http://localhost:${PORT}/auth/callback`;
const SCOPES = [
  'read_content',
  'write_content',
  'read_files',
  'write_files',
  'read_themes',
  'write_themes',
  'read_metaobjects',
  'write_metaobjects',
  'read_metaobject_definitions',
  'write_metaobject_definitions',
  // Added for lead extraction: read new customers + orders (incl. sample/contact)
  'read_customers',
  'read_orders',
].join(',');

const TOKEN_FILE = new URL('./.shopify-token.json', import.meta.url);
const URL_FILE = new URL('./.install-url.txt', import.meta.url);

async function readSecret() {
  if (process.env.SHOPIFY_CLIENT_SECRET) return process.env.SHOPIFY_CLIENT_SECRET;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const secret = await rl.question('Client secret (shpss_...): ');
  rl.close();
  return secret.trim();
}

function buildInstallUrl(state) {
  const url = new URL(`https://${SHOP}/admin/oauth/authorize`);
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('scope', SCOPES);
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('state', state);
  return url.toString();
}

function verifyHmac(params, clientSecret) {
  const received = params.get('hmac');
  if (!received) return false;
  const message = [...params.entries()]
    .filter(([k]) => k !== 'hmac' && k !== 'signature')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const digest = crypto.createHmac('sha256', clientSecret).update(message).digest('hex');
  if (digest.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(received, 'hex'));
}

async function exchangeCode(shop, code, clientSecret) {
  const resp = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: clientSecret, code }),
  });
  if (!resp.ok) {
    throw new Error(`Token exchange failed: ${resp.status} ${await resp.text()}`);
  }
  return resp.json();
}

function htmlPage(title, body) {
  return `<!doctype html><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:system-ui;max-width:560px;margin:80px auto;padding:0 24px;color:#222}
h1{font-size:20px}p{line-height:1.5}code{background:#f3f3f3;padding:2px 6px;border-radius:4px}</style>
${body}`;
}

async function main() {
  const clientSecret = await readSecret();
  if (!clientSecret.startsWith('shpss_')) {
    console.warn('Warning: client secret does not start with shpss_ — continuing anyway.');
  }

  const state = crypto.randomBytes(16).toString('hex');
  const installUrl = buildInstallUrl(state);

  const server = http.createServer(async (req, res) => {
    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
    if (reqUrl.pathname !== '/auth/callback') {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(htmlPage('Not found', '<h1>Not found</h1>'));
      return;
    }

    const params = reqUrl.searchParams;
    const code = params.get('code');
    const receivedState = params.get('state');
    const shop = params.get('shop');

    try {
      if (receivedState !== state) throw new Error('State mismatch — possible CSRF.');
      if (shop !== SHOP) throw new Error(`Shop mismatch — expected ${SHOP}, got ${shop}.`);
      if (!code) throw new Error('Missing code parameter.');
      if (!verifyHmac(params, clientSecret)) throw new Error('HMAC verification failed.');

      const data = await exchangeCode(shop, code, clientSecret);

      fs.writeFileSync(
        TOKEN_FILE,
        JSON.stringify({
          shop,
          access_token: data.access_token,
          scope: data.scope,
          granted_at: new Date().toISOString(),
        }, null, 2),
        { mode: 0o600 },
      );

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(htmlPage(
        'App installed',
        `<h1>App installed successfully.</h1>
         <p>You can close this tab. The development team has captured the access token.</p>`,
      ));

      console.log('\n=== Access token received ===');
      console.log('Shop:          ', shop);
      console.log('Scope granted: ', data.scope);
      console.log('Token preview: ', data.access_token.slice(0, 12) + '...');
      console.log(`Saved to ${TOKEN_FILE.pathname} (chmod 600)`);

      try { fs.unlinkSync(URL_FILE); } catch {}
      setTimeout(() => { server.close(); process.exit(0); }, 250);
    } catch (err) {
      console.error('Callback error:', err.message);
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(htmlPage(
        'Install failed',
        `<h1>Install failed</h1><p>${err.message}</p><p>Check the terminal for details.</p>`,
      ));
      setTimeout(() => { server.close(); process.exit(1); }, 250);
    }
  });

  server.listen(PORT, () => {
    fs.writeFileSync(URL_FILE, installUrl + '\n');
    console.log(`\nLocal callback server listening on ${REDIRECT_URI}`);
    console.log('\n=== Open this URL in the store owner\'s browser ===\n');
    console.log(installUrl);
    console.log('\nWaiting for the owner to install the app...\n');
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
