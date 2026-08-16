import { renderHook, waitFor } from '@testing-library/react-native';
import type { EventSubscription } from 'expo-modules-core';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useNotificationObserver } from '../useNotificationObserver';

const getLastResponseMock = jest.mocked(
  Notifications.getLastNotificationResponse
);
const addResponseListenerMock = jest.mocked(
  Notifications.addNotificationResponseReceivedListener
);
const pushMock = jest.mocked(router.push);

type ResponseListener = Parameters<
  typeof Notifications.addNotificationResponseReceivedListener
>[0];

/**
 * A notification response shaped exactly like the OS delivers one. `data` is
 * `Record<string, unknown>` in expo-notifications 55, so an arbitrary payload
 * needs no cast — which is the whole point of the URL guard under test.
 */
function responseWithData(
  data: Record<string, unknown> | undefined
): Notifications.NotificationResponse {
  return {
    actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
    notification: {
      date: Date.now(),
      request: {
        identifier: 'degassing-bean-1',
        content: {
          title: '디게싱 완료',
          subtitle: null,
          body: '에티오피아 예가체프 디게싱 기간이 끝났습니다. 맛있게 원두를 즐기세요!',
          data,
          categoryIdentifier: null,
          sound: null,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: Date.now(),
        },
      },
    },
  };
}

const removeSpy = jest.fn();

/**
 * Captures the listener the hook registers so a warm-start tap can be
 * delivered through the real subscription contract instead of a timer. The
 * subscription object is the same `EventSubscription` shape expo-modules-core
 * returns, so `remove` is exercised exactly as production would call it.
 */
function captureRegisteredListener(): ResponseListener {
  const call = addResponseListenerMock.mock.calls[0];
  if (!call) {
    throw new Error('addNotificationResponseReceivedListener was never called');
  }
  return call[0];
}

const DEEP_LINK = '/beans/bean-1';

beforeEach(() => {
  jest.clearAllMocks();
  getLastResponseMock.mockReturnValue(null);
  addResponseListenerMock.mockImplementation(
    (): EventSubscription => ({ remove: removeSpy })
  );
});

