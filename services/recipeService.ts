import { supabase } from "@/lib/supabaseClient";
import { Recipe, RecipeWithSteps } from "../types/recipe";

export class RecipeService {
  /**
   * 특정 ID의 레시피를 조회합니다 (steps 포함)
   */
  static async getRecipeById(recipeId: string): Promise<RecipeWithSteps> {
    // 레시피와 단계 조회
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .select(
        `
        *,
        recipe_steps (*)
      `
      )
      .eq("id", recipeId)
      .single();

    if (recipeError) {
      throw new Error(`Failed to fetch recipe: ${recipeError.message}`);
    }

    if (!recipe) {
      throw new Error("Recipe not found");
    }

    // 사용자 정보 조회
    const { data: user } = await supabase
      .from("users")
      .select("id, display_name, profile_image")
      .eq("id", recipe.owner_id)
      .single();

    return {
      ...recipe,
      users: user,
    } as RecipeWithSteps;
  }

  /**
   * 모든 공개 레시피를 조회합니다
   */
  static async getAllRecipes(
    includeSteps: boolean = false
  ): Promise<Recipe[] | RecipeWithSteps[]> {
    try {
      if (!includeSteps) {
        // 스텝 없이 기본 레시피만 조회
        const { data: recipes, error } = await supabase
          .from("recipes")
          .select("*")
          .eq("is_public", true)
          .order("created_at", { ascending: false });

        if (error) {
          throw new Error(`Failed to fetch recipes: ${error.message}`);
        }

        return recipes || [];
      }

      // 스텝 정보도 포함하는 경우 - 별도 쿼리로 분리
      const { data: recipes, error } = await supabase
        .from("recipes")
        .select(
          `
          *,
          recipe_steps (*)
          `
        )
        .eq("is_public", true)
        .order("created_at", { ascending: true });
      if (error) {
        throw new Error(`Failed to fetch recipes: ${error.message}`);
      }

      if (!recipes) {
        return [];
      }

      // 사용자 정보 별도 조회
      const userIds = [
        ...new Set((recipes as any).map((recipe: any) => recipe.owner_id)),
      ];
      const { data: users } = await supabase
        .from("users")
        .select("id, display_name, profile_image")
        .in("id", userIds as string[]);

      // 레시피와 사용자 정보 결합
      const recipesWithUsers = (recipes as any).map((recipe: any) => ({
        ...recipe,
        users: users?.find((user) => user.id === recipe.owner_id),
      }));

      return recipesWithUsers as any;
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
    pageSize: number = 10,
    includeSteps: boolean = false
  ): Promise<{
    recipes: Recipe[] | RecipeWithSteps[];
    totalCount: number;
    totalPages: number;
  }> {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    // 전체 개수 조회
    const { count } = await supabase
      .from("recipes")
      .select("*", { count: "exact", head: true })
      .eq("is_public", true);

    // 페이지네이션된 데이터 조회
    const selectQuery = includeSteps
      ? `
        *,
        recipe_steps (*)
      `
      : "*";

    const { data: recipes, error } = await supabase
      .from("recipes")
      .select(selectQuery)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch paginated recipes: ${error.message}`);
    }

    let recipesWithUsers = recipes || [];

    // 사용자 정보 추가 (includeSteps인 경우에만)
    if (includeSteps && recipes && recipes.length > 0) {
      const userIds = [
        ...new Set((recipes as any).map((recipe: any) => recipe.owner_id)),
      ];
      const { data: users } = await supabase
        .from("users")
        .select("id, display_name, profile_image")
        .in("id", userIds as string[]);

      recipesWithUsers = (recipes as any).map((recipe: any) => ({
        ...recipe,
        users: users?.find((user) => user.id === recipe.owner_id),
      }));
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      recipes: recipesWithUsers as any,
      totalCount,
      totalPages,
    };
  }

  /**
   * 검색어로 레시피를 검색합니다
   */
  static async searchRecipes(
    searchTerm: string,
    includeSteps: boolean = false
  ): Promise<Recipe[] | RecipeWithSteps[]> {
    if (!searchTerm.trim()) {
      return this.getAllRecipes(includeSteps);
    }

    const selectQuery = includeSteps
      ? `
        *,
        recipe_steps (*)
      `
      : "*";

    const { data: recipes, error } = await supabase
      .from("recipes")
      .select(selectQuery)
      .eq("is_public", true)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to search recipes: ${error.message}`);
    }

    let recipesWithUsers = recipes || [];

    // 사용자 정보 추가 (includeSteps인 경우에만)
    if (includeSteps && recipes && recipes.length > 0) {
      const userIds = [
        ...new Set((recipes as any).map((recipe: any) => recipe.owner_id)),
      ];
      const { data: users } = await supabase
        .from("users")
        .select("id, display_name, profile_image")
        .in("id", userIds as string[]);

      recipesWithUsers = (recipes as any).map((recipe: any) => ({
        ...recipe,
        users: users?.find((user) => user.id === recipe.owner_id),
      }));
    }

    return recipesWithUsers as any;
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
