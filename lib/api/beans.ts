import type {
  Bean,
  BeanImage,
  CreateBeanImageInput,
  CreateBeanInput,
  UpdateBeanInput,
} from '@/types/bean';
import { supabase } from '../supabaseClient';

const BEAN_SELECT = `
  id,
  name,
  roastery_name,
  roast_date,
  roast_level,
  bean_type,
  weight_g,
  remaining_g,
  price,
  cup_notes,
  user_id,
  created_at,
  degassing_days,
  variety,
  process_method,
  notes,
  updated_at,
  images:bean_images(
    id,
    bean_id,
    user_id,
    image_url,
    storage_path,
    sort_order,
    is_primary,
    created_at,
    updated_at
  )
`;

function normalizeBeanRecord(record: Record<string, unknown>): Bean {
  const images = Array.isArray(record.images) ? (record.images as BeanImage[]) : [];

  return {
    ...(record as Omit<Bean, 'images'>),
    images,
  } as Bean;
}

export class BeanAPI {
  static async getUserBeans(userId: string): Promise<Bean[]> {
    const { data, error } = await supabase
      .from('beans')
      .select(BEAN_SELECT)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((item) => normalizeBeanRecord(item as Record<string, unknown>));
  }

  static async getBeanById(beanId: string): Promise<Bean | null> {
    const { data, error } = await supabase
      .from('beans')
      .select(BEAN_SELECT)
      .eq('id', beanId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data ? normalizeBeanRecord(data as Record<string, unknown>) : null;
  }

  static async createBean(input: CreateBeanInput, userId: string): Promise<Bean> {
    const { data, error } = await supabase
      .from('beans')
      .insert({
        ...input,
        user_id: userId,
        remaining_g: input.remaining_g ?? input.weight_g,
      })
      .select(BEAN_SELECT)
      .single();

    if (error) throw error;
    return normalizeBeanRecord(data as Record<string, unknown>);
  }

  static async createBeanWithImages(
    beanId: string,
    input: CreateBeanInput,
    images: CreateBeanImageInput[],
    userId: string,
  ): Promise<Bean> {
    const { data, error } = await supabase.rpc('create_bean_with_images', {
      p_bean_id: beanId,
      p_bean: {
        ...input,
        remaining_g: input.remaining_g ?? input.weight_g,
      } as unknown as import('@/types/database').Json,
      p_images: images as unknown as import('@/types/database').Json,
    });

    if (error) throw error;

    const rpcData = (data ?? {}) as {
      bean?: Omit<Bean, 'images'>;
      images?: BeanImage[];
    };

    if (!rpcData.bean) {
      throw new Error('원두 생성 결과를 확인할 수 없습니다.');
    }

    const bean: Bean = {
      ...(rpcData.bean as Omit<Bean, 'images'>),
      user_id: rpcData.bean.user_id ?? userId,
      images: rpcData.images ?? [],
    };

    return bean;
  }

  static async updateBean(
    beanId: string,
    input: UpdateBeanInput,
    userId: string,
  ): Promise<Bean> {
    const { data, error } = await supabase
      .from('beans')
      .update(input)
      .eq('id', beanId)
      .eq('user_id', userId)
      .select(BEAN_SELECT)
      .single();

    if (error) throw error;
    return normalizeBeanRecord(data as Record<string, unknown>);
  }

  static async deleteBean(beanId: string): Promise<void> {
    const { error } = await supabase.rpc('soft_delete_bean', {
      bean_id: beanId,
    });

    if (error) throw error;
  }
}
