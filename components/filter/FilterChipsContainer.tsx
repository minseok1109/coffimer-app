import React from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { 
  brewingTypeOptions, 
  dripperOptions, 
  filterOptions, 
  FilterState,
  getFilterLabel
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
  const hasActiveFilters = filterState.brewingType !== 'all' || 
                          filterState.dripper.length > 0 || 
                          filterState.filter.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
        {/* 초기화 버튼 */}
        {hasActiveFilters && (
          <FilterChip
            label="전체"
            isSelected={false}
            onPress={onReset}
            icon="refresh-outline"
          />
        )}

        {/* 추출 타입 필터 */}
        {brewingTypeOptions.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            isSelected={filterState.brewingType === option.value}
            onPress={() => onBrewingTypeChange(option.value as FilterState['brewingType'])}
            icon={option.icon as any}
          />
        ))}

        {/* 드리퍼 필터 */}
        {dripperOptions.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            isSelected={filterState.dripper.includes(option.value)}
            onPress={() => onDripperToggle(option.value)}
            icon={option.icon as any}
          />
        ))}

        {/* 필터 필터 */}
        {filterOptions.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            isSelected={filterState.filter.includes(option.value)}
            onPress={() => onFilterToggle(option.value)}
            icon={option.icon as any}
          />
        ))}
        </ScrollView>
        
        {/* 로딩 인디케이터 */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#8B4513" />
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