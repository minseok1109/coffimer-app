import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import type { Tables } from '@/types/database';

export type Grinder = Tables<'grinders'>;

export const useGrinders = () => {
  return useQuery({
    queryKey: ['grinders'],
    queryFn: async (): Promise<Grinder[]> => {
      const { data, error } = await supabase
        .from('grinders')
        .select('*')
        .order('brand', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        throw new Error(`그라인더 목록을 가져오는 중 오류가 발생했습니다: ${error.message}`);
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 60, // 1시간 캐시
  });
};

export const useGrinderById = (id: string | null) => {
  return useQuery({
    queryKey: ['grinders', id],
    queryFn: async (): Promise<Grinder | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('grinders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`그라인더 정보를 가져오는 중 오류가 발생했습니다: ${error.message}`);
      }

      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 60, // 1시간 캐시
  });
};

export const getGrinderDisplayName = (grinder: Grinder): string => {
  return `${grinder.brand} ${grinder.name}`;
};

export const getGrinderClickRange = (grinder: Grinder): string => {
  return `${grinder.min_clicks}-${grinder.max_clicks} clicks`;
};

export const getGrinderMicronRange = (grinder: Grinder): string | null => {
  if (!grinder.micron_range_min || !grinder.micron_range_max) {
    return null;
  }
  return `${grinder.micron_range_min}-${grinder.micron_range_max}μm`;
};