import type { Bean, CreateBeanInput, UpdateBeanInput } from '@/types/bean';
import { supabase } from '../supabaseClient';

export class BeanAPI {
  static async getUserBeans(userId: string): Promise<Bean[]> {
    const { data, error } = await supabase
      .from('beans')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Bean[];
  }

  static async getBeanById(beanId: string): Promise<Bean | null> {
    const { data, error } = await supabase
      .from('beans')
      .select('*')
      .eq('id', beanId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as Bean | null;
  }

  static async createBean(
    input: CreateBeanInput,
    userId: string,
  ): Promise<Bean> {
    const { data, error } = await supabase
      .from('beans')
      .insert({
        ...input,
        user_id: userId,
        remaining_g: input.weight_g,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Bean;
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
      .select()
      .single();

    if (error) throw error;
    return data as Bean;
  }

  static async deleteBean(beanId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('beans')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', beanId)
      .eq('user_id', userId);

    if (error) throw error;
  }
}
