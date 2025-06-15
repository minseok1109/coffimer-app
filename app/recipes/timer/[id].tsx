import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  CurrentStepCard,
  ErrorState,
  NextStepCard,
  ProgressBars,
  TimerControls,
  TimerHeader,
} from "../../../components/timer";
import { useStepInfo, useWaterCalculation } from "../../../hooks/timer";
import { useRecipeTimer } from "../../../hooks/useRecipeTimer";
import { getRecipeById, Recipe } from "../../../lib/recipes";

export default function RecipeTimer() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const recipe = getRecipeById(Number(id)) as Recipe;

  const {
    currentTime,
    isRunning,
    currentStep,
    toggleTimer,
    resetTimer,
    goToPreviousStep,
    goToNextStep,
  } = useRecipeTimer(recipe!);

  const waterInfo = useWaterCalculation(recipe, currentStep);
  const { currentStepInfo, nextStepInfo } = useStepInfo(
    recipe,
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
        {currentStepInfo && recipe.steps && (
          <ProgressBars
            currentStepInfo={currentStepInfo}
            currentTime={currentTime}
            totalTime={recipe.totalTime}
            onPreviousStep={goToPreviousStep}
            onNextStep={goToNextStep}
            canGoToPrevious={currentStep > 0}
            canGoToNext={currentStep < recipe.steps.length - 1}
          />
        )}
        {currentStepInfo && (
          <CurrentStepCard
            currentStepInfo={currentStepInfo}
            waterInfo={waterInfo}
            recipe={recipe}
          />
        )}
        {nextStepInfo && <NextStepCard nextStepInfo={nextStepInfo} />}
      </ScrollView>
      {recipe.steps && (
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
    paddingBottom: 20,
  },
});
