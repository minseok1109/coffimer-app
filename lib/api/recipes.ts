import { RecipeService } from '@/services/recipeService';
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

    const { error: stepsError } = await supabase
      .from('recipe_steps')
      .insert(stepsWithRecipeId)
      .select();

    if (stepsError) {
      // 롤백을 위해 생성된 레시피 삭제
      await supabase.from('recipes').delete().eq('id', recipe.id);
      throw stepsError;
    }

    // 3. nested select로 완전한 레시피 반환 (users 포함)
    return RecipeService.getRecipeById(recipe.id);
  }

  // 공개 레시피 목록 조회
  static async getPublicRecipes(
    limit = 20,
    offset = 0
  ): Promise<RecipeWithSteps[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        recipe_steps (*)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data ?? []) as unknown as RecipeWithSteps[];
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
    return (data ?? []) as unknown as RecipeWithSteps[];
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
    return RecipeService.getRecipeById(recipeId);
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
