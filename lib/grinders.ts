export interface GrinderInfo {
  id: string;
  name: string;
  displayName: string;
  type: "manual" | "electric";
  clickRange: {
    min: number;
    max: number;
  };
  micronRange: {
    min: number;
    max: number;
  };
  recommendedClicks?: {
    pourover: number;
    espresso: number;
    french_press: number;
  };
  description?: string;
  // 비선형 보정을 위한 계수들
  conversionProfile?: {
    // 실제 테스트 데이터 기반 보정 계수
    correctionFactor: number;
    // 곡선 특성을 나타내는 지수 (1.0 = 선형, >1.0 = 로그형, <1.0 = 지수형)
    curveFactor: number;
    // 알려진 참조 포인트들 (클릭 -> 마이크론)
    referencePoints?: { clicks: number; microns: number }[];
  };
}

export const grinders: GrinderInfo[] = [
  {
    id: "comandante_c40",
    name: "comandante_c40",
    displayName: "코만단테 C40",
    type: "manual",
    clickRange: {
      min: 0,
      max: 40,
    },
    micronRange: {
      min: 200,
      max: 1000,
    },
    recommendedClicks: {
      pourover: 25,
      espresso: 8,
      french_press: 35,
    },
    description: "독일제 수동 그라인더, 정밀한 분쇄 조절이 가능합니다.",
    conversionProfile: {
      correctionFactor: 0.95, // 실제보다 약간 굵게 나오는 경향
      curveFactor: 1.2, // 로그 곡선 특성 (세밀한 조절이 가능한 부분이 더 넓음)
      referencePoints: [
        { clicks: 8, microns: 250 },
        { clicks: 25, microns: 600 },
        { clicks: 35, microns: 900 },
      ],
    },
  },
  {
    id: "ek43s",
    name: "ek43s",
    displayName: "말코닉 EK43s",
    type: "electric",
    clickRange: {
      min: 1,
      max: 11,
    },
    micronRange: {
      min: 300,
      max: 1200,
    },
    recommendedClicks: {
      pourover: 7,
      espresso: 2,
      french_press: 9,
    },
    description: "프로용 전동 그라인더, 카페에서 많이 사용되는 모델입니다.",
    conversionProfile: {
      correctionFactor: 1.05, // 비교적 정확한 변환
      curveFactor: 1.0, // 선형에 가까운 특성
      referencePoints: [
        { clicks: 2, microns: 400 },
        { clicks: 7, microns: 750 },
        { clicks: 9, microns: 1000 },
      ],
    },
  },
  {
    id: "fellow_ode2",
    name: "fellow_ode2",
    displayName: "펠로우 오드 2세대",
    type: "electric",
    clickRange: {
      min: 1,
      max: 11,
    },
    micronRange: {
      min: 250,
      max: 900,
    },
    recommendedClicks: {
      pourover: 6,
      espresso: 2,
      french_press: 9,
    },
    description: "가정용 전동 그라인더, 핸드드립에 최적화된 모델입니다.",
    conversionProfile: {
      correctionFactor: 0.98, // 약간 보정 필요
      curveFactor: 1.1, // 약간의 곡선 특성
      referencePoints: [
        { clicks: 2, microns: 300 },
        { clicks: 6, microns: 550 },
        { clicks: 9, microns: 800 },
      ],
    },
  },
];

export const getGrinderById = (id: string): GrinderInfo | undefined => {
  return grinders.find((grinder) => grinder.id === id);
};

export const getGrinderByName = (name: string): GrinderInfo | undefined => {
  return grinders.find((grinder) => grinder.name === name);
};

export const getAllGrinders = (): GrinderInfo[] => {
  return grinders;
};
/**
 * 안전한 숫자 변환 유틸리티
 */
export const safeParseInt = (value: string): number | null => {
  if (!value || value.trim() === "") return null;
  const parsed = Number.parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
};

