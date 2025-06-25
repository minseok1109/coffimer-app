import { secureStorage } from "@/lib/secureStorage";
import { supabase } from "@/lib/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // 자동 로그인 설정 확인 후 세션 가져오기
    const initializeAuth = async () => {
      try {
        const autoLoginEnabled = await secureStorage.getAutoLoginEnabled();

        if (!autoLoginEnabled) {
          // 자동 로그인이 비활성화된 경우 세션 정리
          await supabase.auth.signOut();
          setAuthState({
            user: null,
            session: null,
            loading: false,
          });
          return;
        }

        // 자동 로그인이 활성화된 경우 세션 복원
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // 세션이 있으면 상태 설정
        if (session) {
          // 세션 정보 로그
          console.log("🔐 세션 복원:", session.user?.email);
        }

        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
        });
      } catch (error) {
        console.error("인증 초기화 오류:", error);
        setAuthState({
          user: null,
          session: null,
          loading: false,
        });
      }
    };

    initializeAuth();

    // Auth 상태 변경 감지 (인증 클라이언트 사용)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 Auth 상태 변경:", event, session?.user?.email);

      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
      });

      // 로그인 시 자동 로그인 활성화
      if (event === "SIGNED_IN" && session?.user) {
        await secureStorage.setAutoLoginEnabled(true);
      }

      // 로그아웃 시 보안 데이터 정리
      if (event === "SIGNED_OUT") {
        await secureStorage.clearSessionData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncUserProfile = async (user: User) => {
    try {
      // 인증된 상태에서 사용자 프로필 동기화 (인증 클라이언트 사용)
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!existingUser) {
        // 새 사용자 생성
        await supabase.from("users").insert({
          id: user.id,
          email: user.email!,
          display_name:
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "User",
          profile_image: user.user_metadata?.avatar_url || null,
        });
      } else {
        // 기존 사용자 정보 업데이트
        await supabase
          .from("users")
          .update({
            display_name:
              user.user_metadata?.full_name || existingUser.display_name,
            profile_image:
              user.user_metadata?.avatar_url || existingUser.profile_image,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      }
    } catch (error) {
      console.error("Error syncing user profile:", error);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 로그인 성공 시 자동 로그인 활성화
    if (data.session) {
      await secureStorage.setAutoLoginEnabled(true);
    }

    return { data, error };
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: displayName,
        },
      },
    });

    // 회원가입 성공 시 users 테이블에 사용자 정보 저장
    if (data.user && !error) {
      try {
        await supabase.from("users").insert({
          id: data.user.id,
          email: data.user.email!,
          display_name: displayName || data.user.email?.split("@")[0] || "User",
          profile_image: null,
        });
      } catch (insertError) {
        console.error("Error creating user profile:", insertError);
      }
    }

    return { data, error };
  };

  /**
   * Supabase 스토리지 완전 정리 유틸리티
   * supabase.auth.signOut()과 AsyncStorage.removeItem('supabase.auth.token')을 모두 실행
   */
  const clearSupabaseStorage = async () => {
    try {
      // 1. Supabase 로그아웃
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Supabase 로그아웃 오류:", error);
      }

      // 2. AsyncStorage에서 supabase.auth.token 제거 (통합 클라이언트가 사용하는 키)
      await AsyncStorage.removeItem('supabase.auth.token');
      
      console.log("Supabase 스토리지 정리 완료");
      return { success: true, error: null };
    } catch (error) {
      console.error("Supabase 스토리지 정리 중 오류:", error);
      return { success: false, error };
    }
  };

  const signOut = async () => {
    try {
      // 1. AsyncStorage에서 특정 키들 제거
      const keysToRemove = [
        "supabase.auth.token", // 통합 클라이언트가 사용하는 키 유지
        "user_session",
        "auto_login_enabled",
        "user_profile",
        // 필요한 다른 키들 추가
      ];

      await AsyncStorage.multiRemove(keysToRemove);

      // 2. 또는 AsyncStorage 전체 정리 (주의: 앱의 모든 데이터가 삭제됨)
      // await AsyncStorage.clear();

      // 3. Supabase 로그아웃
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("로그아웃 오류:", error);
        return { success: false, error };
      }

      console.log("완전 로그아웃 완료");
      return { success: true };
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
      return { success: false, error };
    }
  };

  return {
    ...authState,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    clearSupabaseStorage, // 새로운 유틸리티 함수 추가
  };
}
