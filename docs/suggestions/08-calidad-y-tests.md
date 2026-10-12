# 08 · Calidad, tests y monitoreo

## Tests end to end (Playwright)

Contra el build (`astro preview`) y en mobile y escritorio:

- Inicio → calculadora → elegir cuenta → cargar ejemplo → resultado y desarrollo.
- Guardar en el historial, recargar, reabrir y borrar.
- Cambiar idioma manteniendo la ruta; cambiar tema y moneda; persistencia tras recargar.
- Banner de cookies: aceptar, rechazar, reabrir desde el pie.
- Compartir: enlaces correctos y "Copiar enlace".
- Login con el backend simulado (rutas de la API interceptadas) y migración de datos.
- Menú: abrir/cerrar con teclado, foco atrapado, Escape.
- 404 en rutas inexistentes, en los dos idiomas.

## En CI

- Correr la auditoría a11y (`scripts/a11y-audit.mjs`) en cada PR, no solo a mano.
- Lighthouse CI y verificación de enlaces rotos.
- Validar el JSON-LD (Rich Results / schema.org) de las páginas clave.
- Tests de contrato entre el front y la API (los tipos del cliente contra el Swagger).
- Dependabot o Renovate para las dependencias de los tres repos.

## Monitoreo en producción

- UptimeRobot (gratis) para el sitio y `/health` de la API.
- Sentry (plan gratuito) para errores del front y de la API, respetando el consentimiento.
- Search Console: cobertura, Core Web Vitals y errores de datos estructurados.

## Repositorios y paquetes (decidido 2026-09-27)

**Repos de Milimon**: `milimon-<área>-<tecnología>` (actualizado el 28/09), para que el nombre
diga qué es y con qué está hecho.

| Antes         | Nombre                   | Contenido                                                                       | Estado        |
| ------------- | ------------------------ | ------------------------------------------------------------------------------- | ------------- |
| `milimon`     | `milimon-frontend-web`   | El sitio (Astro + React)                                                        | Pendiente     |
| `api-milimon` | `milimon-backend-nest`   | La API (NestJS + Postgres)                                                      | Hecho (28/09) |
| —             | `milimon-docs`           | El sitio de documentación (Starlight)                                           | Existe        |
| —             | `milimon-e2e-playwright` | Playwright + auditorías de accesibilidad, SEO y Lighthouse                      | A crear       |
| —             | `milimon-emails-react`   | Plantillas de emails con React Email (ver [10](./10-emails-transaccionales.md)) | A crear       |
| —             | `milimon-cms-keystatic`  | El CMS, si termina separado (ver [02](./02-cms-y-emails.md))                    | A crear       |

- **Sitio:** el deploy toma `BASE_PATH` del nombre del repo, así que renombrarlo solo mueve la URL
  a `/milimon-frontend-web` después del próximo deploy. Se rompen los enlaces ya compartidos a
  `/milimon`; con el dominio propio la URL deja de depender del nombre.
- **API:** el servicio de Render (todavía sin crear) se llama igual, así que su URL será
  `https://milimon-backend-nest.onrender.com` (variable `PUBLIC_API_URL` del sitio ya actualizada).
- GitHub redirige los nombres viejos, pero igual se actualizan los remotes
  (`git remote set-url`), las carpetas locales y las referencias en `CLAUDE.md`, `README.md` y `docs/`.
- `scripts/a11y-audit.mjs` pasa a `milimon-e2e-playwright`; `scripts/og-image.mjs` queda en el
  sitio (es una herramienta del build, no un test).

**Paquetes compartidos**: un repo `inzumer-<nombre>` por paquete, publicado como
`@inzumer/<nombre>`, en lugar del monorepo `ui-library`. Las carpetas locales usan el mismo nombre
que el repo.

| Paquete hoy                          | Repo y carpeta      | Paquete nuevo             |
| ------------------------------------ | ------------------- | ------------------------- |
| `@inzumer/ui-library` (publicado)    | `inzumer-ui-lib`    | `@inzumer/ui-lib`         |
| `@inzumer/tokens` (publicado)        | `inzumer-ui-tokens` | `@inzumer/ui-tokens`      |
| `@inzumer/prettier-config` (privado) | `inzumer-prettier`  | `@inzumer/prettier`       |
| `@inzumer/eslint-config` (privado)   | `inzumer-eslint`    | `@inzumer/eslint`         |
| `@inzumer/tsconfig` (privado)        | `inzumer-tsconfig`  | `@inzumer/tsconfig`       |
| workflows de `.github/` de cada repo | `inzumer-ci`        | (workflows reutilizables) |

- Publicar las configs (hoy privadas) permite dejar de copiarlas en cada proyecto.
- Los nombres viejos en npm (`@inzumer/ui-library`, `@inzumer/tokens`) se marcan como deprecados
  con un mensaje que apunta al nuevo, así nadie queda con una versión sin mantenimiento.
- `inzumer-ci`: workflows reutilizables de GitHub Actions (`workflow_call`) para lint, tests con
  cobertura, build, e2e, auditorías (accesibilidad, SEO, Lighthouse) y release, que llaman todos los
  repos (Milimon, Zamuner…).
