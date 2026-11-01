import '../global.css';
import '@/lib/calendar/locale';
import * as Notifications from 'expo-notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { PostHogProvider } from 'posthog-react-native';
import { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UpdateManager } from '@/components/UpdateManager';
import { NotificationDebugToolbar } from '@/components/NotificationDebugToolbar';
import { AuthProvider } from '@/contexts/AuthContext';
import { useNotificationObserver } from '@/hooks/useNotificationObserver';
import { useScreenTracking } from '@/hooks/useScreenTracking';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Rendered inside PostHogProvider so usePostHog() resolves the client.
const ScreenTracker = () => {
  useScreenTracking();
  return null;
};

export default function RootLayout() {
  useNotificationObserver();
  const [queryClient] = useState(() => new QueryClient());

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PostHogProvider
        apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY!}
        options={{
          host:
            process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        }}
        // captureScreens needs react-navigation, which expo-router 58 dropped.
        autocapture={{ captureScreens: false }}
      >
        <ScreenTracker />
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            />
            <UpdateManager />
            {__DEV__ && <NotificationDebugToolbar />}
          </QueryClientProvider>
        </AuthProvider>
      </PostHogProvider>
    </GestureHandlerRootView>
  );
}
