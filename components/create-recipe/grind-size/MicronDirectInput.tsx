import { createRecipeStyles } from "@/styles/create-recipe.styles";
import type { RecipeFormData } from "@/types/recipe-form";
import type React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Text, TextInput, View } from "react-native";

interface MicronDirectInputProps {
  hasAttemptedNext?: boolean;
}

export const MicronDirectInput: React.FC<MicronDirectInputProps> = ({
  hasAttemptedNext = false,
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<RecipeFormData>();

  return (
    <Controller
      control={control}
      name="grindMicrons"
      render={({ field: { onChange, onBlur, value } }) => (
        <>
          <View
            style={[
              createRecipeStyles.inputWithSuffix,
              hasAttemptedNext &&
                errors.grindMicrons &&
                createRecipeStyles.inputError,
            ]}
          >
            <TextInput
              accessibilityHint="150부터 1200 마이크론 범위로 입력하세요"
              accessibilityLabel="분쇄도 마이크론 입력"
              keyboardType="numeric"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="예: 600"
              placeholderTextColor="#999"
              style={createRecipeStyles.numberInput}
              value={value}
            />
            <Text style={createRecipeStyles.suffix}>μm</Text>
          </View>
          {hasAttemptedNext && errors.grindMicrons && (
            <Text style={createRecipeStyles.errorText}>
              {errors.grindMicrons.message}
            </Text>
          )}
        </>
      )}
    />
  );
};
