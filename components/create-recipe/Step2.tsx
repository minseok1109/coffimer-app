import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createRecipeStyles } from '@/styles/create-recipe.styles';
import type { RecipeFormData } from '@/types/recipe-form';
import {
  DRIPPER_OPTIONS,
  FILTER_OPTIONS,
  getSelectedOptionLabel,
} from '@/utils/selectorUtils';
import { GrindSizeInput } from './GrindSizeInput';

interface Step2Props {
  hasAttemptedNext?: boolean;
  onDripperPress?: () => void;
  onFilterPress?: () => void;
  onGrinderPress?: () => void;
}

export const Step2: React.FC<Step2Props> = ({
  hasAttemptedNext = false,
  onDripperPress,
  onFilterPress,
  onGrinderPress,
}) => {
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<RecipeFormData>();

  const coffeeAmount = watch('coffeeAmount');
  const waterAmount = watch('waterAmount');
  const dripper = watch('dripper');
  const filter = watch('filter');

  // 비율 자동 계산 메모이제이션
  const calculatedRatio = useMemo(() => {
    if (coffeeAmount && waterAmount) {
      const coffee = Number.parseFloat(coffeeAmount);
      const water = Number.parseFloat(waterAmount);
      if (!(isNaN(coffee) || isNaN(water)) && coffee > 0) {
        return (water / coffee).toFixed(2);
      }
    }
    return '';
  }, [coffeeAmount, waterAmount]);

  React.useEffect(() => {
    if (calculatedRatio) {
      setValue('ratio', calculatedRatio);
    }
  }, [calculatedRatio, setValue]);

  // 선택된 라벨 메모이제이션
  const selectedDripperLabel = useMemo(
    () =>
      getSelectedOptionLabel(DRIPPER_OPTIONS, dripper, '드리퍼를 선택하세요'),
    [dripper]
  );

  const selectedFilterLabel = useMemo(
    () => getSelectedOptionLabel(FILTER_OPTIONS, filter, '필터를 선택하세요'),
    [filter]
  );

  return (
    <View style={createRecipeStyles.stepContent}>
      <View style={createRecipeStyles.inputGroup}>
        <Text style={createRecipeStyles.label}>커피 원두 량 (g)</Text>
        <Controller
          control={control}
          name="coffeeAmount"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <View
                style={[
                  createRecipeStyles.inputWithSuffix,
                  hasAttemptedNext &&
                    errors.coffeeAmount &&
                    createRecipeStyles.inputError,
                ]}
              >
                <TextInput
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="0"
                  placeholderTextColor="#999"
                  style={createRecipeStyles.numberInput}
                  value={value}
                />
                <Text style={createRecipeStyles.suffix}>g</Text>
              </View>
              {hasAttemptedNext && errors.coffeeAmount && (
                <Text style={createRecipeStyles.errorText}>
                  {errors.coffeeAmount.message}
                </Text>
              )}
            </>
          )}
        />
      </View>

      <View style={createRecipeStyles.inputGroup}>
        <Text style={createRecipeStyles.label}>물양 (ml)</Text>
        <Controller
          control={control}
          name="waterAmount"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <View
                style={[
                  createRecipeStyles.inputWithSuffix,
                  hasAttemptedNext &&
                    errors.waterAmount &&
                    createRecipeStyles.inputError,
                ]}
              >
                <TextInput
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="0"
                  placeholderTextColor="#999"
                  style={createRecipeStyles.numberInput}
                  value={value}
                />
                <Text style={createRecipeStyles.suffix}>ml</Text>
              </View>
              {hasAttemptedNext && errors.waterAmount && (
                <Text style={createRecipeStyles.errorText}>
                  {errors.waterAmount.message}
                </Text>
              )}
            </>
          )}
        />
      </View>

      <View style={createRecipeStyles.inputGroup}>
        <Text style={createRecipeStyles.label}>비율 (ratio)</Text>
        <Controller
          control={control}
          name="ratio"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              keyboardType="numeric"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="자동 계산됨"
              placeholderTextColor="#999"
              style={createRecipeStyles.input}
              value={value}
            />
          )}
        />
      </View>

      <View style={createRecipeStyles.inputGroup}>
        <Text style={createRecipeStyles.label}>사용할 드리퍼</Text>
        <Controller
          control={control}
          name="dripper"
          render={({ field: { value } }) => (
            <>
              <TouchableOpacity
                onPress={onDripperPress}
                style={[
                  createRecipeStyles.dripperSelector,
                  hasAttemptedNext &&
                    errors.dripper &&
                    createRecipeStyles.inputError,
                ]}
              >
                <Text
                  style={[
                    createRecipeStyles.dripperSelectorText,
                    !value && createRecipeStyles.dripperPlaceholderText,
                  ]}
                >
                  {selectedDripperLabel}
                </Text>
                <Ionicons color="#8B4513" name="chevron-down" size={20} />
              </TouchableOpacity>
              {hasAttemptedNext && errors.dripper && (
                <Text style={createRecipeStyles.errorText}>
                  {errors.dripper.message}
                </Text>
              )}
            </>
          )}
        />
      </View>

      <View style={createRecipeStyles.inputGroup}>
        <Text style={createRecipeStyles.label}>필터</Text>
        <Controller
          control={control}
          name="filter"
          render={({ field: { value } }) => (
            <>
              <TouchableOpacity
                onPress={onFilterPress}
                style={[
                  createRecipeStyles.dripperSelector,
                  hasAttemptedNext &&
                    errors.filter &&
                    createRecipeStyles.inputError,
                ]}
              >
                <Text
                  style={[
                    createRecipeStyles.dripperSelectorText,
                    !value && createRecipeStyles.dripperPlaceholderText,
                  ]}
                >
                  {selectedFilterLabel}
                </Text>
                <Ionicons color="#8B4513" name="chevron-down" size={20} />
              </TouchableOpacity>
              {hasAttemptedNext && errors.filter && (
                <Text style={createRecipeStyles.errorText}>
                  {errors.filter.message}
                </Text>
              )}
            </>
          )}
        />
      </View>

      {/* 분쇄도 입력 섹션 */}
      <GrindSizeInput
        hasAttemptedNext={hasAttemptedNext}
        onGrinderPress={onGrinderPress}
      />
    </View>
  );
};
