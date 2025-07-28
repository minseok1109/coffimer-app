import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRecipe } from '@/hooks/useRecipes';
import {
  ErrorState,
  ProgressBars,
  StepCard,
  TimerControls,
  TimerHeader,
} from '../../../components/timer';
import { useStepInfo, useWaterCalculation } from '../../../hooks/timer';
import { useRecipeTimer } from '../../../hooks/useRecipeTimer';
import { calculateActualTotalTime } from '../../../lib/timer/formatters';

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
        <TimerHeader onBack={() => router.back()} title="레시피 타이머" />
        <ErrorState message="레시피를 찾을 수 없습니다." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TimerHeader onBack={() => router.back()} title={recipe.name} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scrollContainer}
      >
        {currentStepInfo && recipe.recipe_steps && (
          <ProgressBars
            canGoToNext={currentStep < recipe.recipe_steps.length - 1}
            canGoToPrevious={currentStep > 0}
            currentStepInfo={currentStepInfo}
            currentTime={currentTime}
            onNextStep={goToNextStep}
            onPreviousStep={goToPreviousStep}
            totalTime={calculateActualTotalTime(recipe.recipe_steps)}
          />
        )}
        {currentStepInfo && (
          <StepCard
            currentStepInfo={currentStepInfo}
            nextStepInfo={nextStepInfo}
            recipe={recipe}
            waterInfo={waterInfo}
          />
        )}
      </ScrollView>
      {recipe.recipe_steps && (
        <TimerControls
          isRunning={isRunning}
          onReset={resetTimer}
          onToggleTimer={toggleTimer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
});
