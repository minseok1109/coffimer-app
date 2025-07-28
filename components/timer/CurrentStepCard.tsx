import type React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { RecipeWithSteps } from '@/types/recipe';
import type { StepInfo } from '@/types/timer';
import type { WaterInfo } from '../../lib/timer/types';
import { WaterProgressBar } from './WaterProgressBar';

interface CurrentStepCardProps {
  currentStepInfo: StepInfo;
  waterInfo: WaterInfo;
  recipe?: RecipeWithSteps;
}

export const CurrentStepCard: React.FC<CurrentStepCardProps> = ({
  currentStepInfo,
  waterInfo,
  recipe,
}) => {
  return (
    <View style={styles.currentStepCard}>
      <View style={styles.currentStepHeader}>
        <Text style={styles.currentStepLabel}>현재 단계 정보</Text>
      </View>

      <WaterProgressBar
        currentStepInfo={currentStepInfo}
        recipe={recipe}
        waterInfo={waterInfo}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  currentStepCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF6B35',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  currentStepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  currentStepLabel: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepCounter: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
  },
  descriptionContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    flex: 1,
  },
});
