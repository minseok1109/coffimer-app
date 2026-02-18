import { useQuery } from '@tanstack/react-query';
import { RoasteryAPI } from '@/lib/api/roasteries';
import type { Roastery } from '@/types/roastery';

export const roasteryKeys = {
  all: ['roasteries'] as const,
  lists: () => [...roasteryKeys.all, 'list'] as const,
  list: () => [...roasteryKeys.lists()] as const,
  featured: () => [...roasteryKeys.all, 'featured'] as const,
  details: () => [...roasteryKeys.all, 'detail'] as const,
  detail: (id: string) => [...roasteryKeys.details(), id] as const,
};

export const useRoasteries = () => {
  return useQuery<Roastery[], Error>({
    queryKey: roasteryKeys.list(),
    queryFn: () => RoasteryAPI.getRoasteries(),
  });
};

export const useFeaturedRoastery = () => {
  return useQuery<Roastery | null, Error>({
    queryKey: roasteryKeys.featured(),
    queryFn: () => RoasteryAPI.getFeaturedRoastery(),
  });
};

export const useRoastery = (roasteryId: string) => {
  return useQuery<Roastery | null, Error>({
    queryKey: roasteryKeys.detail(roasteryId),
    queryFn: () => RoasteryAPI.getRoasteryById(roasteryId),
    enabled: !!roasteryId,
  });
};
