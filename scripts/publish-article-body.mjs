// Reads a subagent .output JSONL, extracts the final assistant HTML body,
// and updates a Shopify article's body via articleUpdate.
// Usage: node scripts/publish-article-body.mjs <agentOutputFile> <articleGID>
import fs from 'node:fs';
import { graphql } from './lib.mjs';

const [file, gid] = process.argv.slice(2);
if (!file || !gid) { console.error('args: <outputFile> <articleGID>'); process.exit(1); }

const recs = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const assistant = [...recs].reverse().find(r => r.type === 'assistant' && r.message?.role === 'assistant');
if (!assistant) { console.error('no assistant message'); process.exit(1); }
const content = assistant.message.content;
let text = Array.isArray(content) ? content.filter(b => b.type === 'text').map(b => b.text).join('\n') : String(content);

// Extract HTML: from first block tag to the last closing </p> (drops any preamble/commentary).
const startMatch = text.match(/<(?:p|h[1-6]|ul|ol|table|div)\b/i);
if (!startMatch) { console.error('no HTML start tag found'); process.exit(1); }
const start = startMatch.index;
const lastClose = text.lastIndexOf('</p>');
if (lastClose === -1) { console.error('no closing </p> found'); process.exit(1); }
const body = text.slice(start, lastClose + 4).trim();

// sanity
const spec = (body.match(/\[SPECIALIST:/g) || []).length;
console.log(`  extracted ${body.length} chars, ${spec} [SPECIALIST] prompts`);

const mutation = `mutation($id: ID!, $article: ArticleUpdateInput!) {
  articleUpdate(id: $id, article: $article) { article { id handle } userErrors { field message } }
}`;
const res = await graphql(mutation, { id: gid, article: { body } });
const errs = res.articleUpdate.userErrors;
if (errs.length) { console.error('  userErrors:', JSON.stringify(errs)); process.exit(1); }
console.log(`  ✓ updated ${res.articleUpdate.article.handle}`);
