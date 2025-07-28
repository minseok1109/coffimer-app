// 타이머 관련 상수
export const TIMER_INTERVAL_MS = 1000;

// 알림 관련 상수
export const NOTIFICATION_SOUND = '/alarm.mp3';

// UI 관련 상수
export const PROGRESS_DECIMALS = 0;
export const TIME_PAD_LENGTH = 2;
export const TIME_PAD_CHARACTER = '0';

// 기본값
export const DEFAULT_RECIPE_INDEX = 0;
export const INITIAL_TIME = 0;
export const INITIAL_STEP = 0;

// 날짜/시간 포맷 상수
export const DATE_FORMAT = {
  FULL: 'YYYY-MM-DD HH:mm:ss',
  DATE_ONLY: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm:ss',
  KOREAN_FULL: 'YYYY년 MM월 DD일 HH:mm',
  KOREAN_DATE: 'YYYY년 MM월 DD일',
  DISPLAY: 'MM/DD HH:mm',
  LOG: 'YYYY-MM-DD HH:mm:ss.SSS',
} as const;

// 타임존 상수
export const TIMEZONE = 'Asia/Seoul';

// 로그 레벨 상수
export const LOG_LEVEL = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const;
