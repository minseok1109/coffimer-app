import { useMemo } from 'react';
import { WaterInfo } from '../../lib/timer/types';

interface Recipe {
  steps?: {
    water: string;
  }[];
}

const WATER_AMOUNT_EXTRACTION_REGEX = /[^\d]/g;

export const useWaterCalculation = (recipe: Recipe | null, currentStep: number): WaterInfo => {
  const getTotalWaterUsed = useMemo(() => {
    if (!recipe?.steps) return 0;

    let total = 0;
    for (let i = 0; i <= currentStep && i < recipe.steps.length; i++) {
      const waterAmount = parseInt(recipe.steps[i].water.replace(WATER_AMOUNT_EXTRACTION_REGEX, ""));
      if (!isNaN(waterAmount)) {
        total += waterAmount;
      }
    }
    return total;
  }, [recipe?.steps, currentStep]);

  const getTotalWaterNeeded = useMemo(() => {
    if (!recipe?.steps) return 0;

    let total = 0;
    for (let i = 0; i < recipe.steps.length; i++) {
      const waterAmount = parseInt(recipe.steps[i].water.replace(WATER_AMOUNT_EXTRACTION_REGEX, ""));
      if (!isNaN(waterAmount)) {
        total += waterAmount;
      }
    }
    return total;
  }, [recipe?.steps]);

  const getRemainingWater = useMemo(() => {
    return getTotalWaterNeeded - getTotalWaterUsed;
  }, [getTotalWaterNeeded, getTotalWaterUsed]);

  return {
    totalUsed: getTotalWaterUsed,
    totalNeeded: getTotalWaterNeeded,
    remaining: getRemainingWater,
  };
};