import { supabase } from "../supabaseClient";
import type { Recipe, RecipeWithSteps } from "../../types/recipe";

export interface SavedRecipe {
  user_id: string;
  recipe_id: string;
  saved_at: string;
  is_pinned: boolean;
  pin_order: number | null;
  pinned_at: string | null;
}

export class FavoritesAPI {
  // 즐겨찾기 추가
  static async addFavorite(userId: string, recipeId: string): Promise<SavedRecipe> {
    const { data, error } = await supabase
      .from("saved_recipes")
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
      .from("saved_recipes")
      .delete()
      .eq("user_id", userId)
      .eq("recipe_id", recipeId);

    if (error) throw error;
  }

  // 즐겨찾기 상태 확인
  static async checkFavoriteStatus(userId: string, recipeId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("saved_recipes")
      .select("recipe_id")
      .eq("user_id", userId)
      .eq("recipe_id", recipeId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - not favorited
        return false;
      }
      throw error;
    }

    return !!data;
  }

  // 사용자의 즐겨찾기 레시피 ID 목록 조회
  static async getFavoriteRecipeIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from("saved_recipes")
      .select("recipe_id")
      .eq("user_id", userId)
      .order("saved_at", { ascending: false });

    if (error) throw error;
    return data?.map(item => item.recipe_id) || [];
  }

  // 사용자의 즐겨찾기 레시피 전체 정보 조회
  static async getFavoriteRecipes(userId: string): Promise<RecipeWithSteps[]> {
    const { data, error } = await supabase
      .from("saved_recipes")
      .select(`
        recipe_id,
        saved_at,
        recipes (
          *,
          recipe_steps (*)
        )
      `)
      .eq("user_id", userId)
      .order("saved_at", { ascending: false });

    if (error) throw error;
    
    if (!data) return [];

    // 레시피 데이터 변환 및 사용자 정보 조회
    const recipes = data.map(item => item.recipes).filter(Boolean);
    const userIds = [...new Set(recipes.map(recipe => recipe.owner_id))];
    
    const { data: users } = await supabase
      .from("users")
      .select("id, display_name, profile_image")
      .in("id", userIds);

    const recipesWithUsers = recipes.map(recipe => ({
      ...recipe,
      users: users?.find(user => user.id === recipe.owner_id),
    }));

    return recipesWithUsers as RecipeWithSteps[];
  }

  // 즐겨찾기 토글 (현재 상태에 따라 추가/제거)
  static async toggleFavorite(userId: string, recipeId: string): Promise<boolean> {
    const isFavorited = await this.checkFavoriteStatus(userId, recipeId);
    
    if (isFavorited) {
      await this.removeFavorite(userId, recipeId);
      return false;
    } else {
      await this.addFavorite(userId, recipeId);
      return true;
    }
  }

  // 즐겨찾기 개수 조회
  static async getFavoriteCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("saved_recipes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) throw error;
    return count || 0;
  }
}