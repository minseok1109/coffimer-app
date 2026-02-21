import { BeanAPI } from '@/lib/api/beans';
import { supabase } from '@/lib/supabaseClient';

jest.mock('@/lib/supabaseClient', () => ({
  supabase: { rpc: jest.fn() },
}));

const mockRpc = supabase.rpc as jest.Mock;

describe('BeanAPI.deleteBean', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('정상 삭제: resolve', async () => {
    mockRpc.mockResolvedValue({ error: null });

    await expect(BeanAPI.deleteBean('bean-1')).resolves.toBeUndefined();
    expect(mockRpc).toHaveBeenCalledWith('soft_delete_bean', {
      bean_id: 'bean-1',
    });
  });

  it('RPC 에러: throw', async () => {
    const rpcError = { message: 'Bean not found or not owned by user', code: 'P0002' };
    mockRpc.mockResolvedValue({ error: rpcError });

    await expect(BeanAPI.deleteBean('bean-1')).rejects.toMatchObject({
      message: 'Bean not found or not owned by user',
    });
  });

  it('인증 에러: throw', async () => {
    const authError = { message: 'Authentication required', code: 'P0001' };
    mockRpc.mockResolvedValue({ error: authError });

    await expect(BeanAPI.deleteBean('bean-1')).rejects.toMatchObject({
      message: 'Authentication required',
    });
  });
});
