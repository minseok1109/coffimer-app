import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";
// import * as Clarity from '@microsoft/react-native-clarity';

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  // useEffect(() => {
  //   Clarity.initialize('s6n3mh192b', {
  //     logLevel: Clarity.LogLevel.None,
  //   });
  // }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </QueryClientProvider>
    </AuthProvider>
  );
}
