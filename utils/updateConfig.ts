import Constants from 'expo-constants';

// 업데이트 관련 상수
export const UPDATE_CONFIG = {
  // 체크 간격 (24시간)
  CHECK_INTERVAL: 24 * 60 * 60 * 1000,
  
  // 재시도 설정
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000, // 5초
  
  // UI 설정
  MODAL_AUTO_DISMISS_DELAY: 10000, // 10초 후 자동 닫기
  SNACKBAR_DURATION: 5000, // 5초
  
  // 스토리지 키
  STORAGE_KEYS: {
    LAST_CHECK: 'update_last_check',
    USER_SETTINGS: 'update_user_settings',
    DISMISSED_UPDATES: 'update_dismissed',
  },
  
  // 업데이트 메시지
  MESSAGES: {
    UPDATE_AVAILABLE: '새로운 기능이 추가되었어요!',
    UPDATE_DESCRIPTION: '더 나은 커피 타이머 경험을 위해 업데이트해보세요',
    DOWNLOADING: '업데이트를 다운로드하고 있어요...',
    READY_TO_RESTART: '업데이트 준비가 완료되었어요!',
    ERROR_GENERIC: '업데이트 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.',
    ERROR_NETWORK: '네트워크 연결을 확인해주세요',
  },
} as const;

// 사용자 업데이트 설정 타입
export interface UpdateUserSettings {
  autoCheck: boolean;
  autoDownload: boolean;
  wifiOnly: boolean;
  showReleaseNotes: boolean;
  enableNotifications: boolean;
}

// 기본 사용자 설정
export const DEFAULT_USER_SETTINGS: UpdateUserSettings = {
  autoCheck: true,
  autoDownload: false,
  wifiOnly: true,
  showReleaseNotes: true,
  enableNotifications: true,
};

// 업데이트 정보 타입
export interface UpdateInfo {
  isAvailable: boolean;
  manifest?: any;
  createdAt?: Date;
  updateId?: string;
  runtimeVersion?: string;
}

// 업데이트 상태 타입
export type UpdateStatus = 
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'pending'
  | 'error';

// 업데이트 에러 타입
export interface UpdateError {
  code: string;
  message: string;
  originalError?: Error;
}

// 환경 체크
export const isUpdateEnabled = (): boolean => {
  // 개발 모드에서는 업데이트 비활성화
  if (__DEV__) {
    return false;
  }
  
  // Expo Go에서는 업데이트 비활성화
  if (Constants.expoConfig?.extra?.eas?.projectId === undefined) {
    return false;
  }
  
  return true;
};

// 디버그 로그 함수
export const debugLog = (message: string, data?: any): void => {
  if (__DEV__) {
    console.log(`[UpdateManager] ${message}`, data || '');
  }
};

// 업데이트 우선순위 타입
export type UpdatePriority = 'low' | 'medium' | 'high' | 'critical';

// 업데이트 메타데이터 타입
export interface UpdateMetadata {
  priority: UpdatePriority;
  releaseNotes?: string;
  features?: string[];
  bugFixes?: string[];
  size?: number; // bytes
  forceUpdate?: boolean;
}