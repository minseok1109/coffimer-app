import { z } from 'zod';

// 레시피 단계 스키마
export const recipeStepSchema = z.object({
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  time: z.number().min(1, '시간은 1초 이상이어야 합니다'),
  water: z.number().min(0, '물 양은 0ml 이상이어야 합니다'),
  total_water: z
    .number()
    .min(0, '총 물 양은 0ml 이상이어야 합니다')
    .optional()
    .nullable(),
  step_index: z.number().min(0, '단계 순서는 0 이상이어야 합니다'),
});

// 레시피 스키마
export const recipeSchema = z.object({
  name: z
    .string()
    .min(1, '레시피 이름을 입력해주세요')
    .max(100, '레시피 이름은 100자 이하로 입력해주세요'),
  description: z.string().optional().nullable(),
  coffee: z
    .number()
    .min(1, '원두량은 1g 이상이어야 합니다')
    .max(1000, '원두량은 1000g 이하로 입력해주세요'),
  water: z
    .number()
    .min(1, '물량은 1ml 이상이어야 합니다')
    .max(10_000, '물량은 10000ml 이하로 입력해주세요'),
  water_temperature: z
    .number()
    .min(1, '물 온도를 입력해주세요')
    .max(100, '물 온도는 100도 이하로 입력해주세요'),
  dripper: z.string().optional().nullable(),
  filter: z.string().optional().nullable(),
  ratio: z
    .number()
    .min(1, '비율은 1 이상이어야 합니다')
    .max(50, '비율은 50 이하로 입력해주세요')
    .optional()
    .nullable(),
  micron: z
    .number()
    .min(1, '분쇄도는 1 이상이어야 합니다')
    .max(10_000, '분쇄도는 10000 이하로 입력해주세요')
    .optional()
    .nullable(),
  youtube_url: z
    .string()
    .url('올바른 URL 형식을 입력해주세요')
    .optional()
    .or(z.literal(''))
    .nullable(),
  is_public: z.boolean().default(false),
  total_time: z
    .number()
    .min(1, '총 시간은 1초 이상이어야 합니다')
    .max(86_400, '총 시간은 24시간 이하로 입력해주세요'),
});

// 레시피 수정 폼 스키마 (레시피 + 단계들)
export const recipeEditSchema = z.object({
  recipe: recipeSchema,
  steps: z
    .array(recipeStepSchema)
    .min(1, '최소 1개의 단계가 필요합니다')
    .max(20, '단계는 최대 20개까지 추가할 수 있습니다'),
});

// TypeScript 타입 추출
export type RecipeFormData = z.infer<typeof recipeSchema>;
export type RecipeStepFormData = z.infer<typeof recipeStepSchema>;
export type RecipeEditFormData = z.infer<typeof recipeEditSchema>;

// 기본값 함수들
export const getDefaultRecipeStep = (): RecipeStepFormData => ({
  title: '',
  description: '',
  time: 30,
  water: 0,
  total_water: null,
  step_index: 0,
});

export const getDefaultRecipe = (): RecipeFormData => ({
  name: '',
  description: '',
  coffee: 20,
  water: 300,
  water_temperature: 92,
  dripper: '',
  filter: '',
  ratio: 15,
  micron: null,
  youtube_url: '',
  is_public: false,
  total_time: 180,
});
