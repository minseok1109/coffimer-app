import type { CreateRecipeInput, RecipeWithSteps } from '../../types/recipe';
import { supabase } from '../supabaseClient';

export class RecipeAPI {
  // 레시피 생성 (수동 트랜잭션 구현)
  static async createRecipe(
    input: CreateRecipeInput,
    userId: string
  ): Promise<RecipeWithSteps> {
    // 1. 레시피 생성
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        ...input.recipe,
        owner_id: userId,
      })
      .select()
      .single();

    if (recipeError) throw recipeError;

    // 2. 레시피 단계들 생성
    const stepsWithRecipeId = input.steps.map((step) => ({
      ...step,
      recipe_id: recipe.id,
    }));

    const { data: steps, error: stepsError } = await supabase
      .from('recipe_steps')
      .insert(stepsWithRecipeId)
      .select();

    if (stepsError) {
      // 롤백을 위해 생성된 레시피 삭제
      await supabase.from('recipes').delete().eq('id', recipe.id);
      throw stepsError;
    }

    // 3. 사용자 정보와 함께 반환
    const { data: owner } = await supabase
      .from('users')
      .select('id, display_name, profile_image')
      .eq('id', userId)
      .single();

    return {
      ...recipe,
      recipe_steps: steps,
      users: owner || undefined,
    };
  }

  // 레시피 조회 (단계 포함)
  static async getRecipeWithSteps(
    recipeId: string
  ): Promise<RecipeWithSteps | null> {
    // 레시피와 단계 조회
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select(
        `
        *,
        recipe_steps (*)
      `
      )
      .eq('id', recipeId)
      .single();

    if (recipeError) throw recipeError;
    if (!recipe) return null;

    // 사용자 정보 조회
    const { data: user } = await supabase
      .from('users')
      .select('id, display_name, profile_image')
      .eq('id', recipe.owner_id)
      .single();

    return {
      ...recipe,
      users: user || undefined,
    } as RecipeWithSteps;
  }

  // 공개 레시피 목록 조회
  static async getPublicRecipes(
    limit = 20,
    offset = 0
  ): Promise<RecipeWithSteps[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select(
        `
        *,
        recipe_steps (*),
              `
      )
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data as any;
  }

  // 사용자의 레시피 목록 조회
  static async getUserRecipes(userId: string): Promise<RecipeWithSteps[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select(
        `
        *,
        recipe_steps (*)
      `
      )
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as any;
  }

  // 레시피 수정
  static async updateRecipe(
    recipeId: string,
    input: Partial<CreateRecipeInput>,
    userId: string
  ): Promise<RecipeWithSteps> {
    // 소유자 확인
    const { data: existingRecipe, error: checkError } = await supabase
      .from('recipes')
      .select('owner_id')
      .eq('id', recipeId)
      .single();

    if (checkError) throw checkError;
    if (existingRecipe.owner_id !== userId) {
      throw new Error('레시피를 수정할 권한이 없습니다.');
    }

    // 레시피 업데이트
    if (input.recipe) {
      const { error: updateError } = await supabase
        .from('recipes')
        .update(input.recipe)
        .eq('id', recipeId);

      if (updateError) throw updateError;
    }

    // 단계 업데이트 (기존 단계 삭제 후 새로 추가)
    if (input.steps) {
      // 기존 단계 삭제
      const { error: deleteError } = await supabase
        .from('recipe_steps')
        .delete()
        .eq('recipe_id', recipeId);

      if (deleteError) throw deleteError;

      // 새 단계 추가
      const stepsWithRecipeId = input.steps.map((step) => ({
        ...step,
        recipe_id: recipeId,
      }));

      const { error: insertError } = await supabase
        .from('recipe_steps')
        .insert(stepsWithRecipeId);

      if (insertError) throw insertError;
    }

    // 업데이트된 레시피 반환
    return RecipeAPI.getRecipeWithSteps(recipeId) as Promise<RecipeWithSteps>;
  }

  // 레시피 삭제
  static async deleteRecipe(recipeId: string, userId: string): Promise<void> {
    // 소유자 확인
    const { data: existingRecipe, error: checkError } = await supabase
      .from('recipes')
      .select('owner_id')
      .eq('id', recipeId)
      .single();

    if (checkError) throw checkError;
    if (existingRecipe.owner_id !== userId) {
      throw new Error('레시피를 삭제할 권한이 없습니다.');
    }

    // 레시피 삭제 (CASCADE로 단계도 함께 삭제됨)
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId);

    if (error) throw error;
  }
}
