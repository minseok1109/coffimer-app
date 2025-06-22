import { RecipeService } from "@/services/recipeService";
import { Recipe } from "@/types/recipe";
import { useQuery } from "@tanstack/react-query";

export const recipeKeys = {
  all: ["recipes"] as const,
  lists: () => [...recipeKeys.all, "list"] as const,
  list: (filters: {
    includeSteps?: boolean;
    dripper?: string;
    search?: string;
  }) => [...recipeKeys.lists(), filters] as const,
  details: () => [...recipeKeys.all, "detail"] as const,
  detail: (id: string) => [...recipeKeys.details(), id] as const,
  drippers: () => [...recipeKeys.all, "drippers"] as const,
};

// 특정 레시피 조회
export const useRecipe = (recipeId: string) => {
  return useQuery<Recipe, Error>({
    queryKey: recipeKeys.detail(recipeId),
    queryFn: () => RecipeService.getRecipeById(recipeId),
    enabled: !!recipeId,
  });
};

// 모든 레시피 조회
export const useRecipes = (includeSteps: boolean = false) => {
  return useQuery({
    queryKey: recipeKeys.list({ includeSteps }),
    queryFn: () => RecipeService.getAllRecipes(includeSteps),
  });
};
