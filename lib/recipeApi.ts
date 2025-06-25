import { CreateRecipeRequest, Recipe, RecipeStep } from "@/types/recipe";
import { RecipeFormData } from "@/types/recipe-form";

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
    dripper: formData.dripper || null,
    filter: null, // 필터 정보가 폼에 없으므로 null로 설정
    ratio: ratio,
    description: formData.description || null,
    micron: null, // 미크론 정보가 폼에 없으므로 null로 설정
    youtube_url: formData.youtubeUrl || null, // YouTube URL 추가
    is_public: formData.isPublic || false,
  };

  // 스텝 데이터 변환
  let cumulativeWater = 0;
  const steps: Omit<RecipeStep, "id" | "recipe_id">[] = formData.steps.map(
    (step, index) => {
      const stepWater = parseInt(step.waterAmount);
      cumulativeWater += stepWater;

      return {
        step_index: index,
        time: parseInt(step.time),
        title: step.title || `Step ${index + 1}`,
        description: step.description || null,
        water: stepWater || 0,
        total_water: cumulativeWater || null,
      };
    }
  );

  return { recipe, steps };
}
