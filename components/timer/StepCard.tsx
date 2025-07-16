import { RecipeWithSteps } from "@/types/recipe";
import { NextStepInfo, StepInfo } from "@/types/timer";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { formatTime } from "../../lib/timer/formatters";
import { WaterInfo } from "../../lib/timer/types";

interface StepCardProps {
  currentStepInfo: StepInfo;
  nextStepInfo: NextStepInfo | null;
  waterInfo: WaterInfo;
  recipe?: RecipeWithSteps;
}

export const StepCard: React.FC<StepCardProps> = ({
  currentStepInfo,
  nextStepInfo,
  waterInfo,
  recipe,
}) => {
  const { totalNeeded, remaining } = waterInfo;
  const currentStepWater =
    parseInt(currentStepInfo.step.water.toString().replace("ml", "") || "0") ||
    0;
  const usedWater = totalNeeded - remaining;
  const progressPercentage = (usedWater / totalNeeded) * 100;

  return (
    <View style={styles.container}>
      {/* Water Tracking Section */}
      <View style={styles.waterTrackingSection}>
        {/* Enhanced Progress Bar */}
        <View style={styles.enhancedProgressContainer}>
          <View style={styles.enhancedProgressBar}>
            <View
              style={[
                styles.enhancedProgressFill,
                { width: `${progressPercentage}%` },
              ]}
            />
          </View>
        </View>

        {/* Water Stats */}
        <View style={styles.waterStats}>
          <View style={styles.waterStatItem}>
            <View
              style={[
                styles.waterStatIndicator,
                { backgroundColor: "#FF6B35" },
              ]}
            />
            <Text style={styles.waterStatLabel}>누적</Text>
            <Text style={styles.waterStatValue}>{usedWater}ml</Text>
          </View>
          <View style={styles.waterStatItem}>
            <View
              style={[
                styles.waterStatIndicator,
                { backgroundColor: "#E0E0E0" },
              ]}
            />
            <Text style={styles.waterStatLabel}>남은 물</Text>
            <Text style={styles.waterStatValue}>{remaining}ml</Text>
          </View>
          <View style={styles.waterStatItem}>
            <View
              style={[
                styles.waterStatIndicator,
                { backgroundColor: "#E0E0E0" },
              ]}
            />
            <Text style={styles.waterStatLabel}>총 </Text>
            <Text style={styles.waterStatValue}>{totalNeeded}ml</Text>
          </View>
        </View>
      </View>

      {/* Main Info Section */}
      <View style={styles.mainInfoSection}>
        {/* Current Step Card */}
        <View style={styles.currentStepCard}>
          <View style={styles.stepCardHeader}>
            <Ionicons name="water" size={18} color="#FF6B35" />
            <Text style={styles.stepCardLabel}>이번 단계</Text>
          </View>
          <Text style={styles.stepCardAmount}>{currentStepWater}ml</Text>
          <Text style={styles.stepCardTime}>
            {formatTime(currentStepInfo.step.time)}
          </Text>
          <Text style={styles.stepCardDescription}>
            {currentStepInfo.step.title}
          </Text>
        </View>

        {/* Next Step Card */}
        {nextStepInfo && (
          <View style={styles.nextStepCard}>
            <View style={styles.stepCardHeader}>
              <Ionicons name="time-outline" size={18} color="#D2691E" />
              <Text style={[styles.stepCardLabel, styles.nextStepLabel]}>
                다음 단계
              </Text>
            </View>
            <Text style={[styles.stepCardAmount, styles.nextStepAmount]}>
              {nextStepInfo.step.water}ml
            </Text>
            <Text style={[styles.stepCardTime, styles.nextStepTime]}>
              {formatTime(nextStepInfo.step.time)}
            </Text>
            <Text
              style={[styles.stepCardDescription, styles.nextStepDescription]}
            >
              {nextStepInfo.step.title}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
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

  // Main Info Section
  mainInfoSection: {
    flexDirection: "row",
    padding: 16,
    paddingTop: 16,
    gap: 12,
  },
  currentStepCard: {
    flex: 1,
    backgroundColor: "#FFF8F5",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#FF6B35",
    alignItems: "center",
  },
  nextStepCard: {
    flex: 1,
    backgroundColor: "#FDF7F0",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#D2691E",
    alignItems: "center",
  },
  stepCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  stepCardLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FF6B35",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  nextStepLabel: {
    color: "#D2691E",
  },
  stepCardAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B35",
    marginBottom: 2,
  },
  nextStepAmount: {
    fontSize: 16,
    color: "#D2691E",
  },
  stepCardTime: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
  },
  nextStepTime: {
    fontSize: 11,
  },
  stepCardDescription: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    lineHeight: 14,
  },
  nextStepDescription: {
    fontSize: 9,
  },

  // Water Tracking Section
  waterTrackingSection: {
    backgroundColor: "#F8F9FA",
    padding: 16,
    paddingTop: 20,
  },
  waterTrackingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  waterTrackingTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  enhancedProgressContainer: {
    marginBottom: 12,
  },
  enhancedProgressBar: {
    height: 8,
    backgroundColor: "#E9ECEF",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  enhancedProgressFill: {
    height: "100%",
    backgroundColor: "#FF6B35",
    borderRadius: 4,
  },
  enhancedProgressText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
  },
  waterStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  waterStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  waterStatIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  waterStatLabel: {
    fontSize: 14,
    color: "#666",
  },
  waterStatValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
});
