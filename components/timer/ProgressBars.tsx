import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatTime } from "../../lib/timer/formatters";
import { StepInfo } from "../../lib/timer/types";

interface ProgressBarsProps {
  currentStepInfo: StepInfo;
  currentTime: number;
  totalTime: number;
  onPreviousStep: () => void;
  onNextStep: () => void;
  canGoToPrevious: boolean;
  canGoToNext: boolean;
}

export const ProgressBars: React.FC<ProgressBarsProps> = ({
  currentStepInfo,
  currentTime,
  totalTime,
  onPreviousStep,
  onNextStep,
  canGoToPrevious,
  canGoToNext,
}) => {
  const progressValue = Math.round(currentStepInfo.progress);

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressCard}>
        <View style={styles.timeProgressSection}>
          <View style={styles.currentTimeContainer}>
            <Text style={styles.currentTimeLabel}>현재 시간</Text>
            <View style={styles.timeNavigationRow}>
              <TouchableOpacity
                style={[
                  styles.stepNavigationButton,
                  !canGoToPrevious && styles.stepNavigationButtonDisabled,
                ]}
                onPress={onPreviousStep}
                disabled={!canGoToPrevious}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={canGoToPrevious ? "#FF6B35" : "#ccc"}
                />
              </TouchableOpacity>

              <Text style={styles.currentTimeValue}>
                {formatTime(currentTime)}
              </Text>

              <TouchableOpacity
                style={[
                  styles.stepNavigationButton,
                  !canGoToNext && styles.stepNavigationButtonDisabled,
                ]}
                onPress={onNextStep}
                disabled={!canGoToNext}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={canGoToNext ? "#FF6B35" : "#ccc"}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.timeProgressRow}>
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>단계 완료</Text>
              <Text style={styles.timeValue}>
                {formatTime(currentStepInfo.stepEndTime)}
              </Text>
            </View>
            <View style={styles.timeDivider} />
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>전체</Text>
              <Text style={styles.timeValue}>{formatTime(totalTime)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>{currentStepInfo.step.title}</Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${currentStepInfo.progress}%`,
                  backgroundColor: getProgressColor(progressValue),
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
  if (progress < 30) return "#FF6B35"; // 오렌지
  if (progress < 70) return "#FFA726"; // 밝은 오렌지
  return "#4CAF50"; // 초록
};

const styles = StyleSheet.create({
  progressContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 20,
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
  timeProgressSection: {
    marginBottom: 24,
    alignItems: "center",
  },
  currentTimeContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  currentTimeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8e9aaf",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  currentTimeValue: {
    fontSize: 64,
    fontWeight: "900",
    color: "#FF6B35",
    lineHeight: 64,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  timeProgressRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  timeItem: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8e9aaf",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#495057",
  },
  timeDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#e9ecef",
    marginHorizontal: 8,
  },
  timeNavigationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  stepNavigationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: "#FF6B35",
  },
  stepNavigationButtonDisabled: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e9ecef",
    shadowOpacity: 0.05,
    elevation: 1,
  },
});
