import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FilterChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  showCount?: number;
}

const FilterChip = memo(function FilterChip({ 
  label, 
  isSelected, 
  onPress, 
  icon,
  showCount 
}: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        isSelected && styles.selectedChip
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.chipContent}>
        {icon && (
          <Ionicons
            name={icon}
            size={16}
            color={isSelected ? '#fff' : '#666'}
            style={styles.icon}
          />
        )}
        <Text style={[
          styles.chipText,
          isSelected && styles.selectedChipText
        ]}>
          {label}
        </Text>
        {showCount !== undefined && showCount > 0 && (
          <View style={[
            styles.countBadge,
            isSelected && styles.selectedCountBadge
          ]}>
            <Text style={[
              styles.countText,
              isSelected && styles.selectedCountText
            ]}>
              {showCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

export default FilterChip;

const styles = StyleSheet.create({
  chip: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedChip: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 4,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedChipText: {
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
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  selectedCountText: {
    color: '#fff',
  },
});