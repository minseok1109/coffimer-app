import { TimerDisplayData } from './types';

export const formatTime = (totalTime: number): string => {
  const minutes = Math.floor(totalTime / 60);
  const seconds = totalTime % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

export const formatTimerDisplay = (time: number): TimerDisplayData => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return {
    minutes: minutes.toString().padStart(2, "0"),
    seconds: seconds.toString().padStart(2, "0"),
  };
};