import { useQuery } from '@tanstack/react-query';
import { RecipeAPI } from '@/lib/api/recipes';
import { RecipeService } from '@/services/recipeService';
import type { Recipe, RecipeWithSteps } from '@/types/recipe';

export const recipeKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipeKeys.all, 'list'] as const,
  list: (filters: {
    includeSteps?: boolean;
    dripper?: string;
    search?: string;
  }) => [...recipeKeys.lists(), filters] as const,
  details: () => [...recipeKeys.all, 'detail'] as const,
  detail: (id: string) => [...recipeKeys.details(), id] as const,
  userRecipes: (userId: string) => [...recipeKeys.all, 'user', userId] as const,
};

// 특정 레시피 조회 (단계 포함)
export const useRecipe = (recipeId: string) => {
  return useQuery<RecipeWithSteps, Error>({
    queryKey: recipeKeys.detail(recipeId),
    queryFn: () => RecipeService.getRecipeById(recipeId),
    enabled: !!recipeId,
  });
};

// 모든 레시피 조회
export const useRecipes = (includeSteps = false) => {
  return useQuery<Recipe[] | RecipeWithSteps[], Error>({
    queryKey: recipeKeys.list({ includeSteps }),
    queryFn: () => RecipeService.getAllRecipes(includeSteps),
  });
};

// 레시피 검색
export const useSearchRecipes = (searchTerm: string, includeSteps = false) => {
  return useQuery<Recipe[] | RecipeWithSteps[], Error>({
    queryKey: recipeKeys.list({ search: searchTerm, includeSteps }),
    queryFn: () => RecipeService.searchRecipes(searchTerm, includeSteps),
    enabled: !!searchTerm.trim(),
  });
};

// 드리퍼별 레시피 조회
export const useRecipesByDripper = (dripper: string) => {
  return useQuery<Recipe[], Error>({
    queryKey: recipeKeys.list({ dripper }),
    queryFn: () => RecipeService.getRecipesByDripper(dripper),
    enabled: !!dripper,
  });
};

// 사용자의 레시피 목록 조회
export const useUserRecipes = (userId: string) => {
  return useQuery<RecipeWithSteps[], Error>({
    queryKey: recipeKeys.userRecipes(userId),
    queryFn: () => RecipeAPI.getUserRecipes(userId),
    enabled: !!userId,
  });
};
