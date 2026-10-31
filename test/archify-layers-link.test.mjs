import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const linker = fileURLToPath(new URL('../archify-layers/bin/link-pages.mjs', import.meta.url));

function page(body, scriptText = '{"keep":"下钻：对战"}') {
  return `<!doctype html>
<html data-archify-artifact="explainer"><head><title>t</title></head>
<body><a class="skip-link" href="#board">跳至正文</a>
<p>${body}</p>
<script type="application/json" id="archify-explainer-prepared">${scriptText}</script>
</body></html>`;
}

function writeSite(dir, { body = '下钻：对战', extraPage = true, manifest } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  const pages = [
    { id: 'overview', file: '00-map.html', title: '阅读地图', role: 'overview', parent: null },
    { id: 'system', file: '01-system.html', title: '整体系统', role: 'level', parent: 'overview' },
    { id: 'cross', file: '09-cross.html', title: '横切', role: 'cross', parent: 'overview' },
    { id: 'patterns', file: '10-patterns.html', title: '机制', role: 'patterns', parent: 'overview' },
  ];
  if (!extraPage) pages.splice(2);
  const drills = [{ file: '01-system.html', text: '下钻：对战', href: '00-map.html' }];
  fs.writeFileSync(path.join(dir, 'layers.json'), JSON.stringify(manifest || { title: '样例', pages, drills }));
  fs.writeFileSync(path.join(dir, '01-system.html'), page(body));
  fs.writeFileSync(path.join(dir, '00-map.html'), page('地图'));
  if (extraPage) {
    fs.writeFileSync(path.join(dir, '09-cross.html'), page('横切正文'));
    fs.writeFileSync(path.join(dir, '10-patterns.html'), page('机制正文'));
  }
}

function run(dir) {
  return spawnSync(process.execPath, [linker, dir], { encoding: 'utf8' });
}

test('links parent, next level and drill text without touching script payloads', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'archify-layers-'));
  writeSite(dir);
  const before = fs.readFileSync(path.join(dir, '01-system.html'), 'utf8');
  const script = before.match(/<script type="application\/json" id="archify-explainer-prepared">[\s\S]*?<\/script>/)[0];
  const first = run(dir);
  assert.equal(first.status, 0, first.stderr);
  const html = fs.readFileSync(path.join(dir, '01-system.html'), 'utf8');
  assert.match(html, /id="archify-layers-nav"/);
  assert.match(html, /class="archify-layers-crumbs"/);
  assert.match(html, /href="00-map.html"/);
  assert.match(html, /class="archify-layers-up" href="00-map.html">返回上一层/);
  assert.match(html, /href="09-cross.html"/);
  assert.match(html, /<a class="archify-layers-drill" href="00-map.html">下钻：对战<\/a>/);
  assert.equal(html.match(/<script type="application\/json" id="archify-explainer-prepared">[\s\S]*?<\/script>/)[0], script);
  assert.doesNotMatch(script, /archify-layers-drill/);
  const second = run(dir);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(fs.readFileSync(path.join(dir, '01-system.html'), 'utf8'), html);
  assert.match(fs.readFileSync(path.join(dir, 'index.html'), 'utf8'), /href="00-map.html"/);
});

test('refuses a missing drill token and leaves every page unchanged', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'archify-layers-'));
  writeSite(dir, { body: '没有下钻标记' });
  const before = fs.readFileSync(path.join(dir, '00-map.html'), 'utf8');
  const result = run(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing drill text/);
  assert.equal(fs.readFileSync(path.join(dir, '00-map.html'), 'utf8'), before);
  assert.equal(fs.existsSync(path.join(dir, 'index.html')), false);
});

test('moves a delivery receipt aside so the linked file is not bound to the pre-link hash', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'archify-layers-'));
  writeSite(dir);
  const receipt = { schemaVersion: 1, command: 'deliver', artifact: { sha256: 'abc', bytes: 1 } };
  fs.writeFileSync(path.join(dir, '01-system.delivery.json'), JSON.stringify(receipt));
  const result = run(dir);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(dir, '01-system.delivery.json')), false);
  assert.equal(fs.existsSync(path.join(dir, 'receipts/01-system.delivery.json')), true);
  const report = JSON.parse(fs.readFileSync(path.join(dir, 'link-report.json'), 'utf8'));
  const system = report.pages.find(entry => entry.file === '01-system.html');
  assert.equal(system.preLinkSha256, 'abc');
  assert.match(system.postLinkSha256, /^[0-9a-f]{64}$/);
});

