import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  brewingTypeOptions, 
  FilterState,
  dripperOptions,
  filterOptions,
} from '@/constants/filterConstants';
import FilterChip from './FilterChip';
import FilterBottomSheet from './FilterBottomSheet';

interface CompactFilterChipsContainerProps {
  filterState: FilterState;
  onBrewingTypeChange: (brewingType: FilterState['brewingType']) => void;
  onDripperToggle: (dripper: string) => void;
  onFilterToggle: (filter: string) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export default function CompactFilterChipsContainer({
  filterState,
  onBrewingTypeChange,
  onDripperToggle,
  onFilterToggle,
  onReset,
  isLoading = false,
}: CompactFilterChipsContainerProps) {
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  const hasActiveFilters = filterState.brewingType !== 'all' || 
                          filterState.dripper.length > 0 || 
                          filterState.filter.length > 0;

  const activeDripperCount = filterState.dripper.length;
  const activeFilterCount = filterState.filter.length;

  const getDripperFilterText = () => {
    if (activeDripperCount === 0 && activeFilterCount === 0) {
      return '드리퍼·필터';
    }
    
    const parts = [];
    if (activeDripperCount > 0) {
      if (activeDripperCount === 1) {
        const selectedDripper = dripperOptions.find(d => 
          filterState.dripper.includes(d.value)
        );
        parts.push(selectedDripper?.label || '드리퍼');
      } else {
        parts.push(`드리퍼 ${activeDripperCount}개`);
      }
    }
    
    if (activeFilterCount > 0) {
      if (activeFilterCount === 1) {
        const selectedFilter = filterOptions.find(f => 
          filterState.filter.includes(f.value)
        );
        parts.push(selectedFilter?.label || '필터');
      } else {
        parts.push(`필터 ${activeFilterCount}개`);
      }
    }
    
    return parts.join('·');
  };

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

          {/* 추출 타입 필터 (전체 제외) */}
          {brewingTypeOptions.filter(option => option.value !== 'all').map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              isSelected={filterState.brewingType === option.value}
              onPress={() => onBrewingTypeChange(option.value as FilterState['brewingType'])}
              icon={option.icon as any}
            />
          ))}

          {/* 드리퍼·필터 통합 칩 */}
          <TouchableOpacity
            style={[
              styles.combinedChip,
              (activeDripperCount > 0 || activeFilterCount > 0) && styles.selectedCombinedChip
            ]}
            onPress={() => setShowBottomSheet(true)}
            activeOpacity={0.7}
          >
            <View style={styles.combinedChipContent}>
              <Ionicons
                name="funnel-outline"
                size={16}
                color={(activeDripperCount > 0 || activeFilterCount > 0) ? '#fff' : '#666'}
                style={styles.icon}
              />
              <Text style={[
                styles.combinedChipText,
                (activeDripperCount > 0 || activeFilterCount > 0) && styles.selectedCombinedChipText
              ]}>
                {getDripperFilterText()}
              </Text>
              {(activeDripperCount > 0 || activeFilterCount > 0) && (
                <View style={[
                  styles.countBadge,
                  styles.selectedCountBadge
                ]}>
                  <Text style={styles.selectedCountText}>
                    {activeDripperCount + activeFilterCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </ScrollView>
        
        {/* 로딩 인디케이터 */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#8B4513" />
          </View>
        )}
      </View>

      {/* 바텀시트 */}
      <FilterBottomSheet
        isVisible={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        filterState={filterState}
        onDripperToggle={onDripperToggle}
        onFilterToggle={onFilterToggle}
        onReset={onReset}
      />
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
  combinedChip: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedCombinedChip: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  combinedChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 4,
  },
  combinedChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedCombinedChipText: {
    color: '#fff',
  },
  countBadge: {
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  selectedCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectedCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});