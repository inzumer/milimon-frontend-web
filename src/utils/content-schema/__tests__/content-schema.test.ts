import { z } from 'astro/zod';
import { ALT_MESSAGE, blogSchema, recipeSchema } from '../content-schema';

const url = () => z.string();

describe('content schemas', () => {
  it('should fill the recipe defaults and start as a draft', () => {
    const recipe = recipeSchema(url).parse({
      title: 'Loaf',
      titleEs: 'Budín',
      summary: { es: 'Rico' },
      category: 'sweet',
      minutes: null,
      servings: null,
    });

    expect(recipe.summary.en).toBe('');
    expect(recipe.ingredients).toEqual([]);
    expect(recipe.draft).toBe(true);
  });

  it('should ask for the photo description in both languages', () => {
    const result = recipeSchema(url).safeParse({
      title: 'Loaf',
      titleEs: 'Budín',
      summary: { es: 'Rico' },
      category: 'sweet',
      minutes: 10,
      servings: 2,
      photo: 'https://example.com/a.webp',
      photoAlt: { es: 'Budín', en: '' },
    });

    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain(ALT_MESSAGE);
  });

  it('should coerce the article date', () => {
    const post = blogSchema(url).parse({
      title: 'Post',
      titleEs: 'Artículo',
      description: { es: 'Bajada' },
      date: '2026-09-26',
    });

    expect(post.date).toBeInstanceOf(Date);
    expect(post.cover).toBeUndefined();
  });
});
