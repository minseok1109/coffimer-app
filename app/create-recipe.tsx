import {
  Step1,
  Step2,
  Step3,
  Step4,
  StepIndicator,
} from "@/components/create-recipe";
import {
  BottomSheetRef,
  DripperBottomSheet,
} from "@/components/create-recipe/DripperBottomSheet";
import { useCreateRecipe } from "@/hooks/useCreateRecipe";
import { createRecipeStyles } from "@/styles/create-recipe.styles";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { StatusBar } from "expo-status-bar";
import React, { useRef } from "react";
import { FormProvider } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateRecipeScreen() {
  const {
    methods,
    currentStep,
    handleNext,
    handlePrevious,
    animatedStyle,
    router,
    hasAttemptedNext,
    isTransitioning,
  } = useCreateRecipe();

  const bottomSheetRef = useRef<BottomSheetRef>(null);
  const dripperOptions = [
    { label: "V60", value: "v60", icon: "funnel-outline" },
    { label: "칼리타", value: "kalita", icon: "funnel-outline" },
    { label: "케멕스", value: "chemex", icon: "funnel-outline" },
    { label: "하리오", value: "hario", icon: "funnel-outline" },
    { label: "오리가미", value: "origami", icon: "funnel-outline" },
    { label: "솔로 드리퍼", value: "solo", icon: "funnel-outline" },
  ];

  const handleDripperSelect = (value: string) => {
    methods.setValue("dripper", value);
  };

  const handleDripperPress = () => {
    bottomSheetRef.current?.expand();
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1 hasAttemptedNext={hasAttemptedNext} />;
      case 2:
        return (
          <Step2
            hasAttemptedNext={hasAttemptedNext}
            onDripperPress={handleDripperPress}
          />
        );
      case 3:
        return <Step3 hasAttemptedNext={hasAttemptedNext} />;
      case 4:
        return <Step4 />;
      default:
        return null;
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <FormProvider {...methods}>
          <SafeAreaView style={createRecipeStyles.container}>
            <StatusBar style="auto" />

            {/* 헤더 */}
            <View style={createRecipeStyles.header}>
              <TouchableOpacity
                style={createRecipeStyles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={createRecipeStyles.title}>레시피 작성</Text>
              <View style={createRecipeStyles.placeholder} />
            </View>

            {/* Step Indicator */}
            <StepIndicator currentStep={currentStep} />

            {/* Form Content */}
            <KeyboardAvoidingView
              style={createRecipeStyles.content}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <ScrollView
                style={createRecipeStyles.scrollView}
                showsVerticalScrollIndicator={false}
              >
                <Animated.View
                  style={[createRecipeStyles.stepsContainer, animatedStyle]}
                >
                  {renderCurrentStep()}
                </Animated.View>
              </ScrollView>

              {/* Navigation Buttons */}
              <View style={createRecipeStyles.navigationButtons}>
                {currentStep > 1 && (
                  <TouchableOpacity
                    style={[
                      createRecipeStyles.navButton,
                      createRecipeStyles.previousButton,
                      isTransitioning && { opacity: 0.7 },
                    ]}
                    onPress={handlePrevious}
                    disabled={isTransitioning}
                  >
                    <Text style={createRecipeStyles.previousButtonText}>
                      이전 버튼
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    createRecipeStyles.navButton,
                    createRecipeStyles.nextButton,
                    currentStep === 1 && createRecipeStyles.fullWidthButton,
                    isTransitioning && { opacity: 0.7 },
                  ]}
                  onPress={handleNext}
                  disabled={isTransitioning}
                >
                  <Text style={createRecipeStyles.nextButtonText}>
                    {currentStep === 4 ? "완료" : "다음 버튼"}
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </FormProvider>

        {/* Global Bottom Sheet */}
        <DripperBottomSheet
          ref={bottomSheetRef}
          options={dripperOptions}
          selectedValue={methods.watch("dripper")}
          onSelect={handleDripperSelect}
        />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
