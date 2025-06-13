import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getRecipeById } from "../../lib/recipes";

export default function RecipeDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const recipe = getRecipeById(Number(id));

  if (!recipe) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>레시피 상세</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>레시피를 찾을 수 없습니다.</Text>
        </View>
      </View>
    );
  }

  const formatTime = (totalTime: number) => {
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;
    return `${minutes}분${seconds > 0 ? ` ${seconds}초` : ""}`;
  };

  const formatStepTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes > 0 ? `${minutes}:` : ""}${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStartRecipe = () => {
    // TODO: 타이머 페이지로 이동
    console.log("Starting recipe:", recipe.id);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>레시피 상세</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{recipe.name}</Text>
        <Text style={styles.description}>{recipe.description}</Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Ionicons name="cafe-outline" size={20} color="#D2691E" />
            <Text style={styles.infoLabel}>원두</Text>
            <Text style={styles.infoValue}>{recipe.coffee}</Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="water-outline" size={20} color="#4A90E2" />
            <Text style={styles.infoLabel}>물</Text>
            <Text style={styles.infoValue}>{recipe.water}</Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>소요시간</Text>
            <Text style={styles.infoValue}>{formatTime(recipe.totalTime)}</Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="thermometer-outline" size={20} color="#FF6B6B" />
            <Text style={styles.infoLabel}>수온</Text>
            <Text style={styles.infoValue}>{recipe.waterTemperature}</Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="funnel-outline" size={20} color="#8B4513" />
            <Text style={styles.infoLabel}>드리퍼</Text>
            <Text style={styles.infoValue}>{recipe.dripper}</Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="analytics-outline" size={20} color="#4ECDC4" />
            <Text style={styles.infoLabel}>비율</Text>
            <Text style={styles.infoValue}>{recipe.ratio}</Text>
          </View>
        </View>

        {recipe.steps && recipe.steps.length > 0 && (
          <View style={styles.stepsContainer}>
            <Text style={styles.sectionTitle}>단계</Text>
            {recipe.steps.map((step, index) => (
              <View key={index} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stepInfo}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepTime}>
                      {formatStepTime(step.time)}
                    </Text>
                  </View>
                  <View style={styles.stepWater}>
                    <Text style={styles.stepWaterText}>{step.water}</Text>
                    {step.totalWater && (
                      <Text style={styles.stepTotalWater}>
                        (총 {step.totalWater}ml)
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            ))}
          </View>
        )}

        {recipe.youtubeUrl && (
          <TouchableOpacity style={styles.youtubeButton}>
            <Ionicons name="logo-youtube" size={20} color="#FF0000" />
            <Text style={styles.youtubeButtonText}>YouTube 영상 보기</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartRecipe}
        >
          <Ionicons name="play" size={20} color="white" />
          <Text style={styles.startButtonText}>레시피 시작하기</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 16,
    color: "#333",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 24,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    width: "48%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoLabel: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  stepsContainer: {
    marginBottom: 32,
  },
  stepCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#D2691E",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  stepInfo: {
    flex: 1,
    marginLeft: 12,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  stepTime: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  stepWater: {
    alignItems: "flex-end",
  },
  stepWaterText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4A90E2",
  },
  stepTotalWater: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  stepDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  youtubeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  youtubeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF0000",
    marginLeft: 8,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D2691E",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  startButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
  },
});
