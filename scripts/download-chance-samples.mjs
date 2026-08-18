import { execSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const STORE = "monteiro-fabrics.myshopify.com";
const OUT_DIR = "data/chance-samples";
const CONCURRENCY = 8;

function runShopifyQuery(cursor) {
  const variables = cursor ? { cursor } : {};
  const query = `query ChanceFiles($cursor: String) {
    files(first: 250, after: $cursor, query: "filename:CHANCE*") {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        ... on MediaImage {
          image { url }
        }
        ... on GenericFile {
          url
        }
      }
    }
  }`;
  const args = [
    "store", "execute",
    "--store", STORE,
    "--query", query,
    "--variables", JSON.stringify(variables),
  ];
  const res = spawnSync("shopify", args, { encoding: "utf8" });
  if (res.status !== 0) {
    console.error("shopify execute failed:", res.stderr);
    process.exit(1);
  }
  const stdout = res.stdout;
  const jsonStart = stdout.indexOf("{");
  if (jsonStart < 0) {
    console.error("No JSON in shopify output:", stdout);
    process.exit(1);
  }
  return JSON.parse(stdout.slice(jsonStart)).files;
}

function urlToFilename(url) {
  const path = new URL(url).pathname;
  return decodeURIComponent(path.split("/").pop());
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  // Page through all CHANCE files
  let allUrls = [];
  let cursor = null;
  let page = 0;
  while (true) {
    page++;
    const result = runShopifyQuery(cursor);
    const urls = result.nodes
      .map((n) => n.image?.url || n.url)
      .filter(Boolean);
    allUrls.push(...urls);
    console.log(`page ${page}: +${urls.length} urls (total: ${allUrls.length}), hasNext=${result.pageInfo.hasNextPage}`);
    if (!result.pageInfo.hasNextPage) break;
    cursor = result.pageInfo.endCursor;
  }

  // Filter to actual sample images: filename starts with CHANCE followed by a letter (not _ or digit), ends in jpg/jpeg
  const sampleUrls = allUrls.filter((u) => {
    const name = urlToFilename(u).split("?")[0];
    return /^CHANCE[A-Za-z-]/.test(name) && /\.(jpe?g|JPE?G)$/i.test(name);
  });
  console.log(`\nfetched ${allUrls.length} total CHANCE* files, ${sampleUrls.length} match sample pattern (CHANCE + letter, .jpg)`);

  // Write manifest
  writeFileSync(`${OUT_DIR}/_manifest.json`, JSON.stringify(sampleUrls, null, 2));

  // Download with limited concurrency
  let done = 0;
  let skipped = 0;
  let failed = 0;
  const queue = [...sampleUrls];

  async function worker() {
    while (queue.length) {
      const url = queue.shift();
      const filename = urlToFilename(url).split("?")[0];
      const out = join(OUT_DIR, filename);
      if (existsSync(out) && statSync(out).size > 0) {
        skipped++;
        done++;
        continue;
      }
      const res = spawnSync("curl", ["-sSfL", "-o", out, url], { encoding: "utf8" });
      if (res.status !== 0) {
        failed++;
        console.error(`FAIL ${filename}: ${res.stderr.trim().slice(0, 200)}`);
      }
      done++;
      if (done % 20 === 0 || done === sampleUrls.length) {
        console.log(`progress ${done}/${sampleUrls.length} (skipped existing: ${skipped}, failed: ${failed})`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`\ndone: ${sampleUrls.length - failed - skipped} downloaded, ${skipped} already present, ${failed} failed`);
  console.log(`folder: ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
