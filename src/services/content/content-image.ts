import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';

/** A photo processed by Astro in the build, or a plain URL (the online CMS preview). */
export type ImageSource = ImageMetadata | string;

type RecipeData = CollectionEntry<'recipes'>['data'];
type RecipeStep = RecipeData['steps'][number];

/** A recipe from the build or a CMS draft: same data, photos as `ImageSource`. */
export interface RecipeEntry {
  id: string;
  data: Omit<RecipeData, 'photo' | 'steps'> & {
    photo?: ImageSource | null | undefined;
    steps: (Omit<RecipeStep, 'photo'> & { photo?: ImageSource | null | undefined })[];
  };
}

/** A blog article from the build or a CMS draft. */
export interface BlogEntry {
  id: string;
  data: Omit<CollectionEntry<'blog'>['data'], 'cover'> & {
    cover?: ImageSource | null | undefined;
  };
}

/** The URL to show: a resized WebP for build photos, the URL itself for preview ones. */
export const imageSrc = async (src: ImageSource, width: number): Promise<string> =>
  typeof src === 'string' ? src : (await getImage({ src, width, format: 'webp' })).src;
