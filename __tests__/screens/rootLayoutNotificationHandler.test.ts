import * as Notifications from 'expo-notifications';

/**
 * The root layout pulls in the whole provider stack (PostHog, gesture handler,
 * update manager) and a global stylesheet that jest cannot transform. Those are
 * irrelevant to the notification handler, so each is replaced with an inert
 * stand-in and the module is imported for its side effect only.
 *
 * `jest.mock` calls are hoisted above the imports by babel-plugin-jest-hoist,
 * which is exactly what is needed here: the mocks must be in place before
 * `@/app/_layout` is required inside the test.
 */
jest.mock('../../global.css', () => ({}), { virtual: true });
jest.mock('@/lib/calendar/locale', () => ({}), { virtual: true });
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: 'GestureHandlerRootView',
}));
jest.mock('posthog-react-native', () => ({
  PostHogProvider: 'PostHogProvider',
}));
jest.mock('@/components/UpdateManager', () => ({ UpdateManager: () => null }));
jest.mock('@/components/NotificationDebugToolbar', () => ({
  NotificationDebugToolbar: () => null,
}));
jest.mock('@/hooks/useNotificationObserver', () => ({
  useNotificationObserver: jest.fn(),
}));

const setHandlerMock = jest.mocked(Notifications.setNotificationHandler);

/**
 * `setNotificationHandler` also accepts `null` to clear the handler, so the
 * registered argument is nullable. Narrowing here (instead of asserting)
 * means passing `null` — which would silently disable foreground
 * presentation — fails these tests loudly.
 */
function readRegisteredHandler(): Notifications.NotificationHandler {
  const call = setHandlerMock.mock.calls[0];
  if (!call) {
    throw new Error('setNotificationHandler was never called');
  }
  const [handler] = call;
  if (!handler) {
    throw new Error('setNotificationHandler was called with null');
  }
  return handler;
}

describe('app/_layout foreground notification handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      // A static `import` is hoisted and evaluated once for the whole file, so
      // the module-scope registration could not be re-observed after
      // `clearAllMocks`. Re-loading inside `isolateModules` is what proves
      // the handler is registered on every fresh module load.
      jest.requireActual('@/app/_layout');
    });
  });

  describe('Given the root layout module is loaded', () => {
    it('When it is imported, Then the handler is registered at module scope, before any render', () => {
      // Nothing was rendered in this test — registration happened purely as an
      // import side effect, which is what guarantees a notification arriving
      // during cold start is still presented.
      expect(setHandlerMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Given a notification arrives while the app is in the foreground', () => {
    it('When the handler runs, Then it shows a banner, lists it and plays a sound', async () => {
      const handler = readRegisteredHandler();
      const notification = {} as Notifications.Notification;

      const behavior = await handler.handleNotification(notification);

      expect(behavior).toEqual({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      });
    });

    it('When the handler runs, Then each presentation flag is individually correct', async () => {
      const handler = readRegisteredHandler();

      const behavior = await handler.handleNotification(
        {} as Notifications.Notification
      );

      expect(behavior.shouldShowBanner).toBe(true);
      expect(behavior.shouldShowList).toBe(true);
      expect(behavior.shouldPlaySound).toBe(true);
    });
  });
});
