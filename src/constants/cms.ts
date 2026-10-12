/** Staging build: Keystatic online (GitHub mode), drafts visible and the live preview reads GitHub. */
// `?.`: astro.config.mjs also imports this file, from plain Node (no `import.meta.env`).
export const CMS_ONLINE = import.meta.env?.PUBLIC_KEYSTATIC_STORAGE === 'github';

/** GitHub repository the CMS saves to, and the branch it edits (published to dev by cms-to-dev). */
export const CMS_REPO = 'inzumer/milimon-frontend-web';
export const CMS_DRAFT_BRANCH = 'cms/draft';

/** Keystatic on that branch, the left pane of the editor. */
export const CMS_KEYSTATIC_PATH = `/keystatic/branch/${encodeURIComponent(CMS_DRAFT_BRANCH)}`;

/** Content editor: Keystatic next to the live preview, online only on staging. */
export const CMS_URL = 'https://milimon-staging.inzumer.workers.dev/keystatic-editor';

/** Cookie with the editor's GitHub token, set by Keystatic when signing in. */
export const CMS_TOKEN_COOKIE = 'keystatic-gh-access-token';

/** How often the preview checks for a new save (ms). */
export const CMS_PREVIEW_POLL_MS = 3_000;

/** Tab titles of the CMS screens (Keystatic sets none). */
export const CMS_TITLES = {
  collections: {
    blog: { list: 'Blog', create: 'Nuevo artículo' },
    recipes: { list: 'Recetas', create: 'Nueva receta' },
  },
  home: 'Inicio',
  suffix: 'Editor de Milimon',
} as const;

/** Where each entry is seen on the site; Keystatic's "Preview" opens it ({slug} is filled in). */
export const CMS_PREVIEW_PATHS = {
  blog: '/es/blog/{slug}',
  recipes: '/es/recipes/{slug}',
} as const;
