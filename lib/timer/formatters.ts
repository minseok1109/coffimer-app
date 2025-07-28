import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { DATE_FORMAT, type LOG_LEVEL, TIMEZONE } from '../../constants';
import type { TimerDisplayData } from './types';

// dayjs 플러그인 활성화
dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('ko'); // 한국어 설정

/**
 * 초 단위 시간을 MM:SS 형식으로 포맷팅
 * @param totalTime 총 시간 (초)
 * @returns MM:SS 형식 문자열
 */
export const formatTime = (totalTime: number): string => {
  const dur = dayjs.duration(totalTime, 'seconds');
  const minutes = Math.floor(dur.asMinutes());
  const seconds = dur.seconds();

  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
};

/**
 * 초 단위 시간을 분/초로 분리하여 TimerDisplayData 형식으로 반환
 * @param time 시간 (초)
 * @returns TimerDisplayData 객체
 */
export const formatTimerDisplay = (time: number): TimerDisplayData => {
  const dur = dayjs.duration(time, 'seconds');
  const minutes = Math.floor(dur.asMinutes());
  const seconds = dur.seconds();

  return {
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
  };
};

/**
 * 초 단위 시간을 한국어 형식으로 포맷팅 (예: "3분 30초", "45초")
 * @param totalTime 총 시간 (초)
 * @returns 한국어 시간 표현 문자열
 */
export const formatTimeKorean = (totalTime: number): string => {
  const dur = dayjs.duration(totalTime, 'seconds');
  const minutes = Math.floor(dur.asMinutes());
  const seconds = dur.seconds();

  if (minutes > 0) {
    return seconds > 0 ? `${minutes}분 ${seconds}초` : `${minutes}분`;
  }
  return `${seconds}초`;
};

/**
 * 밀리초 단위 시간을 MM:SS.mmm 형식으로 포맷팅
 * @param totalTimeMs 총 시간 (밀리초)
 * @returns MM:SS.mmm 형식 문자열
 */
export const formatTimeWithMilliseconds = (totalTimeMs: number): string => {
  const dur = dayjs.duration(totalTimeMs, 'milliseconds');
  const minutes = Math.floor(dur.asMinutes());
  const seconds = dur.seconds();
  const milliseconds = dur.milliseconds();

  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
};

/**
 * 현재 날짜와 시간을 ISO 형식으로 반환
 * @returns ISO 형식 날짜 문자열
 */
export const getCurrentISOTime = (): string => {
  return dayjs().toISOString();
};

/**
 * 현재 날짜와 시간을 한국 시간대로 포맷팅
 * @param format 날짜 포맷 (기본값: 'YYYY-MM-DD HH:mm:ss')
 * @returns 포맷된 날짜 문자열
 */
export const getCurrentKoreanTime = (
  format: string = DATE_FORMAT.FULL
): string => {
  return dayjs().tz(TIMEZONE).format(format);
};

/**
 * 타임스탬프를 상대적 시간으로 표현 (예: "3분 전", "1시간 전")
 * @param timestamp 타임스탬프 (밀리초 또는 dayjs 객체)
 * @returns 상대적 시간 표현 문자열
 */
export const getRelativeTime = (
  timestamp: number | dayjs.Dayjs | string
): string => {
  const time = dayjs.isDayjs(timestamp) ? timestamp : dayjs(timestamp);
  return time.fromNow();
};

/**
 * 두 시간의 차이를 계산하여 초 단위로 반환
 * @param startTime 시작 시간
 * @param endTime 종료 시간
 * @returns 차이 (초)
 */
export const getTimeDifferenceInSeconds = (
  startTime: number | dayjs.Dayjs | string,
  endTime: number | dayjs.Dayjs | string
): number => {
  const start = dayjs.isDayjs(startTime) ? startTime : dayjs(startTime);
  const end = dayjs.isDayjs(endTime) ? endTime : dayjs(endTime);

  return end.diff(start, 'seconds');
};

/**
 * 레시피 완료 기록을 위한 타임스탬프 생성
 * @param recipeId 레시피 ID
 * @param recipeName 레시피 이름
 * @param completionTimeSeconds 완료 시간 (초)
 * @returns 완료 기록 객체
 */
export const createRecipeCompletionRecord = (
  recipeId: number,
  recipeName: string,
  completionTimeSeconds: number
) => {
  const now = dayjs();

  return {
    recipeId,
    recipeName,
    completionTime: completionTimeSeconds,
    completionTimeFormatted: formatTimeKorean(completionTimeSeconds),
    completedAt: now.toISOString(),
    completedAtKorean: now.tz(TIMEZONE).format(DATE_FORMAT.KOREAN_FULL),
    completedAtDisplay: now.tz(TIMEZONE).format(DATE_FORMAT.DISPLAY),
    timestamp: now.valueOf(),
  };
};

/**
 * 오늘 날짜인지 확인
 * @param date 확인할 날짜 (dayjs 객체, 문자열, 또는 타임스탬프)
 * @returns 오늘 날짜 여부
 */
export const isToday = (date: dayjs.Dayjs | string | number): boolean => {
  const targetDate = dayjs.isDayjs(date) ? date : dayjs(date);
  const today = dayjs().tz(TIMEZONE);

  return targetDate.tz(TIMEZONE).isSame(today, 'day');
};

/**
 * 이번 주인지 확인
 * @param date 확인할 날짜 (dayjs 객체, 문자열, 또는 타임스탬프)
 * @returns 이번 주 여부
 */
