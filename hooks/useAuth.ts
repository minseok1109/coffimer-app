import { secureStorage } from "@/lib/secureStorage";
import { supabaseAuth, syncAuth } from "@/lib/supabaseClient";

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
          await supabaseAuth.auth.signOut();
          await syncAuth(null);
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
        } = await supabaseAuth.auth.getSession();

        // 세션이 있으면 데이터 로딩 클라이언트에도 동기화
        if (session) {
          await syncAuth(session);
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
    } = supabaseAuth.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 Auth 상태 변경:", event, session?.user?.email);
      
      // 데이터 로딩 클라이언트와 동기화
      await syncAuth(session);
      
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
      });

      // 로그인 시 사용자 정보 동기화 및 자동 로그인 활성화
      if (event === "SIGNED_IN" && session?.user) {
        await syncUserProfile(session.user);
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
      const { data: existingUser } = await supabaseAuth
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!existingUser) {
        // 새 사용자 생성
        await supabaseAuth.from("users").insert({
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
        await supabaseAuth
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
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
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
    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: displayName,
        },
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    // 로그아웃 시 보안 데이터 정리
    await secureStorage.clearSessionData();
    await secureStorage.setAutoLoginEnabled(false);

    const { error } = await supabaseAuth.auth.signOut();
    return { error };
  };

  return {
    ...authState,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
}
