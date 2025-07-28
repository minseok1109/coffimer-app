import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  type BottomSheetRef,
  DripperBottomSheet,
} from '@/components/create-recipe/DripperBottomSheet';
import { FilterBottomSheet } from '@/components/create-recipe/FilterBottomSheet';
import {
  defaultDripperOptions,
  getDripperLabel,
} from '@/constants/dripperOptions';
import {
  defaultFilterOptions,
  getFilterLabel,
} from '@/constants/filterOptions';
import {
  getDefaultRecipe,
  getDefaultRecipeStep,
  type RecipeEditFormData,
  recipeEditSchema,
} from '@/lib/validation/recipeSchema';
import { transformEditFormDataToRecipe } from '@/lib/recipeApi';
import { smartTimeConversion } from '@/lib/timer/formatters';
import type { RecipeWithSteps } from '@/types/recipe';
import { StepEditor } from './StepEditor';

interface EditFormProps {
  recipe: RecipeWithSteps;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EditForm: React.FC<EditFormProps> = ({
  recipe,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<RecipeEditFormData>({
    resolver: zodResolver(recipeEditSchema),
    defaultValues: {
      recipe: getDefaultRecipe(),
      steps: [getDefaultRecipeStep()],
    },
  });

  const dripperBottomSheetRef = useRef<BottomSheetRef>(null);
  const filterBottomSheetRef = useRef<BottomSheetRef>(null);

  // 기존 레시피 데이터로 폼 초기화
  useEffect(() => {
    if (recipe) {
      // 원본 스텝 데이터
      const originalSteps = recipe.recipe_steps.map((step) => ({
        title: step.title || '',
        description: step.description || '',
        time: step.time,
        water: step.water || 0,
        total_water: step.total_water || null,
        step_index: step.step_index,
      }));

      // 스마트 변환: 자동으로 누적/개별 시간 감지하여 개별 시간으로 정규화
      const { steps: normalizedSteps, wasCumulative } = smartTimeConversion(originalSteps);

      const formData: RecipeEditFormData = {
        recipe: {
          name: recipe.name,
          description: recipe.description || '',
          coffee: recipe.coffee,
          water: recipe.water,
          water_temperature: recipe.water_temperature,
          dripper: recipe.dripper || '',
          filter: recipe.filter || '',
          ratio: recipe.ratio || 15,
          micron: recipe.micron || null,
          youtube_url: recipe.youtube_url || '',
          is_public: recipe.is_public,
          total_time: recipe.total_time,
        },
        steps: normalizedSteps,
      };
      reset(formData);

      // 개발 환경에서 변환 정보 로깅
      if (process.env.NODE_ENV === 'development') {
        console.log(`[EditForm] 시간 데이터 형태: ${wasCumulative ? '누적 시간' : '개별 시간'}`);
      }
    }
  }, [recipe, reset]);

  const coffeeAmount = watch('recipe.coffee');
  const waterAmount = watch('recipe.water');
  const steps = watch('steps');

  // 비율 자동 계산
  useEffect(() => {
    if (coffeeAmount && waterAmount && coffeeAmount > 0) {
      const ratio = waterAmount / coffeeAmount;
      setValue('recipe.ratio', Math.round(ratio * 10) / 10);
    }
  }, [coffeeAmount, waterAmount, setValue]);

  // 총 시간 자동 계산 (모든 단계의 시간 합계)
  useEffect(() => {
    if (steps && Array.isArray(steps) && steps.length > 0) {
      // 모든 단계의 시간을 합산하여 총 시간 계산
      const totalTime = steps.reduce((sum, step) => {
        return sum + (step?.time || 0);
      }, 0);
      setValue('recipe.total_time', totalTime);
    }
  }, [steps, setValue]);

  const handleSavePress = async (data: RecipeEditFormData) => {
    try {
      // 수정 데이터를 생성과 동일한 형식으로 변환 (누적 시간 적용)
      const transformedData = transformEditFormDataToRecipe(data);
      await onSave(transformedData as any);
    } catch (error) {
      Alert.alert(
        '저장 실패',
        '레시피 저장 중 오류가 발생했습니다. 다시 시도해주세요.'
      );
    }
  };

  const handleCancelPress = () => {
    if (isDirty) {
      Alert.alert(
        '변경사항이 있습니다',
        '저장하지 않은 변경사항이 있습니다. 정말 취소하시겠습니까?',
        [
          { text: '계속 수정', style: 'cancel' },
          { text: '취소', style: 'destructive', onPress: onCancel },
        ]
      );
    } else {
      onCancel();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* 레시피 기본 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>레시피 이름 *</Text>
            <Controller
              control={control}
              name="recipe.name"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <TextInput
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="레시피 이름을 입력하세요"
                    placeholderTextColor="#999"
                    style={[
                      styles.input,
                      errors.recipe?.name && styles.inputError,
                    ]}
                    value={value}
                  />
                  {errors.recipe?.name && (
                    <Text style={styles.errorText}>
                      {errors.recipe.name.message}
                    </Text>
                  )}
                </>
              )}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>레시피 설명</Text>
            <Controller
              control={control}
              name="recipe.description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  multiline
                  numberOfLines={3}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="레시피에 대한 설명을 입력하세요"
                  placeholderTextColor="#999"
                  style={[styles.input, styles.textArea]}
                  value={value || ''}
                />
              )}
            />
          </View>
        </View>

