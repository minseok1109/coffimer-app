import { BeanAPI } from '@/lib/api/beans';
import { supabase } from '@/lib/supabaseClient';

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
}));

const mockRpc = supabase.rpc as jest.Mock;

describe('BeanAPI.createBeanWithImages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls RPC with correct params', async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        bean: {
          id: 'bean-id',
          name: 'Test Bean',
          roastery_name: null,
          roast_date: null,
          opened_date: '2026-02-20',
          roast_level: null,
          bean_type: 'single_origin',
          weight_g: 200,
          remaining_g: 200,
          price: null,
          cup_notes: [],
          user_id: 'user-id',
          created_at: '2026-02-22T00:00:00Z',
          degassing_days: null,
          variety: null,
          process_method: null,
          notes: null,
          updated_at: '2026-02-22T00:00:00Z',
        },
        images: [
          {
            id: 'img-1',
            bean_id: 'bean-id',
            user_id: 'user-id',
            image_url: 'url1',
            storage_path: 'path1',
            sort_order: 0,
            is_primary: true,
            created_at: '2026-02-22T00:00:00Z',
            updated_at: '2026-02-22T00:00:00Z',
          },
        ],
      },
      error: null,
    });

    const bean = await BeanAPI.createBeanWithImages(
      'bean-id',
      {
        name: 'Test Bean',
        bean_type: 'single_origin',
        weight_g: 200,
        opened_date: '2026-02-20',
      },
      [
        {
          image_url: 'url1',
          storage_path: 'path1',
          sort_order: 0,
          is_primary: true,
        },
      ],
      'user-id',
    );

    expect(mockRpc).toHaveBeenCalledWith('create_bean_with_images', {
      p_bean_id: 'bean-id',
      p_bean: expect.objectContaining({ name: 'Test Bean', remaining_g: 200 }),
      p_images: expect.arrayContaining([
        expect.objectContaining({ sort_order: 0, is_primary: true }),
      ]),
    });

    expect(bean.id).toBe('bean-id');
    expect(bean.images).toHaveLength(1);
    expect(bean.opened_date).toBe('2026-02-20');
  });

  it('throws when RPC fails', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: new Error('RPC failed'),
    });

    await expect(
      BeanAPI.createBeanWithImages(
        'bean-id',
        {
          name: 'Test Bean',
          bean_type: 'single_origin',
          weight_g: 200,
        },
        [],
        'user-id',
      ),
    ).rejects.toThrow('RPC failed');
  });
});
