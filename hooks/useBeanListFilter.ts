import type { Bean } from '@/types/bean';
import { useCallback, useMemo, useState } from 'react';

export type SortOption = 'latest' | 'remaining' | 'roast_date';
export type StatusFilter = 'active' | 'exhausted';

export const SORT_OPTIONS: readonly { value: SortOption; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'remaining', label: '잔여량순' },
  { value: 'roast_date', label: '로스팅일순' },
] as const;

export const STATUS_FILTER_OPTIONS: readonly {
  value: StatusFilter;
  label: string;
}[] = [
  { value: 'active', label: '보유 중' },
  { value: 'exhausted', label: '소진됨' },
] as const;

export const useBeanListFilter = (beans: Bean[]) => {
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [statusFilter, setStatusFilter] = useState<StatusFilter | null>(null);

  const toggleStatusFilter = useCallback((filter: StatusFilter) => {
    setStatusFilter((prev) => (prev === filter ? null : filter));
  }, []);

  const sortedBeans = useMemo(() => {
    const filtered = beans.filter((bean) => {
      if (statusFilter === 'active') return bean.remaining_g > 0;
      if (statusFilter === 'exhausted') return bean.remaining_g <= 0;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'remaining') return b.remaining_g - a.remaining_g;
      if (sortBy === 'roast_date') {
        if (!a.roast_date) return 1;
        if (!b.roast_date) return -1;
        return (
          new Date(b.roast_date).getTime() - new Date(a.roast_date).getTime()
        );
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [beans, sortBy, statusFilter]);

  const isFiltered = statusFilter !== null;

  return {
    sortBy,
    setSortBy,
    statusFilter,
    toggleStatusFilter,
    sortedBeans,
    isFiltered,
  };
};
