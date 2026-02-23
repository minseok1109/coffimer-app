import { BeanAPI } from '@/lib/api/beans';
import { supabase } from '@/lib/supabaseClient';

const mockSingle = jest.fn();
const mockSelect = jest.fn(() => ({ single: mockSingle }));
const mockInsert = jest.fn(() => ({ select: mockSelect }));

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: mockInsert,
    })),
  },
}));

describe('manual bean entry regression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createBean succeeds without images payload', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'bean-1',
        name: 'Manual Bean',
        roastery_name: null,
        roast_date: null,
        opened_date: null,
        roast_level: null,
        bean_type: 'blend',
        weight_g: 200,
        remaining_g: 200,
        price: null,
        cup_notes: [],
        user_id: 'user-1',
        created_at: '2026-02-22T00:00:00Z',
        degassing_days: null,
        variety: null,
        process_method: null,
        notes: null,
        updated_at: '2026-02-22T00:00:00Z',
        images: [],
      },
      error: null,
    });

    const bean = await BeanAPI.createBean(
      {
        name: 'Manual Bean',
        bean_type: 'blend',
        weight_g: 200,
      },
      'user-1',
    );

    expect(bean.name).toBe('Manual Bean');
    expect(bean.images).toEqual([]);
  });
});
