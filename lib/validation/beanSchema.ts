import { z } from 'zod';

export const beanFormSchema = z
  .object({
    name: z.string().min(1, '원두 이름을 입력해주세요'),
    roastery_name: z.string().optional(),
    roast_date: z.string().optional(),
    roast_level: z
      .enum(['light', 'medium_light', 'medium', 'medium_dark', 'dark'])
      .nullable()
      .optional(),
    bean_type: z.enum(['blend', 'single_origin']),
    weight_g: z.number().min(1, '무게를 입력해주세요'),
    price: z.number().nullable().optional(),
    cup_notes: z.array(z.string()),
    degassing_days: z.number().int().min(0).max(365).nullable().optional(),
    variety: z.string().optional(),
    process_method: z.string().nullable().optional(),
    notes: z.string().optional(),
    remaining_g: z.number().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      typeof data.remaining_g === 'number' &&
      typeof data.weight_g === 'number' &&
      data.remaining_g > data.weight_g
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['remaining_g'],
        message: '잔여량은 전체 무게를 초과할 수 없습니다',
      });
    }
  });

export type BeanFormData = z.infer<typeof beanFormSchema>;

// useBeanAnalysis.ts와 공유되는 단일 정의
export interface ImageData {
  base64: string;
  mimeType: string;
}
