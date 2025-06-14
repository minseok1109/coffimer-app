import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StepInfo } from '../../lib/timer/types';

interface ProgressBarsProps {
  currentStepInfo: StepInfo;
}

export const ProgressBars: React.FC<ProgressBarsProps> = ({ currentStepInfo }) => {
  return (
    <View style={styles.progressContainer}>
      {/* Current Step Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>현재 단계 진행률</Text>
          <Text style={styles.progressPercentage}>
            {Math.round(currentStepInfo.progress)}%
          </Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${currentStepInfo.progress}%` },
            ]}
          />
        </View>
      </View>

      {/* Total Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>전체 진행률</Text>
          <Text style={styles.progressPercentage}>
            {Math.round(currentStepInfo.totalProgress)}%
          </Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.totalProgressBarFill,
              { width: `${currentStepInfo.totalProgress}%` },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    width: "100%",
    gap: 16,
  },
  progressSection: {
    width: "100%",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6c757d",
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6B35",
  },
  progressBarBackground: {
    width: "100%",
    height: 8,
    backgroundColor: "#e9ecef",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FF6B35",
    borderRadius: 4,
  },
  totalProgressBarFill: {
    height: "100%",
    backgroundColor: "#8B4513",
    borderRadius: 4,
  },
});