export const isThisWeek = (date: dayjs.Dayjs | string | number): boolean => {
  const targetDate = dayjs.isDayjs(date) ? date : dayjs(date);
  const today = dayjs().tz(TIMEZONE);

  return targetDate.tz(TIMEZONE).isSame(today, 'week');
};

/**
 * 이번 달인지 확인
 * @param date 확인할 날짜 (dayjs 객체, 문자열, 또는 타임스탬프)
 * @returns 이번 달 여부
 */
export const isThisMonth = (date: dayjs.Dayjs | string | number): boolean => {
  const targetDate = dayjs.isDayjs(date) ? date : dayjs(date);
  const today = dayjs().tz(TIMEZONE);

  return targetDate.tz(TIMEZONE).isSame(today, 'month');
};

/**
 * 레시피 스텝에서 실제 총 시간을 계산 (스마트 감지 적용)
 * @param steps 레시피 스텝 배열 (누적 또는 개별 시간)
 * @returns 실제 총 소요 시간 (초)
 */
export const calculateActualTotalTime = (steps: Array<{ time: number }>): number => {
  if (!steps || steps.length === 0) return 0;
  
  const wasCumulative = isCumulativeTimeData(steps);
  
  if (wasCumulative) {
    // 누적 시간 데이터인 경우: 개별 시간으로 변환하여 합산
    let totalTime = 0;
    let previousTime = 0;
    
    for (const step of steps) {
      const stepDuration = step.time - previousTime;
      totalTime += stepDuration;
      previousTime = step.time;
    }
    
    return totalTime;
  } else {
    // 개별 시간 데이터인 경우: 단순 합산
    return steps.reduce((sum, step) => sum + step.time, 0);
  }
};

/**
 * 레시피 스텝의 시간 데이터가 누적 시간인지 개별 시간인지 자동 감지
 * @param steps 레시피 스텝 배열
 * @returns true: 누적 시간, false: 개별 시간
 */
export const isCumulativeTimeData = (steps: Array<{ time: number }>): boolean => {
  if (!steps || steps.length <= 1) return false;
  
  // 누적 시간의 특징:
  // 1. 각 단계의 시간이 이전 단계보다 크거나 같음 (단조증가)
  // 2. 첫 번째 단계를 제외하고는 모든 단계가 이전 단계보다 큼
  
  let strictlyIncreasingCount = 0;
  let equalCount = 0;
  let decreasingCount = 0;
  
  for (let i = 1; i < steps.length; i++) {
    const current = steps[i].time;
    const previous = steps[i - 1].time;
    
    if (current > previous) {
      strictlyIncreasingCount++;
    } else if (current === previous) {
      equalCount++;
    } else {
      decreasingCount++;
    }
  }
  
  // 누적 시간 판단 기준:
  // - 90% 이상이 증가하는 패턴이고
  // - 감소하는 패턴이 10% 이하인 경우
  const totalComparisons = steps.length - 1;
  const increasingRatio = strictlyIncreasingCount / totalComparisons;
  const decreasingRatio = decreasingCount / totalComparisons;
  
  return increasingRatio >= 0.9 && decreasingRatio <= 0.1;
};

/**
 * 누적 시간으로 저장된 레시피 스텝을 각 단계별 개별 시간으로 변환
 * @param steps 누적 시간으로 저장된 레시피 스텝 배열
 * @returns 각 단계별 개별 시간으로 변환된 스텝 배열
 */
export const convertCumulativeToIndividualTimes = <T extends { time: number }>(
  steps: T[]
): T[] => {
  if (!steps || steps.length === 0) return steps;
  
  let previousTime = 0;
  
  return steps.map((step) => {
    // 현재 누적 시간에서 이전 누적 시간을 빼서 개별 시간 계산
    const individualTime = step.time - previousTime;
    previousTime = step.time;
    
    return {
      ...step,
      time: individualTime,
    };
  });
};

/**
 * 스마트 시간 변환: 데이터 형태를 자동 감지하여 적절히 처리
 * @param steps 레시피 스텝 배열
 * @returns 개별 시간으로 정규화된 스텝 배열
 */
export const smartTimeConversion = <T extends { time: number }>(
  steps: T[]
): { steps: T[]; wasCumulative: boolean } => {
  if (!steps || steps.length === 0) {
    return { steps, wasCumulative: false };
  }
  
  const wasCumulative = isCumulativeTimeData(steps);
  
  if (wasCumulative) {
    return {
      steps: convertCumulativeToIndividualTimes(steps),
      wasCumulative: true,
    };
  }
  
  return {
    steps,
    wasCumulative: false,
  };
};

/**
 * 로그 메시지를 타임스탬프와 함께 포맷팅
 * @param level 로그 레벨 ('info', 'warn', 'error', 'debug')
 * @param message 로그 메시지
 * @param data 추가 데이터 (선택사항)
 * @returns 포맷된 로그 문자열
 */
export const formatLogMessage = (
  level: keyof typeof LOG_LEVEL,
  message: string,
  data?: any
): string => {
  const timestamp = dayjs().tz(TIMEZONE).format(DATE_FORMAT.LOG);
  const levelUpper = level.toUpperCase().padEnd(5);
  const dataStr = data ? ` | ${JSON.stringify(data)}` : '';

  return `[${timestamp}] ${levelUpper} | ${message}${dataStr}`;
};
