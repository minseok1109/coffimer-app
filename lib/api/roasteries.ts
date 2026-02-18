import { supabase } from '@/lib/supabaseClient';
import type { Roastery } from '@/types/roastery';

const ROASTERY_LIST_COLUMNS = 'id, name, description, featured_image, created_at' as const;

export const RoasteryAPI = {
  async getRoasteries(): Promise<Roastery[]> {
    const { data, error } = await supabase
      .from('roasteries')
      .select(ROASTERY_LIST_COLUMNS)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []) as unknown as Roastery[];
  },

  async getRoasteryById(roasteryId: string): Promise<Roastery | null> {
    const { data, error } = await supabase
      .from('roasteries')
      .select('*')
      .eq('id', roasteryId)
      .is('deleted_at', null)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async getFeaturedRoastery(): Promise<Roastery | null> {
    const { data, error } = await supabase
      .from('roasteries')
      .select(ROASTERY_LIST_COLUMNS)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return null;
    }

    return data as unknown as Roastery;
  },
};
