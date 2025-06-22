import { RecipeStep } from "./recipe";

export interface StepInfo {
  step: RecipeStep;
  progress: number;
  totalProgress: number;
  stepNumber: number;
  totalSteps: number;
  stepStartTime: number;
  stepEndTime: number;
  stepCurrentTime: number;
}

export interface NextStepInfo {
  step: RecipeStep;
  stepNumber: number;
  totalSteps: number;
}