        {/* 재료 및 도구 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>재료 및 도구</Text>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>원두량 (g) *</Text>
              <Controller
                control={control}
                name="recipe.coffee"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <View
                      style={[
                        styles.inputWithSuffix,
                        errors.recipe?.coffee && styles.inputError,
                      ]}
                    >
                      <TextInput
                        keyboardType="numeric"
                        onBlur={onBlur}
                        onChangeText={(text) => onChange(Number(text) || 0)}
                        placeholder="20"
                        placeholderTextColor="#999"
                        style={styles.numberInput}
                        value={value?.toString() || ''}
                      />
                      <Text style={styles.suffix}>g</Text>
                    </View>
                    {errors.recipe?.coffee && (
                      <Text style={styles.errorText}>
                        {errors.recipe.coffee.message}
                      </Text>
                    )}
                  </>
                )}
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>물량 (ml) *</Text>
              <Controller
                control={control}
                name="recipe.water"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <View
                      style={[
                        styles.inputWithSuffix,
                        errors.recipe?.water && styles.inputError,
                      ]}
                    >
                      <TextInput
                        keyboardType="numeric"
                        onBlur={onBlur}
                        onChangeText={(text) => onChange(Number(text) || 0)}
                        placeholder="300"
                        placeholderTextColor="#999"
                        style={styles.numberInput}
                        value={value?.toString() || ''}
                      />
                      <Text style={styles.suffix}>ml</Text>
                    </View>
                    {errors.recipe?.water && (
                      <Text style={styles.errorText}>
                        {errors.recipe.water.message}
                      </Text>
                    )}
                  </>
                )}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>물 온도 (°C) *</Text>
              <Controller
                control={control}
                name="recipe.water_temperature"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <View
                      style={[
                        styles.inputWithSuffix,
                        errors.recipe?.water_temperature && styles.inputError,
                      ]}
                    >
                      <TextInput
                        keyboardType="numeric"
                        onBlur={onBlur}
                        onChangeText={(text) => onChange(Number(text) || 0)}
                        placeholder="92"
                        placeholderTextColor="#999"
                        style={styles.numberInput}
                        value={value?.toString() || ''}
                      />
                      <Text style={styles.suffix}>°C</Text>
                    </View>
                    {errors.recipe?.water_temperature && (
                      <Text style={styles.errorText}>
                        {errors.recipe.water_temperature.message}
                      </Text>
                    )}
                  </>
                )}
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>비율 (1:n)</Text>
              <Controller
                control={control}
                name="recipe.ratio"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputWithSuffix}>
                    <Text style={styles.ratioPrefix}>1:</Text>
                    <TextInput
                      keyboardType="numeric"
                      onBlur={onBlur}
                      onChangeText={(text) => onChange(Number(text) || 0)}
                      placeholder="15"
                      placeholderTextColor="#999"
                      style={styles.numberInput}
                      value={value?.toString() || ''}
                    />
                  </View>
                )}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>드리퍼</Text>
            <Controller
              control={control}
              name="recipe.dripper"
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity
                  onPress={() => dripperBottomSheetRef.current?.expand()}
                  style={styles.selector}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      !value && styles.selectorPlaceholder,
                    ]}
                  >
                    {value ? getDripperLabel(value) : '드리퍼를 선택하세요'}
                  </Text>
                  <Ionicons color="#8B4513" name="chevron-down" size={20} />
                </TouchableOpacity>
              )}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>필터</Text>
            <Controller
              control={control}
              name="recipe.filter"
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity
                  onPress={() => filterBottomSheetRef.current?.expand()}
                  style={styles.selector}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      !value && styles.selectorPlaceholder,
                    ]}
                  >
                    {value ? getFilterLabel(value) : '필터를 선택하세요'}
                  </Text>
                  <Ionicons color="#8B4513" name="chevron-down" size={20} />
                </TouchableOpacity>
              )}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>YouTube URL</Text>
            <Controller
              control={control}
              name="recipe.youtube_url"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <TextInput
                    keyboardType="url"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="https://youtube.com/watch?v=..."
                    placeholderTextColor="#999"
                    style={[
                      styles.input,
                      errors.recipe?.youtube_url && styles.inputError,
                    ]}
                    value={value || ''}
                  />
                  {errors.recipe?.youtube_url && (
                    <Text style={styles.errorText}>
                      {errors.recipe.youtube_url.message}
                    </Text>
                  )}
                </>
              )}
            />
          </View>

          <View style={styles.switchGroup}>
            <Text style={styles.label}>공개 설정</Text>
            <Controller
              control={control}
              name="recipe.is_public"
              render={({ field: { onChange, value } }) => (
                <Switch
                  onValueChange={onChange}
                  thumbColor="#fff"
                  trackColor={{ false: '#ddd', true: '#8B4513' }}
                  value={value}
                />
              )}
            />
          </View>
        </View>

        {/* 단계 편집 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>추출 단계</Text>
          <StepEditor control={control} errors={errors.steps} />
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          disabled={isLoading}
          onPress={handleCancelPress}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelButtonText}>취소</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={isLoading}
          onPress={handleSubmit(handleSavePress)}
          style={[styles.saveButton, isLoading && styles.disabledButton]}
        >
          {isLoading ? (
            <Text style={styles.saveButtonText}>저장 중...</Text>
          ) : (
            <Text style={styles.saveButtonText}>저장</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* BottomSheets */}
      <DripperBottomSheet
        onSelect={(value) => setValue('recipe.dripper', value)}
        options={defaultDripperOptions}
        ref={dripperBottomSheetRef}
        selectedValue={watch('recipe.dripper') || undefined}
      />

      <FilterBottomSheet
        onSelect={(value) => setValue('recipe.filter', value)}
        options={defaultFilterOptions}
        ref={filterBottomSheetRef}
        selectedValue={watch('recipe.filter') || undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputWithSuffix: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  numberInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  suffix: {
    paddingRight: 16,
    fontSize: 16,
    color: '#666',
  },
  ratioPrefix: {
    paddingLeft: 16,
    fontSize: 16,
    color: '#666',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#8B4513',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#8B4513',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#8B4513',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  selector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectorPlaceholder: {
    color: '#999',
  },
});
