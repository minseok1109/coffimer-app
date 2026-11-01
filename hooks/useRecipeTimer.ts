import { useCallback, useEffect, useState } from 'react';

import { calculateActualTotalTime } from '@/lib/timer/formatters';
import type { RecipeWithSteps } from '@/types/recipe';
import { INITIAL_STEP, INITIAL_TIME, TIMER_INTERVAL_MS } from '../constants';
import { useAnalytics } from './useAnalytics';
import { useNotification } from './useNotification';

interface UseRecipeTimerReturn {
  currentTime: number;
  isRunning: boolean;
  isCompleted: boolean;
  totalTime: number;
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
    trackRecipeComplete,
  } = useAnalytics();
  const [hasStartedRecipe, setHasStartedRecipe] = useState(false);
  const steps = recipe.recipe_steps;
  const totalTime = calculateActualTotalTime(steps);
  const isCompleted = totalTime > 0 && currentTime >= totalTime;

  // 타이머 로직
  useEffect(() => {
    if (!isRunning) {
      return;
    }

    // One tick per render: side effects read the latest state directly.
    const timeout = setTimeout(() => {
      const newTime = currentTime + 1;

      // 현재 시간이 넘어간 단계 수 (마지막 단계를 넘지 않도록 제한)
      const passedSteps = steps.filter((step) => newTime > step.time).length;
      const newCurrentStep = Math.min(passedSteps, steps.length - 1);

      // 단계가 넘어갈 때 알림 발송 및 analytics 추적
      if (newCurrentStep > currentStep) {
        const completedStepIndex = newCurrentStep - 1;
        const completedStep = steps[completedStepIndex];
        sendNotification(
          `${completedStep.title} 완료`,
          `다음 단계를 진행하세요: ${completedStep.description}`
        );
        trackStepComplete(recipe.id, completedStepIndex, completedStep.time);
      }
      setCurrentStep(newCurrentStep);

      setCurrentTime(newTime);

      // 전체 시간에 도달하면 타이머를 멈추고 완료 처리
      if (totalTime > 0 && newTime >= totalTime) {
        setIsRunning(false);
        sendNotification('추출 완료', '모든 단계가 끝났습니다. 맛있게 즐기세요!');
        trackRecipeComplete(recipe.id, recipe.name, totalTime, 100);
      }
    }, TIMER_INTERVAL_MS);

    return () => clearTimeout(timeout);
  }, [
    isRunning,
    currentTime,
    recipe.id,
    recipe.name,
    steps,
    currentStep,
    totalTime,
    sendNotification,
    trackStepComplete,
    trackRecipeComplete,
  ]);

  const resetTimer = useCallback(() => {
    setCurrentTime(INITIAL_TIME);
    setIsRunning(false);
    setCurrentStep(INITIAL_STEP);
  }, []);

  const toggleTimer = useCallback(() => {
    if (isRunning) {
      trackTimerPause(recipe.id, currentTime, currentStep);
      setIsRunning(false);
      return;
    }

    // 타이머 시작 시 오디오 초기화
    initializeAudio();
    if (isCompleted) {
      // 완료 후 다시 시작하면 처음부터 새로 추출한다.
      resetTimer();
    }
    if (isCompleted || !hasStartedRecipe) {
      trackRecipeStart(recipe.id, recipe.name, totalTime);
      setHasStartedRecipe(true);
    } else {
      trackTimerResume(recipe.id, currentTime, currentStep);
    }
    setIsRunning(true);
  }, [
    isRunning,
    isCompleted,
    initializeAudio,
    hasStartedRecipe,
    recipe,
    resetTimer,
    totalTime,
    currentTime,
    currentStep,
    trackRecipeStart,
    trackTimerPause,
    trackTimerResume,
  ]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 0) {
      const previousStep = currentStep - 1;
      const previousStepTime =
        previousStep === 0 ? 0 : steps[previousStep - 1].time;
      setCurrentStep(previousStep);
      setCurrentTime(previousStepTime);
    }
  }, [currentStep, steps]);

  const goToNextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      const nextStepTime = steps[nextStep - 1].time;
      setCurrentStep(nextStep);
      setCurrentTime(nextStepTime);
    }
  }, [currentStep, steps]);

  return {
    currentTime,
    isRunning,
    isCompleted,
    totalTime,
    currentStep,
    toggleTimer,
    resetTimer,
    goToPreviousStep,
    goToNextStep,
  };
};
