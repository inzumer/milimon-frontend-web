import { collection, config, fields } from '@keystatic/core';
import { wrapper } from '@keystatic/core/content-components';
import { CMS_PREVIEW_PATHS } from './src/constants/cms';
import { RECIPE_CATEGORIES } from './src/constants/recipes';
import recipeText from './src/i18n/recipe-page/es.json';

/** Tells where a saved entry shows up. */
const publishHint = (example: string) =>
  `Se completa sola; ej.: ${example}. Al guardar, la vista previa de la derecha se actualiza en segundos; en el sitio de prueba se ve en unos 5 minutos (botón «Preview»).`;

/** English is optional and falls back to Spanish on the site. */
const localized = (label: string, { multiline = false, required = true } = {}) =>
  fields.object(
    {
      es: fields.text({ label: 'Español', multiline, validation: { isRequired: required } }),
      en: fields.text({ label: 'English', multiline }),
    },
    { label, layout: [6, 6] },
  );

/** Rich text: section titles (h2/h3), lists, quotes, links and images anywhere. */
const article = (label: string) =>
  fields.markdoc({
    label,
    options: {
      heading: [2, 3],
      bold: true,
      italic: true,
      strikethrough: false,
      code: false,
      codeBlock: false,
      table: false,
      image: { directory: 'src/assets/blog', publicPath: '../../../../assets/blog/' },
    },
    components: {
      milicitos: wrapper({
        label: 'Milicitos',
        description: 'Una puntuación de 1 a 5 milicitos con su texto al lado.',
        schema: {
          rating: fields.integer({
            label: 'Milicitos (1 a 5)',
            defaultValue: 5,
            validation: { isRequired: true, min: 1, max: 5 },
          }),
        },
      }),
    },
  });

export default config({
  storage:
    import.meta.env.PUBLIC_KEYSTATIC_STORAGE === 'github'
      ? {
          kind: 'github',
          repo: { owner: 'inzumer', name: 'milimon-frontend-web' },
          // Edits go to cms/draft; cms-to-dev turns each entry into one squash-merged PR to dev.
          branchPrefix: 'cms/',
        }
      : { kind: 'local' },
  ui: { brand: { name: 'Milimon' } },
  collections: {
    blog: collection({
      label: 'Blog',
      slugField: 'title',
      previewUrl: CMS_PREVIEW_PATHS.blog,
      path: 'src/content/blog/*/',
      format: { data: 'yaml' },
      columns: ['titleEs', 'date', 'draft'],
      schema: {
        title: fields.slug({
          name: {
            label: 'Título en inglés',
            description: 'Arma la dirección del artículo (igual en los dos idiomas).',
            validation: { isRequired: true },
          },
          slug: { label: 'Dirección', description: publishHint('first-review') },
        }),
        titleEs: fields.text({ label: 'Título en español', validation: { isRequired: true } }),
        description: localized('Bajada (para la lista y los buscadores)', { multiline: true }),
        date: fields.date({ label: 'Fecha', defaultValue: { kind: 'today' } }),
        cover: fields.image({
          label: 'Imagen de portada (opcional)',
          directory: 'src/assets/blog',
          publicPath: '../../../assets/blog/',
        }),
        coverAlt: localized(
          'Descripción de la portada (obligatoria en los dos idiomas si hay portada)',
          {
            required: false,
          },
        ),
        content: fields.object(
          { es: article('Texto en español'), en: article('Text in English') },
          { label: 'Artículo' },
        ),
        featured: fields.checkbox({
          label: 'Destacado',
          description: 'Aparece en la portada del sitio.',
          defaultValue: false,
        }),
        draft: fields.checkbox({
          label: 'Borrador',
          description: 'Los borradores no se publican.',
          defaultValue: true,
        }),
      },
    }),
    recipes: collection({
      label: 'Recetas',
      slugField: 'title',
      previewUrl: CMS_PREVIEW_PATHS.recipes,
      path: 'src/content/recipes/*',
      format: { data: 'yaml' },
      columns: ['titleEs', 'category', 'draft'],
      entryLayout: 'form',
      schema: {
        title: fields.slug({
          name: {
            label: 'Título en inglés',
            description: 'Arma la dirección de la receta (igual en los dos idiomas).',
            validation: { isRequired: true },
          },
          slug: { label: 'Dirección', description: publishHint('lemon-loaf') },
        }),
        titleEs: fields.text({ label: 'Título en español', validation: { isRequired: true } }),
        summary: localized('Resumen (una o dos frases)', { multiline: true }),
        category: fields.select({
          label: 'Categoría',
          options: RECIPE_CATEGORIES.map((value) => ({
            label: recipeText.categories[value],
            value,
          })),
          defaultValue: 'sweet',
        }),
        minutes: fields.integer({ label: 'Tiempo total (minutos)', validation: { min: 1 } }),
        servings: fields.integer({ label: 'Porciones', validation: { min: 1 } }),
        photo: fields.image({
          label: 'Foto principal',
          description: 'Vertical 3:4, ver la guía de fotografía.',
          directory: 'src/assets/recipes',
          publicPath: '../../assets/recipes/',
        }),
        photoAlt: localized('Descripción de la foto (obligatoria en los dos idiomas si hay foto)', {
          required: false,
        }),
        ingredients: fields.array(
          fields.object({
            amount: fields.text({ label: 'Cantidad (ej.: 200 g)' }),
            name: localized('Ingrediente'),
          }),
          { label: 'Ingredientes', itemLabel: (item) => item.fields.name.fields.es.value || '…' },
        ),
        steps: fields.array(
          fields.object({
            text: localized('Paso', { multiline: true }),
            photo: fields.image({
              label: 'Foto del paso (opcional)',
              directory: 'src/assets/recipes',
              publicPath: '../../assets/recipes/',
            }),
            photoAlt: localized(
              'Descripción de la foto del paso (si hay foto, en los dos idiomas)',
              {
                required: false,
              },
            ),
          }),
          { label: 'Pasos', itemLabel: (item) => item.fields.text.fields.es.value || '…' },
        ),
        featured: fields.checkbox({ label: 'Destacada en el inicio' }),
        draft: fields.checkbox({
          label: 'Borrador',
          description: 'Los borradores no se publican.',
          defaultValue: true,
        }),
      },
    }),
  },
});