describe('hooks/useNotificationObserver cold start', () => {
  describe('Given the app was launched by tapping a degassing notification', () => {
    it('When the observer mounts, Then it deep-links to that bean exactly once', async () => {
      getLastResponseMock.mockReturnValue(
        responseWithData({ url: DEEP_LINK })
      );

      renderHook(() => useNotificationObserver());

      await waitFor(() => expect(pushMock).toHaveBeenCalledTimes(1));
      expect(pushMock).toHaveBeenCalledWith(DEEP_LINK);
    });

    it('When the observer mounts, Then the listener is subscribed too, so a later tap is not lost', () => {
      getLastResponseMock.mockReturnValue(
        responseWithData({ url: DEEP_LINK })
      );

      renderHook(() => useNotificationObserver());

      expect(addResponseListenerMock).toHaveBeenCalledTimes(1);
    });

    it('When the cold response is consumed, Then the live listener does not replay it', async () => {
      getLastResponseMock.mockReturnValue(
        responseWithData({ url: DEEP_LINK })
      );

      renderHook(() => useNotificationObserver());
      await waitFor(() => expect(pushMock).toHaveBeenCalledTimes(1));

      // The OS does not re-deliver the launch response to the runtime listener;
      // if it ever did, this would surface as a duplicate navigation.
      expect(pushMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Given the app was launched normally', () => {
    it('When the observer mounts, Then no navigation happens', () => {
      getLastResponseMock.mockReturnValue(null);

      renderHook(() => useNotificationObserver());

      expect(pushMock).not.toHaveBeenCalled();
    });
  });
});

describe('hooks/useNotificationObserver warm start', () => {
  describe('Given the app is already running', () => {
    it('When a degassing notification is tapped, Then it deep-links to that bean', async () => {
      renderHook(() => useNotificationObserver());

      captureRegisteredListener()(responseWithData({ url: DEEP_LINK }));

      await waitFor(() => expect(pushMock).toHaveBeenCalledTimes(1));
      expect(pushMock).toHaveBeenCalledWith(DEEP_LINK);
    });

    it('When two notifications are tapped, Then each one navigates', async () => {
      renderHook(() => useNotificationObserver());
      const listener = captureRegisteredListener();

      listener(responseWithData({ url: DEEP_LINK }));
      listener(responseWithData({ url: '/beans/bean-2' }));

      await waitFor(() => expect(pushMock).toHaveBeenCalledTimes(2));
      expect(pushMock.mock.calls.map(([href]) => href)).toEqual([
        DEEP_LINK,
        '/beans/bean-2',
      ]);
    });
  });
});

describe('hooks/useNotificationObserver rejects payloads that are not bean deep links', () => {
  /**
   * Everything the app must refuse to navigate to. `//evil.com` and
   * `https://evil.com` matter most: expo-router treats those as external
   * paths, so forwarding a server-controlled payload straight into
   * `router.push` would let a notification payload drive navigation off-app.
   */
  const REJECTED_PAYLOADS: {
    label: string;
    data: Record<string, unknown> | undefined;
  }[] = [
    { label: 'data is absent entirely', data: undefined },
    { label: 'url key is missing', data: {} },
    { label: 'url is null', data: { url: null } },
    { label: 'url is a number', data: { url: 42 } },
    { label: 'url is an object', data: { url: { pathname: DEEP_LINK } } },
    { label: 'url is an empty string', data: { url: '' } },
    { label: 'url is a protocol-relative external host', data: { url: '//evil.com' } },
    { label: 'url is an absolute external URL', data: { url: 'https://evil.com' } },
    { label: 'url is a custom scheme', data: { url: 'coffimerapp://beans/x' } },
    { label: 'url is a relative path escape', data: { url: '../beans/bean-1' } },
    { label: 'url points outside the beans route', data: { url: '/profile' } },
    { label: 'url has no bean id', data: { url: '/beans/' } },
    { label: 'url has extra path segments', data: { url: '/beans/bean-1/edit' } },
    { label: 'url is not absolute', data: { url: 'beans/bean-1' } },
  ];

  describe.each(REJECTED_PAYLOADS)(
    'Given a cold-start payload where $label',
    ({ data }) => {
      it('When the observer mounts, Then nothing is navigated to', () => {
        getLastResponseMock.mockReturnValue(responseWithData(data));

        renderHook(() => useNotificationObserver());

        expect(pushMock).not.toHaveBeenCalled();
      });
    }
  );

  describe.each(REJECTED_PAYLOADS)(
    'Given a warm-start payload where $label',
    ({ data }) => {
      it('When the notification is tapped, Then nothing is navigated to', () => {
        renderHook(() => useNotificationObserver());

        captureRegisteredListener()(responseWithData(data));

        expect(pushMock).not.toHaveBeenCalled();
      });
    }
  );
});

describe('hooks/useNotificationObserver teardown', () => {
  describe('Given the observer is mounted', () => {
    it('When it unmounts, Then the subscription is removed exactly once', () => {
      const { unmount } = renderHook(() => useNotificationObserver());

      expect(removeSpy).not.toHaveBeenCalled();

      unmount();

      expect(removeSpy).toHaveBeenCalledTimes(1);
    });

    it('When it remounts, Then the old subscription is removed and a fresh one is taken', () => {
      const { unmount } = renderHook(() => useNotificationObserver());
      unmount();

      renderHook(() => useNotificationObserver());

      expect(removeSpy).toHaveBeenCalledTimes(1);
      expect(addResponseListenerMock).toHaveBeenCalledTimes(2);
    });

    /**
     * `getLastNotificationResponse()` is synchronous in expo-notifications 55
     * (`NotificationsEmitter.d.ts:83` returns `NotificationResponse | null`,
     * with the promise-returning `getLastNotificationResponseAsync` deprecated
     * in its favour), and the hook holds no component state. There is therefore
     * no late-resolving cold-start promise that could set state after unmount.
     * What is worth pinning is that a stale callback firing after teardown
     * cannot throw and take the app down with it: `router.push` is a module
     * singleton, not captured component state.
     */
    it('When a stale callback fires after unmount, Then it neither throws nor touches React state', () => {
      const { unmount } = renderHook(() => useNotificationObserver());
      const listener = captureRegisteredListener();

      unmount();

      expect(() =>
        listener(responseWithData({ url: DEEP_LINK }))
      ).not.toThrow();
    });
  });
});
