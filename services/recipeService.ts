import { supabase } from "@/lib/supabaseClient";
import { Recipe } from "../types/recipe";

export class RecipeService {
  /**
   * 특정 ID의 레시피를 조회합니다 (steps 포함)
   */
  static async getRecipeById(recipeId: string): Promise<Recipe> {
    // 레시피 기본 정보 조회
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", recipeId)
      .single();

    if (recipeError) {
      throw new Error(`Failed to fetch recipe: ${recipeError.message}`);
    }

    // 레시피 스텝 조회
    const { data: steps, error: stepsError } = await supabase
      .from("recipe_steps")
      .select("*")
      .eq("recipe_id", recipeId)
      .order("step_index", { ascending: true });

    if (stepsError) {
      console.warn("Failed to fetch recipe steps:", stepsError);
    }

    return {
      ...recipe,
      steps: steps || [],
    };
  }

  /**
   * 모든 공개 레시피를 조회합니다
   */
  static async getAllRecipes(includeSteps: boolean = false): Promise<Recipe[]> {
    try {
      // 공개된 레시피만 조회
      const { data: recipes, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch recipes: ${error.message}`);
      }

      if (!recipes) {
        return [];
      }

      if (!includeSteps) {
        return recipes;
      }

      // 스텝 정보도 포함하는 경우
      const recipesWithSteps: Recipe[] = await Promise.all(
        recipes.map(async (recipe) => {
          const { data: steps } = await supabase
            .from("recipe_steps")
            .select("*")
            .eq("recipe_id", recipe.id)
            .order("step_index", { ascending: true });

          return {
            ...recipe,
            steps: steps || [],
          };
        })
      );

      return recipesWithSteps;
    } catch (error) {
      console.error("RecipeService.getAllRecipes 오류:", error);
      throw error;
    }
  }

  /**
   * 페이지네이션을 지원하는 레시피 목록 조회
   */
  static async getRecipesPaginated(
    page: number = 0,
    pageSize: number = 10
  ): Promise<{ recipes: Recipe[]; totalCount: number; totalPages: number }> {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    // 전체 개수 조회
    const { count } = await supabase
      .from("recipes")
      .select("*", { count: "exact", head: true })
      .eq("is_public", true);

    // 페이지네이션된 데이터 조회
    const { data: recipes, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch paginated recipes: ${error.message}`);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      recipes: recipes || [],
      totalCount,
      totalPages,
    };
  }

  /**
   * 검색어로 레시피를 검색합니다
   */
  static async searchRecipes(searchTerm: string): Promise<Recipe[]> {
    if (!searchTerm.trim()) {
      return this.getAllRecipes();
    }

    const { data: recipes, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("is_public", true)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to search recipes: ${error.message}`);
    }

    return recipes || [];
  }

  /**
   * 특정 드리퍼로 필터링된 레시피를 조회합니다
   */
  static async getRecipesByDripper(dripper: string): Promise<Recipe[]> {
    const { data: recipes, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("is_public", true)
      .eq("dripper", dripper)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch recipes by dripper: ${error.message}`);
    }

    return recipes || [];
  }

  /**
   * 사용 가능한 모든 드리퍼 목록을 조회합니다
   */
  static async getAvailableDrippers(): Promise<string[]> {
    const { data, error } = await supabase
      .from("recipes")
      .select("dripper")
      .eq("is_public", true)
      .not("dripper", "is", null);

    if (error) {
      throw new Error(`Failed to fetch drippers: ${error.message}`);
    }

    // 중복 제거
    const uniqueDrippers = [
      ...new Set(data?.map((item) => item.dripper).filter(Boolean)),
    ];
    return uniqueDrippers as string[];
  }
}
