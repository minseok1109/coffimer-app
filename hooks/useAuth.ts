import { secureStorage } from "@/lib/secureStorage";
import { supabase } from "@/lib/supabaseClient";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

GoogleSignin.configure({
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  webClientId:
    "1023947480817-req4un46k8h50hhpt8ij1i75bte405cm.apps.googleusercontent.com",
});

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

    // Auth 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
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
    return { data, error };
  };

  const signInWithGoogle = async () => {
    console.log("🔍 구글 로그인 시작...");
    try {
      // Google Sign-in 설정 확인
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Google 로그인 수행
      const userInfo = await GoogleSignin.signIn();
      console.log("📊 Google 사용자 정보:", userInfo);

      if (userInfo.data?.idToken) {
        // Supabase에 ID 토큰으로 로그인
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: userInfo.data.idToken,
        });

        console.log("📊 Supabase 로그인 응답:", { data, error });

        if (error) {
          console.error("❌ Supabase 로그인 에러:", error);
          return { data, error };
        }

        // 로그인 성공 시 자동 로그인 활성화
        if (data.session) {
          await secureStorage.setAutoLoginEnabled(true);
        }

        console.log("✅ 구글 로그인 성공!");
        return { data, error };
      } else {
        const error = new Error("Google ID 토큰을 받지 못했습니다.");
        return { data: null, error };
      }
    } catch (error: unknown) {
      console.error("🚨 구글 로그인 실패:", error);

      // Google Sign-in 에러 처리
      if (error && typeof error === "object" && "code" in error) {
        const googleError = error as { code: string; message?: string };
        switch (googleError.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            console.log("사용자가 로그인을 취소했습니다.");
            return { data: null, error: null }; // 취소는 에러가 아님
          case statusCodes.IN_PROGRESS:
            return {
              data: null,
              error: new Error("이미 로그인이 진행 중입니다."),
            };
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            return {
              data: null,
              error: new Error("Google Play Services를 사용할 수 없습니다."),
            };
          default:
            console.error("Google Sign-in 에러:", googleError);
        }
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      return { data: null, error: new Error(errorMessage) };
    }
  };

  const signInWithApple = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: "coffimerapp://auth/callback",
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    // 로그아웃 시 보안 데이터 정리
    await secureStorage.clearSessionData();
    await secureStorage.setAutoLoginEnabled(false);

    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    ...authState,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    signOut,
  };
}
