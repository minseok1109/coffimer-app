import { createRecipeStyles } from "@/styles/create-recipe.styles";
import { RecipeFormData } from "@/types/recipe-form";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useFormContext } from "react-hook-form";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export const Step4: React.FC = () => {
  const { watch } = useFormContext<RecipeFormData>();
  const formData = watch();

  const totalWater =
    formData.steps?.reduce(
      (sum, step) => sum + (parseInt(step.waterAmount || "0") || 0),
      0
    ) || 0;

  return (
    <View style={createRecipeStyles.stepContent}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Recipe Title Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={20} color="#8B4513" />
            <Text style={styles.cardTitle}>기본 정보</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>레시피 제목</Text>
              <Text style={styles.value}>{formData.title || "제목 없음"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>설명</Text>
              <Text style={styles.value}>
                {formData.description || "설명 없음"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>공개 설정</Text>
              <View style={styles.publicBadge}>
                <Ionicons
                  name={formData.isPublic ? "globe" : "lock-closed"}
                  size={14}
                  color={formData.isPublic ? "#4CAF50" : "#666"}
                />
                <Text
                  style={[
                    styles.publicText,
                    { color: formData.isPublic ? "#4CAF50" : "#666" },
                  ]}
                >
                  {formData.isPublic ? "공개" : "비공개"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Coffee Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cafe" size={20} color="#8B4513" />
            <Text style={styles.cardTitle}>커피 정보</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.coffeeStatsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {formData.coffeeAmount || 0}
                </Text>
                <Text style={styles.statLabel}>원두 (g)</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{totalWater}</Text>
                <Text style={styles.statLabel}>물 (ml)</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>1:{formData.ratio || "0"}</Text>
                <Text style={styles.statLabel}>비율</Text>
              </View>
            </View>
            <View style={styles.dripperSection}>
              <Text style={styles.dripperLabel}>드리퍼</Text>
              <View style={styles.dripperBox}>
                <Ionicons name="funnel" size={18} color="#8B4513" />
                <Text style={styles.dripperText}>
                  {formData.dripper || "미선택"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Steps Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="timer" size={20} color="#8B4513" />
            <Text style={styles.cardTitle}>추출 가이드</Text>
            <Text style={styles.stepsCount}>
              {formData.steps?.length || 0}단계
            </Text>
          </View>
          <View style={styles.cardContent}>
            {formData.steps?.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stepContent}>
                  <View style={styles.stepInfo}>
                    <View style={styles.stepTimeWater}>
                      <View style={styles.stepTimeBox}>
                        <Ionicons name="time" size={16} color="#666" />
                        <Text style={styles.stepTime}>
                          {step.time || "0"}초
                        </Text>
                      </View>
                      <View style={styles.stepWaterBox}>
                        <Ionicons name="water" size={16} color="#2196F3" />
                        <Text style={styles.stepWater}>
                          {step.waterAmount || "0"}ml
                        </Text>
                      </View>
                    </View>
                    {step.description && (
                      <Text style={styles.stepDescription}>
                        {step.description}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 12,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  scrollContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  stepsCount: {
    fontSize: 12,
    color: "#8B4513",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: "500",
  },
  cardContent: {
    padding: 20,
  },
  infoRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  value: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  publicBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
  },
  publicText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  coffeeStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8B4513",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 8,
  },
  dripperSection: {
    paddingTop: 16,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  dripperLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },
  dripperBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dripperText: {
    fontSize: 15,
    color: "#333",
    marginLeft: 10,
    fontWeight: "500",
  },
  stepRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#8B4513",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumberText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  stepContent: {
    flex: 1,
  },
  stepInfo: {
    gap: 8,
  },
  stepTimeWater: {
    flexDirection: "row",
    gap: 12,
  },
  stepTimeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stepWaterBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f8ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stepTime: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
    marginLeft: 6,
  },
  stepWater: {
    fontSize: 15,
    color: "#2196F3",
    fontWeight: "600",
    marginLeft: 6,
  },
  stepDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginTop: 4,
  },
});