- Orden: primero las configs (`tsconfig`, `prettier`, `eslint`), después los tokens, la librería
  (el repo `ui-library` se renombra a `inzumer-ui-lib` y conserva su historia), `inzumer-ci` y por
  último los consumidores (Milimon y Zamuner) con los nombres nuevos.

## Releases automáticos

**Estado: implementado (2026-09-28)** en `milimon-frontend-web` y `milimon-backend-nest`, con horario de
Madrid. Los workflows viven en [`inzumer-ci`](https://github.com/inzumer/inzumer-ci) (`@v1`) y cada repo
los llama con una línea `uses:` (`release-prepare`, `release-find` + `release-merge` y
`release-finish`); el CI de cada repo usa `node-ci` con sus propios comandos. Los mismos workflows
sirven para los demás proyectos (Zamuner, Inzumer, los paquetes `inzumer-*`).

- **Viernes 12:00** (`release-prepare.yml`): si `dev` tiene cambios desde el último tag, crea
  `release/X.Y.Z` (versión por Conventional Commits), abre el PR a `main` y corre el CI. Si no hay
  cambios, cierra los PRs de release que hayan quedado abiertos.
- **Lunes 12:00 la API y 12:30 el sitio** (`release-publish.yml`): vuelve a correr el CI, fusiona el
  PR y `release-finish.yml` crea el tag, el GitHub Release y el **backport a `dev`** (rama
  `backport/vX.Y.Z` con su PR, fusionado solo; si hay conflicto queda abierto) y despliega.
- Todo se puede lanzar a mano desde **Actions** (prepare permite elegir el tipo de versión).
- GitHub solo acepta horarios en UTC: cada workflow tiene dos horarios (verano e invierno) y corre el
  que cae al mediodía en Madrid.
- **Dependencias**: a mano, sin Dependabot (desde el 07/10), para no tener PRs automáticos abiertos.

**Configuración de cada repo** (una sola vez, en GitHub; ya hecha en `milimon` y `api-milimon` el 2026-09-28):

- **Settings → Actions → General → Workflow permissions**: "Read and write permissions" y "Allow
  GitHub Actions to create and approve pull requests".
- **Settings → General**: "Automatically delete head branches".
- Si `main` tiene reglas que piden revisiones o checks, dejar pasar al bot `github-actions` o crear
  la variable del repo `RELEASE_AUTO_MERGE=false` (entonces el PR queda para fusionarlo a mano y
  `release-finish.yml` hace el tag, el release y la vuelta a `dev`).

**Diseño inicial** (un solo workflow; después se separó en viernes y lunes, como se describe arriba)

Objetivo: que el release (`dev` → `main`, versión, tag y vuelta a `dev`) salga solo **una o dos
veces por semana** (por ejemplo martes y viernes) y que **se cierre sin hacer nada si no hay
cambios**. Primero en cada repo; después, como workflow reutilizable en `inzumer-ci`.

**Workflow `release.yml`** (`schedule` + `workflow_dispatch` para forzarlo):

1. Compara `main..dev` (commits que no son merges). **Sin cambios**: cierra los PRs `release/*`
   abiertos, borra sus ramas y termina.
2. Calcula la versión con Conventional Commits desde el último tag: `!` o `BREAKING CHANGE` →
   major, `feat` → minor, el resto → patch.
3. Cierra un PR de release anterior que haya quedado abierto, crea `release/X.Y.Z` desde `dev`,
   sube la versión (`chore(release): X.Y.Z`) y abre el PR a `main` con las notas agrupadas por tipo.
4. Corre la validación completa reutilizando `ci.yml` (agregarle `workflow_call`) sobre la rama.
5. Si pasa y la variable del repo `RELEASE_AUTO_MERGE` no es `false`: fusiona a `main`, crea el tag
   `vX.Y.Z` y el GitHub Release, fusiona `main` en `dev` y borra la rama. Si no, deja el PR para
   revisarlo a mano y un `release-finish.yml` (PR a `main` cerrado y fusionado) hace el resto.

**Detalles a tener en cuenta**

- Lo que hace el `GITHUB_TOKEN` **no dispara otros workflows**: ni el CI del PR ni el deploy de Pages
  por el push a `main`. Por eso la validación va dentro del mismo workflow (paso 4) y el deploy del
  front se lanza con `gh workflow run pages.yml --ref main`. Render sí despliega solo (usa su propia
  integración con GitHub). Alternativa: un token de una GitHub App como secreto.
- Protección de ramas: si `main` pide revisiones, el merge automático falla; o se exceptúa al bot o
  se usa `RELEASE_AUTO_MERGE=false`.
- Se puede correr dos veces sin romper nada: si el tag ya existe, no se vuelve a crear.
- `concurrency` por repo para que no corran dos releases a la vez.
- Activar "Automatically delete head branches" en cada repo.
- Orden: primero la API (el front puede depender de endpoints nuevos). Con horarios distintos (API
  martes 9:00, front martes 11:00) alcanza; más adelante, un release coordinado desde `inzumer-ci`.