test('links a diagram box to its child page and rejects a missing node', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'archify-layers-'));
  const diagram = `<div class="diagram-preview preview-context-map"><svg><g id="n-battle" data-node-id="battle" data-node-label="对战"><text class="t-primary">对战</text></g><g id="n-bus" data-node-id="bus" data-node-label="事件总线"><text class="t-primary">事件总线</text></g></svg></div>`;
  writeSite(dir, { body: `下钻：对战${diagram}` });
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'layers.json'), 'utf8'));
  manifest.nodes = [{ file: '01-system.html', diagram: 'context-map', node: 'battle', href: '00-map.html' }];
  fs.writeFileSync(path.join(dir, 'layers.json'), JSON.stringify(manifest));
  const payload = fs.readFileSync(path.join(dir, '01-system.html'), 'utf8').match(/<script type="application\/json"[\s\S]*?<\/script>/)[0];
  const result = run(dir);
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(dir, '01-system.html'), 'utf8');
  assert.match(html, /<a class="archify-layers-node" href="00-map.html"><g class="archify-layers-drill-node" id="n-battle"/);
  assert.match(html, /对战 ▸/);
  assert.match(html, /data-motion="still"/);
  const svg = html.match(/<svg>[\s\S]*?<\/svg>/)[0];
  assert.match(svg, /<\/a><g id="n-bus" data-node-id="bus"/);
  assert.equal(html.match(/<script type="application\/json"[\s\S]*?<\/script>/)[0], payload);
  const report = JSON.parse(fs.readFileSync(path.join(dir, 'link-report.json'), 'utf8'));
  assert.ok(report.unlinkedNodes.some(entry => entry.node === 'bus'));
  const again = run(dir);
  assert.equal(again.status, 0, again.stderr);
  assert.equal(fs.readFileSync(path.join(dir, '01-system.html'), 'utf8'), html);

  manifest.nodes.push({ file: '01-system.html', diagram: 'context-map', node: 'missing', href: '00-map.html' });
  fs.writeFileSync(path.join(dir, 'layers.json'), JSON.stringify(manifest));
  const before = fs.readFileSync(path.join(dir, '00-map.html'), 'utf8');
  const missing = run(dir);
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /missing diagram nodes/);
  assert.equal(fs.readFileSync(path.join(dir, '00-map.html'), 'utf8'), before);
});

test('keeps the behavior script out of a runtime string that mentions body', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'archify-layers-'));
  writeSite(dir);
  const runtime = `<script>(() => { const end = html.toLowerCase().lastIndexOf('</body>'); frame.srcdoc = end; })();</script>`;
  const file = path.join(dir, '01-system.html');
  const original = fs.readFileSync(file, 'utf8').replace('</body>', `${runtime}</body>`);
  fs.writeFileSync(file, original);
  const result = run(dir);
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(file, 'utf8');
  assert.equal((html.match(/<script\b/g) || []).length, (html.match(/<\/script>/g) || []).length);
  assert.match(html, /lastIndexOf\('<\/body>'\); frame\.srcdoc/);
  assert.doesNotMatch(html, /lastIndexOf\('<script id="archify-layers-behavior"/);
  const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
  assert.doesNotMatch(visible, /frame\.srcdoc/);
  assert.doesNotMatch(visible, /addEventListener/);
});

test('rejects a parent cycle before writing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'archify-layers-'));
  writeSite(dir, {
    manifest: {
      pages: [
        { id: 'a', file: 'a.html', title: 'A', role: 'level', parent: 'b' },
        { id: 'b', file: 'b.html', title: 'B', role: 'level', parent: 'a' },
      ],
      drills: [],
    },
  });
  fs.writeFileSync(path.join(dir, 'a.html'), page('a'));
  fs.writeFileSync(path.join(dir, 'b.html'), page('b'));
  const result = run(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /cycle/i);
});
