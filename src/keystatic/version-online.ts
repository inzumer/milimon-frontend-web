import type { APIRoute } from 'astro';
import { CMS_TOKEN_COOKIE } from '@constants/cms';
import { draftVersion, withEditorToken } from '@services/cms-preview';

/** Online preview: the last commit of the CMS branch, so the preview reloads after each save. */
export const GET: APIRoute = async ({ cookies }) => {
  const { value } = await withEditorToken(cookies.get(CMS_TOKEN_COOKIE)?.value, (token) =>
    draftVersion(token),
  );

  return new Response(value ?? 'signed-out', { headers: { 'cache-control': 'no-store' } });
};
