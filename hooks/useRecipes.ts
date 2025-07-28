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
  drippers: () => [...recipeKeys.all, 'drippers'] as const,
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

// 사용 가능한 드리퍼 목록 조회
export const useAvailableDrippers = () => {
  return useQuery<string[], Error>({
    queryKey: recipeKeys.drippers(),
    queryFn: () => RecipeService.getAvailableDrippers(),
  });
};

// 페이지네이션된 레시피 조회
export const useRecipesPaginated = (
  page = 0,
  pageSize = 10,
  includeSteps = false
) => {
  return useQuery({
    queryKey: [
      ...recipeKeys.lists(),
      'paginated',
      page,
      pageSize,
      includeSteps,
    ],
    queryFn: () =>
      RecipeService.getRecipesPaginated(page, pageSize, includeSteps),
  });
};
