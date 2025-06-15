import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { TimerDisplayData } from "../../lib/timer/types";

interface TimerDisplayProps {
  timerDisplay: TimerDisplayData;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ timerDisplay }) => {
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
    </View>
  );
};

const styles = StyleSheet.create({
  timerContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 40,
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
});
