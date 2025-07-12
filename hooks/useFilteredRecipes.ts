import { useQuery } from "@tanstack/react-query";
import { RecipeService } from "@/services/recipeService";
import { FilterState } from "@/constants/filterConstants";
import { Recipe, RecipeWithSteps } from "@/types/recipe";
import { useDebounce } from "./useDebounce";

export const filteredRecipeKeys = {
  all: ["filtered-recipes"] as const,
  lists: () => [...filteredRecipeKeys.all, "list"] as const,
  list: (filters: FilterState, includeSteps: boolean = false) => 
    [...filteredRecipeKeys.lists(), filters, includeSteps] as const,
};

// 필터링된 레시피 조회 (debounced)
export const useFilteredRecipes = (
  filters: FilterState,
  includeSteps: boolean = false
) => {
  const debouncedFilters = useDebounce(filters, 300); // 300ms 지연
  
  return useQuery<Recipe[] | RecipeWithSteps[], Error>({
    queryKey: filteredRecipeKeys.list(debouncedFilters, includeSteps),
    queryFn: () => RecipeService.getFilteredRecipes(debouncedFilters, includeSteps),
    enabled: true, // 항상 활성화
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
    placeholderData: (previousData) => previousData, // 이전 데이터 유지
  });
};

// 사용 가능한 필터 옵션들 조회
export const useAvailableFilters = () => {
  return useQuery<string[], Error>({
    queryKey: ["available-filters"],
    queryFn: () => RecipeService.getAvailableFilters(),
    staleTime: 30 * 60 * 1000, // 30분간 fresh
    gcTime: 60 * 60 * 1000, // 1시간 캐시 유지
  });
};

export const useAvailableDrippers = () => {
  return useQuery<string[], Error>({
    queryKey: ["available-drippers"],
    queryFn: () => RecipeService.getAvailableDrippers(),
    staleTime: 30 * 60 * 1000, // 30분간 fresh
    gcTime: 60 * 60 * 1000, // 1시간 캐시 유지
  });
};

export const useAvailableBrewingTypes = () => {
  return useQuery<string[], Error>({
    queryKey: ["available-brewing-types"],
    queryFn: () => RecipeService.getAvailableBrewingTypes(),
    staleTime: 30 * 60 * 1000, // 30분간 fresh
    gcTime: 60 * 60 * 1000, // 1시간 캐시 유지
  });
};