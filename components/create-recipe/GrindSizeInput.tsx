import { createRecipeStyles } from "@/styles/create-recipe.styles";
// import type { RecipeFormData } from "@/types/recipe-form"; // 그라인더 기능 비활성화로 인해 주석처리
import type React from "react";
// import { useCallback } from "react"; // 그라인더 기능 비활성화로 인해 주석처리
// import { useFormContext } from "react-hook-form"; // 그라인더 기능 비활성화로 인해 주석처리
import { Text, View } from "react-native";
import {
  // ClicksInput,
  GrindNotes,
  // GrinderSelector,
  MicronDirectInput,
  // ModeToggle,
} from "./grind-size";

interface GrindSizeInputProps {
  hasAttemptedNext?: boolean;
  onGrinderPress?: () => void;
}

export const GrindSizeInput: React.FC<GrindSizeInputProps> = ({
  hasAttemptedNext = false,
  // onGrinderPress, // 그라인더 기능 비활성화로 인해 주석처리
}) => {
  // const { watch, setValue } = useFormContext<RecipeFormData>();
  // const grindInputMode = watch("grindInputMode");

  // // 입력 모드 변경 콜백 메모이제이션 - 데이터 보존
  // const handleModeChange = useCallback(
  //   (mode: "micron" | "grinder") => {
  //     setValue("grindInputMode", mode);
  //     // 값 삭제 대신 보존: 사용자가 실수로 모드를 바꿔도 데이터 유지
  //     // 필요시 나중에 모드별로 값을 숨기기만 함
  //   },
  //   [setValue]
  // );

  return (
    <View style={createRecipeStyles.inputGroup}>
      <Text style={createRecipeStyles.label}>분쇄도 (선택사항)</Text>

      {/* 입력 모드 토글 - 그라인더 기능 비활성화로 인해 주석처리 */}
      {/* <ModeToggle
        currentMode={grindInputMode}
        onModeChange={handleModeChange}
      /> */}

      {/* 마이크론 직접 입력 모드만 활성화 */}
      <MicronDirectInput hasAttemptedNext={hasAttemptedNext} />

      {/* 그라인더별 클릭수 입력 모드 - 그라인더 기능 비활성화로 인해 주석처리 */}
      {/* {grindInputMode === "grinder" && (
        <View style={createRecipeStyles.gridContainer}>
          <GrinderSelector
            hasAttemptedNext={hasAttemptedNext}
            onGrinderPress={onGrinderPress}
          />
          <ClicksInput hasAttemptedNext={hasAttemptedNext} />
        </View>
      )} */}

      {/* 분쇄도 메모 */}
      <GrindNotes hasAttemptedNext={hasAttemptedNext} />
    </View>
  );
};
