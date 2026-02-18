import { useMemo } from 'react';
import type { RecipeWithSteps } from '@/types/recipe';
import type { WaterInfo } from '../../lib/timer/types';

const NON_DIGIT_REGEX = /[^\d]/g;

function parseWaterAmount(water: number | null | undefined): number {
  const parsed = Number.parseInt(
    (water ?? 0).toString().replace(NON_DIGIT_REGEX, ''),
    10,
  );
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sumWater(steps: RecipeWithSteps['recipe_steps'], endIndex: number): number {
  let total = 0;
  for (let i = 0; i <= endIndex && i < steps.length; i++) {
    total += parseWaterAmount(steps[i].water);
  }
  return total;
}

export const useWaterCalculation = (
  recipe: RecipeWithSteps | null,
  currentStep: number,
): WaterInfo => {
  const totalUsed = useMemo(() => {
    if (!recipe?.recipe_steps) return 0;
    return sumWater(recipe.recipe_steps, currentStep);
  }, [recipe?.recipe_steps, currentStep]);

  const totalNeeded = useMemo(() => {
    if (!recipe?.recipe_steps) return 0;
    return sumWater(recipe.recipe_steps, recipe.recipe_steps.length - 1);
  }, [recipe?.recipe_steps]);

  const remaining = totalNeeded - totalUsed;

  return { totalUsed, totalNeeded, remaining };
};
