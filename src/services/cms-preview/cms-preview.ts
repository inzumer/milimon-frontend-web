import { z } from 'astro/zod';
import { parse as parseYaml } from 'yaml';
import { CMS_DRAFT_BRANCH, CMS_REPO } from '@constants/cms';
import { blogSchema, recipeSchema } from '@utils/content-schema';
import type { Locale } from '@utils/locale';

const GITHUB_API = 'https://api.github.com';
const GITHUB_RAW = 'https://raw.githubusercontent.com';
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** In the preview, photos are plain URLs (GitHub raw files of the saved commit). */
const draftRecipeSchema = recipeSchema(() => z.string());
const draftBlogSchema = blogSchema(() => z.string());

export type DraftRecipe = { id: string; data: z.infer<typeof draftRecipeSchema> };
export type DraftPost = { id: string; data: z.infer<typeof draftBlogSchema>; body: string };

type Fetch = typeof fetch;

/** The preview can't read GitHub: no session, expired token or no access. */
export class CmsPreviewError extends Error {}

/** `../a/b` resolved against a folder of the repo, without Node's `path` (it runs on a Worker). */
export const resolveRepoPath = (folder: string, relative: string): string =>
  relative
    .split('/')
    .reduce(
      (parts, part) =>
        part === '..' ? parts.slice(0, -1) : part === '.' || !part ? parts : [...parts, part],
      folder.split('/').filter(Boolean),
    )
    .join('/');

/** A file of the repo at an exact commit: it never comes back stale from GitHub's cache. */
export const rawUrl = (sha: string, path: string): string =>
  `${GITHUB_RAW}/${CMS_REPO}/${sha}/${path}`;

const folderOf = (file: string) => file.slice(0, file.lastIndexOf('/'));

/** An image saved by Keystatic (relative to its content file) as a URL of that commit. */
const assetUrl = (sha: string, file: string, value: unknown) =>
  typeof value === 'string' && value ? rawUrl(sha, resolveRepoPath(folderOf(file), value)) : value;

/** Last commit of the CMS branch: changes on every save, so the preview reloads with it. */
export const draftVersion = async (token: string, fetchImpl: Fetch = fetch): Promise<string> => {
  const response = await fetchImpl(
    `${GITHUB_API}/repos/${CMS_REPO}/git/ref/heads/${CMS_DRAFT_BRANCH}`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'milimon-cms-preview',
      },
    },
  );

  if (!response.ok) {
    throw new CmsPreviewError(`GitHub answered ${response.status}`);
  }

  const { object } = (await response.json()) as { object: { sha: string } };

  return object.sha;
};

const rawText = async (sha: string, path: string, fetchImpl: Fetch): Promise<string | null> => {
  const response = await fetchImpl(rawUrl(sha, path));

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new CmsPreviewError(`GitHub answered ${response.status} for ${path}`);
  }

  return response.text();
};

/** A recipe as saved on the CMS branch, or null when it doesn't exist (yet). */
export const loadDraftRecipe = async (
  slug: string,
  token: string,
  fetchImpl: Fetch = fetch,
): Promise<DraftRecipe | null> => {
  if (!SLUG.test(slug)) {
    return null;
  }

  const sha = await draftVersion(token, fetchImpl);
  const file = `src/content/recipes/${slug}.yaml`;
  const text = await rawText(sha, file, fetchImpl);

  if (text === null) {
    return null;
  }

  const raw = (parseYaml(text) ?? {}) as Record<string, unknown> & {
    steps?: Record<string, unknown>[];
  };
  const data = draftRecipeSchema.parse({
    ...raw,
    photo: assetUrl(sha, file, raw.photo),
    steps: (raw.steps ?? []).map((step) => ({ ...step, photo: assetUrl(sha, file, step.photo) })),
  });

  return { id: slug, data };
};

/** A blog article as saved on the CMS branch, with its text in `lang` (Spanish fallback). */
export const loadDraftPost = async (
  slug: string,
  lang: Locale,
  token: string,
  fetchImpl: Fetch = fetch,
): Promise<(DraftPost & { resolveImage: (src: string) => string }) | null> => {
  if (!SLUG.test(slug)) {
    return null;
  }

  const sha = await draftVersion(token, fetchImpl);
  const folder = `src/content/blog/${slug}`;
  const index = await rawText(sha, `${folder}/index.yaml`, fetchImpl);

  if (index === null) {
    return null;
  }

  const raw = (parseYaml(index) ?? {}) as Record<string, unknown>;
  const data = draftBlogSchema.parse({
    ...raw,
    cover: assetUrl(sha, `${folder}/index.yaml`, raw.cover),
  });
  const bodyFile = `${folder}/content/${lang}.mdoc`;
  const body =
    (await rawText(sha, bodyFile, fetchImpl)) ??
    (await rawText(sha, `${folder}/content/es.mdoc`, fetchImpl)) ??
    '';

  return {
    id: slug,
    data,
    body,
    resolveImage: (src) =>
      /^https?:\/\//.test(src) ? src : rawUrl(sha, resolveRepoPath(folderOf(bodyFile), src)),
  };
};

/** Runs a draft load with the editor's token; without a session (or a refused one) it says so. */
export const withEditorToken = async <T>(
  token: string | undefined,
  load: (token: string) => Promise<T>,
): Promise<{ value: T | null; signedOut: boolean }> => {
  if (!token) {
    return { value: null, signedOut: true };
  }

  try {
    return { value: await load(token), signedOut: false };
  } catch (error) {
    if (error instanceof CmsPreviewError) {
      return { value: null, signedOut: true };
    }

    throw error;
  }
};
