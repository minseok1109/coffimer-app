import { createRecipeStyles } from "@/styles/create-recipe.styles";
import type { RecipeFormData } from "@/types/recipe-form";
import type React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { StyleSheet, Text, TextInput } from "react-native";

interface GrindNotesProps {
  hasAttemptedNext?: boolean;
}

export const GrindNotes: React.FC<GrindNotesProps> = ({
  hasAttemptedNext = false,
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<RecipeFormData>();

  return (
    <Controller
      control={control}
      name="grindNotes"
      render={({ field: { onChange, onBlur, value } }) => (
        <>
          <TextInput
            accessibilityHint="분쇄도에 대한 추가 정보나 메모를 입력하세요. 최대 200자까지 입력 가능합니다"
            accessibilityLabel="분쇄도 메모 입력"
            maxLength={200}
            multiline
            numberOfLines={2}
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="분쇄도 관련 메모 (선택사항)"
            placeholderTextColor="#999"
            style={[createRecipeStyles.input, styles.notesInput]}
            value={value}
          />
          {hasAttemptedNext && errors.grindNotes && (
            <Text style={createRecipeStyles.errorText}>
              {errors.grindNotes.message}
            </Text>
          )}
        </>
      )}
    />
  );
};

const styles = StyleSheet.create({
  notesInput: {
    height: 60,
    textAlignVertical: "top",
    marginTop: 8,
  },
});
