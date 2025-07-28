import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import {
  DEFAULT_USER_SETTINGS,
  debugLog,
  UPDATE_CONFIG,
  type UpdateError,
  type UpdateMetadata,
  type UpdateUserSettings,
} from './updateConfig';

/**
 * 마지막 업데이트 체크 시간을 저장합니다
 */
export const setLastCheckTime = async (
  time: Date = new Date()
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      UPDATE_CONFIG.STORAGE_KEYS.LAST_CHECK,
      time.toISOString()
    );
    debugLog('Last check time saved', time.toISOString());
  } catch (error) {
    debugLog('Failed to save last check time', error);
  }
};

/**
 * 마지막 업데이트 체크 시간을 가져옵니다
 */
export const getLastCheckTime = async (): Promise<Date | null> => {
  try {
    const timeString = await AsyncStorage.getItem(
      UPDATE_CONFIG.STORAGE_KEYS.LAST_CHECK
    );
    if (timeString) {
      return new Date(timeString);
    }
    return null;
  } catch (error) {
    debugLog('Failed to get last check time', error);
    return null;
  }
};

/**
 * 업데이트 체크가 필요한지 확인합니다
 */
export const shouldCheckForUpdates = async (): Promise<boolean> => {
  try {
    const lastCheck = await getLastCheckTime();
    if (!lastCheck) {
      return true;
    }

    const now = new Date();
    const timeDifference = now.getTime() - lastCheck.getTime();
    const shouldCheck = timeDifference >= UPDATE_CONFIG.CHECK_INTERVAL;

    debugLog('Should check for updates', {
      lastCheck: lastCheck.toISOString(),
      timeDifference,
      shouldCheck,
    });

    return shouldCheck;
  } catch (error) {
    debugLog('Error checking if should update', error);
    return true; // 에러 시 체크하도록 설정
  }
};

/**
 * 사용자 업데이트 설정을 저장합니다
 */
export const saveUserSettings = async (
  settings: UpdateUserSettings
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      UPDATE_CONFIG.STORAGE_KEYS.USER_SETTINGS,
      JSON.stringify(settings)
    );
    debugLog('User settings saved', settings);
  } catch (error) {
    debugLog('Failed to save user settings', error);
  }
};

/**
 * 사용자 업데이트 설정을 가져옵니다
 */
export const getUserSettings = async (): Promise<UpdateUserSettings> => {
  try {
    const settingsString = await AsyncStorage.getItem(
      UPDATE_CONFIG.STORAGE_KEYS.USER_SETTINGS
    );
    if (settingsString) {
      const settings = JSON.parse(settingsString);
      return { ...DEFAULT_USER_SETTINGS, ...settings };
    }
    return DEFAULT_USER_SETTINGS;
  } catch (error) {
    debugLog('Failed to get user settings, using defaults', error);
    return DEFAULT_USER_SETTINGS;
  }
};

/**
 * 네트워크 연결 상태를 확인합니다
 */
export const checkNetworkConnection = async (): Promise<{
  isConnected: boolean;
  isWifi: boolean;
  connectionType: string;
}> => {
  try {
    // 네트워크 상태 확인
    const networkState = await Network.getNetworkStateAsync();

    if (!networkState.isConnected) {
      return {
        isConnected: false,
        isWifi: false,
        connectionType: 'none',
      };
    }

    // 네트워크 타입 확인
    const networkType = networkState.type;
    const isWifi = networkType === Network.NetworkStateType.WIFI;

    // 연결 타입 문자열 변환
    let connectionType = 'unknown';
    switch (networkType) {
      case Network.NetworkStateType.WIFI:
        connectionType = 'wifi';
        break;
      case Network.NetworkStateType.CELLULAR:
        connectionType = 'cellular';
        break;
      case Network.NetworkStateType.ETHERNET:
        connectionType = 'ethernet';
        break;
      case Network.NetworkStateType.BLUETOOTH:
        connectionType = 'bluetooth';
        break;
      case Network.NetworkStateType.VPN:
        connectionType = 'vpn';
        break;
      default:
        connectionType = 'unknown';
    }

    debugLog('Network state', {
      isConnected: networkState.isConnected,
      isWifi,
      connectionType,
      isInternetReachable: networkState.isInternetReachable,
    });

    return {
      isConnected: networkState.isConnected,
      isWifi,
      connectionType,
    };
  } catch (error) {
    debugLog('Failed to check network connection', error);
    // 에러 발생 시 보수적으로 접근 (연결되지 않은 것으로 간주)
    return {
      isConnected: false,
      isWifi: false,
      connectionType: 'unknown',
    };
  }
};

