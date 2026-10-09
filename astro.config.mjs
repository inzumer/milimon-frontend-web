// @ts-check
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import cloudflare from '@astrojs/cloudflare';
import markdoc from '@astrojs/markdoc';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, sessionDrivers } from 'astro/config';
import { CMS_TITLES } from './src/constants/cms.ts';
import { SETTINGS_STORAGE_KEY } from './src/constants/storage.ts';
import {
  cmsTitleScript,
  languageRedirectScript,
  notFoundLanguageScript,
  themeScript,
} from './src/utils/inline-scripts/inline-scripts.ts';
import { DEFAULT_LOCALE, LOCALES } from './src/utils/locale/locale.ts';

try {
  process.loadEnvFile();
} catch {
  // No .env file.
}

const site = process.env.SITE_URL ?? 'https://milimon.inzumer.workers.dev';
const base = process.env.BASE_PATH || '/';
const isDev = process.argv.includes('dev');
/** Staging build: Keystatic online (GitHub mode) on the Worker; the rest stays static. */
const cmsOnline = process.env.PUBLIC_KEYSTATIC_STORAGE === 'github';
if (cmsOnline) {
  // The adapter builds the Worker for this wrangler environment.
  process.env.CLOUDFLARE_ENV ??= 'staging';
}

/** Recipes stays "coming soon" (out of the sitemap) until one is published. */
const RECIPES_DIR = 'src/content/recipes';
const hasRecipes =
  existsSync(RECIPES_DIR) &&
  readdirSync(RECIPES_DIR).some(
    (file) => cmsOnline || /^draft: false$/m.test(readFileSync(`${RECIPES_DIR}/${file}`, 'utf8')),
  );
const privateRoute = hasRecipes
  ? /\/(account|history|login|admin)$/
  : /\/(account|history|login|recipes|admin)$/;

/** Editor with a live preview next to Keystatic (/keystatic-editor): local files in dev, the CMS branch on staging. */
const keystaticPreview = () => ({
  name: 'keystatic-preview',
  hooks: {
    /** @param {{ injectRoute: (route: { pattern: string, entrypoint: string, prerender: boolean }) => void }} options */
    'astro:config:setup': ({ injectRoute }) => {
      /** @param {string} pattern @param {string} entrypoint */
      const route = (pattern, entrypoint) => injectRoute({ pattern, entrypoint, prerender: false });
      route('/keystatic-editor', './src/keystatic/editor.astro');
      route('/keystatic-preview/recipes/[slug]', './src/keystatic/recipe-preview.astro');
      route('/keystatic-preview/blog/[slug]', './src/keystatic/blog-preview.astro');
      // The local version reads file times (Node); the online one asks GitHub for the branch head.
      route(
        '/keystatic-preview/version/[...file]',
        cmsOnline ? './src/keystatic/version-online.ts' : './src/keystatic/version.ts',
      );
    },
  },
});

/** @param {string | undefined} url */
const origin = (url) => {
  try {
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
};
const apiOrigin = origin(process.env.PUBLIC_API_URL);

/**
 * @param {string} text
 * @returns {`sha256-${string}`}
 */
const sha256 = (text) => `sha256-${createHash('sha256').update(text).digest('base64')}`;
const inlineScriptHashes = [
  sha256(themeScript(SETTINGS_STORAGE_KEY)),
  sha256(
    languageRedirectScript({
      storageKey: SETTINGS_STORAGE_KEY,
      locales: LOCALES,
      fallbackLocale: DEFAULT_LOCALE,
      base: base.replace(/\/+$/, ''),
    }),
  ),
  sha256(notFoundLanguageScript({ locales: LOCALES, base: base.replace(/\/+$/, '') })),
  sha256(cmsTitleScript(CMS_TITLES)),
];

/** @type {`connect-src ${string}`} */
const connectSrc = /** @type {`connect-src ${string}`} */ (
  [
    "connect-src 'self'",
    apiOrigin,
    'https://accounts.google.com',
    'https://graph.facebook.com',
    'https://*.facebook.com',
    'https://*.googletagmanager.com',
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
    // Keystatic in GitHub mode reads and commits through the GitHub API; file contents come from raw.
    cmsOnline && 'https://api.github.com https://raw.githubusercontent.com',
  ]
    .filter(Boolean)
    .join(' ')
);

/** @type {Exclude<NonNullable<NonNullable<import('astro').AstroUserConfig['security']>['csp']>, boolean>} */
const csp = {
  directives: [
    "default-src 'self'",
    connectSrc,
    `img-src 'self' data: ${cmsOnline ? 'blob: https://avatars.githubusercontent.com https://raw.githubusercontent.com ' : ''}https://*.googleusercontent.com https://*.fbcdn.net https://platform-lookaside.fbsbx.com https://*.googletagmanager.com https://*.google-analytics.com https://ssl.gstatic.com https://www.gstatic.com`,
    'frame-src https://accounts.google.com https://*.facebook.com https://www.googletagmanager.com',
    // GTM preview mode (Tag Assistant) badge fonts.
    "font-src 'self' https://fonts.gstatic.com data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ],
  scriptDirective: {
    resources: [
      "'self'",
      'https://accounts.google.com',
      'https://connect.facebook.net',
      'https://www.googletagmanager.com',
      'https://tagmanager.google.com',
    ],
    hashes: inlineScriptHashes,
  },
  styleDirective: {
    resources: [
      "'self'",
      'https://accounts.google.com',
      'https://www.googletagmanager.com',
      'https://tagmanager.google.com',
      'https://fonts.googleapis.com',
      { resource: "'self'", kind: 'element' },
      { resource: "'unsafe-inline'", kind: 'element' },
      { resource: 'https://accounts.google.com', kind: 'element' },
      { resource: 'https://www.googletagmanager.com', kind: 'element' },
      { resource: 'https://tagmanager.google.com', kind: 'element' },
      { resource: 'https://fonts.googleapis.com', kind: 'element' },
      { resource: "'unsafe-inline'", kind: 'attribute' },
    ],
  },
};

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  security: { csp },
  // Not in dev: Keystatic's GitHub App setup writes the local .env from Node.
  ...(cmsOnline &&
    !isDev && {
      adapter: cloudflare({
        // Static pages are optimized in the build; the live CMS preview serves the originals.
        imageService: { build: 'compile', runtime: 'passthrough' },
        prerenderEnvironment: 'node',
      }),
      session: { driver: sessionDrivers.lruCache() },
    }),
  integrations: [
    react(),
    markdoc(),
    ...(isDev || cmsOnline ? [keystatic()] : []),
    ...(isDev || cmsOnline ? [keystaticPreview()] : []),
    sitemap({
      i18n: { defaultLocale: 'es', locales: { es: 'es', en: 'en' } },
      filter: (page) => {
        const { pathname } = new URL(page);
        const route = pathname.slice(base.replace(/\/+$/, '').length) || '/';

        return (
          route !== '/' &&
          !route.includes('404') &&
          !privateRoute.test(route) &&
          !route.includes('/admin/')
        );
      },
    }),
  ],
  // Not with Keystatic: its prefix check 404s /keystatic, and pages are [lang]/… routes anyway.
  ...(isDev || cmsOnline
    ? {}
    : {
        i18n: {
          locales: ['es', 'en'],
          defaultLocale: 'es',
          routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
        },
      }),
  markdown: { syntaxHighlight: false },
  vite: {
    plugins: [tailwindcss()],
  },
});
