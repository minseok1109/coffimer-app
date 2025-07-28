import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import {
  type Control,
  Controller,
  FieldErrors,
  useFieldArray,
  useWatch,
} from 'react-hook-form';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getDefaultRecipeStep,
  type RecipeEditFormData,
} from '@/lib/validation/recipeSchema';

interface StepEditorProps {
  control: Control<RecipeEditFormData>;
  errors?: any; // 배열 에러 타입이 복잡하므로 any 사용
}

export const StepEditor: React.FC<StepEditorProps> = ({ control, errors }) => {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'steps',
  });

  const addStep = useCallback(() => {
    const newStep = getDefaultRecipeStep();
    newStep.step_index = fields.length;
    append(newStep);
  }, [fields.length, append]);

  const removeStep = useCallback(
    (index: number) => {
      if (fields.length <= 1) {
        Alert.alert('알림', '최소 1개의 단계는 있어야 합니다.');
        return;
      }

      Alert.alert('단계 삭제', `${index + 1}단계를 삭제하시겠습니까?`, [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => remove(index),
        },
      ]);
    },
    [fields.length, remove]
  );

  const moveStep = useCallback(
    (fromIndex: number, toIndex: number) => {
      move(fromIndex, toIndex);
    },
    [move]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {fields.map((field, index) => (
          <StepCard
            control={control}
            errors={errors}
            fieldsLength={fields.length}
            index={index}
            key={field.id}
            onMove={moveStep}
            onRemove={removeStep}
          />
        ))}

        {/* 단계 추가 버튼 */}
        <TouchableOpacity onPress={addStep} style={styles.addButton}>
          <Ionicons color="#8B4513" name="add-circle-outline" size={20} />
          <Text style={styles.addButtonText}>단계 추가</Text>
        </TouchableOpacity>

        {/* 전체 에러 메시지 */}
        {errors && Object.keys(errors).length > 0 && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              모든 단계의 필수 정보를 입력해주세요
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// 단계 카드 컴포넌트 (메모이제이션으로 불필요한 re-render 방지)
const StepCard: React.FC<{
  control: Control<RecipeEditFormData>;
  index: number;
  fieldsLength: number;
  onRemove: (index: number) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  errors?: any;
}> = React.memo(function StepCard({
  control,
  index,
  fieldsLength,
  onRemove,
  onMove,
  errors,
}) {
  const handleMoveUp = useCallback(() => {
    onMove(index, index - 1);
  }, [index, onMove]);

  const handleMoveDown = useCallback(() => {
    onMove(index, index + 1);
  }, [index, onMove]);

  const handleRemove = useCallback(() => {
    onRemove(index);
  }, [index, onRemove]);

  return (
    <View style={styles.stepCard}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>{index + 1}단계</Text>
        <View style={styles.stepActions}>
          {/* 위로 이동 버튼 */}
          {index > 0 && (
            <TouchableOpacity
              onPress={handleMoveUp}
              style={styles.actionButton}
            >
              <Ionicons color="#666" name="chevron-up" size={20} />
            </TouchableOpacity>
          )}

          {/* 아래로 이동 버튼 */}
          {index < fieldsLength - 1 && (
            <TouchableOpacity
              onPress={handleMoveDown}
              style={styles.actionButton}
            >
              <Ionicons color="#666" name="chevron-down" size={20} />
            </TouchableOpacity>
          )}

          {/* 삭제 버튼 */}
          {fieldsLength > 1 && (
            <TouchableOpacity
              onPress={handleRemove}
              style={styles.deleteButton}
            >
              <Ionicons color="#ff4444" name="trash-outline" size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 시간과 물량 입력 */}
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.inputLabel}>시간 (초) *</Text>
          <Controller
            control={control}
            name={`steps.${index}.time`}
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <View
                  style={[
                    styles.inputWithSuffix,
                    errors?.[index]?.time && styles.inputError,
                  ]}
                >
                  <TextInput
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(Number(text) || 0)}
                    placeholder="30"
                    placeholderTextColor="#999"
                    style={styles.numberInput}
                    value={value?.toString() || ''}
                  />
                  <Text style={styles.suffix}>초</Text>
                </View>
                {errors?.[index]?.time && (
                  <Text style={styles.errorText}>시간을 입력해주세요</Text>
                )}
              </>
            )}
          />
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.inputLabel}>물량 (ml) *</Text>
          <Controller
            control={control}
            name={`steps.${index}.water`}
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <View
                  style={[
                    styles.inputWithSuffix,
                    errors?.[index]?.water && styles.inputError,
                  ]}
                >
                  <TextInput
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(Number(text) || 0)}
                    placeholder="50"
                    placeholderTextColor="#999"
                    style={styles.numberInput}
                    value={value?.toString() || ''}
                  />
                  <Text style={styles.suffix}>ml</Text>
                </View>
                {errors?.[index]?.water && (
                  <Text style={styles.errorText}>물량을 입력해주세요</Text>
                )}
              </>
            )}
          />
        </View>
      </View>

      {/* 단계 제목 */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>단계 제목</Text>
        <Controller
          control={control}
          name={`steps.${index}.title`}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="뜸들이기, 1차 추출, 완료 등"
              placeholderTextColor="#999"
              style={styles.input}
              value={value || ''}
            />
          )}
        />
      </View>

      {/* 단계 설명 */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>단계 설명</Text>
        <Controller
          control={control}
          name={`steps.${index}.description`}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              multiline
              numberOfLines={3}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="이 단계에서 수행할 작업을 설명해주세요"
              placeholderTextColor="#999"
              style={[styles.input, styles.textArea]}
              value={value || ''}
            />
          )}
        />
      </View>

      {/* 총 물량 표시 */}
      <TotalWaterDisplay control={control} stepIndex={index} />
    </View>
  );
});

// 총 시간 및 누적 물량 표시 컴포넌트 (useWatch로 최적화)
const TotalWaterDisplay: React.FC<{
  control: Control<RecipeEditFormData>;
  stepIndex: number;
}> = React.memo(function TotalWaterDisplay({ control, stepIndex }) {
  // useWatch로 steps만 감시하여 불필요한 re-render 방지
  const steps = useWatch({ control, name: 'steps' });

  const { totalTime, totalWater } = useMemo(() => {
    if (!(steps && Array.isArray(steps)))
      return { totalTime: 0, totalWater: 0 };

    let totalTime = 0;
    let totalWater = 0;

    for (let i = 0; i <= stepIndex; i++) {
      const time = steps[i]?.time || 0;
      const water = steps[i]?.water || 0;

      totalTime += time;
      totalWater += water;
    }

    return { totalTime, totalWater };
  }, [steps, stepIndex]);

  return (
    <View style={styles.totalContainer}>
      {/* <View style={styles.totalTimeContainer}>
        <Text style={styles.totalTimeLabel}>총 시간: {totalTime}초</Text>
      </View> */}
      <View style={styles.totalWaterContainer}>
        <Text style={styles.totalWaterLabel}>누적 물량: {totalWater}ml</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 300,
  },
  header: {
    marginBottom: 16,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  stepCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  stepActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  deleteButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  suffix: {
    paddingRight: 12,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  totalContainer: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'flex-start',
  },
  totalTimeContainer: {
    backgroundColor: '#fff3cd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  totalTimeLabel: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '600',
  },
  totalWaterContainer: {
    backgroundColor: '#e8f5e8',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  totalWaterLabel: {
    fontSize: 12,
    color: '#2d7d32',
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B4513',
    marginLeft: 6,
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
});
