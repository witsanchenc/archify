# Agent instructions

Follow [CONTRIBUTING.md](CONTRIBUTING.md) for repository changes and [REVIEWING.md](REVIEWING.md) for reviews.

## PR preparation

Before requesting final review, follow the scoped [PR improvement check](CONTRIBUTING.md#pr-improvement-check) using the project Skills when applicable.

## Test selection

Before running tests, read [Choose evidence by impact](CONTRIBUTING.md#choose-evidence-by-impact) to select coverage for the changed behavior. Use the [focused test workflow](CONTRIBUTING.md#local-setup-and-verification) for local iteration. Before integration, follow [Final integration and follow-up](CONTRIBUTING.md#final-integration-and-follow-up) to verify CI and reused evidence against the final revision.

## Live Archify installations

Install, update, reinstall, or remove a live Archify installation only when the user explicitly requests that action. Repository editing, testing, reviewing, publishing, or syncing does not authorize installation. This applies to Skills CLI, manual ZIP copies, and DSH plugins. Reuse authorization already given for the same action and scope; ask only for unresolved decisions.

- Keep the source, Skill/package, target agents, and global/project scope within the request. Avoid bulk operations or force flags that expand that scope. An update notification is informational.
- Before a Skills CLI install, discover the selected source with `npx -y skills add <source> --list --full-depth` (default source: `tt-a1i/archify`) and verify exactly one Skill named `archify`. For an explicitly requested durable local source, inspect that checkout. Stop on failed or ambiguous discovery.
- Use the canonical remote source by default. Use a local source only when requested, from a durable checkout; live symlinks must not point into temporary directories or disposable worktrees.
- Preserve unrelated files and existing unmanaged destinations. Report a destination conflict before replacing it unless that exact replacement is already explicitly authorized; use the installer's documented conflict handling within the approved scope.
- Report the action, source, targets, and result, including skipped or failed destinations. A partial installation is not a complete success.

## Cursor Cloud specific instructions

The default image already provides Node 22.23 with bundled zlib `1.3.1-e00f703` (the ZIP toolchain in [CONTRIBUTING](CONTRIBUTING.md#packages-and-generated-artifacts)) and Chrome at `/usr/bin/google-chrome`. Keep that Node; the website requires Node >= 22.12 even though the Skill runtime allows Node >= 18.

Install every lockfile before tests or the website. Root and `archify/` are the product; `website/` is the separate Astro site:

```sh
npm ci && npm --prefix archify ci && npm --prefix website ci
```

- Product smoke is `npm test`. Render the sample diagram with `node archify/bin/archify.mjs demo <directory>`, then open `archify-demo.html`.
- Website commands run in `website/`: `npm run check`, `npm run build`, `npm test`, and `npm run dev`. Dev serves `http://127.0.0.1:4321/archify/`; the `/archify` base is required. On boot, `start` launches that server when `http://127.0.0.1:4321/archify/` is not already responding.
- Astro dev may log that `assets/site-language.js` could not be resolved during its dependency scan. The staged file is still served, and Guide, Proof Lab, and the homepage load.
- Browser gates need `ARCHIFY_CHROME=/usr/bin/google-chrome`. Website browser tests also need `ARCHIFY_SITE_INTEGRATION=1` and `ARCHIFY_SITE_ROOT` set to the built `website/dist` (see [website/README.md](website/README.md)).
