import { useRecipe } from "@/hooks/useRecipes";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { formatTime, formatTimeKorean } from "../../lib/timer/formatters";

export default function RecipeDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data: recipe, isLoading } = useRecipe(id as string);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>레시피를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>레시피 상세</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>레시피를 찾을 수 없습니다.</Text>
        </View>
      </>
    );
  }

  const handleStartRecipe = () => {
    router.push(`/recipes/timer/${recipe.id}`);
  };

  const handleYouTubePress = async () => {
    if (!recipe.youtube_url) return;

    try {
      const supported = await Linking.canOpenURL(recipe.youtube_url);
      if (supported) {
        await Linking.openURL(recipe.youtube_url);
      } else {
        Alert.alert("오류", "YouTube 앱을 열 수 없습니다.");
      }
    } catch (error) {
      Alert.alert("오류", "YouTube 영상을 열 수 없습니다.");
    }
  };

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>레시피 상세</Text>
      </View>

      <ScrollView style={styles.container}>
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
              <Text style={styles.infoValue}>
                {formatTimeKorean(recipe.total_time)}
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="thermometer-outline" size={20} color="#FF6B6B" />
              <Text style={styles.infoLabel}>수온</Text>
              <Text style={styles.infoValue}>{recipe.water_temperature}</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="funnel-outline" size={20} color="#8B4513" />
              <Text style={styles.infoLabel}>드리퍼</Text>
              <Text style={styles.infoValue}>{recipe.dripper}</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="analytics-outline" size={20} color="#4ECDC4" />
              <Text style={styles.infoLabel}>비율</Text>
              <Text style={styles.infoValue}>1:{recipe.ratio}</Text>
            </View>
          </View>

          {recipe.recipe_steps && recipe.recipe_steps.length > 0 && (
            <View style={styles.stepsContainer}>
              <Text style={styles.sectionTitle}>단계</Text>
              {recipe.recipe_steps.map((step, index) => (
                <View key={index} style={styles.stepCard}>
                  <View style={styles.stepHeader}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.stepInfo}>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.stepTime}>
                        {formatTime(step.time)}
                      </Text>
                    </View>
                    <View style={styles.stepWater}>
                      <Text style={styles.stepWaterText}>{step.water}</Text>
                      {step.total_water && (
                        <Text style={styles.stepTotalWater}>
                          (총 {step.total_water}ml)
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        {recipe.youtube_url && (
          <TouchableOpacity
            style={styles.youtubeButton}
            onPress={handleYouTubePress}
          >
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    marginTop: 0,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 16,
    color: "#333",
  },
  content: {
    padding: 20,
    paddingTop: 120,
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
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  youtubeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  youtubeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF0000",
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#A0522D",
    borderRadius: 16,
    padding: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
