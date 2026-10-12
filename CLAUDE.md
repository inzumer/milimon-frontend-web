# CLAUDE.md

Guidance for Claude Code (and any other AI coding agent) working in this repository.

## Project

**Milimon** (`milimon-frontend-web`): a bilingual (`/es`, `/en`) study manual and set of
calculators for food cost, waste (desechos) and cooking loss (mermas) in gastronomy.

- Repository names: Milimon repos are `milimon-<area>-<technology>` (`milimon-frontend-web`,
  `milimon-backend-nest`, `milimon-docs`…); shared packages live in `inzumer-<name>` repos and are
  published as `@inzumer/<name>` (`@inzumer/ui-lib`, `@inzumer/ui-tokens`, `@inzumer/prettier`…).
  Local folders use the repository name.

- Master plan and decisions: [docs/PLAN.md](./docs/PLAN.md). Architecture decisions: [docs/adr](./docs/adr).
- Content: the course material (`AyG- Manual.pdf`, `FORMULAS 2026.xlsx`) is only a reference for
  concepts and methods. **Never copy its examples, figures or wording**: every worked example, number
  and text on the site is our own (the running example is a neighborhood café).
- Stack: Astro (static output) + React 19 islands, TypeScript strict, Tailwind v4 + `@inzumer/tokens`
  preset, `@inzumer/ui-library` components, Vitest + Testing Library.
- Agent roles live in [.claude/agents](./.claude/agents); start with `workflow-orchestrator-agent.md`.

Key commands (Node from `.nvmrc`, pnpm from `packageManager`):

| Command              | What it does                                                   |
| -------------------- | -------------------------------------------------------------- |
| `pnpm dev`           | Astro dev server (+ Keystatic admin at `/keystatic`)           |
| `pnpm typecheck`     | `astro check` (TS + `.astro`)                                  |
| `pnpm lint`          | ESLint (TS, React, a11y, Astro, Vitest)                        |
| `pnpm test:coverage` | Vitest with the **90%** coverage gate                          |
| `pnpm build`         | Static build to `dist/`                                        |
| `pnpm format`        | Prettier (imports sorted, Astro + Tailwind plugins)            |
| `pnpm spellcheck`    | cspell (en + es; project words in `.cspell/project-words.txt`) |
| `pnpm validate`      | typecheck + lint + test:coverage + build                       |

## Non-negotiable conventions

- **Routes** always in English and identical in both languages: `/es/formulas/cooking-loss` ↔ `/en/formulas/cooking-loss`.
- **Translations** in kebab-case folders, one file per language: `src/i18n/<folder>/{es,en}.json`.
  Folder name = formula id = route slug. `es` and `en` must have exactly the same keys.
- **Every input** has a visible label and a descriptive placeholder (what, unit, a value from our own example).
- **Tests**: every test title starts with `should …` (e.g. `it('should render the menu')`), enforced
  by `vitest/valid-title`. `describe` names the unit under test.
- **Formulas** are pure functions in `src/utils/formulas`, registered once in `registry.ts`, tested with
  our own worked examples (expected values computed by hand, not by the code under test).
- **Imports**: path aliases (`@components`, `@constants`, `@stores`, `@services`, `@hooks`, `@utils`, `@i18n`,
  `@layouts/*`, `@assets/*`, `@styles/*`, `@test/*`) for anything outside the current folder. Enforced by ESLint.
- **Constants**: limits, retries, timeouts, patterns and other tunable values live in `src/constants`
  (`@constants`), never as magic numbers inside components or services.
- **Tracking ids**: every interactive element (inputs, selects, switches, buttons, CTA links) has a
  stable id from `trackingId(scope, kind, name)` for Google Tag Manager (see docs/TRACKING.md).
- **Placement**: every UI piece lives in `src/components` (atoms / molecules / organisms),
  calculator islands included (organisms); hooks in `src/hooks`, pure helpers and formulas in `src/utils`,
  tunable values in `src/constants`, external integrations (API, GTM, sign-in SDKs) in `src/services`.
- **Text**: headings, paragraphs and inline text use the ui-library `RichText` (`variant` h1–h6,
  s1–s4, p1–p4; `as` for another element), in `.tsx` and `.astro` alike, never bare `<p>`/`<h*>`.
  Images use `astro:assets` in `.astro` and the ui-library `Image` in React.
- **Icons**: Milimon's own family, line SVGs in `src/assets/icons` (24px, 1.5 stroke, round ends, no fill),
  exposed as components by `@components/atoms/Icons` and painted with `currentColor`. Other projects keep their own
  family; the ui-library takes icons as props (`Badge`, `Chip`, `Filter`).
- **Readability**: a blank line after every `if` and before every `return` (ESLint
  `@stylistic/padding-line-between-statements`, fixed by `pnpm lint --fix`).
