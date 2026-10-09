import { CMS_REPO } from '@constants/cms';
import {
  CmsPreviewError,
  draftVersion,
  loadDraftPost,
  loadDraftRecipe,
  rawUrl,
  resolveRepoPath,
  withEditorToken,
} from '../cms-preview';

const SHA = 'abc123';
const RAW = `https://raw.githubusercontent.com/${CMS_REPO}/${SHA}`;

const RECIPE = `title: Lemon loaf
titleEs: Budín de limón
summary:
  es: Húmedo.
category: sweet
minutes: 70
servings: 10
photo: ../../assets/recipes/lemon-loaf/photo.webp
photoAlt:
  es: Budín
  en: Loaf
steps:
  - text:
      es: Batir.
    photo: null
`;

const POST = `title: Milicitos
titleEs: Los milicitos
description:
  es: Del 1 al 5.
date: 2026-09-26
cover: null
`;

/** A GitHub that knows the branch head and the given raw files. */
const github = (files: Record<string, string>, refStatus = 200) =>
  vi.fn(async (url: string) => {
    if (url.includes('/git/ref/heads/')) {
      return new Response(JSON.stringify({ object: { sha: SHA } }), { status: refStatus });
    }

    const path = url.replace(`${RAW}/`, '');

    return path in files ? new Response(files[path]) : new Response('', { status: 404 });
  }) as unknown as typeof fetch;

describe('cms-preview', () => {
  it('should resolve relative paths inside the repo', () => {
    expect(resolveRepoPath('src/content/recipes', '../../assets/recipes/a.webp')).toBe(
      'src/assets/recipes/a.webp',
    );
    expect(resolveRepoPath('src/content', './a/b.png')).toBe('src/content/a/b.png');
    expect(rawUrl(SHA, 'a.png')).toBe(`${RAW}/a.png`);
  });

  it('should read the branch head with the editor token', async () => {
    const fetchImpl = github({});

    await expect(draftVersion('token', fetchImpl)).resolves.toBe(SHA);
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining('/git/ref/heads/cms/draft'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      }),
    );
  });

  it('should fail clearly when GitHub refuses the token', async () => {
    await expect(draftVersion('expired', github({}, 401))).rejects.toBeInstanceOf(CmsPreviewError);
  });

  it('should load a draft recipe with its photos as URLs of that commit', async () => {
    const recipe = await loadDraftRecipe(
      'lemon-loaf',
      'token',
      github({ 'src/content/recipes/lemon-loaf.yaml': RECIPE }),
    );

    expect(recipe?.id).toBe('lemon-loaf');
    expect(recipe?.data.titleEs).toBe('Budín de limón');
    expect(recipe?.data.photo).toBe(`${RAW}/src/assets/recipes/lemon-loaf/photo.webp`);
    expect(recipe?.data.steps[0]?.photo).toBeNull();
    expect(recipe?.data.draft).toBe(true);
  });

  it('should return null for a missing recipe or an invalid slug', async () => {
    await expect(loadDraftRecipe('nope', 'token', github({}))).resolves.toBeNull();
    await expect(loadDraftRecipe('../secrets', 'token', github({}))).resolves.toBeNull();
  });

  it('should fail on a GitHub error that is not a missing file', async () => {
    const fetchImpl = vi.fn(async (url: string) =>
      url.includes('/git/ref/heads/')
        ? new Response(JSON.stringify({ object: { sha: SHA } }))
        : new Response('', { status: 500 }),
    ) as unknown as typeof fetch;

    await expect(loadDraftRecipe('lemon-loaf', 'token', fetchImpl)).rejects.toBeInstanceOf(
      CmsPreviewError,
    );
  });

  it('should load a draft article in the language, falling back to Spanish', async () => {
    const files = {
      'src/content/blog/milicitos/index.yaml': POST,
      'src/content/blog/milicitos/content/es.mdoc': 'Hola',
    };
    const post = await loadDraftPost('milicitos', 'en', 'token', github(files));

    expect(post?.data.titleEs).toBe('Los milicitos');
    expect(post?.body).toBe('Hola');
    expect(post?.resolveImage('../../../../assets/blog/a.png')).toBe(
      `${RAW}/src/assets/blog/a.png`,
    );
    expect(post?.resolveImage('https://example.com/a.png')).toBe('https://example.com/a.png');
  });

  it('should return null for a missing article or an invalid slug', async () => {
    await expect(loadDraftPost('nope', 'es', 'token', github({}))).resolves.toBeNull();
    await expect(loadDraftPost('A B', 'es', 'token', github({}))).resolves.toBeNull();
  });

  it('should leave the body empty when the article has no text yet', async () => {
    const post = await loadDraftPost(
      'milicitos',
      'es',
      'token',
      github({ 'src/content/blog/milicitos/index.yaml': POST }),
    );

    expect(post?.body).toBe('');
  });
});

describe('withEditorToken', () => {
  it('should load with the token, or report a missing or refused session', async () => {
    await expect(withEditorToken('token', async (token) => token.length)).resolves.toEqual({
      value: 5,
      signedOut: false,
    });
    await expect(withEditorToken(undefined, async () => 1)).resolves.toEqual({
      value: null,
      signedOut: true,
    });
    await expect(
      withEditorToken('expired', async () => {
        throw new CmsPreviewError('401');
      }),
    ).resolves.toEqual({ value: null, signedOut: true });
    await expect(
      withEditorToken('token', async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
  });
});
