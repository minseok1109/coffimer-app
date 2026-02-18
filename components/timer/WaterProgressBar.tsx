import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { RecipeWithSteps } from '@/types/recipe';
import type { StepInfo } from '@/types/timer';
import type { WaterInfo } from '../../lib/timer/types';

interface WaterProgressBarProps {
  currentStepInfo: StepInfo;
  waterInfo: WaterInfo;
  recipe?: RecipeWithSteps | null;
}

const STEP_COLORS = [
  '#CD853F',
  '#A0522D',
  '#8B7355',
  '#8B4513',
  '#6B4423',
  '#5C4033',
  '#4A3728',
  '#2C1810',
];

export function WaterProgressBar({
  currentStepInfo,
  waterInfo,
  recipe,
}: WaterProgressBarProps) {
  const { totalNeeded, remaining } = waterInfo;
  const currentStepWater =
    Number.parseInt(
      (currentStepInfo.step.water ?? 0).toString().replace('ml', '') || '0'
    ) || 0;

  const stepWaterAmounts = useMemo(() => {
    if (!recipe?.recipe_steps) return [];

    return recipe.recipe_steps.map((step) => {
      const waterAmount =
        Number.parseInt((step.water ?? 0).toString().replace(/[^\d]/g, '')) || 0;
      return waterAmount;
    });
  }, [recipe?.recipe_steps]);

  const cumulativeWaterAmounts = useMemo(() => {
    const cumulative = [];
    let total = 0;
    for (const amount of stepWaterAmounts) {
      total += amount;
      cumulative.push(total);
    }
    return cumulative;
  }, [stepWaterAmounts]);

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          {/* 각 단계별 색상으로 구분된 세그먼트 */}
          {stepWaterAmounts.map((waterAmount, index) => {
            // 현재 단계까지만 표시
            if (index > currentStepInfo.stepNumber - 1) return null;

            const startPercentage =
              index === 0
                ? 0
                : (cumulativeWaterAmounts[index - 1] / totalNeeded) * 100;
            const width = (waterAmount / totalNeeded) * 100;

            return (
              <View
                key={index}
                style={[
                  styles.progressSegment,
                  {
                    left: `${startPercentage}%`,
                    width: `${width}%`,
                    backgroundColor: STEP_COLORS[index % STEP_COLORS.length],
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* 라벨들 */}
      <View style={styles.labelsContainer}>
        <View style={styles.labelItem}>
          <View
            style={[
              styles.colorIndicator,
              {
                backgroundColor:
                  STEP_COLORS[
                    (currentStepInfo.stepNumber - 1) % STEP_COLORS.length
                  ],
              },
            ]}
          />
          <Text style={styles.labelText}>현재 투입해야하는 물량</Text>
          <Text style={styles.labelValue}>{currentStepWater}ml</Text>
        </View>

        <View style={styles.labelItem}>
          <View
            style={[styles.colorIndicator, { backgroundColor: '#E0E0E0' }]}
          />
          <Text style={styles.labelText}>남은 물량</Text>
          <Text style={styles.labelValue}>{remaining}ml</Text>
        </View>

        <View style={styles.labelItem}>
          <View
            style={[styles.colorIndicator, { backgroundColor: '#9E9E9E' }]}
          />
          <Text style={styles.labelText}>총 물량</Text>
          <Text style={styles.labelValue}>{totalNeeded}ml</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  progressSegment: {
    height: '100%',
    position: 'absolute',
    top: 0,
  },
  labelsContainer: {
    gap: 8,
  },
  labelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  labelText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  labelValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
