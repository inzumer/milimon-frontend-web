import Markdoc, { type Config, type RenderableTreeNode } from '@markdoc/markdoc';

// CommonJS package: its classes come from the default export in the build.
const { Tag } = Markdoc;

/**
 * A CMS article (Markdoc) as a tree whose tags name the site's own components (`Heading`,
 * `Paragraph`, `Link`, `Milicitos`), like `markdoc.config.mjs` does in the build.
 */
export const markdocTree = (
  source: string,
  resolveImage: (src: string) => string,
): RenderableTreeNode => {
  const config: Config = {
    nodes: {
      heading: {
        ...Markdoc.nodes.heading,
        // Markdoc's own transform writes h1…h6; the site renders its MarkdocHeading instead.
        transform(node, transformConfig) {
          return new Tag(
            'Heading',
            { ...node.transformAttributes(transformConfig), level: node.attributes.level },
            node.transformChildren(transformConfig),
          );
        },
      },
      paragraph: { ...Markdoc.nodes.paragraph, render: 'Paragraph' },
      link: { ...Markdoc.nodes.link, render: 'Link' },
      image: {
        ...Markdoc.nodes.image,
        transform(node, transformConfig) {
          const attributes = node.transformAttributes(transformConfig);

          return new Tag('img', { ...attributes, src: resolveImage(String(attributes.src ?? '')) });
        },
      },
    },
    tags: {
      milicitos: {
        render: 'Milicitos',
        // 1 to 5 is checked by the build (markdoc.config.mjs); the preview only reads it.
        attributes: { rating: { type: Number, required: true } },
      },
    },
  };

  return Markdoc.transform(Markdoc.parse(source), config);
};
