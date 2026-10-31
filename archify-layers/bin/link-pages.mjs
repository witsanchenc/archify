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
const nodes = Array.isArray(manifest.nodes) ? manifest.nodes : [];
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
function pageHref(href, label) {
  const [target, hash] = String(href).split('#');
  if (!byFile.has(target) || String(href).split('#').length > 2 || (hash !== undefined && !/^[A-Za-z][\w-]*$/.test(hash))) {
    fail(`${label} must be a page file with an optional anchor: ${href}`);
  }
}
for (const drill of drills) {
  if (!drill || typeof drill.file !== 'string' || typeof drill.text !== 'string' || typeof drill.href !== 'string') {
    fail('Each drill needs file, text and href.');
  }
  if (!drill.text.trim()) fail(`Drill text is empty on ${drill.file}`);
  if (!byFile.has(drill.file)) fail(`Drill file is not a page: ${drill.file}`);
  pageHref(drill.href, 'Drill href');
}
for (const node of nodes) {
  if (!node || typeof node.file !== 'string' || typeof node.node !== 'string' || typeof node.href !== 'string' || typeof node.diagram !== 'string') {
    fail('Each nodes entry needs file, diagram, node and href.');
  }
  if (!/^[A-Za-z][\w-]*$/.test(node.node) || !/^[A-Za-z][\w-]*$/.test(node.diagram)) {
    fail(`Node and diagram ids must be identifiers: ${node.diagram}.${node.node}`);
  }
  if (!byFile.has(node.file)) fail(`Node file is not a page: ${node.file}`);
  pageHref(node.href, 'Node href');
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
.archify-layers-crumbs{display:flex;flex-wrap:wrap;gap:.35rem;margin:0;padding:0;list-style:none}
.archify-layers-crumbs li:not(:last-child)::after{content:"/";margin-left:.35rem;color:color-mix(in srgb,CanvasText 45%,transparent)}
a.archify-layers-up{font-weight:600}
a.archify-layers-drill{text-underline-offset:.15em}
.diagram-preview,.diagram-preview *{animation:none !important;transition:none !important}
.diagram-preview [data-node-id],.diagram-preview [data-edge-id],.diagram-preview.focusing [data-node-id],.diagram-preview.focusing [data-edge-id]{opacity:1 !important}
a.archify-layers-node,a.archify-layers-node *{cursor:pointer}
a.archify-layers-node text.t-primary{text-decoration:underline;text-underline-offset:2px}
</style>`;
const behavior = `<script id="archify-layers-behavior">
document.addEventListener('click',function(event){
  var closest=event.target&&event.target.closest;
  if(!closest)return;
  var link=event.target.closest('a.archify-layers-node');
  if(link&&link.getAttribute('href')){
    event.preventDefault();
    event.stopPropagation();
    location.href=link.getAttribute('href');
    return;
  }
  if(event.target.closest('.diagram-preview')){
    event.preventDefault();
    event.stopPropagation();
  }
},true);
</script>`;

function stripPrevious(html) {
  return html
    .replace(/<style id="archify-layers-style">[\s\S]*?<\/style>/g, '')
    .replace(/<script id="archify-layers-behavior">[\s\S]*?<\/script>/g, '')
    .replace(/<nav id="archify-layers-nav"[\s\S]*?<\/nav>/g, '')
    .replace(/ data-motion="still" data-archify-layers-still=""/g, '')
    .replace(/<a class="archify-layers-node" href="[^"]*">([\s\S]*?)<\/a>/g, (_, inner) => inner
      .replace(/\sclass="archify-layers-drill-node"/g, '')
      .replace(/ class="([^"]*) archify-layers-drill-node"/g, ' class="$1"')
      .replace(/(<tspan\b[^>]*>[\s\S]*?) ▸(<\/tspan>)/g, '$1$2')
      .replace(/(<text\b[^>]*\bclass="[^"]*\bt-primary\b[^"]*"[^>]*>)([^<]*) ▸/g, '$1$2'))
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

function maskScripts(html) {
  const scripts = [];
  const masked = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, block => {
    const token = `\u0000SCRIPT${scripts.length}\u0000`;
    scripts.push(block);
    return token;
  });
  return { masked, scripts };
}
function unmaskScripts(masked, scripts) {
  return masked.replace(/\u0000SCRIPT(\d+)\u0000/g, (_, index) => scripts[Number(index)]);
}
function markGroup(group) {
  let next = group;
  if (/\bclass="[^"]*\barchify-layers-drill-node\b/.test(next.slice(0, next.indexOf('>')))) return next;
  if (/^<g\b[^>]*\bclass="/.test(next)) next = next.replace(/^<g\b([^>]*\bclass=")([^"]*)"/, '<g$1$2 archify-layers-drill-node"');
  else next = next.replace(/^<g\b/, '<g class="archify-layers-drill-node"');
  return next.replace(/(<text\b[^>]*\bclass="[^"]*\bt-primary\b[^"]*"[^>]*>)([\s\S]*?)(<\/text>)/, (all, open, inner, close) => {
    if (inner.includes('▸')) return all;
    if (inner.includes('</tspan>')) return `${open}${inner.replace(/(<\/tspan>)(?![\s\S]*<\/tspan>)/, ' ▸$1')}${close}`;
    return `${open}${inner} ▸${close}`;
  });
}
function wrapOneGroup(svg, nodeId, href) {
  const pattern = new RegExp(`<g\\b(?![^>]*\\barchify-layers-drill-node\\b)[^>]*\\bdata-node-id="${nodeId}"[^>]*>`);
  const match = pattern.exec(svg);
  if (!match) return null;
  const tags = /<\/?g\b[^>]*>/g;
  tags.lastIndex = match.index;
  let depth = 0;
  let end = -1;
  let tag;
  while ((tag = tags.exec(svg))) {
    if (tag[0].startsWith('</')) {
      depth -= 1;
      if (depth === 0) { end = tags.lastIndex; break; }
    } else if (!tag[0].endsWith('/>')) depth += 1;
  }
  if (end < 0) return null;
  const wrapped = `<a class="archify-layers-node" href="${escape(href)}">${markGroup(svg.slice(match.index, end))}</a>`;
  return svg.slice(0, match.index) + wrapped + svg.slice(end);
}
function svgExtent(html, from) {
  const start = html.indexOf('<svg', from);
  if (start < 0) return null;
  const tags = /<\/?svg\b[^>]*>/gi;
  tags.lastIndex = start;
  let depth = 0;
  let tag;
  while ((tag = tags.exec(html))) {
    if (tag[0].startsWith('</')) {
      depth -= 1;
      if (depth === 0) return [start, tags.lastIndex];
    } else if (!tag[0].endsWith('/>')) depth += 1;
  }
  return null;
}
function linkNodes(html, pageNodes) {
  const { masked, scripts } = maskScripts(html);
  let next = masked;
  const found = new Set();
  const present = [];
  const opener = /<div\b[^>]*class="([^"]*\bdiagram-preview\b[^"]*)"/g;
  const regions = [];
  let openerMatch;
  while ((openerMatch = opener.exec(next))) {
    const diagram = openerMatch[1].split(/\s+/).find(token => token.startsWith('preview-'))?.slice('preview-'.length);
    const extent = svgExtent(next, openerMatch.index);
    if (!diagram || !extent) continue;
    regions.push({ diagram, start: extent[0], end: extent[1] });
  }
  for (const region of regions.reverse()) {
    let svg = next.slice(region.start, region.end);
    const ids = [...svg.matchAll(/\bdata-node-id="([^"]+)"/g)].map(match => match[1]);
    for (const id of ids) if (!present.some(entry => entry.diagram === region.diagram && entry.node === id)) present.push({ diagram: region.diagram, node: id });
    for (const link of pageNodes.filter(entry => entry.diagram === region.diagram)) {
      let wrapped = svg;
      let guard = 0;
      while (guard < 20) {
        const step = wrapOneGroup(wrapped, link.node, link.href);
        if (!step) break;
        wrapped = step;
        found.add(`${link.diagram}:${link.node}`);
        guard += 1;
      }
      svg = wrapped;
    }
    if (!svg.includes('data-archify-layers-still')) {
      // The still flag belongs on the preview div, which sits before this svg.
    }
    next = next.slice(0, region.start) + svg + next.slice(region.end);
  }
  next = next.replace(/<div\b(?![^>]*\bdata-archify-layers-still\b)([^>]*\bclass="[^"]*\bdiagram-preview\b)/g, '<div data-motion="still" data-archify-layers-still=""$1');
  const missing = pageNodes.filter(entry => !found.has(`${entry.diagram}:${entry.node}`)).map(entry => `${entry.diagram}.${entry.node}`);
  const linkedKeys = new Set(pageNodes.map(entry => `${entry.diagram}:${entry.node}`));
  const unlinked = present.filter(entry => !linkedKeys.has(`${entry.diagram}:${entry.node}`));
  return { html: unmaskScripts(next, scripts), missing, unlinked };
}

function navigation(page) {
  const chain = [];
  for (let cursor = page; cursor; cursor = cursor.parent ? byId.get(cursor.parent) : null) chain.push(cursor);
  chain.reverse();
  const crumbs = chain.map((entry, index) => index === chain.length - 1
    ? `<li aria-current="page">${escape(entry.title)}</li>`
    : `<li><a href="${escape(entry.file)}">${escape(entry.title)}</a></li>`).join('');
  const links = [`<ol class="archify-layers-crumbs">${crumbs}</ol>`];
  if (page.parent) {
    const parent = byId.get(page.parent);
    links.push(`<a class="archify-layers-up" href="${escape(parent.file)}">返回上一层</a>`);
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
  // The explainer runtime contains the characters "</body>" inside a script string.
  // Replacing the first match splices this script into that string and the
  // following "</script>" ends the runtime early, so the rest is visible text.
  const bodyClose = next.lastIndexOf('</body>');
  if (bodyClose >= 0) next = next.slice(0, bodyClose) + behavior + next.slice(bodyClose);
  else next += behavior;
  return next;
}

const planned = [];
const unlinkedNodes = [];
for (const page of pages) {
  const original = fs.readFileSync(path.join(root, page.file), 'utf8');
  const stripped = stripPrevious(original);
  const pageDrills = drills.filter(drill => drill.file === page.file);
  const drilled = applyDrills(stripped, pageDrills);
  if (drilled.missing.length) {
    fail(`${page.file} is missing drill text: ${drilled.missing.join(' | ')}`);
  }
  const pageNodes = nodes.filter(entry => entry.file === page.file);
  const linkedNodes = linkNodes(drilled.html, pageNodes);
  if (linkedNodes.missing.length) {
    fail(`${page.file} is missing diagram nodes: ${linkedNodes.missing.join(' | ')}`);
  }
  const hasDiagram = drilled.html.includes('class="diagram-preview') || drilled.html.includes("class='diagram-preview");
  const levelChildren = pages.some(entry => entry.parent === page.id && entry.role === 'level');
  if (hasDiagram && levelChildren && pageNodes.length === 0) {
    fail(`${page.file} has a deeper level but no nodes[] links. List every box that opens a child page.`);
  }
  for (const entry of linkedNodes.unlinked) unlinkedNodes.push({ file: page.file, ...entry });
  planned.push({ file: page.file, html: insert(linkedNodes.html, page), unlinked: linkedNodes.unlinked });
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
  note: 'Delivery receipts bind the HTML from finalize, before navigation was inserted. They are moved aside so a later check validates the linked pages instead of failing a stale hash. unlinkedNodes are boxes left non-clickable on purpose: they have no deeper page.',
  pages: linked,
  nodeLinks: nodes.length,
  unlinkedNodes,
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
process.stdout.write(`${JSON.stringify({ ok: true, pages: pages.length, drills: drills.length, nodes: nodes.length, unlinkedNodes: unlinkedNodes.length, index: 'index.html' })}\n`);
