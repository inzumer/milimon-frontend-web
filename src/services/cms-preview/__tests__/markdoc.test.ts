import { Tag } from '@markdoc/markdoc';
import { markdocTree } from '../markdoc';

const names = (node: unknown): string[] =>
  Tag.isTag(node) ? [node.name, ...node.children.flatMap(names)] : [];

describe('markdocTree', () => {
  it('should name the site components and resolve image paths', () => {
    const tree = markdocTree(
      '## Título\n\nUn [link](https://example.com).\n\n![Foto](../a.png)\n\n{% milicitos rating=4 %}Rico{% /milicitos %}',
      (src) => `https://raw/${src}`,
    );
    const all = names(tree);

    expect(all).toEqual(
      expect.arrayContaining(['Heading', 'Paragraph', 'Link', 'img', 'Milicitos']),
    );

    const find = (node: unknown, name: string): Tag | undefined =>
      Tag.isTag(node)
        ? node.name === name
          ? node
          : node.children.map((child) => find(child, name)).find(Boolean)
        : undefined;

    expect(find(tree, 'img')?.attributes.src).toBe('https://raw/../a.png');
    expect(find(tree, 'Milicitos')?.attributes.rating).toBe(4);
    expect(find(tree, 'Heading')?.attributes.level).toBe(2);
  });
});
