import { Recipe } from "@/lib/recipes";
import { useCallback, useEffect, useState } from "react";

import { INITIAL_STEP, INITIAL_TIME, TIMER_INTERVAL_MS } from "../constants";
import { useNotification } from "./useNotification";

interface UseRecipeTimerReturn {
  currentTime: number;
  isRunning: boolean;
  currentStep: number;
  toggleTimer: () => void;
  resetTimer: () => void;
}

export const useRecipeTimer = (recipe: Recipe): UseRecipeTimerReturn => {
  const [currentTime, setCurrentTime] = useState(INITIAL_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(INITIAL_STEP);
  const { sendNotification, initializeAudio } = useNotification();

  // 레시피 변경 시 초기화
  useEffect(() => {
    setCurrentTime(INITIAL_TIME);
    setCurrentStep(INITIAL_STEP);
    setIsRunning(false);
  }, [recipe.id]);

  // 타이머 로직
  useEffect(() => {
    if (!isRunning || currentTime >= recipe.totalTime || !recipe.steps) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime((prevTime) => {
        const newTime = prevTime + 1;

        // 단계 완료 체크 및 알림
        const completedStep = recipe.steps?.find(
          (step) => step.time === newTime
        );
        if (completedStep) {
          sendNotification(
            `${completedStep.title} 완료`,
            `다음 단계를 진행하세요: ${completedStep.description}`
          );
        }

        // 현재 단계 업데이트 (시간 구간 기반)
        let newCurrentStep = 0;
        if (recipe.steps) {
          // 현재 시간이 넘어간 단계들의 개수를 계산
          const passedSteps = recipe.steps.filter(
            (step) => newTime > step.time
          ).length;
          // 마지막 단계를 넘지 않도록 제한
          newCurrentStep = Math.min(passedSteps, recipe.steps.length - 1);
        }

        if (newCurrentStep !== currentStep) {
          setCurrentStep(newCurrentStep);
        }

        return newTime;
      });
    }, TIMER_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isRunning, currentTime, recipe, currentStep, sendNotification]);

  const toggleTimer = useCallback(() => {
    // 타이머 시작 시 오디오 초기화
    if (!isRunning) {
      initializeAudio();
    }
    setIsRunning((prev) => !prev);
  }, [isRunning, initializeAudio]);

  const resetTimer = useCallback(() => {
    setCurrentTime(INITIAL_TIME);
    setIsRunning(false);
    setCurrentStep(INITIAL_STEP);
  }, []);

  return {
    currentTime,
    isRunning,
    currentStep,
    toggleTimer,
    resetTimer,
  };
};
