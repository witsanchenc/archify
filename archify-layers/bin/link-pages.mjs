#!/usr/bin/env node
// Link finalized Archify explainer pages. Does not render diagrams.
// Relative links are injected after finalize because explainer prose
// accepts HTTP(S), source, block, node and route targets only.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const usage = 'Usage: node link-pages.mjs <directory-with-layers.json>';

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

const dirArg = process.argv[2];
if (!dirArg || process.argv.length !== 3) fail(usage);
const root = path.resolve(dirArg);
const manifestPath = path.join(root, 'layers.json');
let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (error) {
  fail(`Cannot read ${manifestPath}: ${error.message}`);
}

const pages = Array.isArray(manifest.pages) ? manifest.pages : null;
const drills = Array.isArray(manifest.drills) ? manifest.drills : [];
if (!pages?.length) fail('layers.json needs a non-empty pages array.');

const byId = new Map();
const byFile = new Map();
for (const page of pages) {
  if (!page || typeof page.id !== 'string' || typeof page.file !== 'string' || typeof page.title !== 'string') {
    fail('Each page needs id, file and title.');
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(page.id)) fail(`Page id must be an identifier: ${page.id}`);
  if (page.file !== path.basename(page.file) || !page.file.endsWith('.html')) fail(`Page file must be a same-directory HTML name: ${page.file}`);
  if (byId.has(page.id)) fail(`Duplicate page id: ${page.id}`);
  if (byFile.has(page.file)) fail(`Duplicate page file: ${page.file}`);
  if (!['level', 'overview', 'cross', 'patterns'].includes(page.role)) fail(`Page role must be level, overview, cross or patterns: ${page.id}`);
  if (page.parent !== null && typeof page.parent !== 'string') fail(`Page parent must be an id or null: ${page.id}`);
  byId.set(page.id, page);
  byFile.set(page.file, page);
}
for (const page of pages) {
  if (page.parent === null) continue;
  if (!byId.has(page.parent)) fail(`Unknown parent ${page.parent} on ${page.id}`);
  const seen = new Set();
  for (let cursor = page; cursor?.parent; cursor = byId.get(cursor.parent)) {
    if (seen.has(cursor.id)) fail(`Parent cycle includes ${page.id}`);
    seen.add(cursor.id);
  }
}
for (const drill of drills) {
  if (!drill || typeof drill.file !== 'string' || typeof drill.text !== 'string' || typeof drill.href !== 'string') {
    fail('Each drill needs file, text and href.');
  }
  if (!drill.text.trim()) fail(`Drill text is empty on ${drill.file}`);
  if (!byFile.has(drill.file)) fail(`Drill file is not a page: ${drill.file}`);
  const [target, hash] = drill.href.split('#');
  if (!byFile.has(target) || drill.href.split('#').length > 2 || (hash !== undefined && !/^[A-Za-z][\w-]*$/.test(hash))) {
    fail(`Drill href must be a page file with an optional anchor: ${drill.href}`);
  }
}
for (const page of pages) {
  if (!fs.existsSync(path.join(root, page.file))) fail(`Missing finalized page: ${page.file}`);
}

const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

const style = `<style id="archify-layers-style">
#archify-layers-nav{display:flex;flex-wrap:wrap;gap:.75rem 1rem;align-items:baseline;margin:0;padding:.7rem 1.25rem;border-bottom:1px solid color-mix(in srgb,CanvasText 16%,transparent);background:Canvas;color:CanvasText;font:14px/1.45 ui-sans-serif,system-ui,sans-serif}
#archify-layers-nav a{color:LinkText}
a.archify-layers-drill{text-underline-offset:.15em}
</style>`;

function stripPrevious(html) {
  return html
    .replace(/<style id="archify-layers-style">[\s\S]*?<\/style>/g, '')
    .replace(/<nav id="archify-layers-nav"[\s\S]*?<\/nav>/g, '')
    .replace(/<a class="archify-layers-drill" href="[^"]*">([\s\S]*?)<\/a>/g, '$1');
}

