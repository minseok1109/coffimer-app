import { AuthProvider } from "@/contexts/AuthContext";
import { initializeSession } from "@/lib/supabaseClient";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    // 백그라운드에서 세션 초기화 (블로킹하지 않음)
    initializeSession();
  }, []);

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
