# Workflow and self-check

Do this in order. Drafts go in one directory per guide. The sibling Archify CLI renders each page. This skill only links the finished pages.

## 1. Freeze the source

From the target repository:

```bash
git rev-parse HEAD
git remote get-url origin
git status --short
```

Remove HTTP(S) userinfo before writing the origin down. Record the forty-character revision. If the worktree is dirty, do not cite those paths as `HEAD`; inspect a clean checkout. A zip with no commits is not frozen until you create a local commit of the files you will cite, or you refuse to pin a revision and say so.

`doc/` essays, generated HTML, and chat notes are not runtime evidence unless you use them only as the author's claim and then check the code.

## 2. Choose levels

Read [Method](method.md). Walk entry points, manifests, and the modules they import until each level's black boxes have a source. Stop when a further file cannot change the level structure. Write the reading map first: levels kept, levels refused, and why.

## 3. Draft pages

Copy [Page template](page-template.md). One `*.archify.md` per page. Chinese. Four questions on every level page. At most four native diagrams per file (`@architecture`, `@sequence`, `@workflow`, `@tree`, or `@diagram` of another native type). Put class, lifecycle, and other non-shorthand diagrams in a JSON file beside the draft and reference `@diagram class source=diagrams/example.class.json`.

Follow [Diagrams by level](diagrams.md) and Archify's own explainer guide (`archify/references/explainer-authoring.md`) for directive shape. Do not copy schemas into this skill.

Cite `path` where useful. Add `lines=start:end` when finalize should verify that file. Per-statement line numbers are not required.

Set on every page:

```md
@meta locale=zh-CN repo_url=<credential-free origin> repo_revision=<40-hex> repo_link_mode=local-only
```

Use `local-only` unless the origin is a canonical GitHub, Gitee, or GitLab HTTPS URL. The URL must be the origin you recorded, not a guessed forge.

Keep drill tokens exact. They are the only click targets the linker can see. Explainer prose cannot link to a sibling HTML file.

Write `layers.json` in the output directory. `bin/link-pages.mjs` checks its shape:

- `pages[]`: `id`, `file` (same directory, `.html`), `title`, `role` (`overview`, `level`, `cross`, `patterns`), `parent` (`null` or an id, no cycles).
- `drills[]`: `file`, `text` (exact token in that page), `href` (a page file plus an optional `#anchor`).
- `title`: used for `index.html`.

Only `role: "level"` children become “下一层” links. Cross-cutting and mechanisms stay separate links.

## 4. Finalize, then link

From the draft directory, for each page, using the sibling CLI:

```bash
node <archify>/bin/archify.mjs finalize explainer 01-system.archify.md 01-system.html --repo-root <repo> --quality showcase --json
```

A non-zero exit is not done. Fix the named line and rerun the same command. Writing warnings (`--writing` defaults to `warn`) should be fixed when the repair keeps the meaning: sentences over 50 Chinese units, three or more “的”, paragraphs over four sentences.

When every finalize exits 0, `page.delivery.json` beside each HTML file binds those exact bytes. Link after that:

```bash
node <archify-layers>/bin/link-pages.mjs <output-directory>
node <archify>/bin/archify.mjs check <page>.html --json
```

The linker inserts navigation, then moves each `page.delivery.json` to `receipts/`. A receipt left beside the linked file fails `check` with `delivery/provenance-mismatch`, because the hash is the pre-link artifact. `link-report.json` records both hashes. `check` on the linked file validates explainer composition. It does not claim the receipt still matches the linked bytes. Linking must not change `<script>` payloads.

Open `index.html` or the reading-map page. Click one drill link and one “上一层” link.

## Self-check

Before calling the guide done, answer yes to each:

- Level 0 exists and shows the outside boundary. The bottom pages are classes or objects.
- Every middle level was kept only because it treats the next as black boxes, answers all four questions, and differs from its neighbors. Refusals are on the reading map.
- No level question is blank. Each gap says 本层不适用 and why.
- Cross-cutting lists only structures the code has, and level pages link to it.
- Mechanisms answer 解决什么问题 / 怎样运作 / 有什么代价, plus sync or async, order, and errors.
- There is no third content part.
- Each page has at most four native diagrams.
- The revision, origin, and dirty-tree note match the checkout. Unknowns are written. No behavior was filled in from names alone.
- Finalize passed on every page. After linking, `check` passed on every linked page. A drill token that the linker cannot find is a failure, not a warning.
