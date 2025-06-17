import { z } from "zod";

export const recipeFormSchema = z.object({
  // Step 1
  title: z.string().min(1, "레시피 제목을 입력해주세요"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),

  // Step 2
  coffeeAmount: z
    .string()
    .min(1, "커피 원두 량을 입력해주세요")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "올바른 숫자를 입력해주세요",
    }),
  waterAmount: z
    .string()
    .min(1, "물의 양을 입력해주세요")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "올바른 숫자를 입력해주세요",
    }),
  ratio: z.string().optional(),
  dripper: z.string().min(1, "사용할 드리퍼를 선택해주세요"),

  // Step 3
  steps: z
    .array(
      z.object({
        time: z.string().min(1, "시간을 입력해주세요"),
        waterAmount: z.string().min(1, "물의 양을 입력해주세요"),
        description: z.string().optional(),
      })
    )
    .min(1, "최소 한 개의 단계를 추가해주세요"),
});

export type RecipeFormData = z.infer<typeof recipeFormSchema>;

export interface CreateRecipeStepProps {
  currentStep: number;
}

export interface StepIndicatorProps {
  currentStep: number;
}