/**
 * 업데이트 다운로드가 가능한 네트워크 상태인지 확인합니다
 */
export const canDownloadUpdate = async (
  userSettings: UpdateUserSettings
): Promise<boolean> => {
  const networkInfo = await checkNetworkConnection();

  if (!networkInfo.isConnected) {
    return false;
  }

  // WiFi 전용 설정이고 WiFi가 아닌 경우
  if (userSettings.wifiOnly && !networkInfo.isWifi) {
    return false;
  }

  return true;
};

/**
 * 지수 백오프를 사용한 재시도 함수
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = UPDATE_CONFIG.MAX_RETRY_ATTEMPTS,
  baseDelay: number = UPDATE_CONFIG.RETRY_DELAY
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      debugLog(`Attempt ${attempt} failed`, error);

      if (attempt === maxAttempts) {
        break;
      }

      // 지수 백오프 (2^attempt * baseDelay)
      const delay = 2 ** (attempt - 1) * baseDelay;
      debugLog(`Retrying in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};

/**
 * 업데이트 에러를 사용자 친화적 메시지로 변환합니다
 */
export const formatUpdateError = (error: Error): UpdateError => {
  const errorCode = (error as any)?.code || 'UNKNOWN';

  // 네트워크 관련 에러
  if (errorCode.includes('NETWORK') || error.message.includes('network')) {
    return {
      code: 'NETWORK_ERROR',
      message: UPDATE_CONFIG.MESSAGES.ERROR_NETWORK,
      originalError: error,
    };
  }

  // 일반적인 에러
  return {
    code: errorCode,
    message: UPDATE_CONFIG.MESSAGES.ERROR_GENERIC,
    originalError: error,
  };
};

/**
 * 업데이트 크기를 사람이 읽기 쉬운 형태로 변환합니다
 */
export const formatUpdateSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
};

/**
 * 업데이트 우선순위에 따른 메시지를 생성합니다
 */
export const getUpdateMessage = (
  metadata?: UpdateMetadata
): {
  title: string;
  description: string;
  isForced: boolean;
} => {
  if (!metadata) {
    return {
      title: UPDATE_CONFIG.MESSAGES.UPDATE_AVAILABLE,
      description: UPDATE_CONFIG.MESSAGES.UPDATE_DESCRIPTION,
      isForced: false,
    };
  }

  const {
    priority,
    forceUpdate = false,
    features = [],
    bugFixes = [],
  } = metadata;

  let title: string = UPDATE_CONFIG.MESSAGES.UPDATE_AVAILABLE;
  let description: string = UPDATE_CONFIG.MESSAGES.UPDATE_DESCRIPTION;

  // 우선순위에 따른 메시지 조정
  switch (priority) {
    case 'critical':
      title = '중요한 업데이트가 있어요!';
      description = '보안 및 안정성 개선을 위한 필수 업데이트입니다.';
      break;
    case 'high':
      title = '새로운 기능이 추가되었어요!';
      if (features.length > 0) {
        description = `${features
          .slice(0, 2)
          .join(', ')} 등의 새로운 기능을 만나보세요.`;
      }
      break;
    case 'medium':
      title = '앱이 더 좋아졌어요!';
      if (bugFixes.length > 0) {
        description = '여러 개선사항과 버그 수정이 포함되어 있어요.';
      }
      break;
    case 'low':
      title = '작은 업데이트가 있어요';
      description = '사용 경험 개선을 위한 작은 변경사항입니다.';
      break;
  }

  return {
    title,
    description,
    isForced: forceUpdate,
  };
};

/**
 * 업데이트 시간을 상대적 시간으로 표시합니다
 */
export const getRelativeTimeString = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '방금 전';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  }

  return date.toLocaleDateString('ko-KR');
};

/**
 * 업데이트 관련 분석 이벤트를 로깅합니다
 */
export const logUpdateEvent = (
  event: string,
  properties?: Record<string, any>
): void => {
  // 추후 분석 도구 (Expo Analytics, Firebase 등) 연동 시 구현
  debugLog(`Update Event: ${event}`, properties);
};
