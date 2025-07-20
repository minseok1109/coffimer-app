import { secureStorage } from "@/lib/secureStorage";
import { supabase } from "@/lib/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePostHog } from "posthog-react-native";

import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useState, useRef, useCallback } from "react";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const posthog = usePostHog();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  // PostHog 중복 호출 방지를 위한 추적
  const lastIdentifiedUserId = useRef<string | null>(null);
  const identificationInProgress = useRef(false);

  // PostHog 사용자 식별 함수 (중복 방지 포함)
  const identifyUserInPostHog = useCallback((user: User, context: 'session_restore' | 'login' = 'login') => {
    if (!posthog || !user) return false;
    
    // 이미 같은 사용자를 식별했거나 식별이 진행 중이면 건너뛰기
    if (lastIdentifiedUserId.current === user.id || identificationInProgress.current) {
      console.log("🎯 PostHog 중복 식별 방지:", user.id, context);
      return false;
    }

    try {
      identificationInProgress.current = true;
      
      const userProperties = {
        email: user.email,
        user_id: user.id,
        created_at: user.created_at,
        context: context,
        timestamp: new Date().toISOString(),
        ...(user.user_metadata?.full_name && { 
          full_name: user.user_metadata.full_name 
        }),
      };

      posthog.identify(user.id, userProperties);
      lastIdentifiedUserId.current = user.id;
      
      console.log("🎯 PostHog 사용자 식별 완료:", user.id, context, userProperties);
      return true;
    } catch (error) {
      console.error("🎯 PostHog 식별 오류:", error);
      return false;
    } finally {
      identificationInProgress.current = false;
    }
  }, [posthog]);

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
          
          // PostHog 사용자 식별 (세션 복원 시) - 중복 방지 포함
          if (session.user) {
            identifyUserInPostHog(session.user, 'session_restore');
          }
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

      // PostHog 사용자 식별 및 이벤트 추적
      try {
        if (posthog) {
          if (event === "SIGNED_IN" && session?.user) {
            // 사용자 식별 (중복 방지 포함)
            const identified = identifyUserInPostHog(session.user, 'login');
            
            // 로그인 이벤트만 추적 (identify와 분리)
            posthog.capture("user_login", { 
              method: "email",
              user_id: session.user.id,
              identified: identified
            });
            
            console.log("🎯 PostHog 로그인 이벤트 추적:", session.user.id, { identified });
          } else if (event === "SIGNED_OUT") {
            // 로그아웃 시 처리
            posthog.capture("user_logout", {});
            posthog.reset();
            
            // 추적 상태 초기화
            lastIdentifiedUserId.current = null;
            identificationInProgress.current = false;
            
            console.log("🎯 PostHog 로그아웃 및 상태 초기화");
          }
        } else {
          console.warn("🎯 PostHog 인스턴스를 사용할 수 없습니다");
        }
      } catch (error) {
        console.error("🎯 PostHog 연동 오류:", error);
      }

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
  }, [identifyUserInPostHog]);


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
      await AsyncStorage.removeItem("supabase.auth.token");

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

  const deleteAccount = async () => {
    try {
      // 현재 세션 확인
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return { success: false, error: new Error("로그인이 필요합니다") };
      }

      // Edge Function 호출하여 계정 삭제
      const supabaseUrl = "https://qyjbrwvlzxrtrypwncfl.supabase.co";
      const response = await fetch(
        `${supabaseUrl}/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "계정 삭제에 실패했습니다");
      }

      // 삭제 성공 시 로컬 데이터 정리
      await clearSupabaseStorage();
      await secureStorage.clearSessionData();

      console.log("계정 탈퇴 완료");
      return { success: true };
    } catch (error) {
      console.error("계정 탈퇴 중 오류:", error);
      return { success: false, error };
    }
  };

  return {
    ...authState,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    clearSupabaseStorage, // 새로운 유틸리티 함수 추가
    deleteAccount, // 계정 삭제 함수 추가
  };
}
