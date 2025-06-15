import { useMemo } from "react";
import { NextStepInfo, StepInfo } from "../../lib/timer/types";

interface Recipe {
  steps?: {
    title: string;
    water: string;
    time: number;
    description?: string;
  }[];
  totalTime: number;
}

export const useStepInfo = (
  recipe: Recipe | null,
  currentStep: number,
  currentTime: number
): { currentStepInfo: StepInfo | null; nextStepInfo: NextStepInfo | null } => {
  console.log("🚀 ~ recipe:", recipe);
  const currentStepInfo = useMemo((): StepInfo | null => {
    if (!recipe?.steps || recipe.steps.length === 0) {
      return null;
    }

    const step = recipe.steps[currentStep];
    console.log("🚀 ~ currentStepInfo ~ step:", step);

    // 현재 단계의 시작 시간 계산 (누적시간 방식)
    const stepStartTime =
      currentStep === 0 ? 0 : recipe.steps[currentStep - 1].time;
    console.log("🚀 ~ currentStepInfo ~ stepStartTime:", stepStartTime);

    // 현재 단계의 끝 시간 계산 (누적시간)
    const stepEndTime = step.time;

    // 현재 단계의 지속시간
    const stepDuration = stepEndTime - stepStartTime;

    // 현재 단계 내에서의 진행 시간 (전체 시간 기준)
    const stepCurrentTime = Math.max(0, currentTime - stepStartTime);
    const progress =
      stepDuration > 0 ? Math.min((stepCurrentTime / stepDuration) * 100, 100) : 0;

    // 전체 진행률 계산
    const totalProgress =
      recipe.totalTime > 0
        ? Math.min((currentTime / recipe.totalTime) * 100, 100)
        : 0;

    return {
      step,
      progress,
      totalProgress,
      stepNumber: currentStep + 1,
      totalSteps: recipe.steps.length,
      stepStartTime,
      stepEndTime,
      stepCurrentTime,
    };
  }, [recipe, currentStep, currentTime]);

  const nextStepInfo = useMemo((): NextStepInfo | null => {
    if (!recipe?.steps || currentStep >= recipe.steps.length - 1) {
      return null;
    }

    const nextStep = recipe.steps[currentStep + 1];
    return {
      step: nextStep,
      stepNumber: currentStep + 2,
      totalSteps: recipe.steps.length,
    };
  }, [recipe?.steps, currentStep]);

  return { currentStepInfo, nextStepInfo };
};
