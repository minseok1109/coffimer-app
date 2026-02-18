import type { RecipeWithSteps } from '../../types/recipe';
import { supabase } from '../supabaseClient';

export interface SavedRecipe {
  user_id: string;
  recipe_id: string;
  saved_at: string;
  is_pinned: boolean | null;
  pin_order: number | null;
  pinned_at: string | null;
}

export class FavoritesAPI {
  // 즐겨찾기 추가
  static async addFavorite(
    userId: string,
    recipeId: string
  ): Promise<SavedRecipe> {
    const { data, error } = await supabase
      .from('saved_recipes')
      .insert({
        user_id: userId,
        recipe_id: recipeId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 즐겨찾기 제거
  static async removeFavorite(userId: string, recipeId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_recipes')
      .delete()
      .eq('user_id', userId)
      .eq('recipe_id', recipeId);

    if (error) throw error;
  }

  // 즐겨찾기 상태 확인 (HEAD 쿼리 — 데이터 전송 없이 count만 확인)
  static async checkFavoriteStatus(
    userId: string,
    recipeId: string
  ): Promise<boolean> {
    const { count, error } = await supabase
      .from('saved_recipes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('recipe_id', recipeId);

    if (error) throw error;
    return (count ?? 0) > 0;
  }

  // 사용자의 즐겨찾기 레시피 ID 목록 조회
  static async getFavoriteRecipeIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('saved_recipes')
      .select('recipe_id')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    if (error) throw error;
    return data?.map((item) => item.recipe_id) ?? [];
  }

  // 사용자의 즐겨찾기 레시피 전체 정보 조회
  static async getFavoriteRecipes(userId: string): Promise<RecipeWithSteps[]> {
    const { data, error } = await supabase
      .from('saved_recipes')
      .select(`
        recipe_id,
        saved_at,
        recipes (
          *,
          recipe_steps (*),
          users!recipes_owner_id_fkey (id, display_name, profile_image)
        )
      `)
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    if (error) throw error;

    if (!data) return [];

    const recipes = data.map((item) => item.recipes).filter(Boolean);
    return recipes as unknown as RecipeWithSteps[];
  }

  // 즐겨찾기 토글 (원자적 RPC — race condition 방지)
  static async toggleFavorite(
    userId: string,
    recipeId: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('toggle_favorite' as any, {
      p_user_id: userId,
      p_recipe_id: recipeId,
    });

    if (error) throw error;
    return data as unknown as boolean;
  }

  // 즐겨찾기 개수 조회
  static async getFavoriteCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('saved_recipes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count ?? 0;
  }
}
