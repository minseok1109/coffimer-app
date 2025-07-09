import type { Database, Tables, InsertTables } from './database'

// 기본 타입 정의 (Supabase 자동 생성 타입 기반)
export type Recipe = Tables<'recipes'>
export type RecipeStep = Tables<'recipe_steps'>
export type User = Tables<'users'>

export type RecipeInsert = InsertTables<'recipes'>
export type RecipeStepInsert = InsertTables<'recipe_steps'>

// 레시피 생성을 위한 입력 타입
export interface CreateRecipeInput {
  recipe: Omit<RecipeInsert, 'owner_id'>
  steps: Omit<RecipeStepInsert, 'recipe_id'>[]
}

// 레시피 생성 요청 타입 (기존 호환성을 위해 유지)
export interface CreateRecipeRequest {
  recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>
  steps: Omit<RecipeStep, 'id' | 'recipe_id'>[]
}

// 완전한 레시피 타입 (단계 포함)
export interface RecipeWithSteps extends Recipe {
  recipe_steps: RecipeStep[]
  users?: Pick<User, 'id' | 'display_name' | 'profile_image'>
}

// 즐겨찾기 레시피 타입
export interface SavedRecipe {
  user_id: string
  recipe_id: string
  saved_at: string
  is_pinned: boolean
  pin_order: number | null
  pinned_at: string | null
}