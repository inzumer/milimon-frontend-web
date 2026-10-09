# Milimon

Manual de estudio y calculadoras de costos, desechos y mermas en gastronomía. Bilingüe
(`/es`, `/en`), mobile-first, con modo claro y oscuro.

Basado en el manual _Administración y Gestión gastronómica_. Plan completo en
[docs/PLAN.md](./docs/PLAN.md).

## Stack

- [Astro](https://astro.build) (salida estática) + islas de React 19
- TypeScript estricto
- Tailwind CSS v4 + [`@inzumer/tokens`](https://www.npmjs.com/package/@inzumer/tokens)
- Componentes de [`@inzumer/ui-library`](https://www.npmjs.com/package/@inzumer/ui-library)
- Vitest + Testing Library (cobertura mínima 90%)
- ESLint 10, Prettier, cspell

Detalle de versiones y excepciones: [docs/adr/0002-tooling-versions.md](./docs/adr/0002-tooling-versions.md).

## Requisitos

- Node **24.21.0** (ver `.nvmrc`; con nvm: `nvm install` + `nvm use`)
- pnpm **12** (`npm install -g pnpm@12` o `corepack enable`)

## Uso

```bash
pnpm install
pnpm dev          # http://127.0.0.1:4321 → redirige a /es; /keystatic para cargar recetas
```

| Script               | Descripción                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| `pnpm dev`           | Servidor de desarrollo                                                                 |
| `pnpm build`         | Build estático en `dist/`                                                              |
| `pnpm preview`       | Sirve el build                                                                         |
| `pnpm typecheck`     | `astro check`                                                                          |
| `pnpm lint`          | ESLint                                                                                 |
| `pnpm test`          | Tests                                                                                  |
| `pnpm test:coverage` | Tests con umbral de cobertura del 90%                                                  |
| `pnpm format`        | Prettier                                                                               |
| `pnpm spellcheck`    | Corrector ortográfico (inglés + español)                                               |
| `pnpm validate`      | typecheck + lint + test:coverage + build                                               |
| `pnpm audit:a11y`    | axe-core en todas las páginas, tema claro y oscuro (requiere `pnpm build` y Chrome)    |
| `pnpm og:image`      | Regenera las imágenes para compartir por sección `public/og/og-<sección>-<idioma>.png` |

## Deploy

El sitio es estático y se publica en **Cloudflare Workers** (Workers Builds). `wrangler.jsonc` define
un Worker por ambiente ([ADR 0006](docs/adr/0006-staging-and-production.md)):

| Worker            | Rama   | Deploy command                         | URL                                           | API                                         |
| ----------------- | ------ | -------------------------------------- | --------------------------------------------- | ------------------------------------------- |
| `milimon`         | `main` | `npx wrangler deploy --env production` | <https://milimon.inzumer.workers.dev>         | `milimon-backend-nest.onrender.com`         |
| `milimon-staging` | `dev`  | `npx wrangler deploy --env staging`    | <https://milimon-staging.inzumer.workers.dev> | `milimon-backend-nest-staging.onrender.com` |

Cada Worker tiene su build command (`pnpm build`) y sus propias variables de build (Settings → Build →
Variables): `SITE_URL`, `BASE_PATH` (`/`), `PUBLIC_API_URL`, `PUBLIC_API_KEY` (el `WEB_API_KEY` de su
API), `PUBLIC_API_APP_ID` (`web`), `PUBLIC_GOOGLE_CLIENT_ID` y `NODE_VERSION`.

**CMS en staging.** Con `PUBLIC_KEYSTATIC_STORAGE=github` el build suma el adaptador de Cloudflare:
Keystatic queda online en `/keystatic` (modo GitHub, sobre la rama `cms/draft`: al guardar, el workflow `cms-to-dev` arma `cms/<entrada>` con un solo commit, valida el build y lo mergea con squash en `dev`), staging muestra también los
borradores y el resto del sitio sigue estático. El editor (`/keystatic-editor`) pone Keystatic al
lado de la vista previa en vivo: lee la entrada de `cms/draft` en GitHub con el token de la sesión
del CMS y se recarga segundos después de cada guardado (en local lee los archivos). Producción no lleva esa variable. El Worker de
staging necesita además:

| Dónde                            | Variable                           | Qué es                               |
| -------------------------------- | ---------------------------------- | ------------------------------------ |
| Build → Variables                | `PUBLIC_KEYSTATIC_STORAGE`         | `github`                             |
| Build → Variables                | `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | Slug de la GitHub App de Keystatic   |
| Settings → Variables and Secrets | `KEYSTATIC_GITHUB_CLIENT_ID`       | Client ID de la GitHub App           |
| Settings → Variables and Secrets | `KEYSTATIC_GITHUB_CLIENT_SECRET`   | Client secret de la GitHub App       |
| Settings → Variables and Secrets | `KEYSTATIC_SECRET`                 | Clave aleatoria para firmar sesiones |

La API de cuentas se despliega aparte, en Render (ver su repo).

Variables de entorno (ver `.env.example`):

| Variable                                             | Para qué                                                                                                                           |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `SITE_URL` / `BASE_PATH`                             | Origen y ruta base del sitio (`https://milimon.inzumer.workers.dev` + `/`): canónicas, `hreflang`, sitemap y Open Graph            |
| `PUBLIC_GTM_ID`                                      | Contenedor de Google Tag Manager (`GTM-…`). Vacío = sin analítica ni banner de cookies                                             |
| `PUBLIC_API_URL`                                     | URL de la API de cuentas ([milimon-backend-nest](https://github.com/inzumer/milimon-backend-nest)). Vacío = cuentas no disponibles |
| `PUBLIC_API_KEY` / `PUBLIC_API_APP_ID`               | Identificación del cliente ante la API (públicas por diseño)                                                                       |
| `PUBLIC_GOOGLE_CLIENT_ID` / `PUBLIC_FACEBOOK_APP_ID` | Botones de login; cada uno aparece solo si está configurado                                                                        |

Para activar el login con Google y Facebook, seguí [docs/ACCOUNTS.md](docs/ACCOUNTS.md).

## Estructura

```
src/
  pages/        rutas (.astro): /[lang]/…
  layouts/      layouts .astro
  components/   toda la UI (atoms / molecules / organisms), calculadoras incluidas
  hooks/        estado de React (una por calculadora, borradores, moneda, tema)
  utils/        funciones puras: fórmulas + registry, cálculo, formato, tracking…
  constants/    valores ajustables
  stores/       estado persistido con zustand (configuración, borradores, historial)
  services/     integraciones externas (API de cuentas, Google Tag Manager, SDKs de login)
  i18n/         traducciones en carpetas kebab-case: <carpeta>/{es,en}.json
  styles/ assets/ test/
docs/
  PLAN.md       plan maestro
  adr/          decisiones de arquitectura
```

## Convenciones

Ver [CLAUDE.md](./CLAUDE.md): Conventional Commits, aliases de imports, traducciones en
kebab-case, rutas en inglés, placeholders descriptivos y tokens de color para claro y oscuro.
