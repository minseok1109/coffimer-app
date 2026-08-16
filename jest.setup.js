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
  AndroidImportance: {
    HIGH: 4,
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
