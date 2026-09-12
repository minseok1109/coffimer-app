import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { useUserBeans } from '@/hooks/useBeans';
import { BeanAPI } from '@/lib/api/beans';

type AuthUser = { id: string } | null;

const mockUseAuth = jest.fn<{ user: AuthUser }, []>();

jest.mock('@/hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }));
// BeanAPI is automocked, but loading it for introspection would drag in the
// real supabase client and its native AsyncStorage dependency.
jest.mock('@/lib/supabaseClient', () => ({ supabase: {} }));
jest.mock('@/lib/api/beans');

const getUserBeansMock = jest.mocked(BeanAPI.getUserBeans);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function QueryWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return QueryWrapper;
}

/**
 * Pins the real react-query shape that `app/(tabs)/beans.tsx` gates reconcile
 * on. The screen mocks these fields, so if this contract ever drifts the mock
 * becomes a lie — this suite is what keeps the mock honest.
 */
describe('useUserBeans query shape', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Given the query is disabled because nobody is signed in', () => {
    it('When rendering, Then isLoading is false while isSuccess is false and data is undefined', () => {
      mockUseAuth.mockReturnValue({ user: null });

      const { result } = renderHook(() => useUserBeans(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(getUserBeansMock).not.toHaveBeenCalled();
    });
  });

  describe('Given the fetch rejects for a signed-in user', () => {
    it('When it settles, Then isLoading is false, isSuccess is false and data is undefined', async () => {
      mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
      getUserBeansMock.mockRejectedValue(new Error('network down'));

      const { result } = renderHook(() => useUserBeans(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // This trio is the regression: `!isLoading` is satisfied on an errored
      // query, and `data` is undefined, so a screen defaulting to `[]` would
      // treat a failed fetch as "the user owns no beans".
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('Given the fetch resolves for a signed-in user', () => {
    it('When it settles with an empty library, Then isSuccess is true and data is an empty array', async () => {
      mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
      getUserBeansMock.mockResolvedValue([]);

      const { result } = renderHook(() => useUserBeans(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.data).toEqual([]);
    });
  });
});
