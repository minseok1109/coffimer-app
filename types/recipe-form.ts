import { z } from 'zod';

export const recipeFormSchema = z.object({
  // Step 1
  title: z.string().min(1, '레시피 제목을 입력해주세요'),
  description: z.string().optional(),
  youtubeUrl: z
    .string()
    .url('올바른 URL을 입력해주세요')
    .optional()
    .or(z.literal('')),
  isPublic: z.boolean().default(false),

  // Step 2
  coffeeAmount: z
    .string()
    .min(1, '커피 원두 량을 입력해주세요')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: '올바른 숫자를 입력해주세요',
    }),
  waterAmount: z
    .string()
    .min(1, '물의 양을 입력해주세요')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: '올바른 숫자를 입력해주세요',
    }),
  ratio: z.string().optional(),
  dripper: z.string().min(1, '사용할 드리퍼를 선택해주세요'),
  filter: z.string().optional(),

  // 분쇄도 정보 (선택사항)
  grindInputMode: z.enum(['micron', 'grinder']).default('micron'),
  grindMicrons: z
    .string()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;
        const num = Number(val);
        return !isNaN(num) && num >= 150 && num <= 1200;
      },
      {
        message: '마이크론은 150-1200 범위로 입력해주세요',
      }
    )
    .optional(),
  grindGrinder: z.string().optional(),
  grindClicks: z
    .string()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;
        const num = Number(val);
        return !isNaN(num) && num >= 0 && num <= 50 && Number.isInteger(num);
      },
      {
        message: '클릭 수는 0-50 범위의 정수로 입력해주세요',
      }
    )
    .optional(),
  grindNotes: z
    .string()
    .max(200, '분쇄도 메모는 200자 이내로 입력해주세요')
    .optional(),

  // Step 3
  steps: z
    .array(
      z.object({
        title: z.string(),
        time: z.string().min(1, '시간을 입력해주세요'),
        waterAmount: z.string().min(1, '물의 양을 입력해주세요'),
        description: z.string().optional(),
      })
    )
    .min(1, '최소 한 개의 단계를 추가해주세요'),
});

export type RecipeFormData = z.infer<typeof recipeFormSchema>;

export interface CreateRecipeStepProps {
  currentStep: number;
}

export interface StepIndicatorProps {
  currentStep: number;
}
