import { useMemo } from 'react';
import type { RecipeWithSteps } from '@/types/recipe';
import type { NextStepInfo, StepInfo } from '@/types/timer';

export const useStepInfo = (
  recipe: RecipeWithSteps | null,
  currentStep: number,
  currentTime: number
) => {
  const currentStepInfo = useMemo((): StepInfo | null => {
    if (!recipe?.recipe_steps || recipe.recipe_steps.length === 0) {
      return null;
    }

    const step = recipe.recipe_steps[currentStep];
    // 현재 단계의 시작 시간 계산 (누적시간 방식)
    const stepStartTime =
      currentStep === 0 ? 0 : recipe.recipe_steps[currentStep - 1].time;
    // 현재 단계의 끝 시간 계산 (누적시간)
    const stepEndTime = step.time;

    // 현재 단계의 지속시간
    const stepDuration = stepEndTime - stepStartTime;

    // 현재 단계 내에서의 진행 시간 (전체 시간 기준)
    const stepCurrentTime = Math.max(0, currentTime - stepStartTime);
    const progress =
      stepDuration > 0
        ? Math.min((stepCurrentTime / stepDuration) * 100, 100)
        : 0;

    // 전체 진행률 계산
    const totalProgress =
      recipe.total_time > 0
        ? Math.min((currentTime / recipe.total_time) * 100, 100)
        : 0;

    return {
      step,
      progress,
      totalProgress,
      stepNumber: currentStep + 1,
      totalSteps: recipe.recipe_steps.length,
      stepStartTime,
      stepEndTime,
      stepCurrentTime,
    };
  }, [recipe, currentStep, currentTime]);

  const nextStepInfo = useMemo((): NextStepInfo | null => {
    if (
      !recipe?.recipe_steps ||
      currentStep >= recipe.recipe_steps.length - 1
    ) {
      return null;
    }

    const nextStep = recipe.recipe_steps[currentStep + 1];
    return {
      step: nextStep,
      stepNumber: currentStep + 2,
      totalSteps: recipe.recipe_steps.length,
    };
  }, [recipe?.recipe_steps, currentStep]);

  return { currentStepInfo, nextStepInfo };
};
