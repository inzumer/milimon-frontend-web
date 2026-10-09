import type { ImageMetadata } from 'astro';
import { imageSrc } from '../content-image';

vi.mock('astro:assets', () => ({
  getImage: vi.fn(async ({ width }: { width: number }) => ({ src: `/_astro/photo.${width}.webp` })),
}));

describe('imageSrc', () => {
  it('should keep a URL as is and resize a build photo to WebP', async () => {
    const photo = { src: '/photo.jpg', width: 2000, height: 1500, format: 'jpg' } as ImageMetadata;

    await expect(imageSrc('https://raw.example/a.webp', 640)).resolves.toBe(
      'https://raw.example/a.webp',
    );
    await expect(imageSrc(photo, 640)).resolves.toBe('/_astro/photo.640.webp');
  });
});
