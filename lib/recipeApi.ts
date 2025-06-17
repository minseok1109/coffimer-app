import {
  CreateRecipeRequest,
  Recipe,
  RecipeStep,
  RecipeWithSteps,
} from "@/types/recipe";
import { RecipeFormData } from "@/types/recipe-form";
import { supabase } from "./supabaseClient";

/**
 * 폼 데이터를 데이터베이스 형식으로 변환
 */
export function transformFormDataToRecipe(
  formData: RecipeFormData,
  userId: string
): CreateRecipeRequest {
  // 총 시간 계산 (모든 스텝의 시간 합계)
  const totalTime = formData.steps.reduce((sum, step) => {
    return sum + parseInt(step.time);
  }, 0);

  // 물 온도 기본값 설정 (일반적인 드립 온도)
  const waterTemperature = 92;

  // 비율 계산 (물:커피)
  const coffeeAmount = parseInt(formData.coffeeAmount);
  const waterAmount = parseInt(formData.waterAmount);
  const ratio = waterAmount / coffeeAmount;

  const recipe: Omit<Recipe, "id" | "created_at" | "updated_at"> = {
    owner_id: userId,
    name: formData.title,
    total_time: totalTime,
    coffee: coffeeAmount,
    water: waterAmount,
    water_temperature: waterTemperature,
    dripper: formData.dripper,
    ratio: ratio,
    description: formData.description || "",
    is_public: formData.isPublic,
  };

  // 스텝 데이터 변환
  let cumulativeWater = 0;
  const steps: Omit<RecipeStep, "id" | "recipe_id">[] = formData.steps.map(
    (step, index) => {
      const stepWater = parseInt(step.waterAmount);
      cumulativeWater += stepWater;

      return {
        step_index: index + 1,
        time: parseInt(step.time),
        title: `Step ${index + 1}`,
        description: step.description || "",
        water: stepWater,
        total_water: cumulativeWater,
      };
    }
  );

  return { recipe, steps };
}

/**
 * 레시피와 스텝을 데이터베이스에 저장
 */
export async function createRecipe(
  formData: RecipeFormData,
  userId: string
): Promise<{ success: boolean; data?: RecipeWithSteps; error?: string }> {
  try {
    const { recipe, steps } = transformFormDataToRecipe(formData, userId);

    // 1. 레시피 저장
    const { data: recipeData, error: recipeError } = await supabase
      .from("recipes")
      .insert(recipe)
      .select()
      .single();

    if (recipeError) {
      console.error("레시피 저장 오류:", recipeError);
      return { success: false, error: recipeError.message };
    }

    // 2. 스텝 저장
    const stepsWithRecipeId = steps.map((step) => ({
      ...step,
      recipe_id: recipeData.id,
    }));

    const { data: stepsData, error: stepsError } = await supabase
      .from("recipe_steps")
      .insert(stepsWithRecipeId)
      .select();

    if (stepsError) {
      console.error("레시피 스텝 저장 오류:", stepsError);
      // 레시피 롤백
      await supabase.from("recipes").delete().eq("id", recipeData.id);
      return { success: false, error: stepsError.message };
    }

    const result: RecipeWithSteps = {
      ...recipeData,
      recipe_steps: stepsData,
    };

    return { success: true, data: result };
  } catch (error) {
    console.error("레시피 생성 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

/**
 * 사용자의 레시피 목록 조회
 */
export async function getUserRecipes(
  userId: string
): Promise<{ success: boolean; data?: RecipeWithSteps[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("recipes")
      .select(
        `
        *,
        recipe_steps (*)
      `
      )
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("레시피 조회 오류:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as RecipeWithSteps[] };
  } catch (error) {
    console.error("레시피 조회 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

/**
 * 특정 레시피 상세 조회
 */
export async function getRecipeById(
  recipeId: string
): Promise<{ success: boolean; data?: RecipeWithSteps; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("recipes")
      .select(
        `
        *,
        recipe_steps (*),
        users (display_name, profile_image)
      `
      )
      .eq("id", recipeId)
      .single();

    if (error) {
      console.error("레시피 상세 조회 오류:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as RecipeWithSteps };
  } catch (error) {
    console.error("레시피 상세 조회 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

/**
 * 공개 레시피 목록 조회
 */
export async function getPublicRecipes(): Promise<{
  success: boolean;
  data?: RecipeWithSteps[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("recipes")
      .select(
        `
        *,
        recipe_steps (*),
        users (display_name, profile_image)
      `
      )
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("공개 레시피 조회 오류:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as RecipeWithSteps[] };
  } catch (error) {
    console.error("공개 레시피 조회 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
    };
  }
}
