// Jest setup file

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: 'ExpoImage',
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(() =>
    Promise.resolve('mock-notification-id'),
  ),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  setNotificationHandler: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  getLastNotificationResponse: jest.fn(() => null),
  // Mirrors the shipped enum in expo-notifications 0.32.17
  // (build/NotificationChannelManager.types.d.ts). LOW and DEFAULT are present
  // so a regression that downgrades the degassing channel fails with the real
  // value it would ship, instead of `undefined` masking the difference.
  AndroidImportance: {
    LOW: 4,
    DEFAULT: 5,
    HIGH: 6,
  },
  SchedulableTriggerInputTypes: {
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
  },
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
    SafeAreaConsumer: ({ children }) => children(inset),
  };
});

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuthContext: jest.fn(() => ({
    signUpWithEmail: jest.fn(),
    signInWithEmail: jest.fn(),
    signOut: jest.fn(),
    user: null,
    loading: false,
  })),
  AuthProvider: ({ children }) => children,
}));

// Mock Alert
global.Alert = {
  alert: jest.fn(),
};

// react-native-worklets 0.7+ throws at import time when its native part is absent (jest).
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/lib/module/mock'),
);

// Reanimated 4.7.1 runs its native initializer under jest, which calls
// setCSSEventHandler on the JS fallback module (unsupported there) and throws.
// The official react-native-reanimated/mock hits the same path, so patch the
// fallback module itself (literal paths: jest.mock calls are hoisted).
jest.mock(
  'react-native-reanimated/lib/module/ReanimatedModule/js-reanimated/JSReanimated',
  () => {
    const actual = jest.requireActual(
      'react-native-reanimated/lib/module/ReanimatedModule/js-reanimated/JSReanimated',
    );
    return {
      ...actual,
      createJSReanimatedModule: () => {
        const reanimatedModule = actual.createJSReanimatedModule();
        reanimatedModule.setCSSEventHandler = () => undefined;
        return reanimatedModule;
      },
    };
  },
);
