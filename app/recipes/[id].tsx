import { getFilterLabel } from "@/constants/filterOptions";
import { getDripperLabel } from "@/constants/dripperOptions";
import { useAuth } from "@/hooks/useAuth";
import { useRecipe } from "@/hooks/useRecipes";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Linking,
  Modal,
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
  const { user } = useAuth();
  const [showGrindGuide, setShowGrindGuide] = useState(false);
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const openBottomSheet = () => {
    setShowGrindGuide(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeBottomSheet = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 250,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowGrindGuide(false);
    });
  };

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

  // 소유자 확인
  const isOwner = user && recipe && user.id === recipe.owner_id;

  const handleStartRecipe = () => {
    router.push(`/recipes/timer/${recipe.id}`);
  };

  const handleEditRecipe = () => {
    if (!isOwner) {
      Alert.alert("알림", "레시피 소유자만 수정할 수 있습니다.");
      return;
    }
    router.push(`/recipes/edit/${recipe.id}`);
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
              <Text style={styles.infoValue}>{recipe.coffee}g</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="water-outline" size={20} color="#4A90E2" />
              <Text style={styles.infoLabel}>물</Text>
              <Text style={styles.infoValue}>{recipe.water}ml</Text>
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
              <Text style={styles.infoLabel}>물 온도</Text>
              <Text style={styles.infoValue}>{recipe.water_temperature}°C</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="funnel-outline" size={20} color="#8B4513" />
              <Text style={styles.infoLabel}>드리퍼</Text>
              <Text style={styles.infoValue}>
                {getDripperLabel(recipe?.dripper ?? "") || "미지정"}
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="analytics-outline" size={20} color="#4ECDC4" />
              <Text style={styles.infoLabel}>비율</Text>
              <Text style={styles.infoValue}>1:{recipe.ratio}</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="filter-outline" size={20} color="#8B7355" />
              <Text style={styles.infoLabel}>필터</Text>
              <Text style={styles.infoValue}>
                {getFilterLabel(recipe?.filter ?? "") || "미지정"}
              </Text>
            </View>
            {recipe.micron ? (
              <TouchableOpacity
                style={styles.infoCard}
                onPress={openBottomSheet}
              >
                <Ionicons name="cog-outline" size={20} color="#8B4513" />
                <Text style={styles.infoLabel}>분쇄도</Text>
                <Text style={styles.infoValue}>{recipe.micron}μm</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.infoCard}>
                <Ionicons name="cog-outline" size={20} color="#999" />
                <Text style={styles.infoLabel}>분쇄도</Text>
                <Text style={styles.infoValue}>미지정</Text>
              </View>
            )}
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
                      <Text style={styles.stepWaterText}>{step.water}ml</Text>
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

      {/* 분쇄도 가이드 바텀 시트 */}
      <Modal
        visible={showGrindGuide}
        transparent={true}
        animationType="none"
        onRequestClose={closeBottomSheet}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalBackground,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.modalBackgroundTouchable}
              activeOpacity={1}
              onPress={closeBottomSheet}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.bottomSheet,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>분쇄도 가이드</Text>
              <TouchableOpacity onPress={closeBottomSheet}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.bottomSheetContent}>
              <View style={styles.micronSection}>
                <Ionicons name="cog-outline" size={32} color="#8B4513" />
                <Text style={styles.micronTitle}>추천 분쇄도</Text>
                <Text style={styles.micronValue}>{recipe.micron}μm</Text>
                <Text style={styles.micronDescription}>
                  이 레시피에 최적화된 분쇄도입니다.
                </Text>
              </View>

              <View style={styles.grinderSection}>
                <Text style={styles.grinderSectionTitle}>그라인더별 설정</Text>

                {/* 기본 그라인더 설정들 */}
                <View style={styles.grinderItem}>
                  <Text style={styles.grinderName}>EK43S</Text>
                  <Text style={styles.grinderSetting}>2.5 회전</Text>
                  <Text style={styles.grinderDesc}>시계방향 2.5바퀴</Text>
                </View>

                <View style={styles.grinderItem}>
                  <Text style={styles.grinderName}>Fellow Ode Gen 2</Text>
                  <Text style={styles.grinderSetting}>4 클릭</Text>
                  <Text style={styles.grinderDesc}>4번 클릭</Text>
                </View>

                <View style={styles.grinderItem}>
                  <Text style={styles.grinderName}>Comandante C40</Text>
                  <Text style={styles.grinderSetting}>25 클릭</Text>
                  <Text style={styles.grinderDesc}>0에서 25클릭</Text>
                </View>

                <View style={styles.grinderItem}>
                  <Text style={styles.grinderName}>1Zpresso JX-Pro</Text>
                  <Text style={styles.grinderSetting}>2.8.0</Text>
                  <Text style={styles.grinderDesc}>2회전 8클릭</Text>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
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
    minHeight: 90,
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
    textAlign: "center",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
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
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "#8B4513",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B4513",
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalBackgroundTouchable: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  bottomSheetContent: {
    padding: 20,
  },
  micronSection: {
    alignItems: "center",
    marginBottom: 32,
    paddingVertical: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  micronTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 12,
    marginBottom: 8,
  },
  micronValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#8B4513",
    marginBottom: 8,
  },
  micronDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  grinderSection: {
    marginBottom: 20,
  },
  grinderSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  grinderItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  grinderName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  grinderSetting: {
    fontSize: 18,
    fontWeight: "600",
    color: "#8B4513",
    marginBottom: 4,
  },
  grinderDesc: {
    fontSize: 14,
    color: "#666",
  },
});
