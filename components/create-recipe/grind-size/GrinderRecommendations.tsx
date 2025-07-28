import { getAllGrinders } from "@/lib/grinders";
import type { RecipeFormData } from "@/types/recipe-form";
import type React from "react";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface GrinderRecommendationsProps {
  grinderId: string;
}

export const GrinderRecommendations: React.FC<GrinderRecommendationsProps> = ({
  grinderId,
}) => {
  const { setValue } = useFormContext<RecipeFormData>();
  const grinders = useMemo(() => getAllGrinders(), []);

  const selectedGrinder = useMemo(
    () => grinders.find((g) => g.id === grinderId),
    [grinders, grinderId]
  );

  if (!selectedGrinder?.recommendedClicks) {
    return null;
  }

  return (
    <View style={styles.grinderInfo}>
      <Text style={styles.recommendationTitle}>추천 설정:</Text>
      <View style={styles.recommendationButtons}>
        <TouchableOpacity
          accessibilityHint="클릭하면 추천 클릭수가 자동으로 입력됩니다"
          accessibilityLabel={`핸드드립용 추천 설정 ${selectedGrinder.recommendedClicks.pourover}클릭 적용`}
          accessibilityRole="button"
          onPress={() =>
            setValue(
              "grindClicks",
              selectedGrinder.recommendedClicks!.pourover.toString()
            )
          }
          style={styles.recommendationButton}
        >
          <Text style={styles.recommendationButtonText}>
            핸드드립 {selectedGrinder.recommendedClicks.pourover}클릭
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityHint="클릭하면 추천 클릭수가 자동으로 입력됩니다"
          accessibilityLabel={`에스프레소용 추천 설정 ${selectedGrinder.recommendedClicks.espresso}클릭 적용`}
          accessibilityRole="button"
          onPress={() =>
            setValue(
              "grindClicks",
              selectedGrinder.recommendedClicks!.espresso.toString()
            )
          }
          style={styles.recommendationButton}
        >
          <Text style={styles.recommendationButtonText}>
            에스프레소 {selectedGrinder.recommendedClicks.espresso}클릭
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityHint="클릭하면 추천 클릭수가 자동으로 입력됩니다"
          accessibilityLabel={`프렌치프레스용 추천 설정 ${selectedGrinder.recommendedClicks.french_press}클릭 적용`}
          accessibilityRole="button"
          onPress={() =>
            setValue(
              "grindClicks",
              selectedGrinder.recommendedClicks!.french_press.toString()
            )
          }
          style={styles.recommendationButton}
        >
          <Text style={styles.recommendationButtonText}>
            프렌치프레스 {selectedGrinder.recommendedClicks.french_press}클릭
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  grinderInfo: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  recommendationTitle: {
    fontSize: 13,
    color: "#8B4513",
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  recommendationButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },
  recommendationButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#8B4513",
    marginVertical: 2,
  },
  recommendationButtonText: {
    fontSize: 11,
    color: "#8B4513",
    fontWeight: "500",
    textAlign: "center",
  },
});
