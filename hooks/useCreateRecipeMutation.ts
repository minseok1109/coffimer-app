import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth' // 인증 훅
import { RecipeAPI } from '../lib/api/recipes'
import type { CreateRecipeInput, RecipeWithSteps } from '../types/recipe'
import { recipeKeys } from './useRecipes'

interface UseCreateRecipeOptions {
  onSuccess?: (recipe: RecipeWithSteps) => void
  onError?: (error: Error) => void
}

export const useCreateRecipeMutation = (options?: UseCreateRecipeOptions) => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: CreateRecipeInput): Promise<RecipeWithSteps> => {
      if (!user) throw new Error('사용자 인증이 필요합니다.')
      return RecipeAPI.createRecipe(input, user.id)
    },
    onSuccess: (data) => {
      // 캐시 무효화 및 업데이트
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['user-recipes', user?.id] })
      
      // 새로 생성된 레시피를 캐시에 추가
      queryClient.setQueryData(recipeKeys.detail(data.id), data)
      
      options?.onSuccess?.(data)
    },
    onError: (error: Error) => {
      console.error('레시피 생성 오류:', error)
      options?.onError?.(error)
    }
  })
}

// 레시피 업데이트 뮤테이션
export const useUpdateRecipeMutation = (options?: UseCreateRecipeOptions) => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ 
      recipeId, 
      input 
    }: { 
      recipeId: string, 
      input: Partial<CreateRecipeInput> 
    }): Promise<RecipeWithSteps> => {
      if (!user) throw new Error('사용자 인증이 필요합니다.')
      return RecipeAPI.updateRecipe(recipeId, input, user.id)
    },
    onSuccess: (data) => {
      // 캐시 무효화 및 업데이트
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['user-recipes', user?.id] })
      
      // 업데이트된 레시피를 캐시에 설정
      queryClient.setQueryData(recipeKeys.detail(data.id), data)
      
      options?.onSuccess?.(data)
    },
    onError: (error: Error) => {
      console.error('레시피 수정 오류:', error)
      options?.onError?.(error)
    }
  })
}

// 레시피 삭제 뮤테이션
export const useDeleteRecipeMutation = (options?: { onSuccess?: () => void, onError?: (error: Error) => void }) => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (recipeId: string): Promise<void> => {
      if (!user) throw new Error('사용자 인증이 필요합니다.')
      return RecipeAPI.deleteRecipe(recipeId, user.id)
    },
    onSuccess: (_, recipeId) => {
      // 캐시에서 삭제된 레시피 제거
      queryClient.removeQueries({ queryKey: recipeKeys.detail(recipeId) })
      
      // 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['user-recipes', user?.id] })
      
      options?.onSuccess?.()
    },
    onError: (error: Error) => {
      console.error('레시피 삭제 오류:', error)
      options?.onError?.(error)
    }
  })
}