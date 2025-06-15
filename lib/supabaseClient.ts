import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { secureStorage } from "./secureStorage";

const supabaseUrl = "https://qyjbrwvlzxrtrypwncfl.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5amJyd3ZsenhydHJ5cHduY2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNTE5OTQsImV4cCI6MjA2NDkyNzk5NH0.d5yLGjuwAHF0AZDXV7YTQl-loRrK1iGSAXoR-4XQkZw";

// 보안 저장소 어댑터
const SecureStorageAdapter = {
  getItem: async (key: string) => {
    // 중요한 토큰들은 보안 저장소에서 가져오기
    if (key.includes("access_token") || key.includes("refresh_token")) {
      const tokens = await secureStorage.getSessionTokens();
      if (key.includes("access_token")) {
        return tokens.accessToken;
      }
      if (key.includes("refresh_token")) {
        return tokens.refreshToken;
      }
    }

    // 일반 데이터는 AsyncStorage에서 가져오기
    return AsyncStorage.getItem(key);
  },

  setItem: async (key: string, value: string) => {
    // 중요한 토큰들은 보안 저장소에 저장
    if (key.includes("access_token") || key.includes("refresh_token")) {
      const tokens = await secureStorage.getSessionTokens();

      if (key.includes("access_token")) {
        await secureStorage.saveSessionTokens(value, tokens.refreshToken || "");
      } else if (key.includes("refresh_token")) {
        await secureStorage.saveSessionTokens(tokens.accessToken || "", value);
      }
      return;
    }

    // 일반 데이터는 AsyncStorage에 저장
    return AsyncStorage.setItem(key, value);
  },

  removeItem: async (key: string) => {
    // 토큰 삭제 시 보안 저장소도 함께 정리
    if (key.includes("access_token") || key.includes("refresh_token")) {
      await secureStorage.clearSessionData();
    }

    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce", // PKCE flow for enhanced security
  },
});
