import type { Bean } from '@/types/bean';

/**
 * Minimal valid Bean for screen-level notification wiring tests. Callers
 * override only the fields their scenario cares about.
 */
export function createBean(overrides: Partial<Bean> = {}): Bean {
  return {
    id: 'bean-1',
    name: '에티오피아 예가체프',
    roastery_name: null,
    roast_date: '2026-01-01',
    opened_date: null,
    roast_level: null,
    bean_type: 'single_origin',
    weight_g: 200,
    remaining_g: 200,
    price: null,
    cup_notes: [],
    images: [],
    user_id: 'user-1',
    created_at: '2026-01-01T00:00:00.000Z',
    degassing_days: 14,
    variety: null,
    process_method: null,
    notes: null,
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}
