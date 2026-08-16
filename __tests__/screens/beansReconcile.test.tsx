import { render } from '@testing-library/react-native';
import BeansScreen from '@/app/(tabs)/beans';
import { reconcileDegassing } from '@/lib/notifications/degassing';
import { setupNotificationChannel } from '@/lib/notifications/permissions';
import type { Bean } from '@/types/bean';

type AuthUser = { id: string } | null;
type AuthSlice = { user: AuthUser };
type BeansQuerySlice = { data: Bean[]; isLoading: boolean };

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

function setScreenState(state: {
  user: AuthUser;
  beans: Bean[];
  isLoading: boolean;
}): void {
  mockUseAuth.mockReturnValue({ user: state.user });
  mockUseUserBeans.mockReturnValue({
    data: state.beans,
    isLoading: state.isLoading,
  });
}

describe('BeansScreen degassing reconcile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setScreenState({ user: SIGNED_IN, beans: [], isLoading: false });
  });

  describe('Given nobody is signed in', () => {
    it('When a stale bean list is still cached, Then nothing is reconciled', () => {
      setScreenState({ user: null, beans: STORED_BEANS, isLoading: false });

      render(<BeansScreen />);

      expect(reconcileMock).not.toHaveBeenCalled();
    });

    it('When the query is disabled and reports an empty list, Then nothing is reconciled', () => {
      // The disabled query resolves to `[]` with isLoading false, so without an
      // auth guard this render would cancel every healthy notification.
      setScreenState({ user: null, beans: [], isLoading: false });

      render(<BeansScreen />);

      expect(reconcileMock).not.toHaveBeenCalled();
    });
  });

  describe('Given a signed-in user whose list finished loading', () => {
    it('When the list is empty, Then reconcile still runs so orphans are cleaned up', () => {
      setScreenState({ user: SIGNED_IN, beans: [], isLoading: false });

      render(<BeansScreen />);

      expect(reconcileMock).toHaveBeenCalledTimes(1);
      expect(reconcileMock).toHaveBeenCalledWith([]);
    });

    it('When the list has beans, Then reconcile receives exactly that list', () => {
      setScreenState({
        user: SIGNED_IN,
        beans: STORED_BEANS,
        isLoading: false,
      });

      render(<BeansScreen />);

      expect(reconcileMock).toHaveBeenCalledTimes(1);
      expect(reconcileMock).toHaveBeenCalledWith(STORED_BEANS);
    });
  });

  describe('Given the bean list is still loading', () => {
    it('When rendering, Then reconcile waits for the load to finish', () => {
      setScreenState({ user: SIGNED_IN, beans: [], isLoading: true });

      render(<BeansScreen />);

      expect(reconcileMock).not.toHaveBeenCalled();
    });

    it('When the load finishes, Then reconcile runs once with the loaded list', () => {
      setScreenState({ user: SIGNED_IN, beans: [], isLoading: true });
      const { rerender } = render(<BeansScreen />);

      setScreenState({
        user: SIGNED_IN,
        beans: STORED_BEANS,
        isLoading: false,
      });
      rerender(<BeansScreen />);

      expect(reconcileMock).toHaveBeenCalledTimes(1);
      expect(reconcileMock).toHaveBeenCalledWith(STORED_BEANS);
    });
  });

  describe('Given reconcile already ran this mount', () => {
    it('When the screen re-renders with a new list identity, Then it does not run again', () => {
      setScreenState({
        user: SIGNED_IN,
        beans: STORED_BEANS,
        isLoading: false,
      });
      const { rerender } = render(<BeansScreen />);

      setScreenState({
        user: SIGNED_IN,
        beans: [createBean({ id: 'bean-2' })],
        isLoading: false,
      });
      rerender(<BeansScreen />);

      expect(reconcileMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Given a session is restored after an unauthenticated render', () => {
    it('When the user arrives, Then the earlier skipped pass does not latch reconcile off', () => {
      setScreenState({ user: null, beans: [], isLoading: false });
      const { rerender } = render(<BeansScreen />);
      expect(reconcileMock).not.toHaveBeenCalled();

      setScreenState({
        user: SIGNED_IN,
        beans: STORED_BEANS,
        isLoading: false,
      });
      rerender(<BeansScreen />);

      expect(reconcileMock).toHaveBeenCalledTimes(1);
      expect(reconcileMock).toHaveBeenCalledWith(STORED_BEANS);
    });
  });

  describe('Given the screen mounts', () => {
    it('When rendering while signed out, Then the notification channel is still set up', () => {
      setScreenState({ user: null, beans: [], isLoading: false });

      render(<BeansScreen />);

      expect(setupChannelMock).toHaveBeenCalledTimes(1);
    });

    it('When rendering while signed in, Then the notification channel is set up once', () => {
      setScreenState({
        user: SIGNED_IN,
        beans: STORED_BEANS,
        isLoading: false,
      });

      const { rerender } = render(<BeansScreen />);
      rerender(<BeansScreen />);

      expect(setupChannelMock).toHaveBeenCalledTimes(1);
    });
  });
});
