import type { Bean, BeanImage } from '@/types/bean';

describe('BeanImage type contract', () => {
  it('includes required fields', () => {
    const image: BeanImage = {
      id: 'img-1',
      bean_id: 'bean-1',
      user_id: 'user-1',
      image_url: 'https://example.com/image.jpg',
      storage_path: 'user-1/bean-1/image.jpg',
      sort_order: 0,
      is_primary: true,
      created_at: '2026-02-22T00:00:00Z',
      updated_at: '2026-02-22T00:00:00Z',
    };

    expect(image.sort_order).toBeGreaterThanOrEqual(0);
    expect(image.sort_order).toBeLessThanOrEqual(4);
    expect(image.is_primary).toBe(true);
  });

  it('Bean exposes images array', () => {
    const bean = {
      id: 'bean-1',
      name: '테스트',
      roastery_name: null,
      roast_date: null,
      opened_date: null,
      roast_level: null,
      bean_type: 'blend',
      weight_g: 200,
      remaining_g: 200,
      price: null,
      cup_notes: [],
      images: [],
      user_id: 'user-1',
      created_at: '2026-02-22T00:00:00Z',
      degassing_days: null,
      variety: null,
      process_method: null,
      notes: null,
      updated_at: '2026-02-22T00:00:00Z',
    } as Bean;

    expect(bean).toHaveProperty('images');
    expect(bean).not.toHaveProperty('image_url');
  });
});
