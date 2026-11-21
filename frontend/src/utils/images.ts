import type { Animal } from '@/types/shelter';

const PHOTOS: Record<string, string[]> = {
  DOG: [
    'https://images.unsplash.com/photo-1552053831-71594a27632d',
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1',
    'https://images.unsplash.com/photo-1517849845537-4d257902454a',
    'https://images.unsplash.com/photo-1587303381677-8a4e2e7b7f91',
  ],
  CAT: [
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba',
    'https://images.unsplash.com/photo-1573865526739-10659fec78a5',
    'https://images.unsplash.com/photo-1495360010541-f48722b34f7d',
    'https://images.unsplash.com/photo-1533738363-b7f9aef128ce',
  ],
  BIRD: [
    'https://images.unsplash.com/photo-1444464666168-49d633b86797',
    'https://images.unsplash.com/photo-1552728089-57bdde30beb3',
    'https://images.unsplash.com/photo-1509316785289-025f5b846b35',
    'https://images.unsplash.com/photo-1548767797-d8c844163c4c',
  ],
};

const PHOTO_SUFFIX = '?auto=format&fit=crop&w=800&q=75';

/** Deterministic editorial photo per animal. No photo is persisted by the
 * backend — this is purely a visual fallback for the local UI. */
export function animalPhoto(animal: Animal): string {
  const list = PHOTOS[animal.category] ?? PHOTOS.DOG;
  return `${list[Math.abs(animal.id) % list.length]}${PHOTO_SUFFIX}`;
}

export function heroPhoto(): string {
  return 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=1400&q=80';
}
