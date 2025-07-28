import { createRecipeStyles } from "@/styles/create-recipe.styles";
import type { RecipeFormData } from "@/types/recipe-form";
import type React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useGrindSizeConversion } from "./useGrindSizeConversion";

interface ClicksInputProps {
  hasAttemptedNext?: boolean;
  grinderId?: string;
}

export const ClicksInput: React.FC<ClicksInputProps> = ({
  hasAttemptedNext = false,
  grinderId,
}) => {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<RecipeFormData>();

  const grindClicks = watch("grindClicks");
  const conversionResult = useGrindSizeConversion(grinderId, grindClicks);

  return (
    <Controller
      control={control}
      name="grindClicks"
      render={({ field: { onChange, onBlur, value } }) => (
        <>
          <View
            style={[
              createRecipeStyles.inputWithSuffix,
              hasAttemptedNext &&
                errors.grindClicks &&
                createRecipeStyles.inputError,
            ]}
          >
            <TextInput
              accessibilityHint="선택한 그라인더의 클릭수를 입력하세요"
              accessibilityLabel="그라인더 클릭수 입력"
              keyboardType="numeric"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="클릭 수"
              placeholderTextColor="#999"
              style={createRecipeStyles.numberInput}
              value={value}
            />
            <Text style={createRecipeStyles.suffix}>클릭</Text>
          </View>

          {hasAttemptedNext && errors.grindClicks && (
            <Text style={createRecipeStyles.errorText}>
              {errors.grindClicks.message}
            </Text>
          )}

          {/* 예상 마이크론 표시 및 에러/경고 처리 */}
          {conversionResult.value && (
            <Text style={styles.estimatedText}>{conversionResult.value}</Text>
          )}
          {conversionResult.error && (
            <Text style={styles.errorFeedback}>
              ⚠️ {conversionResult.error}
            </Text>
          )}
          {conversionResult.warning && (
            <Text style={styles.warningFeedback}>
              💡 {conversionResult.warning}
            </Text>
          )}
        </>
      )}
    />
  );
};

const styles = StyleSheet.create({
  estimatedText: {
    fontSize: 12,
    color: "#8B4513",
    marginTop: 4,
    fontWeight: "500",
    textAlign: "center",
    backgroundColor: "#fff3e0",
    padding: 4,
    borderRadius: 4,
  },
  errorFeedback: {
    fontSize: 12,
    color: "#d32f2f",
    marginTop: 4,
    fontWeight: "500",
    textAlign: "center",
    backgroundColor: "#ffebee",
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ffcdd2",
  },
  warningFeedback: {
    fontSize: 12,
    color: "#f57c00",
    marginTop: 4,
    fontWeight: "500",
    textAlign: "center",
    backgroundColor: "#fff8e1",
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ffecb3",
  },
});
