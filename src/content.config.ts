import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { blogSchema, recipeSchema } from '@utils/content-schema';

/** Internal suggestion documents, shown to editors and admins (see `ADMIN_DOCS`). */
const suggestions = defineCollection({
  loader: glob({ pattern: '[0-9][0-9]-*.md', base: './docs/suggestions' }),
});

/** Recipes edited with Keystatic (`keystatic.config.ts`), one YAML file each. */
const recipes = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/recipes' }),
  schema: ({ image }) => recipeSchema(image),
});

/** Blog articles edited with Keystatic: `<slug>/index.yaml` plus `<slug>/content/{es,en}.mdoc`. */
const blog = defineCollection({
  loader: glob({ pattern: '*/index.yaml', base: './src/content/blog' }),
  schema: ({ image }) => blogSchema(image),
});

const blogContent = defineCollection({
  loader: glob({ pattern: '*/content/*.mdoc', base: './src/content/blog' }),
});

export const collections = { suggestions, recipes, blog, blogContent };
