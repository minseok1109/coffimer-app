import { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { DateData } from "react-native-calendars";
import type { CustomMarkedDate } from "@/types/event";

const SELECTED_BG_COLOR = "#FF6F43";

interface CustomDayComponentProps {
  date?: DateData;
  state?: "disabled" | "today" | "selected" | "inactive" | "";
  marking?: CustomMarkedDate;
  onPress?: (date: DateData) => void;
}

export const CustomDayComponent = memo(
  ({ date, state, marking, onPress }: CustomDayComponentProps) => {
    const colors = marking?.colors ?? [];
    const isSelected = marking?.selected;
    const isToday = state === "today";
    const isDisabled = state === "disabled";

    const handlePress = useCallback(() => {
      if (!isDisabled && date) {
        onPress?.(date);
      }
    }, [date, isDisabled, onPress]);

    const renderDots = () => {
      if (colors.length === 0) {
        return null;
      }

      const displayColors = colors.slice(0, 3);

      return (
        <View style={styles.dotsContainer}>
          {displayColors.map((color) => (
            <View
              key={color}
              style={[styles.dot, { backgroundColor: color }]}
            />
          ))}
        </View>
      );
    };

    return (
      <Pressable
        accessibilityLabel={`${date?.day}일`}
        accessibilityRole="button"
        onPress={handlePress}
        style={[styles.container, isSelected && styles.selectedContainer]}
      >
        <Text
          style={[
            styles.dayText,
            isToday && styles.todayText,
            isSelected && styles.selectedText,
            isDisabled && styles.disabledText,
          ]}
        >
          {date?.day}
        </Text>
        {renderDots()}
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  dayText: {
    color: "#1C1C1E",
    fontSize: 14,
    fontWeight: "400",
  },
  disabledText: {
    color: "#9CA3AF",
  },
  dot: {
    borderRadius: 3,
    height: 6,
    marginHorizontal: 1,
    width: 6,
  },
  dotsContainer: {
    flexDirection: "row",
    marginTop: 2,
  },
  selectedContainer: {
    backgroundColor: SELECTED_BG_COLOR,
    borderRadius: 20,
  },
  selectedText: {
    color: "#FFFFFF",
  },
  todayText: {
    color: "#FF6B35",
    fontWeight: "600",
  },
});
