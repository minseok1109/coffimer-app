import { BeanAPI } from '@/lib/api/beans';
import { supabase } from '@/lib/supabaseClient';

jest.mock('@/lib/supabaseClient', () => ({
  supabase: { from: jest.fn() },
}));

// 모킹된 from 함수를 jest.Mock으로 캐스팅 (Supabase 복잡한 제네릭 타입 우회)
const mockFrom = supabase.from as jest.Mock;

// SELECT 체인 (존재 확인 — deleted_at IS NULL 포함)
const mockMaybeSingle = jest.fn();
const selectChain = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  maybeSingle: mockMaybeSingle,
};

// UPDATE 체인 팩토리 (RETURNING 없음 — SELECT RLS 미적용)
const makeUpdateChain = (result: { error: unknown }) => {
  const p = Promise.resolve(result);
  return {
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    then: p.then.bind(p),
    catch: p.catch.bind(p),
    finally: p.finally.bind(p),
  };
};

describe('BeanAPI.deleteBean', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('존재하는 원두: 정상 resolve', async () => {
    mockFrom
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(makeUpdateChain({ error: null }));
    mockMaybeSingle.mockResolvedValue({ data: { id: 'bean-1' }, error: null });

    await expect(BeanAPI.deleteBean('bean-1', 'user-1')).resolves.toBeUndefined();
  });

  it('존재하지 않는 beanId: 에러를 throw', async () => {
    mockFrom.mockReturnValueOnce(selectChain);
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(BeanAPI.deleteBean('unknown-id', 'user-1')).rejects.toThrow(
      '원두를 찾을 수 없거나 삭제 권한이 없습니다.',
    );
  });

  it('타인 소유 원두: 에러를 throw', async () => {
    mockFrom.mockReturnValueOnce(selectChain);
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(BeanAPI.deleteBean('bean-1', 'wrong-user')).rejects.toThrow(
      '원두를 찾을 수 없거나 삭제 권한이 없습니다.',
    );
  });

  it('SELECT 단계 DB 에러: 해당 에러를 그대로 throw', async () => {
    const dbError = { message: 'Database connection error', code: '08006' };
    mockFrom.mockReturnValueOnce(selectChain);
    mockMaybeSingle.mockResolvedValue({ data: null, error: dbError });

    await expect(BeanAPI.deleteBean('bean-1', 'user-1')).rejects.toMatchObject({
      message: 'Database connection error',
    });
  });

  it('UPDATE 단계 DB 에러: 해당 에러를 그대로 throw', async () => {
    const dbError = { message: 'Update failed', code: '23505' };
    mockFrom
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(makeUpdateChain({ error: dbError }));
    mockMaybeSingle.mockResolvedValue({ data: { id: 'bean-1' }, error: null });

    await expect(BeanAPI.deleteBean('bean-1', 'user-1')).rejects.toMatchObject({
      message: 'Update failed',
    });
  });
});
