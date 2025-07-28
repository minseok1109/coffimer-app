import type { CreateRecipeRequest, Recipe, RecipeStep } from '@/types/recipe';
import type { RecipeFormData } from '@/types/recipe-form';

/**
 * 폼 데이터를 데이터베이스 형식으로 변환 (생성용)
 */
export function transformFormDataToRecipe(
  formData: RecipeFormData,
  userId: string
): CreateRecipeRequest {
  // 총 시간 계산 (모든 단계의 소요 시간 합계)
  const totalTime = formData.steps.reduce((sum, step) => {
    return sum + Number.parseInt(step.time);
  }, 0);

  // 물 온도 기본값 설정 (일반적인 드립 온도)
  const waterTemperature = 92;

  // 비율 계산 (물:커피)
  const coffeeAmount = Number.parseInt(formData.coffeeAmount);
  const waterAmount = Number.parseInt(formData.waterAmount);
  const ratio = waterAmount / coffeeAmount;

  const recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'> = {
    owner_id: userId,
    name: formData.title,
    total_time: totalTime,
    coffee: coffeeAmount,
    water: waterAmount,
    water_temperature: waterTemperature,
    dripper: formData.dripper || null,
    filter: formData.filter || null,
    ratio,
    description: formData.description || null,
    micron: null, // 미크론 정보가 폼에 없으므로 null로 설정
    youtube_url: formData.youtubeUrl || null, // YouTube URL 추가
    is_public: formData.isPublic,
    brewing_type: 'hot', // 기본값: 핫 브루잉
  };

  // 스텝 데이터 변환 - 누적 시간으로 변환
  let cumulativeTime = 0;
  let cumulativeWater = 0;
  const steps: Omit<RecipeStep, 'id' | 'recipe_id'>[] = formData.steps.map(
    (step, index) => {
      const stepTime = Number.parseInt(step.time);
      const stepWater = Number.parseInt(step.waterAmount);

      cumulativeTime += stepTime; // 누적 시간 계산
      cumulativeWater += stepWater;

      return {
        step_index: index,
        time: cumulativeTime, // 누적 시간으로 저장
        title: step.title || `Step ${index + 1}`,
        description: step.description || null,
        water: stepWater || 0,
        total_water: cumulativeWater || null,
      };
    }
  );

  return { recipe, steps };
}

/**
 * 수정용 폼 데이터를 데이터베이스 형식으로 변환
 */
export function transformEditFormDataToRecipe(
  formData: { recipe: any; steps: any[] }
): CreateRecipeRequest {
  // 레시피 데이터는 그대로 사용
  const recipe = formData.recipe;

  // 스텝 데이터 변환 - 누적 시간으로 변환
  let cumulativeTime = 0;
  let cumulativeWater = 0;
  const steps: Omit<RecipeStep, 'id' | 'recipe_id'>[] = formData.steps.map(
    (step, index) => {
      const stepTime = step.time || 0;
      const stepWater = step.water || 0;

      cumulativeTime += stepTime; // 누적 시간 계산
      cumulativeWater += stepWater;

      return {
        step_index: index,
        time: cumulativeTime, // 누적 시간으로 저장
        title: step.title || `Step ${index + 1}`,
        description: step.description || null,
        water: stepWater,
        total_water: cumulativeWater || null,
      };
    }
  );

  return { recipe, steps };
}
