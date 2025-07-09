import { FavoritesAPI } from "@/lib/api/favorites";
import { RecipeWithSteps } from "@/types/recipe";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const favoriteKeys = {
  all: ["favorites"] as const,
  lists: () => [...favoriteKeys.all, "list"] as const,
  recipes: (userId: string) => [...favoriteKeys.lists(), "recipes", userId] as const,
  ids: (userId: string) => [...favoriteKeys.lists(), "ids", userId] as const,
  status: (userId: string, recipeId: string) => 
    [...favoriteKeys.all, "status", userId, recipeId] as const,
  count: (userId: string) => [...favoriteKeys.all, "count", userId] as const,
};

// 즐겨찾기 레시피 목록 조회
export const useFavoriteRecipes = (userId: string) => {
  return useQuery<RecipeWithSteps[], Error>({
    queryKey: favoriteKeys.recipes(userId),
    queryFn: () => FavoritesAPI.getFavoriteRecipes(userId),
    enabled: !!userId,
  });
};

// 즐겨찾기 레시피 ID 목록 조회
export const useFavoriteRecipeIds = (userId: string) => {
  return useQuery<string[], Error>({
    queryKey: favoriteKeys.ids(userId),
    queryFn: () => FavoritesAPI.getFavoriteRecipeIds(userId),
    enabled: !!userId,
  });
};

// 특정 레시피의 즐겨찾기 상태 확인
export const useFavoriteStatus = (userId: string, recipeId: string) => {
  return useQuery<boolean, Error>({
    queryKey: favoriteKeys.status(userId, recipeId),
    queryFn: () => FavoritesAPI.checkFavoriteStatus(userId, recipeId),
    enabled: !!userId && !!recipeId,
  });
};

// 즐겨찾기 개수 조회
export const useFavoriteCount = (userId: string) => {
  return useQuery<number, Error>({
    queryKey: favoriteKeys.count(userId),
    queryFn: () => FavoritesAPI.getFavoriteCount(userId),
    enabled: !!userId,
  });
};

// 즐겨찾기 토글 mutation
export const useFavoriteToggle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, recipeId }: { userId: string; recipeId: string }) =>
      FavoritesAPI.toggleFavorite(userId, recipeId),
    onMutate: async ({ userId, recipeId }) => {
      // 낙관적 업데이트를 위해 쿼리 취소
      await queryClient.cancelQueries({
        queryKey: favoriteKeys.status(userId, recipeId),
      });
      await queryClient.cancelQueries({
        queryKey: favoriteKeys.ids(userId),
      });
      await queryClient.cancelQueries({
        queryKey: favoriteKeys.recipes(userId),
      });

      // 이전 상태 백업
      const previousStatus = queryClient.getQueryData<boolean>(
        favoriteKeys.status(userId, recipeId)
      );
      const previousIds = queryClient.getQueryData<string[]>(
        favoriteKeys.ids(userId)
      );

      // 낙관적 업데이트
      const newStatus = !previousStatus;
      queryClient.setQueryData(favoriteKeys.status(userId, recipeId), newStatus);

      if (previousIds) {
        const newIds = newStatus
          ? [...previousIds, recipeId]
          : previousIds.filter(id => id !== recipeId);
        queryClient.setQueryData(favoriteKeys.ids(userId), newIds);
      }

      return { previousStatus, previousIds };
    },
    onError: (err, { userId, recipeId }, context) => {
      // 에러 시 이전 상태로 롤백
      if (context?.previousStatus !== undefined) {
        queryClient.setQueryData(
          favoriteKeys.status(userId, recipeId),
          context.previousStatus
        );
      }
      if (context?.previousIds) {
        queryClient.setQueryData(favoriteKeys.ids(userId), context.previousIds);
      }
    },
    onSettled: (data, error, { userId, recipeId }) => {
      // 최종적으로 관련 쿼리들 다시 가져오기
      queryClient.invalidateQueries({
        queryKey: favoriteKeys.status(userId, recipeId),
      });
      queryClient.invalidateQueries({
        queryKey: favoriteKeys.ids(userId),
      });
      queryClient.invalidateQueries({
        queryKey: favoriteKeys.recipes(userId),
      });
      queryClient.invalidateQueries({
        queryKey: favoriteKeys.count(userId),
      });
    },
  });
};

// 즐겨찾기 추가 mutation
export const useAddFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, recipeId }: { userId: string; recipeId: string }) =>
      FavoritesAPI.addFavorite(userId, recipeId),
    onSuccess: (data, { userId, recipeId }) => {
      // 즐겨찾기 상태 업데이트
      queryClient.setQueryData(favoriteKeys.status(userId, recipeId), true);
      
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: favoriteKeys.recipes(userId),
      });
      queryClient.invalidateQueries({
        queryKey: favoriteKeys.ids(userId),
      });
      queryClient.invalidateQueries({
        queryKey: favoriteKeys.count(userId),
      });
    },
  });
};

// 즐겨찾기 제거 mutation
export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, recipeId }: { userId: string; recipeId: string }) =>
      FavoritesAPI.removeFavorite(userId, recipeId),
    onSuccess: (data, { userId, recipeId }) => {
      // 즐겨찾기 상태 업데이트
      queryClient.setQueryData(favoriteKeys.status(userId, recipeId), false);
      
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: favoriteKeys.recipes(userId),
      });
      queryClient.invalidateQueries({
        queryKey: favoriteKeys.ids(userId),
      });
      queryClient.invalidateQueries({
        queryKey: favoriteKeys.count(userId),
      });
    },
  });
};