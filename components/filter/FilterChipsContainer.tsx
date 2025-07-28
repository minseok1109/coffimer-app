import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import {
  brewingTypeOptions,
  dripperOptions,
  type FilterState,
  filterOptions,
  getFilterLabel,
} from '@/constants/filterConstants';
import FilterChip from './FilterChip';

interface FilterChipsContainerProps {
  filterState: FilterState;
  onBrewingTypeChange: (brewingType: FilterState['brewingType']) => void;
  onDripperToggle: (dripper: string) => void;
  onFilterToggle: (filter: string) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export default function FilterChipsContainer({
  filterState,
  onBrewingTypeChange,
  onDripperToggle,
  onFilterToggle,
  onReset,
  isLoading = false,
}: FilterChipsContainerProps) {
  const hasActiveFilters =
    filterState.brewingType !== 'all' ||
    filterState.dripper.length > 0 ||
    filterState.filter.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {/* 초기화 버튼 */}
          {hasActiveFilters && (
            <FilterChip
              icon="refresh-outline"
              isSelected={false}
              label="전체"
              onPress={onReset}
            />
          )}

          {/* 추출 타입 필터 */}
          {brewingTypeOptions.map((option) => (
            <FilterChip
              icon={option.icon as any}
              isSelected={filterState.brewingType === option.value}
              key={option.value}
              label={option.label}
              onPress={() =>
                onBrewingTypeChange(option.value as FilterState['brewingType'])
              }
            />
          ))}

          {/* 드리퍼 필터 */}
          {dripperOptions.map((option) => (
            <FilterChip
              icon={option.icon as any}
              isSelected={filterState.dripper.includes(option.value)}
              key={option.value}
              label={option.label}
              onPress={() => onDripperToggle(option.value)}
            />
          ))}

          {/* 필터 필터 */}
          {filterOptions.map((option) => (
            <FilterChip
              icon={option.icon as any}
              isSelected={filterState.filter.includes(option.value)}
              key={option.value}
              label={option.label}
              onPress={() => onFilterToggle(option.value)}
            />
          ))}
        </ScrollView>

        {/* 로딩 인디케이터 */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#8B4513" size="small" />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    paddingRight: 16,
    justifyContent: 'center',
  },
});
