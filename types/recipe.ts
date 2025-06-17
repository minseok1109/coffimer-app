// Supabase 데이터베이스 스키마에 맞는 Recipe 타입 정의
export interface Recipe {
  id?: string;
  owner_id: string;
  name: string;
  total_time: number;
  coffee: number;
  water: number;
  water_temperature: number;
  dripper?: string;
  filter?: string;
  ratio?: number;
  description?: string;
  micron?: number;
  youtube_url?: string;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RecipeStep {
  id?: number;
  recipe_id: string;
  step_index: number;
  time: number;
  title?: string;
  description?: string;
  water?: number;
  total_water?: number;
}

// 레시피 생성 요청 타입
export interface CreateRecipeRequest {
  recipe: Omit<Recipe, "id" | "created_at" | "updated_at">;
  steps: Omit<RecipeStep, "id" | "recipe_id">[];
}

// 레시피 응답 타입
export interface RecipeWithSteps extends Recipe {
  recipe_steps: RecipeStep[];
}
