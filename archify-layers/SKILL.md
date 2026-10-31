---
name: archify-layers
description: "Turn a codebase into a Chinese layered reading guide: zoom from the whole system to classes, one explainer page per level, with a cross-cutting page and a mechanisms page. Reuses the sibling Archify renderer, schemas, finalize pipeline and explainer format. Use when the user asks for 分层阅读, 分层学习, 像学人体一样分层看代码, archify-layers, or a level-by-level code reading document. Does not replace a single Archify diagram or the archify skill."
license: Apache-2.0
metadata:
  version: "1.0"
  author: tt-a1i
---

# Archify Layers

Build a navigable Chinese reading guide for one codebase. Readers zoom in level by level. Each level treats the next as a black box, so a reader can stop at the level they need.

This skill adds no diagram renderer. Resolve the sibling Archify package and call its CLI, schemas, and explainer format. Do not copy `bin/`, `renderers/`, `schemas/`, or `assets/`.

## When to use it

Use this skill when the user wants to *learn a codebase by layers*, not when they ask for one diagram or one explainer page. A single diagram stays on the `archify` skill. Do not change that skill's behavior from here.

Read [Method](references/method.md) before choosing levels. Read [Workflow and self-check](references/workflow.md) for the commands. Read [Diagrams by level](references/diagrams.md), [Patterns and contracts](references/patterns.md), and [Page template](references/page-template.md) while drafting.

## Resolve Archify

From this skill's directory, the package is the sibling `../archify`. In this repository the CLI is `archify/bin/archify.mjs`. When the skill is installed elsewhere, use the `archify` directory next to `archify-layers`, or the installed skill's `bin/archify.mjs`. Stop if that file is missing. Do not vendor a second copy.

Run finalize from the draft directory:

```bash
node <archify>/bin/archify.mjs finalize explainer <page>.archify.md <page>.html --repo-root <repo> --quality showcase --json
```

`<archify>` is the absolute path of the sibling package. Repeat per page. Then link pages with this skill's script:

```bash
node <archify-layers>/bin/link-pages.mjs <output-directory>
```

After linking, run `check` on each HTML file. The command detects the explainer family. Linking only adds relative navigation. It does not re-render diagrams.

## What the document contains

Exactly two content parts, plus the cross-cutting pages that belong to no level:

1. **Levels.** One zoom line. The reading map states how many levels this project needs and why.
2. **Mechanisms.** Design patterns and behavioral contracts that the code actually uses.

**Cross-cutting** (shared kernel, event bus, program entry, configuration, logging, error handling) is not a level and not a third part. Include only the kinds that exist. Every level page links to it.

Do not add a glossary, tutorial, or runtime guide as a third part.

## Output

Write Chinese. One explainer page per level, plus the reading map, cross-cutting page, and mechanisms page. Split a level into sibling pages when the next level is per element (one context, one aggregate) or when a page would hold more than four native diagrams. Archify's explainer authoring limit is four native diagrams per document.

Each page links down to the next level and back to its parent. The linker fills those links from `layers.json`. Drafts use the drill tokens in the page template. Explainer prose cannot hold relative HTML links by itself.

## Diagram nodes are links

This is a hard rule. A box, actor, or tree node that has a deeper page must be a clickable link to that page. The link is the box itself, not only a sentence under the figure.

- List every such box in `layers.json` `nodes[]`: `file`, `diagram` (the explainer diagram id), `node` (the native node id), and `href` (the child page).
- `link-pages.mjs` wraps that SVG node in a link, underlines the label, and adds a ▸ marker. It fails if a listed node is absent, and it fails if a page has both a diagram and a deeper level page but no `nodes[]` entries.
- Boxes with no deeper page stay plain. Say so in the reading map or the link report. Do not invent a page just to make a box clickable.
- Every page except the reading map has a breadcrumb and a 返回上一层 link to its parent.
- Inline diagrams stay still. Do not rely on flowing edges, hover fades, or a click that opens the animated viewer. The linker forces `data-motion="still"` and turns off preview animation. Do not change the `archify` skill or its renderer to do this.

## Evidence

Follow Archify repository discipline: freeze `git rev-parse HEAD` and the credential-free origin, do not invent services or behavior, and write unknowns next to the claim they affect. Cite repository paths where they help the reader check a claim. Per-statement line numbers are not required. A line range is still required on any `@source` you want finalize to verify, and on every `@code` excerpt.

Pin the revision with `@meta repo_url repo_revision repo_link_mode`. Use `local-only` when the origin is not a public GitHub, Gitee, or GitLab HTTPS URL. Pass `--repo-root` for the checkout you froze. Do not cite dirty working-tree bytes as `HEAD`.
