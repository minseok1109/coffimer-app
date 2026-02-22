export type RoastLevel =
  | 'light'
  | 'medium_light'
  | 'medium'
  | 'medium_dark'
  | 'dark';

export type BeanType = 'blend' | 'single_origin';

export interface BeanImage {
  id: string;
  bean_id: string;
  user_id: string;
  image_url: string;
  storage_path: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Bean {
  id: string;
  name: string;
  roastery_name: string | null;
  roast_date: string | null;
  roast_level: RoastLevel | null;
  bean_type: BeanType;
  weight_g: number;
  remaining_g: number;
  price: number | null;
  cup_notes: string[];
  images: BeanImage[];
  user_id: string;
  created_at: string;
  degassing_days: number | null;
  variety: string | null;
  process_method: string | null;
  notes: string | null;
  updated_at: string;
}

export interface BeanFieldConfidence {
  name: number | null;
  roastery_name: number | null;
  roast_level: number | null;
  bean_type: number | null;
  weight_g: number | null;
  price: number | null;
  cup_notes: number | null;
  roast_date: number | null;
  variety: number | null;
  process_method: number | null;
}

export interface AIExtractionResult {
  name: string | null;
  roastery_name: string | null;
  roast_level: RoastLevel | null;
  bean_type: BeanType | null;
  weight_g: number | null;
  price: number | null;
  cup_notes: string[];
  roast_date: string | null;
  variety: string | null;
  process_method: string | null;
  confidence: BeanFieldConfidence;
}

export const ROAST_LEVEL_CONFIG: Record<
  RoastLevel,
  { color: string; label: string }
> = {
  light: { color: '#CD853F', label: '라이트' },
  medium_light: { color: '#A0522D', label: '미디엄 라이트' },
  medium: { color: '#8B7355', label: '미디엄' },
  medium_dark: { color: '#8B4513', label: '미디엄 다크' },
  dark: { color: '#6B4423', label: '다크' },
} as const;

export const ROAST_LEVELS: RoastLevel[] = [
  'light',
  'medium_light',
  'medium',
  'medium_dark',
  'dark',
] as const;

export const PRESET_CUP_NOTES = [
  '초콜릿',
  '견과류',
  '베리',
  '꽃향',
  '시트러스',
  '카라멜',
  '열대과일',
  '바닐라',
  '허브',
  '스파이스',
] as const;

export interface CreateBeanInput {
  name: string;
  roastery_name?: string | null;
  roast_date?: string | null;
  roast_level?: RoastLevel | null;
  bean_type: BeanType;
  weight_g: number;
  remaining_g?: number;
  price?: number | null;
  cup_notes?: string[];
  degassing_days?: number | null;
  variety?: string | null;
  process_method?: string | null;
  notes?: string | null;
}

export interface CreateBeanImageInput {
  image_url: string;
  storage_path: string;
  sort_order: number;
  is_primary: boolean;
}

export type UpdateBeanInput = Partial<CreateBeanInput> & {
  remaining_g?: number;
};
