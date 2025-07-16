import {
  BottomSheetRef,
  DripperBottomSheet,
} from "@/components/create-recipe/DripperBottomSheet";
import { FilterBottomSheet } from "@/components/create-recipe/FilterBottomSheet";
import {
  defaultDripperOptions,
  getDripperLabel,
} from "@/constants/dripperOptions";
import {
  defaultFilterOptions,
  getFilterLabel,
} from "@/constants/filterOptions";
import {
  RecipeEditFormData,
  getDefaultRecipe,
  getDefaultRecipeStep,
  recipeEditSchema,
} from "@/lib/validation/recipeSchema";
import { RecipeWithSteps } from "@/types/recipe";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StepEditor } from "./StepEditor";

interface EditFormProps {
  recipe: RecipeWithSteps;
  onSave: (data: RecipeEditFormData) => Promise<void>;
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
      const formData: RecipeEditFormData = {
        recipe: {
          name: recipe.name,
          description: recipe.description || "",
          coffee: recipe.coffee,
          water: recipe.water,
          water_temperature: recipe.water_temperature,
          dripper: recipe.dripper || "",
          filter: recipe.filter || "",
          ratio: recipe.ratio || 15,
          micron: recipe.micron || null,
          youtube_url: recipe.youtube_url || "",
          is_public: recipe.is_public || false,
          total_time: recipe.total_time,
        },
        steps: recipe.recipe_steps.map((step) => ({
          title: step.title || "",
          description: step.description || "",
          time: step.time,
          water: step.water || 0,
          total_water: step.total_water || null,
          step_index: step.step_index,
        })),
      };
      reset(formData);
    }
  }, [recipe, reset]);

  const coffeeAmount = watch("recipe.coffee");
  const waterAmount = watch("recipe.water");
  const steps = watch("steps");

  // 비율 자동 계산
  useEffect(() => {
    if (coffeeAmount && waterAmount && coffeeAmount > 0) {
      const ratio = waterAmount / coffeeAmount;
      setValue("recipe.ratio", Math.round(ratio * 10) / 10);
    }
  }, [coffeeAmount, waterAmount, setValue]);

  // 총 시간 자동 계산 (마지막 단계의 시간이 전체 시간)
  useEffect(() => {
    if (steps && Array.isArray(steps) && steps.length > 0) {
      // 마지막 단계의 시간이 전체 레시피의 총 시간
      const lastStep = steps[steps.length - 1];
      const totalTime = lastStep?.time || 0;
      setValue("recipe.total_time", totalTime);
    }
  }, [steps, setValue]);

  const handleSavePress = async (data: RecipeEditFormData) => {
    try {
      await onSave(data);
    } catch (error) {
      Alert.alert(
        "저장 실패",
        "레시피 저장 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    }
  };

  const handleCancelPress = () => {
    if (isDirty) {
      Alert.alert(
        "변경사항이 있습니다",
        "저장하지 않은 변경사항이 있습니다. 정말 취소하시겠습니까?",
        [
          { text: "계속 수정", style: "cancel" },
          { text: "취소", style: "destructive", onPress: onCancel },
        ]
      );
    } else {
      onCancel();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
                    style={[
                      styles.input,
                      errors.recipe?.name && styles.inputError,
                    ]}
                    placeholder="레시피 이름을 입력하세요"
                    placeholderTextColor="#999"
                    onBlur={onBlur}
                    onChangeText={onChange}
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
                  style={[styles.input, styles.textArea]}
                  placeholder="레시피에 대한 설명을 입력하세요"
                  placeholderTextColor="#999"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value || ""}
                  multiline
                  numberOfLines={3}
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
                        style={styles.numberInput}
                        placeholder="20"
                        placeholderTextColor="#999"
                        onBlur={onBlur}
                        onChangeText={(text) => onChange(Number(text) || 0)}
                        value={value?.toString() || ""}
                        keyboardType="numeric"
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
                        style={styles.numberInput}
                        placeholder="300"
                        placeholderTextColor="#999"
                        onBlur={onBlur}
                        onChangeText={(text) => onChange(Number(text) || 0)}
                        value={value?.toString() || ""}
                        keyboardType="numeric"
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
                        style={styles.numberInput}
                        placeholder="92"
                        placeholderTextColor="#999"
                        onBlur={onBlur}
                        onChangeText={(text) => onChange(Number(text) || 0)}
                        value={value?.toString() || ""}
                        keyboardType="numeric"
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
                      style={styles.numberInput}
                      placeholder="15"
                      placeholderTextColor="#999"
                      onBlur={onBlur}
                      onChangeText={(text) => onChange(Number(text) || 0)}
                      value={value?.toString() || ""}
                      keyboardType="numeric"
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
                  style={styles.selector}
                  onPress={() => dripperBottomSheetRef.current?.expand()}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      !value && styles.selectorPlaceholder,
                    ]}
                  >
                    {value ? getDripperLabel(value) : "드리퍼를 선택하세요"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#8B4513" />
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
                  style={styles.selector}
                  onPress={() => filterBottomSheetRef.current?.expand()}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      !value && styles.selectorPlaceholder,
                    ]}
                  >
                    {value ? getFilterLabel(value) : "필터를 선택하세요"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#8B4513" />
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
                    style={[
                      styles.input,
                      errors.recipe?.youtube_url && styles.inputError,
                    ]}
                    placeholder="https://youtube.com/watch?v=..."
                    placeholderTextColor="#999"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value || ""}
                    keyboardType="url"
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
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ false: "#ddd", true: "#8B4513" }}
                  thumbColor="#fff"
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
          style={styles.cancelButton}
          onPress={handleCancelPress}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>취소</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.disabledButton]}
          onPress={handleSubmit(handleSavePress)}
          disabled={isLoading}
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
        ref={dripperBottomSheetRef}
        onSelect={(value) => setValue("recipe.dripper", value)}
        selectedValue={watch("recipe.dripper")}
        options={defaultDripperOptions}
      />

      <FilterBottomSheet
        ref={filterBottomSheetRef}
        onSelect={(value) => setValue("recipe.filter", value)}
        selectedValue={watch("recipe.filter")}
        options={defaultFilterOptions}
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
    backgroundColor: "white",
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
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
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  suffix: {
    paddingRight: 16,
    fontSize: 16,
    color: "#666",
  },
  ratioPrefix: {
    paddingLeft: 16,
    fontSize: 16,
    color: "#666",
  },
  switchGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#8B4513",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#8B4513",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 2,
    backgroundColor: "#8B4513",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  inputError: {
    borderColor: "#ff4444",
    borderWidth: 2,
  },
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  selector: {
    flexDirection: "row",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  selectorPlaceholder: {
    color: "#999",
  },
});
