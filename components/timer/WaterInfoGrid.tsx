import { StepInfo } from "@/types/timer";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { WaterInfo } from "../../lib/timer/types";

interface WaterInfoGridProps {
  currentStepInfo: StepInfo;
  waterInfo: WaterInfo;
}

export const WaterInfoGrid: React.FC<WaterInfoGridProps> = ({
  currentStepInfo,
  waterInfo,
}) => {
  return (
    <View style={styles.stepDetailsGrid}>
      <View style={styles.waterInfoCurrent}>
        <View style={styles.waterIconContainer}>
          <Ionicons name="water" size={24} color="#2196F3" />
        </View>
        <View>
          <Text style={styles.waterAmountCurrent}>
            {currentStepInfo.step.water}
          </Text>
          <Text style={styles.waterLabelCurrent}>이번 단계</Text>
        </View>
      </View>

      <View style={styles.totalWaterCurrent}>
        <View style={styles.totalWaterIconContainer}>
          <Ionicons name="beaker" size={24} color="#FF9800" />
        </View>
        <View>
          <Text style={styles.totalWaterAmountCurrent}>
            {waterInfo.totalUsed}ml
          </Text>
          <Text style={styles.totalWaterLabelCurrent}>총 사용량</Text>
        </View>
      </View>

      <View style={styles.remainingWaterInfo}>
        <View style={styles.remainingWaterIconContainer}>
          <Ionicons name="water-outline" size={24} color="#A0522D" />
        </View>
        <View>
          <Text style={styles.remainingWaterAmount}>
            {waterInfo.remaining}ml
          </Text>
          <Text style={styles.remainingWaterLabel}>남은 물양</Text>
        </View>
      </View>

      <View style={styles.totalWaterNeeded}>
        <View style={styles.totalNeededIconContainer}>
          <Ionicons name="flask" size={24} color="#9C27B0" />
        </View>
        <View>
          <Text style={styles.totalNeededAmount}>
            {waterInfo.totalNeeded}ml
          </Text>
          <Text style={styles.totalNeededLabel}>총 필요량</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stepDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
    gap: 16,
  },
  waterInfoCurrent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: "45%",
  },
  waterIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(33, 150, 243, 0.1)",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  waterAmountCurrent: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  waterLabelCurrent: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 2,
  },
  totalWaterCurrent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: "45%",
  },
  totalWaterIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(255, 152, 0, 0.1)",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  totalWaterAmountCurrent: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalWaterLabelCurrent: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 2,
  },
  remainingWaterInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: "45%",
  },
  remainingWaterIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(160, 82, 45, 0.1)",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  remainingWaterAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  remainingWaterLabel: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 2,
  },
  totalWaterNeeded: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: "45%",
  },
  totalNeededIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(156, 39, 176, 0.1)",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  totalNeededAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalNeededLabel: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 2,
  },
});