- **Naming**: React components in PascalCase folders; `.astro` files, content folders, slugs and
  i18n keys in kebab-case.
- **Theming**: colors only via CSS variables (`src/styles/theme.css`); light and dark mode must both work.
- **Layout**: mobile-first; one layout up to 1024px, centered container above.
- **Base path**: the site may be served under a sub-path (`BASE_PATH`). Build internal URLs
  with `localizedPath`/`withBase` (never hard-coded `/es/...` or `/favicon.ico`).
- **Security**: a strict Content-Security-Policy (hash-only scripts) is generated at build time
  (`security.csp` in `astro.config.mjs`); a new external script or API origin must be added there.
- **SEO**: pages declare their breadcrumbs with PageLayout `breadcrumbs` (drawn and emitted as
  BreadcrumbList JSON-LD) and extra schema.org data with `structuredData` (builders in `@utils/seo`).
  Canonical, hreflang and share URLs go through `canonicalPath` (no `.html`), matching the sitemap.
- **Waiting for the API**: actions that wait for a server answer show `{busy && <BrandLoader screen />}`
  (logo pulsing over the blurred page, cooking one-liners from `src/i18n/loader` at random); content loading
  in place uses `<BrandLoader label=… showLabel />`.
- **Static first**: no `client:*` directive unless the component is interactive.
- **Persistence**: through the zustand stores in `src/stores` only (persisted to localStorage, synced to the account by `services/account`). **API data**: TanStack Query with the shared client (`getQueryClient`, `queryKeys` in `@services/query`; wrap islands in `QueryProvider`), never `useEffect` fetching (ADR 0005). **Analytics**: through `track()` only.
- **Dependencies**: latest compatible versions, `pnpm audit` clean. Exceptions documented in
  [docs/adr/0002-tooling-versions.md](./docs/adr/0002-tooling-versions.md).

## Commit messages & PR titles

This repo strictly follows [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)
for every commit message and pull request title generated or suggested here.

Format: `<type>[optional scope]: <description>`

| Type       | Use for                                  |
| ---------- | ---------------------------------------- |
| `feat`     | New functionality                        |
| `fix`      | Bug fix                                  |
| `chore`    | Maintenance, dependencies, routine tasks |
| `refactor` | Code change with no functional impact    |
| `docs`     | Documentation only                       |
| `test`     | Adding or fixing tests                   |
| `style`    | Formatting/whitespace, no logic change   |
| `perf`     | Performance improvements                 |
| `ci`       | CI configuration                         |
| `build`    | Build system / tooling                   |
| `content`  | Study content or translations only       |

Breaking changes: append `!` before the colon and/or add a `BREAKING CHANGE:` footer.

Suggested scopes: `formulas`, `calculators`, `ui`, `i18n`, `theme`, `pages`, `deps`, `ci`.

## Git workflow (gitflow)

- `main`: production. Only receives `release/*` (and `hotfix/*`) merges, tagged `vX.Y.Z`.
- `dev`: integration branch. Every feature is merged here with `--no-ff`. **Staging** (Worker `milimon-staging`)
  deploys `dev` on every push, so changes can be checked a few minutes after merging.
- `feature/<kebab-name>` from `dev` → back into `dev`. One phase (or part of one) per feature branch.
- `release/<version>` from `dev` → `main` (tag) and back into `dev`. **Automatic** (Madrid time): `release-prepare.yml` cuts
  the release PR on Fridays at noon, `release-publish.yml` merges it on Mondays at 12:30 and
  `release-finish.yml` tags, publishes the GitHub Release and backports to `dev`; with no
  changes the release PRs are closed. Dependencies are updated by hand (no Dependabot); CI fails
  on any vulnerability.
- `hotfix/<kebab-name>` from `main` → `main` (tag) and `dev`.
- Releases so far: v1.0.0 (F0–F10, accounts and history) and v1.1.0 (F9: components moved to
  ui-library). New work keeps going through `feature/*` → `dev` → `release/*`.
- Never commit directly on `main` or `dev`, and never commit or push unless asked.

## Pull requests

Every PR must use [.github/PULL_REQUEST_TEMPLATE.md](./.github/PULL_REQUEST_TEMPLATE.md) filled out
in full. Describe what changed and why, tick checklist items only once they're true, and leave a
trail in "Notas adicionales" for any non-obvious decision.

## Local environment notes

- `pnpm-workspace.yaml` allows only the install scripts we need (`esbuild`) and also installs the
  WebAssembly builds of native packages, used automatically as a fallback when a native binary
  can't load (e.g. Windows Smart App Control blocking a freshly released `.node` file). Seeing
  `ExperimentalWarning: WASI` locally means that fallback is active.
