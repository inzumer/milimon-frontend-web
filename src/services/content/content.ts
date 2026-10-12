import { getCollection, type CollectionEntry } from 'astro:content';
import { CMS_ONLINE } from '@constants/cms';
import { publishedRecipes, type Locale } from '@utils';

/** Staging (CMS online) also shows drafts, so what the CMS saves can be reviewed there. */
const SHOW_DRAFTS = CMS_ONLINE;

/** Published recipes (no drafts outside staging), featured first. */
export const getPublishedRecipes = async (): Promise<CollectionEntry<'recipes'>[]> =>
  publishedRecipes(await getCollection('recipes'), SHOW_DRAFTS);

/** Published CMS blog posts (no drafts outside staging), newest first. */
export const getPublishedPosts = async (): Promise<CollectionEntry<'blog'>[]> =>
  (await getCollection('blog', ({ data }) => SHOW_DRAFTS || !data.draft)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );

export interface BlogIndexItem {
  id: string;
  title: string;
  description: string;
  date: Date;
  featured: boolean;
}

/** Every published article in `lang` (English falls back to Spanish), newest first. */
export const getBlogIndex = async (lang: Locale): Promise<BlogIndexItem[]> =>
  (await getPublishedPosts()).map(({ id, data }) => ({
    id,
    title: lang === 'en' ? data.title : data.titleEs,
    description: (lang === 'en' && data.description.en) || data.description.es,
    date: data.date,
    featured: data.featured,
  }));
