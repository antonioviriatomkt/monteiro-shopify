// News blog SEO hygiene — June 2026 redesign.
//
// 1. Sets the News blog's SEO title + meta description.
// 2. Normalises every News article's tags to a clean 7-category taxonomy
//    (kills the "SUSTAINABLILITY" typo, casing drift and noise tags).
// 3. Backfills meta descriptions on the 8 News articles that had none.
//
// Tags REPLACE the existing list (intentional normalisation). Re-runnable.
// Targets articles by ID so the duplicate handles across blogs can't collide.
//
// Usage:
//   node scripts/news-seo-hygiene.mjs            # apply everything
//   node scripts/news-seo-hygiene.mjs --dry      # print, change nothing
//   node scripts/news-seo-hygiene.mjs 999277789561   # only this article id (test)

import { graphql } from './lib.mjs';

const DRY = process.argv.includes('--dry');
const idFilter = process.argv.slice(2).filter((a) => /^\d+$/.test(a));

const BLOG_ID = 'gid://shopify/Blog/93694886191';
const BLOG_SEO = {
  title: 'Monteiro Fabrics News — Projects, Materials & Trade Fairs',
  description:
    'News and insights from Monteiro Fabrics: sustainable coated-fabric innovation, contract projects, trade fairs and material know-how, made in Portugal since 1917.',
};

// id, tags (canonical), desc (only where it was missing)
const ARTICLES = [
  { id: '1006818197881', tags: ['Company'], desc: 'Monteiro Fabrics joins the Kaizen Institute to embed continuous improvement and lean operational excellence across its Portuguese coated-fabric production.' },
  { id: '1006797488505', tags: ['Materials'], desc: "Leather or coated fabric? The real question is performance — how Monteiro's coated fabrics pair a leather look with contract-grade durability and easy care." },
  { id: '1006169686393', tags: ['Sustainability', 'Materials'] },
  { id: '1003958567289', tags: ['Projects'] },
  { id: '1000005828985', tags: ['Projects', 'Sustainability', 'Hospitality'] },
  { id: '999412236665', tags: ['Sustainability', 'Events'] },
  { id: '999305544057', tags: ['Sustainability'] },
  { id: '998928351609', tags: ['Sustainability', 'Materials'] },
  { id: '1003253399929', tags: ['Sustainability'] },
  { id: '998584910201', tags: ['Materials'] },
  { id: '998512329081', tags: ['Events', 'Materials'] },
  { id: '998292980089', tags: ['Events'], desc: 'Monteiro Fabrics joined DesignWerkschau at the Architektur Hub in Munich, presenting sustainable Portuguese coated fabrics to architects and interior designers.' },
  { id: '998292717945', tags: ['Events'] },
  { id: '997974933881', tags: ['Events'] },
  { id: '997836915065', tags: ['Collections'], desc: 'A first look at Amazónia, the upcoming coated-fabric collection by designer Nini Andrade Silva for Monteiro Fabrics — inspired by the colours of the rainforest.' },
  { id: '997519065465', tags: ['Events'] },
  { id: '997518934393', tags: ['Events'] },
  { id: '997202166137', tags: ['Company', 'Events'] },
  { id: '608737820975', tags: ['Projects', 'Events'] },
  { id: '607971017007', tags: ['Sustainability', 'Events'] },
  { id: '607915278639', tags: ['Sustainability', 'Events'] },
  { id: '607558336815', tags: ['Events'], desc: "Monteiro Fabrics' Gisela Ferreira spoke at AMI's PVC Formulation conference on advances in sustainable, high-performance PVC coated fabrics." },
  { id: '607062786351', tags: ['Company'], desc: 'An interview with engineer Sónia Claro, General Manager of Monteiro Fabrics, on innovation, sustainability and four generations of Portuguese fabric-making.' },
  { id: '605275652399', tags: ['Projects'] },
  { id: '605450207535', tags: ['Projects', 'Hospitality'], desc: 'Architect Pedro Vasco Ferreira on designing with Monteiro Fabrics — texture, durability and sustainability in contract, hospitality and restaurant interiors.' },
  { id: '605450240303', tags: ['Company'] },
  { id: '605450273071', tags: ['Collections'] },
  { id: '605450305839', tags: ['Sustainability'] },
  { id: '605450338607', tags: ['Sustainability', 'Materials'] },
  { id: '605450371375', tags: ['Company', 'Sustainability'] },
  { id: '605450436911', tags: ['Projects', 'Hospitality'] },
  { id: '605450469679', tags: ['Company'] },
  { id: '605450502447', tags: ['Company'] },
  { id: '605450567983', tags: ['Company'], desc: "Monteiro Fabrics' story, born from passion in 1917 — from a Porto tannery to a fourth-generation maker of high-performance coated fabrics in Portugal." },
  { id: '999277789561', tags: ['Materials'] },
];

const articleMutation = `
  mutation UpdateArticle($id: ID!, $article: ArticleUpdateInput!) {
    articleUpdate(id: $id, article: $article) {
      article { id handle tags }
      userErrors { field message code }
    }
  }`;

const blogMutation = `
  mutation UpdateBlog($id: ID!, $blog: BlogUpdateInput!) {
    blogUpdate(id: $id, blog: $blog) {
      blog { id title }
      userErrors { field message code }
    }
  }`;

function descMetafield(desc) {
  return { namespace: 'global', key: 'description_tag', type: 'single_line_text_field', value: desc };
}

let failures = 0;

// ---- Blog SEO ----
if (idFilter.length === 0) {
  const blogInput = {
    metafields: [
      { namespace: 'global', key: 'title_tag', type: 'single_line_text_field', value: BLOG_SEO.title },
      descMetafield(BLOG_SEO.description),
    ],
  };
  if (DRY) {
    console.log('[dry] blogUpdate News →', JSON.stringify(blogInput.metafields.map((m) => `${m.key}=${m.value.slice(0, 40)}…`)));
  } else {
    const r = (await graphql(blogMutation, { id: BLOG_ID, blog: blogInput })).blogUpdate;
    if (r.userErrors.length) { failures++; console.error('Blog SEO errors:', JSON.stringify(r.userErrors)); }
    else console.log('✓ Blog SEO set (title_tag + description_tag)');
  }
}

// ---- Articles ----
const targets = idFilter.length ? ARTICLES.filter((a) => idFilter.includes(a.id)) : ARTICLES;
console.log(`\nProcessing ${targets.length} article(s)${DRY ? ' [dry run]' : ''}:`);

for (const a of targets) {
  const article = { tags: a.tags };
  if (a.desc) article.metafields = [descMetafield(a.desc)];
  if (DRY) {
    console.log(`  [dry] ${a.id} → tags=[${a.tags.join(', ')}]${a.desc ? '  +meta' : ''}`);
    continue;
  }
  const gid = `gid://shopify/Article/${a.id}`;
  try {
    const r = (await graphql(articleMutation, { id: gid, article })).articleUpdate;
    if (r.userErrors.length) {
      failures++;
      console.error(`  ✗ ${a.id} — ${JSON.stringify(r.userErrors)}`);
    } else {
      console.log(`  ✓ ${r.article.handle} → [${r.article.tags.join(', ')}]${a.desc ? '  +meta' : ''}`);
    }
  } catch (e) {
    failures++;
    console.error(`  ✗ ${a.id} — ${e.message}`);
  }
}

console.log(`\nDone. ${failures} failure(s).`);
process.exit(failures ? 1 : 0);
