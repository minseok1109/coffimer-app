import {
  estimateMicronsFromClicks,
  getAllGrinders,
  safeParseInt,
} from "@/lib/grinders";
import { useMemo } from "react";

interface ConversionResult {
  value: string | null;
  error: string | null;
  warning: string | null;
}

export const useGrindSizeConversion = (
  grinderId: string | undefined,
  clicks: string | undefined
): ConversionResult => {
  const grinders = useMemo(() => getAllGrinders(), []);

  return useMemo((): ConversionResult => {
    if (!grinderId || !clicks) {
      return { value: null, error: null, warning: null };
    }

    const parsedClicks = safeParseInt(clicks);
    if (parsedClicks === null) {
      return {
        value: null,
        error: "올바른 숫자를 입력해주세요",
        warning: null,
      };
    }

    const grinder = grinders.find((g) => g.id === grinderId);
    if (!grinder) {
      return {
        value: null,
        error: "그라인더 정보를 찾을 수 없습니다",
        warning: null,
      };
    }

    // 범위 체크 및 경고
    let warning: string | null = null;
    if (
      parsedClicks < grinder.clickRange.min ||
      parsedClicks > grinder.clickRange.max
    ) {
      warning = `권장 범위: ${grinder.clickRange.min}-${grinder.clickRange.max}클릭`;
    }

    const estimated = estimateMicronsFromClicks(grinderId, parsedClicks);
    if (estimated === null) {
      return {
        value: null,
        error: "변환 중 오류가 발생했습니다",
        warning,
      };
    }

    return {
      value: `약 ${estimated}μm`,
      error: null,
      warning,
    };
  }, [grinderId, clicks, grinders]);
};
