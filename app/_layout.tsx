import '../global.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { PostHogProvider } from 'posthog-react-native';
import { useState } from 'react';
import { UpdateManager } from '@/components/UpdateManager';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  // useEffect(() => {
  //   Clarity.initialize("s6n3mh192b", {
  //     logLevel: Clarity.LogLevel.None,
  //   });
  // }, []);

  return (
    <PostHogProvider
      apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY!}
      options={{
        host:
          process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      }}
    >
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
          <UpdateManager />
        </QueryClientProvider>
      </AuthProvider>
    </PostHogProvider>
  );
}
