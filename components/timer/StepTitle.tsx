import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StepInfo } from '../../lib/timer/types';

interface StepTitleProps {
  currentStepInfo: StepInfo;
}

export const StepTitle: React.FC<StepTitleProps> = ({ currentStepInfo }) => {
  return (
    <View style={styles.currentStepTitleContainer}>
      <Text style={styles.currentStepTitle}>
        {currentStepInfo.step.title}
      </Text>
      <Text style={styles.stepCounter}>
        단계 {currentStepInfo.stepNumber} / {currentStepInfo.totalSteps}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  currentStepTitleContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 32,
    marginTop: 16,
  },
  currentStepTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  stepCounter: {
    fontSize: 16,
    color: "#FF6B35",
    fontWeight: "600",
  },
});