import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FilterState, dripperOptions, filterOptions } from '@/constants/filterConstants';

interface FilterBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  filterState: FilterState;
  onDripperToggle: (dripper: string) => void;
  onFilterToggle: (filter: string) => void;
  onReset: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FilterBottomSheet({
  isVisible,
  onClose,
  filterState,
  onDripperToggle,
  onFilterToggle,
  onReset,
}: FilterBottomSheetProps) {
  if (!isVisible) return null;

  const hasActiveFilters = filterState.dripper.length > 0 || filterState.filter.length > 0;

  const handleReset = () => {
    onReset();
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.bottomSheet}>
          {/* 핸들 */}
          <View style={styles.handle} />
          
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>필터</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* 드리퍼 섹션 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>드리퍼</Text>
              <View style={styles.optionGrid}>
                {dripperOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionChip,
                      filterState.dripper.includes(option.value) && styles.selectedChip,
                    ]}
                    onPress={() => onDripperToggle(option.value)}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={16}
                      color={
                        filterState.dripper.includes(option.value) ? '#fff' : '#666'
                      }
                      style={styles.optionIcon}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        filterState.dripper.includes(option.value) && styles.selectedText,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 필터 섹션 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>필터</Text>
              <View style={styles.optionGrid}>
                {filterOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionChip,
                      filterState.filter.includes(option.value) && styles.selectedChip,
                    ]}
                    onPress={() => onFilterToggle(option.value)}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={16}
                      color={
                        filterState.filter.includes(option.value) ? '#fff' : '#666'
                      }
                      style={styles.optionIcon}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        filterState.filter.includes(option.value) && styles.selectedText,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* 하단 버튼 */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={handleReset}
              disabled={!hasActiveFilters}
            >
              <Text style={[styles.buttonText, styles.resetButtonText]}>
                초기화
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.applyButton]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, styles.applyButtonText]}>
                적용
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    paddingHorizontal: 20,
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedChip: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  optionIcon: {
    marginRight: 4,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedText: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  applyButton: {
    backgroundColor: '#8B4513',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resetButtonText: {
    color: '#666',
  },
  applyButtonText: {
    color: '#fff',
  },
});