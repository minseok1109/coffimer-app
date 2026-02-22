import { BeanAPI } from '@/lib/api/beans';
import { supabase } from '@/lib/supabaseClient';

const mockQueryChain = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  order: jest.fn(),
};

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => mockQueryChain),
  },
}));

describe('bean read model regression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryChain.order.mockResolvedValue({ data: [], error: null });
  });

  it('filters out soft-deleted beans', async () => {
    await BeanAPI.getUserBeans('user-1');

    expect(mockQueryChain.is).toHaveBeenCalledWith('deleted_at', null);
  });
});
