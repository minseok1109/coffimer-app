import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { Control, useFieldArray, Controller, FieldErrors, useWatch } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { RecipeEditFormData, getDefaultRecipeStep } from "@/lib/validation/recipeSchema";

interface StepEditorProps {
  control: Control<RecipeEditFormData>;
  errors?: FieldErrors<RecipeEditFormData["steps"]>;
}

export const StepEditor: React.FC<StepEditorProps> = ({ control, errors }) => {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "steps",
  });

  const addStep = useCallback(() => {
    const newStep = getDefaultRecipeStep();
    newStep.step_index = fields.length;
    append(newStep);
  }, [fields.length, append]);

  const removeStep = useCallback((index: number) => {
    if (fields.length <= 1) {
      Alert.alert("알림", "최소 1개의 단계는 있어야 합니다.");
      return;
    }
    
    Alert.alert(
      "단계 삭제",
      `${index + 1}단계를 삭제하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        { 
          text: "삭제", 
          style: "destructive", 
          onPress: () => remove(index) 
        },
      ]
    );
  }, [fields.length, remove]);

  const moveStep = useCallback((fromIndex: number, toIndex: number) => {
    move(fromIndex, toIndex);
  }, [move]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.helperText}>
          시간은 누적으로 작성해주세요 (예: 30초 → 60초 → 90초)
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {fields.map((field, index) => (
          <StepCard
            key={field.id}
            control={control}
            index={index}
            fieldsLength={fields.length}
            onRemove={removeStep}
            onMove={moveStep}
            errors={errors}
          />
        ))}

        {/* 단계 추가 버튼 */}
        <TouchableOpacity style={styles.addButton} onPress={addStep}>
          <Ionicons name="add-circle-outline" size={20} color="#8B4513" />
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
  errors?: FieldErrors<RecipeEditFormData["steps"]>;
}> = React.memo(function StepCard({ control, index, fieldsLength, onRemove, onMove, errors }) {
  
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
              style={styles.actionButton}
              onPress={handleMoveUp}
            >
              <Ionicons name="chevron-up" size={20} color="#666" />
            </TouchableOpacity>
          )}
          
          {/* 아래로 이동 버튼 */}
          {index < fieldsLength - 1 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMoveDown}
            >
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          )}
          
          {/* 삭제 버튼 */}
          {fieldsLength > 1 && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleRemove}
            >
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
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
                <View style={[
                  styles.inputWithSuffix,
                  errors?.[index]?.time && styles.inputError,
                ]}>
                  <TextInput
                    style={styles.numberInput}
                    placeholder="30"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(Number(text) || 0)}
                    value={value?.toString() || ""}
                    keyboardType="numeric"
                  />
                  <Text style={styles.suffix}>초</Text>
                </View>
                {errors?.[index]?.time && (
                  <Text style={styles.errorText}>
                    시간을 입력해주세요
                  </Text>
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
                <View style={[
                  styles.inputWithSuffix,
                  errors?.[index]?.water && styles.inputError,
                ]}>
                  <TextInput
                    style={styles.numberInput}
                    placeholder="50"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(Number(text) || 0)}
                    value={value?.toString() || ""}
                    keyboardType="numeric"
                  />
                  <Text style={styles.suffix}>ml</Text>
                </View>
                {errors?.[index]?.water && (
                  <Text style={styles.errorText}>
                    물량을 입력해주세요
                  </Text>
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
              style={styles.input}
              placeholder="뜸들이기, 1차 추출, 완료 등"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value || ""}
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
              style={[styles.input, styles.textArea]}
              placeholder="이 단계에서 수행할 작업을 설명해주세요"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value || ""}
              multiline
              numberOfLines={3}
            />
          )}
        />
      </View>

      {/* 총 물량 표시 */}
      <TotalWaterDisplay control={control} stepIndex={index} />
    </View>
  );
});

// 총 물량 표시 컴포넌트 (useWatch로 최적화)
const TotalWaterDisplay: React.FC<{
  control: Control<RecipeEditFormData>;
  stepIndex: number;
}> = React.memo(function TotalWaterDisplay({ control, stepIndex }) {
  // useWatch로 steps만 감시하여 불필요한 re-render 방지
  const steps = useWatch({ control, name: "steps" });
  
  const totalWater = useMemo(() => {
    if (!steps || !Array.isArray(steps)) return 0;
    
    let total = 0;
    for (let i = 0; i <= stepIndex; i++) {
      total += steps[i]?.water || 0;
    }
    return total;
  }, [steps, stepIndex]);

  return (
    <View style={styles.totalWaterContainer}>
      <Text style={styles.totalWaterLabel}>
        누적 물량: {totalWater}ml
      </Text>
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
    color: "#666",
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  stepCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  stepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8B4513",
  },
  stepActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  deleteButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: "#fff5f5",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  row: {
    flexDirection: "row",
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
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  inputWithSuffix: {
    flexDirection: "row",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    alignItems: "center",
  },
  numberInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  suffix: {
    paddingRight: 12,
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  totalWaterContainer: {
    backgroundColor: "#e8f5e8",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  totalWaterLabel: {
    fontSize: 12,
    color: "#2d7d32",
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#8B4513",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B4513",
    marginLeft: 8,
  },
  inputError: {
    borderColor: "#ff4444",
    borderWidth: 2,
  },
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
});