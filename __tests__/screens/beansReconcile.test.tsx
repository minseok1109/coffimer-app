import { render } from '@testing-library/react-native';
import BeansScreen from '@/app/(tabs)/beans';
import { reconcileDegassing } from '@/lib/notifications/degassing';
import { setupNotificationChannel } from '@/lib/notifications/permissions';
import type { Bean } from '@/types/bean';

type AuthUser = { id: string } | null;
type AuthSlice = { user: AuthUser };

/**
 * The exact react-query fields the screen reads. `data` is optional because a
 * disabled, pending or errored query resolves to `undefined` and the screen
 * falls back to `[]` — the fallback that makes `isLoading` alone unsafe.
 */
type BeansQuerySlice = {
  data: Bean[] | undefined;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
};

const mockUseAuth = jest.fn<AuthSlice, []>();
const mockUseUserBeans = jest.fn<BeansQuerySlice, []>();
const mockTrack = jest.fn();

jest.mock('@/hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }));
jest.mock('@/hooks/useBeans', () => ({
  useUserBeans: () => mockUseUserBeans(),
}));
jest.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({ track: mockTrack }),
}));
jest.mock('@/components/beans', () => ({ BeanCard: () => null }));
jest.mock('@/lib/notifications/degassing');
jest.mock('@/lib/notifications/permissions');

const reconcileMock = jest.mocked(reconcileDegassing);
const setupChannelMock = jest.mocked(setupNotificationChannel);

const SIGNED_IN: AuthUser = { id: 'user-1' };

function createBean(overrides: Partial<Bean> = {}): Bean {
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

const STORED_BEANS = [createBean()];

/** Query settled successfully — the only state that may drive reconcile. */
function loaded(beans: Bean[]): BeansQuerySlice {
  return { data: beans, isLoading: false, isSuccess: true, isError: false };
}

/** First fetch in flight. */
const LOADING: BeansQuerySlice = {
  data: undefined,
  isLoading: true,
  isSuccess: false,
  isError: false,
};

/**
 * `enabled: !!user?.id` is false, so the query never runs: status stays pending
 * with fetchStatus idle, which means `isLoading` is FALSE and `data` undefined.
 */
const DISABLED: BeansQuerySlice = {
  data: undefined,
  isLoading: false,
  isSuccess: false,
  isError: false,
};

/**
 * Fetch rejected. `isLoading` is FALSE here too and `data` is undefined, so the
 * screen's `= []` fallback makes an errored query indistinguishable from an
 * empty library unless `isSuccess` is the gate.
 */
const ERRORED: BeansQuerySlice = {
  data: undefined,
  isLoading: false,
  isSuccess: false,
  isError: true,
};

function setScreenState(user: AuthUser, query: BeansQuerySlice): void {
  mockUseAuth.mockReturnValue({ user });
  mockUseUserBeans.mockReturnValue(query);
}

describe('BeansScreen degassing reconcile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setScreenState(SIGNED_IN, loaded([]));
  });

  describe('Given nobody is signed in', () => {
    it('When a stale bean list is still cached, Then nothing is reconciled', () => {
      setScreenState(null, loaded(STORED_BEANS));

      render(<BeansScreen />);

      expect(reconcileMock).not.toHaveBeenCalled();
    });

    it('When the query is disabled, Then nothing is reconciled', () => {
      setScreenState(null, DISABLED);

      render(<BeansScreen />);

      expect(reconcileMock).not.toHaveBeenCalled();
    });
  });

  describe('Given a signed-in user whose query succeeded', () => {
    it('When the list is empty, Then reconcile still runs so orphans are cleaned up', () => {
      setScreenState(SIGNED_IN, loaded([]));

      render(<BeansScreen />);

      expect(reconcileMock).toHaveBeenCalledTimes(1);
      expect(reconcileMock).toHaveBeenCalledWith([]);
    });

    it('When the list has beans, Then reconcile receives exactly that list', () => {
      setScreenState(SIGNED_IN, loaded(STORED_BEANS));

      render(<BeansScreen />);

      expect(reconcileMock).toHaveBeenCalledTimes(1);
      expect(reconcileMock).toHaveBeenCalledWith(STORED_BEANS);
    });
  });

  describe('Given a signed-in user whose query failed', () => {
    it('When rendering, Then reconcile never runs on the empty fallback', () => {
      setScreenState(SIGNED_IN, ERRORED);

      render(<BeansScreen />);

      expect(reconcileMock).not.toHaveBeenCalled();
    });

    it('When a retry later succeeds, Then reconcile runs once with the real list', () => {
      setScreenState(SIGNED_IN, ERRORED);
      const { rerender } = render(<BeansScreen />);
      expect(reconcileMock).not.toHaveBeenCalled();

      setScreenState(SIGNED_IN, loaded(STORED_BEANS));
      rerender(<BeansScreen />);

      expect(reconcileMock).toHaveBeenCalledTimes(1);
      expect(reconcileMock).toHaveBeenCalledWith(STORED_BEANS);
    });
  });

  describe('Given the bean list is still loading', () => {
    it('When rendering, Then reconcile waits for the load to finish', () => {
      setScreenState(SIGNED_IN, LOADING);

      render(<BeansScreen />);

      expect(reconcileMock).not.toHaveBeenCalled();
    });

    it('When the load finishes, Then reconcile runs once with the loaded list', () => {
      setScreenState(SIGNED_IN, LOADING);
      const { rerender } = render(<BeansScreen />);

      setScreenState(SIGNED_IN, loaded(STORED_BEANS));
      rerender(<BeansScreen />);

      expect(reconcileMock).toHaveBeenCalledTimes(1);
      expect(reconcileMock).toHaveBeenCalledWith(STORED_BEANS);
    });
  });

  describe('Given reconcile already ran this mount', () => {
    it('When the screen re-renders with a new list identity, Then it does not run again', () => {
      setScreenState(SIGNED_IN, loaded(STORED_BEANS));
      const { rerender } = render(<BeansScreen />);

      setScreenState(SIGNED_IN, loaded([createBean({ id: 'bean-2' })]));
      rerender(<BeansScreen />);

      expect(reconcileMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Given a session is restored after an unauthenticated render', () => {
    it('When the user arrives, Then the earlier skipped pass does not latch reconcile off', () => {
      setScreenState(null, DISABLED);
      const { rerender } = render(<BeansScreen />);
      expect(reconcileMock).not.toHaveBeenCalled();

      setScreenState(SIGNED_IN, loaded(STORED_BEANS));
      rerender(<BeansScreen />);

      expect(reconcileMock).toHaveBeenCalledTimes(1);
      expect(reconcileMock).toHaveBeenCalledWith(STORED_BEANS);
    });
  });

  describe('Given the screen mounts', () => {
    it('When rendering while signed out, Then the notification channel is still set up', () => {
      setScreenState(null, DISABLED);

      render(<BeansScreen />);

      expect(setupChannelMock).toHaveBeenCalledTimes(1);
    });

    it('When rendering while signed in, Then the notification channel is set up once', () => {
      setScreenState(SIGNED_IN, loaded(STORED_BEANS));

      const { rerender } = render(<BeansScreen />);
      rerender(<BeansScreen />);

      expect(setupChannelMock).toHaveBeenCalledTimes(1);
    });
  });
});
