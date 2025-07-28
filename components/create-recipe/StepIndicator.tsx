import type React from 'react';
import { Text, View } from 'react-native';
import { createRecipeStyles } from '@/styles/create-recipe.styles';
import type { StepIndicatorProps } from '@/types/recipe-form';

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
}) => {
  const steps = ['기본 정보', '커피 정보', '추출 가이드', '검토'];

  return (
    <View style={createRecipeStyles.stepIndicatorContainer}>
      {steps.map((label, index) => (
        <View key={index} style={createRecipeStyles.stepItem}>
          <View
            style={[
              createRecipeStyles.stepCircle,
              currentStep === index + 1 && createRecipeStyles.activeStep,
              currentStep > index + 1 && createRecipeStyles.completedStep,
            ]}
          >
            <Text
              style={[
                createRecipeStyles.stepNumber,
                (currentStep === index + 1 || currentStep > index + 1) &&
                  createRecipeStyles.activeStepText,
              ]}
            >
              {currentStep > index + 1 ? '✓' : index + 1}
            </Text>
          </View>
          <Text
            style={[
              createRecipeStyles.stepLabel,
              currentStep === index + 1 && createRecipeStyles.activeStepLabel,
            ]}
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
};
