import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qyjbrwvlzxrtrypwncfl.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5amJyd3ZsenhydHJ5cHduY2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNTE5OTQsImV4cCI6MjA2NDkyNzk5NH0.d5yLGjuwAHF0AZDXV7YTQl-loRrK1iGSAXoR-4XQkZw";

// 1. 데이터 로딩용 클라이언트 (세션 없음, 빠른 초기화)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// 2. 인증용 클라이언트 (세션 유지, 로그인 상태 보존)
export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});

// 세션 초기화 상태 관리
let isSessionInitialized = false;

// 앱 시작 시 세션 복원 (백그라운드에서)
export const initializeSession = async () => {
  if (isSessionInitialized) return;
  
  try {
    console.log("🔐 세션 초기화 시작...");
    const { data: { session } } = await supabaseAuth.auth.getSession();
    
    if (session) {
      console.log("✅ 기존 세션 복원됨:", session.user.email);
      // 데이터 로딩용 클라이언트에 세션 설정
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    } else {
      console.log("ℹ️ 저장된 세션 없음");
    }
    
    isSessionInitialized = true;
  } catch (error) {
    console.error("🚨 세션 초기화 실패:", error);
    isSessionInitialized = true; // 에러여도 다시 시도하지 않도록
  }
};

// 로그인 시 두 클라이언트 모두 동기화
export const syncAuth = async (session: any) => {
  if (session) {
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  } else {
    await supabase.auth.signOut();
  }
};
