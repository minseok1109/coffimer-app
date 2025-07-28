// 그라인더 기능 비활성화로 인해 전체 컴포넌트 주석처리
/*
import { useGrinderById } from "@/hooks/useGrinders";
import { createRecipeStyles } from "@/styles/create-recipe.styles";
import type { RecipeFormData } from "@/types/recipe-form";
import type React from "react";
import { useMemo, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Text, TextInput, View } from "react-native";

interface ClicksInputProps {
  hasAttemptedNext?: boolean;
}

export const ClicksInput: React.FC<ClicksInputProps> = ({
  hasAttemptedNext = false,
}) => {
  const {
    control,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext<RecipeFormData>();

  const selectedGrinderId = watch("grindGrinder");
  const { data: selectedGrinder, isLoading: isGrinderLoading } = useGrinderById(selectedGrinderId || null);
  const [customError, setCustomError] = useState<string | null>(null);

  const clickRange = useMemo(() => {
    if (!selectedGrinder) return null;
    return `${selectedGrinder.min_clicks}-${selectedGrinder.max_clicks}`;
  }, [selectedGrinder]);

  const placeholder = useMemo(() => {
    if (!selectedGrinder) return "클릭 수";
    const midRange = Math.round((selectedGrinder.min_clicks + selectedGrinder.max_clicks) / 2);
    return `예: ${midRange}`;
  }, [selectedGrinder]);

  const validateClicks = (value: string): boolean => {
    if (!value || value.trim() === '') {
      setCustomError(null);
      clearErrors("grindClicks");
      return true;
    }

    if (!selectedGrinder) {
      setCustomError("먼저 그라인더를 선택해주세요");
      return false;
    }

    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num)) {
      setCustomError("정수로 입력해주세요");
      return false;
    }

    if (num < selectedGrinder.min_clicks || num > selectedGrinder.max_clicks) {
      setCustomError(`${selectedGrinder.min_clicks}-${selectedGrinder.max_clicks} 범위로 입력해주세요`);
      return false;
    }

    setCustomError(null);
    clearErrors("grindClicks");
    return true;
  };

  if (!selectedGrinderId) {
    return (
      <View style={createRecipeStyles.disabledInputContainer}>
        <Text style={createRecipeStyles.disabledText}>
          먼저 그라인더를 선택해주세요
        </Text>
      </View>
    );
  }

  if (isGrinderLoading) {
    return (
      <View style={createRecipeStyles.disabledInputContainer}>
        <Text style={createRecipeStyles.disabledText}>
          그라인더 정보를 불러오는 중...
        </Text>
      </View>
    );
  }

  if (!selectedGrinder) {
    return (
      <View style={createRecipeStyles.disabledInputContainer}>
        <Text style={createRecipeStyles.disabledText}>
          선택된 그라인더 정보를 찾을 수 없습니다
        </Text>
      </View>
    );
  }

  return (
    <Controller
      control={control}
      name="grindClicks"
      render={({ field: { onChange, onBlur, value } }) => (
        <>
          <View
            style={[
              createRecipeStyles.inputWithSuffix,
              ((hasAttemptedNext && errors.grindClicks) || customError) &&
                createRecipeStyles.inputError,
            ]}
          >
            <TextInput
              accessibilityHint={`${selectedGrinder.min_clicks}부터 ${selectedGrinder.max_clicks} 클릭 범위로 입력하세요`}
              accessibilityLabel="그라인더 클릭 수 입력"
              keyboardType="numeric"
              onBlur={onBlur}
              onChangeText={(text) => {
                onChange(text);
                validateClicks(text);
              }}
              placeholder={placeholder}
              placeholderTextColor="#999"
              style={createRecipeStyles.numberInput}
              value={value}
            />
            <Text style={createRecipeStyles.suffix}>clicks</Text>
          </View>
          {clickRange && (
            <Text style={createRecipeStyles.helperText}>
              {selectedGrinder.brand} {selectedGrinder.name} 범위: {clickRange} clicks
            </Text>
          )}
          {customError && (
            <Text style={createRecipeStyles.errorText}>
              {customError}
            </Text>
          )}
          {hasAttemptedNext && errors.grindClicks && !customError && (
            <Text style={createRecipeStyles.errorText}>
              {errors.grindClicks.message}
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

interface ClicksInputProps {
  hasAttemptedNext?: boolean;
}

export const ClicksInput: React.FC<ClicksInputProps> = () => {
  return null;
};