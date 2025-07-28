import { useCallback, useEffect, useState } from 'react';

import type { RecipeWithSteps } from '@/types/recipe';
import { INITIAL_STEP, INITIAL_TIME, TIMER_INTERVAL_MS } from '../constants';
import { useAnalytics } from './useAnalytics';
import { useNotification } from './useNotification';

interface UseRecipeTimerReturn {
  currentTime: number;
  isRunning: boolean;
  currentStep: number;
  toggleTimer: () => void;
  resetTimer: () => void;
  goToPreviousStep: () => void;
  goToNextStep: () => void;
}

export const useRecipeTimer = (
  recipe: RecipeWithSteps
): UseRecipeTimerReturn => {
  const [currentTime, setCurrentTime] = useState(INITIAL_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(INITIAL_STEP);
  const { sendNotification, initializeAudio } = useNotification();
  const {
    trackRecipeStart,
    trackTimerPause,
    trackTimerResume,
    trackStepComplete,
  } = useAnalytics();
  const [hasStartedRecipe, setHasStartedRecipe] = useState(false);

  // 레시피 변경 시 초기화
  useEffect(() => {
    setCurrentTime(INITIAL_TIME);
    setCurrentStep(INITIAL_STEP);
    setIsRunning(false);
    setHasStartedRecipe(false);
  }, [recipe.id]);

  // 타이머 로직
  useEffect(() => {
    if (!(isRunning && recipe.recipe_steps)) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime((prevTime) => {
        const newTime = prevTime + 1;

        // 현재 단계 업데이트 (시간 구간 기반)
        let newCurrentStep = 0;
        if (recipe.recipe_steps) {
          // 현재 시간이 넘어간 단계들의 개수를 계산
          const passedSteps = recipe.recipe_steps.filter(
            (step) => newTime > step.time
          ).length;
          // 마지막 단계를 넘지 않도록 제한
          newCurrentStep = Math.min(
            passedSteps,
            recipe.recipe_steps.length - 1
          );
        }

        // 단계가 변경될 때 알림 발송 및 analytics 추적
        if (newCurrentStep !== currentStep && recipe.recipe_steps) {
          const completedStepIndex =
            newCurrentStep > 0 ? newCurrentStep - 1 : 0;
          const completedStep = recipe.recipe_steps[completedStepIndex];

          if (completedStep && newCurrentStep > currentStep) {
            sendNotification(
              `${completedStep.title} 완료`,
              `다음 단계를 진행하세요: ${completedStep.description}`
            );

            // Track step completion - use time as step duration
            const stepDuration = completedStep.time || 0;
            trackStepComplete(recipe.id, completedStepIndex, stepDuration);
          }

          setCurrentStep(newCurrentStep);
        }

        return newTime;
      });
    }, TIMER_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isRunning, currentTime, recipe, currentStep, sendNotification]);

  const toggleTimer = useCallback(() => {
    // 타이머 시작 시 오디오 초기화
    if (isRunning) {
      // Track pause
      trackTimerPause(recipe.id, currentTime, currentStep);
    } else {
      initializeAudio();

      // Track recipe start (only on first start)
      if (hasStartedRecipe) {
        // Track resume
        trackTimerResume(recipe.id, currentTime, currentStep);
      } else {
        trackRecipeStart(recipe.id, recipe.name, recipe.total_time || 0);
        setHasStartedRecipe(true);
      }
    }
    setIsRunning((prev) => !prev);
  }, [
    isRunning,
    initializeAudio,
    hasStartedRecipe,
    recipe,
    currentTime,
    currentStep,
    trackRecipeStart,
    trackTimerPause,
    trackTimerResume,
  ]);

  const resetTimer = useCallback(() => {
    setCurrentTime(INITIAL_TIME);
    setIsRunning(false);
    setCurrentStep(INITIAL_STEP);
  }, []);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 0 && recipe.recipe_steps) {
      const previousStep = currentStep - 1;
      const previousStepTime =
        previousStep === 0 ? 0 : recipe.recipe_steps[previousStep - 1].time;
      setCurrentStep(previousStep);
      setCurrentTime(previousStepTime);
    }
  }, [currentStep, recipe.recipe_steps]);

  const goToNextStep = useCallback(() => {
    if (recipe.recipe_steps && currentStep < recipe.recipe_steps.length - 1) {
      const nextStep = currentStep + 1;
      const nextStepTime = recipe.recipe_steps[nextStep - 1].time;
      setCurrentStep(nextStep);
      setCurrentTime(nextStepTime);
    }
  }, [currentStep, recipe.recipe_steps]);

  return {
    currentTime,
    isRunning,
    currentStep,
    toggleTimer,
    resetTimer,
    goToPreviousStep,
    goToNextStep,
  };
};
