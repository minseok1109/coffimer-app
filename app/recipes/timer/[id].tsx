import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRecipeTimer } from "../../../hooks/useRecipeTimer";
import { getRecipeById } from "../../../lib/recipes";

const { width } = Dimensions.get("window");

export default function RecipeTimer() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const recipe = getRecipeById(Number(id));

  const { currentTime, isRunning, currentStep, toggleTimer, resetTimer } =
    useRecipeTimer(recipe!);

  if (!recipe) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>레시피 타이머</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>레시피를 찾을 수 없습니다.</Text>
        </View>
      </View>
    );
  }

  const getCurrentStepInfo = () => {
    if (!recipe.steps || recipe.steps.length === 0) {
      return null;
    }

    const step = recipe.steps[currentStep];

    // 현재 단계의 시작 시간 계산
    const stepStartTime =
      currentStep === 0
        ? 0
        : recipe.steps
            .slice(0, currentStep)
            .reduce((acc, s) => acc + s.time, 0);

    // 현재 단계 내에서의 진행 시간 (각 단계마다 0부터 시작)
    const stepCurrentTime = Math.max(0, currentTime - stepStartTime);
    const progress =
      step.time > 0 ? Math.min((stepCurrentTime / step.time) * 100, 100) : 0;

    return {
      step,
      progress,
      stepNumber: currentStep + 1,
      totalSteps: recipe.steps.length,
      stepCurrentTime,
      stepStartTime,
    };
  };

  const getNextStepInfo = () => {
    if (!recipe.steps || currentStep >= recipe.steps.length - 1) {
      return null;
    }

    const nextStep = recipe.steps[currentStep + 1];
    return {
      step: nextStep,
      stepNumber: currentStep + 2,
      totalSteps: recipe.steps.length,
    };
  };

  const currentStepInfo = getCurrentStepInfo();
  const nextStepInfo = getNextStepInfo();

  const getTotalWaterUsed = () => {
    if (!recipe.steps) return 0;

    let total = 0;
    for (let i = 0; i <= currentStep && i < recipe.steps.length; i++) {
      const waterAmount = parseInt(recipe.steps[i].water.replace(/[^\d]/g, ""));
      if (!isNaN(waterAmount)) {
        total += waterAmount;
      }
    }
    return total;
  };

  const getTotalWaterNeeded = () => {
    if (!recipe.steps) return 0;

    let total = 0;
    for (let i = 0; i < recipe.steps.length; i++) {
      const waterAmount = parseInt(recipe.steps[i].water.replace(/[^\d]/g, ""));
      if (!isNaN(waterAmount)) {
        total += waterAmount;
      }
    }
    return total;
  };

  const getRemainingWater = () => {
    return getTotalWaterNeeded() - getTotalWaterUsed();
  };

  const formatTime = (totalTime: number) => {
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatTimerDisplay = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return {
      minutes: minutes.toString().padStart(2, "0"),
      seconds: seconds.toString().padStart(2, "0"),
    };
  };

  const handleTimerToggle = () => {
    toggleTimer();
  };

  const handleReset = () => {
    resetTimer();
  };

  const renderStepIndicator = () => {
    if (!recipe.steps) return null;

    return (
      <View style={styles.stepIndicatorContainer}>
        {recipe.steps.map((_, index) => (
          <View key={index} style={styles.stepIndicatorWrapper}>
            <View
              style={[
                styles.stepIndicatorDot,
                index < currentStep && styles.stepIndicatorCompleted,
                index === currentStep && styles.stepIndicatorActive,
              ]}
            />
            {index < recipe.steps!.length - 1 && (
              <View
                style={[
                  styles.stepIndicatorLine,
                  index < currentStep && styles.stepIndicatorLineCompleted,
                ]}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const timerDisplay = currentStepInfo
    ? formatTimerDisplay(currentStepInfo.stepCurrentTime)
    : { minutes: "00", seconds: "00" };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{recipe.name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Step Progress Indicator */}
        {renderStepIndicator()}

        {/* Current Step Title */}
        {currentStepInfo && (
          <View style={styles.currentStepTitleContainer}>
            <Text style={styles.currentStepTitle}>
              {currentStepInfo.step.title}
            </Text>
          </View>
        )}

        {/* Main Timer Display */}
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

          {/* Progress Bar */}
          {currentStepInfo && (
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${currentStepInfo.progress}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(currentStepInfo.progress)}% 완료
              </Text>
            </View>
          )}
        </View>

        {/* Current Step Info */}
        {currentStepInfo && (
          <View style={styles.currentStepCard}>
            <View style={styles.currentStepHeader}>
              <Text style={styles.currentStepLabel}>현재 단계</Text>
              <Text style={styles.targetTime}>
                목표: {formatTime(currentStepInfo.step.time)}
              </Text>
            </View>

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
                    {getTotalWaterUsed()}ml
                  </Text>
                  <Text style={styles.totalWaterLabelCurrent}>총 사용량</Text>
                </View>
              </View>

              <View style={styles.remainingWaterInfo}>
                <View style={styles.remainingWaterIconContainer}>
                  <Ionicons name="water-outline" size={24} color="#4CAF50" />
                </View>
                <View>
                  <Text style={styles.remainingWaterAmount}>
                    {getRemainingWater()}ml
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
                    {getTotalWaterNeeded()}ml
                  </Text>
                  <Text style={styles.totalNeededLabel}>총 필요량</Text>
                </View>
              </View>
            </View>

            {currentStepInfo.step.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionText}>
                  {currentStepInfo.step.description}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Next Step Preview */}
        {nextStepInfo && (
          <View style={styles.nextStepCard}>
            <View style={styles.nextStepHeader}>
              <Ionicons name="arrow-forward-circle" size={20} color="#4CAF50" />
              <Text style={styles.nextStepLabel}>다음 단계</Text>
              <Text style={styles.nextStepCounter}>
                {nextStepInfo.stepNumber}/{nextStepInfo.totalSteps}
              </Text>
            </View>

            <Text style={styles.nextStepTitle}>{nextStepInfo.step.title}</Text>

            <View style={styles.nextStepDetails}>
              <View style={styles.nextWaterInfo}>
                <Ionicons name="water-outline" size={16} color="#4CAF50" />
                <Text style={styles.nextWaterAmount}>
                  {nextStepInfo.step.water}
                </Text>
              </View>
              <Text style={styles.nextStepTime}>
                {formatTime(nextStepInfo.step.time)}
              </Text>
            </View>
          </View>
        )}

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[
              styles.timerButton,
              isRunning ? styles.timerButtonRunning : styles.timerButtonPaused,
            ]}
            onPress={handleTimerToggle}
          >
            <Ionicons
              name={isRunning ? "pause" : "play"}
              size={32}
              color="white"
            />
            <Text style={styles.timerButtonText}>
              {isRunning ? "일시정지" : "시작"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Ionicons name="refresh" size={24} color="#666" />
            <Text style={styles.resetButtonText}>리셋</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#f8f9fa",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 44,
  },

  // Step Indicator
  stepIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  stepIndicatorWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepIndicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#e9ecef",
    borderWidth: 2,
    borderColor: "#dee2e6",
  },
  stepIndicatorActive: {
    backgroundColor: "#FF6B35",
    borderColor: "#FF6B35",
    transform: [{ scale: 1.3 }],
  },
  stepIndicatorCompleted: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  stepIndicatorLine: {
    width: 40,
    height: 2,
    backgroundColor: "#e9ecef",
    marginHorizontal: 8,
  },
  stepIndicatorLineCompleted: {
    backgroundColor: "#4CAF50",
  },

  // Current Step Title
  currentStepTitleContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  currentStepTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  stepCounter: {
    fontSize: 16,
    color: "#FF6B35",
    fontWeight: "600",
  },

  // Main Timer
  timerContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  timerDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
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
  timerLabel: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "600",
    marginTop: 4,
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

  // Progress Bar
  progressBarContainer: {
    width: "100%",
    alignItems: "center",
  },
  progressBarBackground: {
    width: "100%",
    height: 12,
    backgroundColor: "#e9ecef",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FF6B35",
    borderRadius: 6,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B35",
  },

  // Current Step Card
  currentStepCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#FF6B35",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  currentStepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  currentStepLabel: {
    fontSize: 16,
    color: "#FF6B35",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  targetTime: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "600",
  },
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
    backgroundColor: "rgba(76, 175, 80, 0.1)",
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
  descriptionContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: "#495057",
    lineHeight: 20,
  },

  // Next Step Card
  nextStepCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#4CAF50",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  nextStepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  nextStepLabel: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    flex: 1,
  },
  nextStepCounter: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },
  nextStepTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  nextStepDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nextWaterInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  nextWaterAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  nextStepTime: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "600",
  },

  // Controls
  controlsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 32,
  },
  resetButton: {
    flex: 1,
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
  resetButtonText: {
    fontSize: 16,
    color: "#6c757d",
    fontWeight: "600",
  },
  timerButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
  timerButtonRunning: {
    backgroundColor: "#F44336",
  },
  timerButtonPaused: {
    backgroundColor: "#4CAF50",
  },
  timerButtonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
  },

  // Error State
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#6c757d",
  },
});
