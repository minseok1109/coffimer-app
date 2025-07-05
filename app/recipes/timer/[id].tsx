import { useRecipe } from "@/hooks/useRecipes";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  ErrorState,
  ProgressBars,
  StepCard,
  TimerControls,
  TimerHeader,
} from "../../../components/timer";
import { useStepInfo, useWaterCalculation } from "../../../hooks/timer";
import { useRecipeTimer } from "../../../hooks/useRecipeTimer";

export default function RecipeTimer() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data: recipe } = useRecipe(id as string);

  const {
    currentTime,
    isRunning,
    currentStep,
    toggleTimer,
    resetTimer,
    goToPreviousStep,
    goToNextStep,
  } = useRecipeTimer(recipe!);

  const waterInfo = useWaterCalculation(recipe!, currentStep);
  const { currentStepInfo, nextStepInfo } = useStepInfo(
    recipe!,
    currentStep,
    currentTime
  );

  if (!recipe) {
    return (
      <View style={styles.container}>
        <TimerHeader title="레시피 타이머" onBack={() => router.back()} />
        <ErrorState message="레시피를 찾을 수 없습니다." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TimerHeader title={recipe.name} onBack={() => router.back()} />
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {currentStepInfo && recipe.recipe_steps && (
          <ProgressBars
            currentStepInfo={currentStepInfo}
            currentTime={currentTime}
            totalTime={recipe.total_time}
            onPreviousStep={goToPreviousStep}
            onNextStep={goToNextStep}
            canGoToPrevious={currentStep > 0}
            canGoToNext={currentStep < recipe.recipe_steps.length - 1}
          />
        )}
        {currentStepInfo && (
          <StepCard
            currentStepInfo={currentStepInfo}
            nextStepInfo={nextStepInfo}
            waterInfo={waterInfo}
            recipe={recipe}
          />
        )}
      </ScrollView>
      {recipe.recipe_steps && (
        <TimerControls
          isRunning={isRunning}
          onToggleTimer={toggleTimer}
          onReset={resetTimer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
});
