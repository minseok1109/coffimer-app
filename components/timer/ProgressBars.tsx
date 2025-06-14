import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StepInfo } from '../../lib/timer/types';

interface ProgressBarsProps {
  currentStepInfo: StepInfo;
}

export const ProgressBars: React.FC<ProgressBarsProps> = ({ currentStepInfo }) => {
  const progressValue = Math.round(currentStepInfo.progress);
  
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>{currentStepInfo.step.title}</Text>
          <View style={styles.percentageContainer}>
            <Text style={styles.progressPercentage}>{progressValue}%</Text>
          </View>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { 
                  width: `${currentStepInfo.progress}%`,
                  backgroundColor: getProgressColor(progressValue)
                },
              ]}
            />
          </View>
        </View>
        
        {currentStepInfo.step.description && (
          <View style={styles.progressFooter}>
            <Text style={styles.progressDescription}>
              {currentStepInfo.step.description}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const getProgressColor = (progress: number) => {
  if (progress < 30) return '#FF6B35'; // 오렌지
  if (progress < 70) return '#FFA726'; // 밝은 오렌지
  return '#4CAF50'; // 초록
};

const styles = StyleSheet.create({
  progressContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  progressCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2c3e50",
    flex: 1,
  },
  percentageContainer: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FF6B35",
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    width: "100%",
    height: 12,
    backgroundColor: "#f1f3f4",
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
    position: "relative",
  },
  progressFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  progressDescription: {
    fontSize: 14,
    color: "#6c757d",
    lineHeight: 20,
    fontStyle: "italic",
  },
});