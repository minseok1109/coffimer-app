import { useQuery } from '@tanstack/react-query';
import type { FilterState } from '@/constants/filterConstants';
import { RecipeService } from '@/services/recipeService';
import type { Recipe, RecipeFilterOptions, RecipeWithSteps } from '@/types/recipe';
import { useDebounce } from './useDebounce';

export const filteredRecipeKeys = {
  all: ['filtered-recipes'] as const,
  lists: () => [...filteredRecipeKeys.all, 'list'] as const,
  list: (filters: FilterState, includeSteps = false) =>
    [...filteredRecipeKeys.lists(), filters, includeSteps] as const,
  filterOptions: () => [...filteredRecipeKeys.all, 'filter-options'] as const,
};

// 필터링된 레시피 조회 (debounced)
export const useFilteredRecipes = (
  filters: FilterState,
  includeSteps = false
) => {
  const debouncedFilters = useDebounce(filters, 300);

  return useQuery<Recipe[] | RecipeWithSteps[], Error>({
    queryKey: filteredRecipeKeys.list(debouncedFilters, includeSteps),
    queryFn: () =>
      RecipeService.getFilteredRecipes(debouncedFilters, includeSteps),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
};

// 필터 옵션 일괄 조회 (드리퍼/필터/추출타입 — 단일 RPC)
export const useFilterOptions = () => {
  return useQuery<RecipeFilterOptions, Error>({
    queryKey: filteredRecipeKeys.filterOptions(),
    queryFn: () => RecipeService.getFilterOptions(),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
};
