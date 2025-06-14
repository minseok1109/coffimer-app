export interface StepInfo {
  step: {
    title: string;
    water: string;
    time: number;
    description?: string;
  };
  progress: number;
  totalProgress: number;
  stepNumber: number;
  totalSteps: number;
  stepStartTime: number;
  stepEndTime: number;
  stepCurrentTime: number;
}

export interface NextStepInfo {
  step: {
    title: string;
    water: string;
    time: number;
    description?: string;
  };
  stepNumber: number;
  totalSteps: number;
}

export interface TimerDisplayData {
  minutes: string;
  seconds: string;
}

export interface WaterInfo {
  totalUsed: number;
  totalNeeded: number;
  remaining: number;
}