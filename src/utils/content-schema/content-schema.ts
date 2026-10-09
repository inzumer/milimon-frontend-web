import { z } from 'astro/zod';
import { RECIPE_CATEGORIES } from '@constants/recipes';

/** Spanish is required; English falls back to Spanish. */
const localized = z.object({ es: z.string().min(1), en: z.string().default('') });
const optionalLocalized = z.object({ es: z.string().default(''), en: z.string().default('') });

/** Photos need their description in both languages. */
const describedPhoto = <T extends { photo?: unknown; photoAlt: { es: string; en: string } }>(
  value: T,
) => !value.photo || (value.photoAlt.es.trim() !== '' && value.photoAlt.en.trim() !== '');

export const ALT_MESSAGE = 'Every photo needs its description (alt text) in Spanish and English.';

/**
 * A recipe as Keystatic saves it. `image` validates the photos: Astro's `image()` in the build,
 * a plain URL in the online CMS preview.
 */
export const recipeSchema = <I extends z.ZodTypeAny>(image: () => I) =>
  z
    .object({
      title: z.string().min(1),
      titleEs: z.string().min(1),
      summary: localized,
      category: z.enum(RECIPE_CATEGORIES),
      minutes: z.number().int().positive().nullable(),
      servings: z.number().int().positive().nullable(),
      photo: image().nullable().optional(),
      photoAlt: optionalLocalized.default({ es: '', en: '' }),
      ingredients: z
        .array(z.object({ amount: z.string().default(''), name: localized }))
        .default([]),
      steps: z
        .array(
          z
            .object({
              text: localized,
              photo: image().nullable().optional(),
              photoAlt: optionalLocalized.default({ es: '', en: '' }),
            })
            .refine(describedPhoto, ALT_MESSAGE),
        )
        .default([]),
      featured: z.boolean().default(false),
      draft: z.boolean().default(true),
    })
    .refine(describedPhoto, ALT_MESSAGE);

/** A blog article's metadata as Keystatic saves it (`<slug>/index.yaml`); see `recipeSchema`. */
export const blogSchema = <I extends z.ZodTypeAny>(image: () => I) =>
  z
    .object({
      title: z.string().min(1),
      titleEs: z.string().min(1),
      description: localized,
      date: z.coerce.date(),
      cover: image().nullable().optional(),
      coverAlt: optionalLocalized.default({ es: '', en: '' }),
      featured: z.boolean().default(false),
      draft: z.boolean().default(true),
    })
    .refine(
      ({ cover, coverAlt }) => describedPhoto({ photo: cover, photoAlt: coverAlt }),
      ALT_MESSAGE,
    );
