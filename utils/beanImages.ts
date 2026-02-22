import type { BeanImage } from '@/types/bean';

export function sortBeanImages(images: BeanImage[]): BeanImage[] {
  return [...images].sort((a, b) => {
    if (a.is_primary !== b.is_primary) {
      return a.is_primary ? -1 : 1;
    }
    return a.sort_order - b.sort_order;
  });
}

export function getPrimaryBeanImage(images: BeanImage[]): BeanImage | null {
  if (!images.length) return null;
  const primary = images.find((image) => image.is_primary);
  if (primary) return primary;
  return sortBeanImages(images)[0] ?? null;
}
