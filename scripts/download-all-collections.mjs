import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const STORE = "monteiro-fabrics.myshopify.com";
const OUT_BASE = "data/all-samples";
const COLLECTIONS = ["MARA", "PROSOFT", "MEDIFLEX", "OCEAN", "JAZZ", "STRAW", "PEEL"];
const CONCURRENCY = 12;
const MAX_PAGES = 4; // safety cap per collection

function runShopifyQuery(prefix, cursor) {
  const variables = cursor ? { cursor } : {};
  const query = `query Files($cursor: String) {
    files(first: 250, after: $cursor, query: "filename:${prefix}*") {
      pageInfo { hasNextPage endCursor }
      nodes {
        ... on MediaImage { image { url } }
      }
    }
  }`;
  const res = spawnSync("shopify", [
    "store", "execute", "--store", STORE,
    "--query", query, "--variables", JSON.stringify(variables),
  ], { encoding: "utf8" });
  if (res.status !== 0) { console.error(res.stderr); process.exit(1); }
  const jsonStart = res.stdout.indexOf("{");
  return JSON.parse(res.stdout.slice(jsonStart)).files;
}

function urlToFilename(url) {
  return decodeURIComponent(new URL(url).pathname.split("/").pop());
}

async function collectUrls(prefix) {
  let cursor = null, all = [];
  for (let p = 0; p < MAX_PAGES; p++) {
    const r = runShopifyQuery(prefix, cursor);
    const urls = r.nodes.map(n => n.image?.url).filter(Boolean);
    all.push(...urls);
    if (!r.pageInfo.hasNextPage) break;
    cursor = r.pageInfo.endCursor;
  }
  return all;
}

async function downloadBatch(urls, outDir) {
  mkdirSync(outDir, { recursive: true });
  let i = 0, done = 0, failed = 0, skipped = 0;
  async function worker() {
    while (i < urls.length) {
      const url = urls[i++];
      const filename = urlToFilename(url).split("?")[0];
      if (!filename.toLowerCase().endsWith(".jpg") && !filename.toLowerCase().endsWith(".jpeg")) continue;
      const out = join(outDir, filename);
      if (existsSync(out) && statSync(out).size > 0) { skipped++; done++; continue; }
      const res = spawnSync("curl", ["-sSfL", "-o", out, url], { encoding: "utf8" });
      if (res.status !== 0) failed++;
      done++;
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return { downloaded: urls.length - failed - skipped, failed, skipped };
}

async function main() {
  mkdirSync(OUT_BASE, { recursive: true });
  for (const prefix of COLLECTIONS) {
    console.log(`\n=== ${prefix} ===`);
    const urls = await collectUrls(prefix);
    console.log(`found ${urls.length} matching files`);
    if (urls.length === 0) continue;
    writeFileSync(join(OUT_BASE, `${prefix}_manifest.json`), JSON.stringify(urls, null, 2));
    const stats = await downloadBatch(urls, join(OUT_BASE, prefix));
    console.log(`  downloaded ${stats.downloaded}, skipped ${stats.skipped}, failed ${stats.failed}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
