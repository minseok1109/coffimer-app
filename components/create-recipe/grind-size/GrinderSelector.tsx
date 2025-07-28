// 그라인더 기능 비활성화로 인해 전체 컴포넌트 주석처리
/*
import { useGrinders } from "@/hooks/useGrinders";
import { createRecipeStyles } from "@/styles/create-recipe.styles";
import type { RecipeFormData } from "@/types/recipe-form";
import { Ionicons } from "@expo/vector-icons";
import type React from "react";
import { useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Text, TouchableOpacity } from "react-native";

interface GrinderSelectorProps {
  hasAttemptedNext?: boolean;
  onGrinderPress?: () => void;
}

export const GrinderSelector: React.FC<GrinderSelectorProps> = ({
  hasAttemptedNext = false,
  onGrinderPress,
}) => {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<RecipeFormData>();

  const grindGrinder = watch("grindGrinder");
  const { data: grinders = [], isLoading } = useGrinders();

  const selectedGrinderLabel = useMemo(() => {
    if (!grindGrinder) return "그라인더를 선택하세요";
    if (isLoading) return "로딩 중...";

    const selectedGrinder = grinders.find((g) => g.id === grindGrinder);
    return selectedGrinder ? `${selectedGrinder.brand} ${selectedGrinder.name}` : grindGrinder;
  }, [grindGrinder, grinders, isLoading]);

  return (
    <Controller
      control={control}
      name="grindGrinder"
      render={({ field: { value } }) => (
        <>
          <TouchableOpacity
            accessibilityHint="사용 중인 그라인더를 선택하세요"
            accessibilityLabel="그라인더 선택"
            accessibilityRole="button"
            accessibilityValue={{ text: selectedGrinderLabel }}
            onPress={onGrinderPress}
            style={[
              createRecipeStyles.dripperSelector,
              hasAttemptedNext &&
                errors.grindGrinder &&
                createRecipeStyles.inputError,
            ]}
          >
            <Text
              style={[
                createRecipeStyles.dripperSelectorText,
                !value && createRecipeStyles.dripperPlaceholderText,
              ]}
            >
              {selectedGrinderLabel}
            </Text>
            <Ionicons color="#8B4513" name="chevron-down" size={20} />
          </TouchableOpacity>
          {hasAttemptedNext && errors.grindGrinder && (
            <Text style={createRecipeStyles.errorText}>
              {errors.grindGrinder.message}
            </Text>
          )}
        </>
      )}
    />
  );
};
*/

// 그라인더 기능 비활성화로 인해 임시 더미 컴포넌트 제공
import type React from "react";

interface GrinderSelectorProps {
  hasAttemptedNext?: boolean;
  onGrinderPress?: () => void;
}

export const GrinderSelector: React.FC<GrinderSelectorProps> = () => {
  return null;
};
