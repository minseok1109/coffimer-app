import { useCallback, useState } from 'react';
import {
  type FilterState,
  initialFilterState,
} from '@/constants/filterConstants';

export const useFilterState = (
  initialState: FilterState = initialFilterState
) => {
  const [filterState, setFilterState] = useState<FilterState>(initialState);

  // 추출 타입 설정
  const setBrewingType = useCallback(
    (brewingType: FilterState['brewingType']) => {
      setFilterState((prev) => ({ ...prev, brewingType }));
    },
    []
  );

  // 드리퍼 필터 토글
  const toggleDripper = useCallback((dripper: string) => {
    setFilterState((prev) => ({
      ...prev,
      dripper: prev.dripper.includes(dripper)
        ? prev.dripper.filter((d) => d !== dripper)
        : [...prev.dripper, dripper],
    }));
  }, []);

  // 필터 토글
  const toggleFilter = useCallback((filter: string) => {
    setFilterState((prev) => ({
      ...prev,
      filter: prev.filter.includes(filter)
        ? prev.filter.filter((f) => f !== filter)
        : [...prev.filter, filter],
    }));
  }, []);

  // 드리퍼 필터 설정
  const setDripperFilters = useCallback((dripper: string[]) => {
    setFilterState((prev) => ({ ...prev, dripper }));
  }, []);

  // 필터 설정
  const setFilters = useCallback((filter: string[]) => {
    setFilterState((prev) => ({ ...prev, filter }));
  }, []);

  // 필터 초기화
  const resetFilters = useCallback(() => {
    setFilterState(initialFilterState);
  }, []);

  // 특정 필터 카테고리 초기화
  const resetBrewingType = useCallback(() => {
    setFilterState((prev) => ({ ...prev, brewingType: 'all' }));
  }, []);

  const resetDripperFilters = useCallback(() => {
    setFilterState((prev) => ({ ...prev, dripper: [] }));
  }, []);

  const resetFilterFilters = useCallback(() => {
    setFilterState((prev) => ({ ...prev, filter: [] }));
  }, []);

  // 필터 활성 상태 체크
  const hasActiveFilters =
    filterState.brewingType !== 'all' ||
    filterState.dripper.length > 0 ||
    filterState.filter.length > 0;

  const hasActiveBrewingType = filterState.brewingType !== 'all';
  const hasActiveDripper = filterState.dripper.length > 0;
  const hasActiveFilter = filterState.filter.length > 0;

  return {
    filterState,
    setFilterState,

    // 개별 필터 설정
    setBrewingType,
    toggleDripper,
    toggleFilter,
    setDripperFilters,
    setFilters,

    // 초기화
    resetFilters,
    resetBrewingType,
    resetDripperFilters,
    resetFilterFilters,

    // 상태 체크
    hasActiveFilters,
    hasActiveBrewingType,
    hasActiveDripper,
    hasActiveFilter,
  };
};
