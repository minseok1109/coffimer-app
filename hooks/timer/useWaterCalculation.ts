import { useMemo } from 'react';
import type { RecipeWithSteps } from '@/types/recipe';
import type { WaterInfo } from '../../lib/timer/types';

const WATER_AMOUNT_EXTRACTION_REGEX = /[^\d]/g;

export const useWaterCalculation = (
  recipe: RecipeWithSteps | null,
  currentStep: number
): WaterInfo => {
  const getTotalWaterUsed = useMemo(() => {
    if (!recipe?.recipe_steps) return 0;

    let total = 0;
    for (let i = 0; i <= currentStep && i < recipe.recipe_steps.length; i++) {
      const waterAmount = Number.parseInt(
        recipe.recipe_steps[i].water
          .toString()
          .replace(WATER_AMOUNT_EXTRACTION_REGEX, '')
      );
      if (!isNaN(waterAmount)) {
        total += waterAmount;
      }
    }
    return total;
  }, [recipe?.recipe_steps, currentStep]);

  const getTotalWaterNeeded = useMemo(() => {
    if (!recipe?.recipe_steps) return 0;

    let total = 0;
    for (let i = 0; i < recipe.recipe_steps.length; i++) {
      const waterAmount = Number.parseInt(
        recipe.recipe_steps[i].water
          .toString()
          .replace(WATER_AMOUNT_EXTRACTION_REGEX, '')
      );
      if (!isNaN(waterAmount)) {
        total += waterAmount;
      }
    }
    return total;
  }, [recipe?.recipe_steps]);

  const getRemainingWater = useMemo(() => {
    return getTotalWaterNeeded - getTotalWaterUsed;
  }, [getTotalWaterNeeded, getTotalWaterUsed]);

  return {
    totalUsed: getTotalWaterUsed,
    totalNeeded: getTotalWaterNeeded,
    remaining: getRemainingWater,
  };
};
