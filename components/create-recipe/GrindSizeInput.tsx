import { createRecipeStyles } from "@/styles/create-recipe.styles";
import type { RecipeFormData } from "@/types/recipe-form";
import type React from "react";
import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { Text, View } from "react-native";
import {
  ClicksInput,
  GrindNotes,
  GrinderRecommendations,
  GrinderSelector,
  MicronDirectInput,
  ModeToggle,
} from "./grind-size";

interface GrindSizeInputProps {
  hasAttemptedNext?: boolean;
  onGrinderPress?: () => void;
}

export const GrindSizeInput: React.FC<GrindSizeInputProps> = ({
  hasAttemptedNext = false,
  onGrinderPress,
}) => {
  const { watch, setValue } = useFormContext<RecipeFormData>();

  const grindInputMode = watch("grindInputMode");
  const grindGrinder = watch("grindGrinder");

  // 입력 모드 변경 콜백 메모이제이션 - 데이터 보존
  const handleModeChange = useCallback(
    (mode: "micron" | "grinder") => {
      setValue("grindInputMode", mode);
      // 값 삭제 대신 보존: 사용자가 실수로 모드를 바꿔도 데이터 유지
      // 필요시 나중에 모드별로 값을 숨기기만 함
    },
    [setValue]
  );

  return (
    <View style={createRecipeStyles.inputGroup}>
      <Text style={createRecipeStyles.label}>분쇄도 (선택사항)</Text>

      {/* 입력 모드 토글 */}
      <ModeToggle
        currentMode={grindInputMode}
        onModeChange={handleModeChange}
      />

      {/* 마이크론 직접 입력 모드 */}
      {grindInputMode === "micron" && (
        <MicronDirectInput hasAttemptedNext={hasAttemptedNext} />
      )}

      {/* 그라인더별 클릭수 입력 모드 */}
      {grindInputMode === "grinder" && (
        <>
          {/* 그라인더 선택 */}
          <GrinderSelector
            hasAttemptedNext={hasAttemptedNext}
            onGrinderPress={onGrinderPress}
          />

          {/* 그라인더 정보 및 추천 클릭수 버튼 */}
          {grindGrinder && <GrinderRecommendations grinderId={grindGrinder} />}

          {/* 클릭수 입력 */}
          {grindGrinder && (
            <ClicksInput
              hasAttemptedNext={hasAttemptedNext}
              grinderId={grindGrinder}
            />
          )}
        </>
      )}

      {/* 분쇄도 메모 */}
      <GrindNotes hasAttemptedNext={hasAttemptedNext} />
    </View>
  );
};
