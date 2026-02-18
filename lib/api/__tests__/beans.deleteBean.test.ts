import { BeanAPI } from '@/lib/api/beans';

const mockSelect = jest.fn();
const mockChain = {
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  select: mockSelect,
};

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => mockChain),
  },
}));

describe('BeanAPI.deleteBean', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1개 행 업데이트: 정상 resolve', async () => {
    mockSelect.mockResolvedValue({ data: [{ id: 'bean-1' }], error: null });
    await expect(BeanAPI.deleteBean('bean-1', 'user-1')).resolves.toBeUndefined();
  });

  it('0개 행 업데이트: 에러를 throw', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    await expect(BeanAPI.deleteBean('unknown-id', 'user-1')).rejects.toThrow(
      '원두를 찾을 수 없거나 삭제 권한이 없습니다.',
    );
  });

  it('data가 null: 에러를 throw', async () => {
    mockSelect.mockResolvedValue({ data: null, error: null });
    await expect(BeanAPI.deleteBean('bean-1', 'user-1')).rejects.toThrow(
      '원두를 찾을 수 없거나 삭제 권한이 없습니다.',
    );
  });

  it('Supabase DB 에러: 해당 에러를 그대로 throw', async () => {
    const dbError = { message: 'Database connection error', code: '08006' };
    mockSelect.mockResolvedValue({ data: null, error: dbError });
    await expect(BeanAPI.deleteBean('bean-1', 'user-1')).rejects.toMatchObject({
      message: 'Database connection error',
    });
  });
});