export const safeParseFloat = (value: string): number | null => {
  if (!value || value.trim() === "") return null;
  const parsed = Number.parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

/**
 * 참조 포인트를 사용한 선형 보간
 */
const interpolateFromReferencePoints = (
  clicks: number,
  referencePoints: { clicks: number; microns: number }[]
): number => {
  // 정렬된 참조 포인트 준비
  const sortedPoints = referencePoints.sort((a, b) => a.clicks - b.clicks);

  // 범위 밖의 경우 가장 가까운 값 반환
  if (clicks <= sortedPoints[0].clicks) {
    return sortedPoints[0].microns;
  }
  if (clicks >= sortedPoints[sortedPoints.length - 1].clicks) {
    return sortedPoints[sortedPoints.length - 1].microns;
  }

  // 적절한 구간 찾기
  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const p1 = sortedPoints[i];
    const p2 = sortedPoints[i + 1];

    if (clicks >= p1.clicks && clicks <= p2.clicks) {
      const ratio = (clicks - p1.clicks) / (p2.clicks - p1.clicks);
      return p1.microns + (p2.microns - p1.microns) * ratio;
    }
  }

  return sortedPoints[0].microns; // 기본값
};

/**
 * 그라인더별 클릭수를 마이크론으로 변환하는 개선된 계산
 * @param grinderId 그라인더 ID
 * @param clicks 클릭 수
 * @returns 예상 마이크론 값 또는 null (실패 시)
 */
export const estimateMicronsFromClicks = (
  grinderId: string,
  clicks: number
): number | null => {
  try {
    const grinder = getGrinderById(grinderId);
    if (!grinder) {
      console.warn(`Grinder not found: ${grinderId}`);
      return null;
    }

    const { clickRange, micronRange, conversionProfile } = grinder;

    // 클릭 수가 범위를 벗어나는 경우 경고
    if (clicks < clickRange.min || clicks > clickRange.max) {
      console.warn(
        `Clicks ${clicks} out of range for ${grinder.displayName}: ${clickRange.min}-${clickRange.max}`
      );
    }

    // 클램핑하여 범위 내 값으로 조정
    const clampedClicks = Math.max(
      clickRange.min,
      Math.min(clickRange.max, clicks)
    );

    let estimatedMicrons: number;

    // 변환 프로필이 있고 참조 포인트가 있는 경우
    if (
      conversionProfile?.referencePoints &&
      conversionProfile.referencePoints.length >= 2
    ) {
      estimatedMicrons = interpolateFromReferencePoints(
        clampedClicks,
        conversionProfile.referencePoints
      );
    } else {
      // 기본 선형 보간
      const clickRatio =
        (clampedClicks - clickRange.min) / (clickRange.max - clickRange.min);
      estimatedMicrons =
        micronRange.min + (micronRange.max - micronRange.min) * clickRatio;
    }

    // 곡선 보정 적용
    if (
      conversionProfile?.curveFactor &&
      conversionProfile.curveFactor !== 1.0
    ) {
      const normalizedRatio =
        (clampedClicks - clickRange.min) / (clickRange.max - clickRange.min);
      const curvedRatio = normalizedRatio ** conversionProfile.curveFactor;
      estimatedMicrons =
        micronRange.min + (micronRange.max - micronRange.min) * curvedRatio;
    }

    // 보정 계수 적용
    if (conversionProfile?.correctionFactor) {
      estimatedMicrons *= conversionProfile.correctionFactor;
    }

    return Math.round(estimatedMicrons);
  } catch (error) {
    console.error(`Error estimating microns from clicks: ${error}`);
    return null;
  }
};

/**
 * 마이크론을 그라인더별 클릭수로 변환하는 대략적인 계산
 * @param grinderId 그라인더 ID
 * @param microns 마이크론 값
 * @returns 예상 클릭 수 또는 null (실패 시)
 */
export const estimateClicksFromMicrons = (
  grinderId: string,
  microns: number
): number | null => {
  try {
    const grinder = getGrinderById(grinderId);
    if (!grinder) {
      console.warn(`Grinder not found: ${grinderId}`);
      return null;
    }

    const { clickRange, micronRange } = grinder;

    // 마이크론 값이 범위를 벗어나는 경우 경고
    if (microns < micronRange.min || microns > micronRange.max) {
      console.warn(
        `Microns ${microns} out of range for ${grinder.displayName}: ${micronRange.min}-${micronRange.max}`
      );
    }

    // 클램핑하여 범위 내 값으로 조정
    const clampedMicrons = Math.max(
      micronRange.min,
      Math.min(micronRange.max, microns)
    );
    const micronRatio =
      (clampedMicrons - micronRange.min) / (micronRange.max - micronRange.min);
    const estimatedClicks =
      clickRange.min + (clickRange.max - clickRange.min) * micronRatio;

    return Math.round(estimatedClicks);
  } catch (error) {
    console.error(`Error estimating clicks from microns: ${error}`);
    return null;
  }
};
