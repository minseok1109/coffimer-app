import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// 보안 저장소 키 상수
const STORAGE_KEYS = {
  SESSION_TOKEN: 'user_session_token',
  REFRESH_TOKEN: 'user_refresh_token',
  USER_CREDENTIALS: 'user_credentials',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  AUTO_LOGIN_ENABLED: 'auto_login_enabled',
} as const;

/**
 * 보안 저장소 클래스
 * iOS/Android: Keychain/Keystore 사용
 * Web: 암호화된 LocalStorage 사용
 */
class SecureStorage {
  /**
   * 보안 데이터 저장
   */
  async setSecureItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web에서는 AsyncStorage 사용 (실제 운영에서는 추가 암호화 권장)
        await AsyncStorage.setItem(key, value);
      } else {
        // Native에서는 Keychain/Keystore 사용
        await SecureStore.setItemAsync(key, value, {
          requireAuthentication: false, // 생체 인증 필요 시 true로 설정
          authenticationPrompt: '보안 인증이 필요합니다',
        });
      }
    } catch (error) {
      console.error('보안 저장 실패:', error);
      throw new Error('보안 저장에 실패했습니다');
    }
  }

  /**
   * 보안 데이터 조회
   */
  async getSecureItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key, {
        requireAuthentication: false,
        authenticationPrompt: '보안 인증이 필요합니다',
      });
    } catch (error) {
      console.error('보안 조회 실패:', error);
      return null;
    }
  }

  /**
   * 보안 데이터 삭제
   */
  async deleteSecureItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('보안 삭제 실패:', error);
    }
  }

  /**
   * 세션 토큰 저장
   */
  async saveSessionTokens(
    accessToken: string,
    refreshToken: string
  ): Promise<void> {
    await Promise.all([
      this.setSecureItem(STORAGE_KEYS.SESSION_TOKEN, accessToken),
      this.setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  }

  /**
   * 세션 토큰 조회
   */
  async getSessionTokens(): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
  }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.getSecureItem(STORAGE_KEYS.SESSION_TOKEN),
      this.getSecureItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * 모든 세션 데이터 삭제
   */
  async clearSessionData(): Promise<void> {
    await Promise.all([
      this.deleteSecureItem(STORAGE_KEYS.SESSION_TOKEN),
      this.deleteSecureItem(STORAGE_KEYS.REFRESH_TOKEN),
      this.deleteSecureItem(STORAGE_KEYS.USER_CREDENTIALS),
    ]);
  }

  /**
   * 자동 로그인 설정 저장
   */
  async setAutoLoginEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.AUTO_LOGIN_ENABLED,
      enabled.toString()
    );
  }

  /**
   * 자동 로그인 설정 조회
   */
  async getAutoLoginEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.AUTO_LOGIN_ENABLED);
      return value === 'true';
    } catch {
      return false;
    }
  }

  /**
   * 생체 인증 설정 저장
   */
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.BIOMETRIC_ENABLED,
      enabled.toString()
    );
  }

  /**
   * 생체 인증 설정 조회
   */
  async getBiometricEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      return value === 'true';
    } catch {
      return false;
    }
  }
}

export const secureStorage = new SecureStorage();
export { STORAGE_KEYS };
