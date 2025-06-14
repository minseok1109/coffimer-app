import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TimerDisplayData, StepInfo } from '../../lib/timer/types';
import { formatTime } from '../../lib/timer/formatters';

interface TimerDisplayProps {
  timerDisplay: TimerDisplayData;
  currentStepInfo: StepInfo | null;
  currentTime: number;
  totalTime: number;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timerDisplay,
  currentStepInfo,
  currentTime,
  totalTime,
}) => {
  return (
    <View style={styles.timerContainer}>
      <View style={styles.timerDisplay}>
        <View style={styles.timerDigitGroup}>
          <Text style={styles.timerDigit}>{timerDisplay.minutes}</Text>
        </View>
        <Text style={styles.timerSeparator}>:</Text>
        <View style={styles.timerDigitGroup}>
          <Text style={styles.timerDigit}>{timerDisplay.seconds}</Text>
        </View>
      </View>

      {currentStepInfo && (
        <View style={styles.timeInfoContainer}>
          <Text style={styles.timeInfoText}>
            {formatTime(currentTime)} /{" "}
            {formatTime(currentStepInfo.stepEndTime)} (전체:{" "}
            {formatTime(totalTime)})
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  timerContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  timerDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  timerDigitGroup: {
    alignItems: "center",
  },
  timerDigit: {
    fontSize: 80,
    fontWeight: "900",
    color: "#333",
    lineHeight: 80,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  timerSeparator: {
    fontSize: 80,
    fontWeight: "900",
    color: "#FF6B35",
    marginHorizontal: 16,
    lineHeight: 80,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  timeInfoContainer: {
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  timeInfoText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    textAlign: "center",
  },
});