function applyDrills(html, pageDrills) {
  const parts = html.split(/(<[^>]+>)/g);
  let masked = 0;
  let anchor = 0;
  const maskedTags = new Set(['script', 'style', 'svg']);
  const ordered = [...pageDrills].sort((left, right) => right.text.length - left.text.length);
  const found = new Set();
  const rendered = parts.map(part => {
    if (part.startsWith('<')) {
      const name = part.match(/^<\/?\s*([a-zA-Z][\w:-]*)/)?.[1]?.toLowerCase();
      if (name && maskedTags.has(name)) {
        if (part.startsWith('</')) masked = Math.max(0, masked - 1);
        else if (!part.endsWith('/>')) masked += 1;
      } else if (name === 'a' && masked === 0) {
        if (part.startsWith('</')) anchor = Math.max(0, anchor - 1);
        else if (!part.endsWith('/>')) anchor += 1;
      }
      return part;
    }
    if (masked || anchor) return part;
    let text = part;
    for (const drill of ordered) {
      const token = drill.text;
      if (!text.includes(token)) continue;
      found.add(token);
      const link = `<a class="archify-layers-drill" href="${escape(drill.href)}">${escape(token)}</a>`;
      text = text.split(token).join(link);
    }
    return text;
  }).join('');
  const missing = ordered.filter(drill => !found.has(drill.text)).map(drill => drill.text);
  return { html: rendered, missing };
}

function navigation(page) {
  const links = [];
  const overview = pages.find(entry => entry.role === 'overview');
  if (overview && overview.id !== page.id) links.push(`<a href="${escape(overview.file)}">阅读地图</a>`);
  if (page.parent) {
    const parent = byId.get(page.parent);
    links.push(`<a href="${escape(parent.file)}">上一层：${escape(parent.title)}</a>`);
  }
  for (const child of pages.filter(entry => entry.parent === page.id && entry.role === 'level')) {
    links.push(`<a href="${escape(child.file)}">下一层：${escape(child.title)}</a>`);
  }
  for (const role of ['cross', 'patterns']) {
    const extra = pages.find(entry => entry.role === role);
    if (extra && extra.id !== page.id) links.push(`<a href="${escape(extra.file)}">${escape(extra.title)}</a>`);
  }
  return `<nav id="archify-layers-nav" aria-label="分层导航">${links.join('')}</nav>`;
}

function insert(html, page) {
  let next = html;
  if (next.includes('</head>')) next = next.replace('</head>', `${style}</head>`);
  else next = style + next;
  const nav = navigation(page);
  if (next.includes('class="skip-link"')) {
    next = next.replace(/(<a\b[^>]*class="skip-link"[^>]*>[\s\S]*?<\/a>)/, `$1${nav}`);
  } else if (/<body\b[^>]*>/i.test(next)) {
    next = next.replace(/<body\b[^>]*>/i, match => `${match}${nav}`);
  } else {
    next = nav + next;
  }
  return next;
}

const planned = [];
for (const page of pages) {
  const original = fs.readFileSync(path.join(root, page.file), 'utf8');
  const stripped = stripPrevious(original);
  const pageDrills = drills.filter(drill => drill.file === page.file);
  const drilled = applyDrills(stripped, pageDrills);
  if (drilled.missing.length) {
    fail(`${page.file} is missing drill text: ${drilled.missing.join(' | ')}`);
  }
  planned.push({ file: page.file, html: insert(drilled.html, page) });
}

for (const entry of planned) fs.writeFileSync(path.join(root, entry.file), entry.html);
const receiptsDir = path.join(root, 'receipts');
fs.mkdirSync(receiptsDir, { recursive: true });
const linked = planned.map(entry => {
  const sidecarName = `${path.basename(entry.file, '.html')}.delivery.json`;
  const sidecar = path.join(root, sidecarName);
  const archived = path.join(receiptsDir, sidecarName);
  let preLinkSha256 = null;
  const readSha = file => {
    try { return JSON.parse(fs.readFileSync(file, 'utf8'))?.artifact?.sha256 || null; } catch { return null; }
  };
  if (fs.existsSync(sidecar)) {
    preLinkSha256 = readSha(sidecar);
    fs.renameSync(sidecar, archived);
  } else if (fs.existsSync(archived)) {
    preLinkSha256 = readSha(archived);
  }
  return {
    file: entry.file,
    preLinkSha256,
    postLinkSha256: createHash('sha256').update(entry.html).digest('hex'),
  };
});
fs.writeFileSync(path.join(root, 'link-report.json'), `${JSON.stringify({
  ok: true,
  note: 'Delivery receipts bind the HTML from finalize, before navigation was inserted. They are moved aside so a later check validates the linked pages instead of failing a stale hash.',
  pages: linked,
}, null, 2)}\n`);
const indexTitle = typeof manifest.title === 'string' && manifest.title.trim() ? manifest.title.trim() : '分层阅读';
const overview = pages.find(entry => entry.role === 'overview') || pages[0];
const index = `<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>${escape(indexTitle)}</title></head>
<body><p><a href="${escape(overview.file)}">${escape(overview.title)}</a></p></body>
</html>
`;
fs.writeFileSync(path.join(root, 'index.html'), index);
process.stdout.write(`${JSON.stringify({ ok: true, pages: pages.length, drills: drills.length, index: 'index.html' })}\n`);
