import type React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ModeToggleProps {
  currentMode: "micron" | "grinder";
  onModeChange: (mode: "micron" | "grinder") => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({
  currentMode,
  onModeChange,
}) => {
  return (
    <View style={styles.modeToggle}>
      <TouchableOpacity
        accessibilityLabel="마이크론 직접 입력 모드"
        accessibilityRole="button"
        accessibilityState={{ selected: currentMode === "micron" }}
        onPress={() => onModeChange("micron")}
        style={[
          styles.toggleButton,
          currentMode === "micron" && styles.toggleButtonActive,
        ]}
      >
        <Text
          style={[
            styles.toggleButtonText,
            currentMode === "micron" && styles.toggleButtonTextActive,
          ]}
        >
          마이크론 직접 입력
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityLabel="그라인더별 클릭수 입력 모드"
        accessibilityRole="button"
        accessibilityState={{ selected: currentMode === "grinder" }}
        onPress={() => onModeChange("grinder")}
        style={[
          styles.toggleButton,
          currentMode === "grinder" && styles.toggleButtonActive,
        ]}
      >
        <Text
          style={[
            styles.toggleButtonText,
            currentMode === "grinder" && styles.toggleButtonTextActive,
          ]}
        >
          그라인더별 클릭수
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  modeToggle: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#8B4513",
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  toggleButtonTextActive: {
    color: "#fff",
  },
});
