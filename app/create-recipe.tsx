import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { FormProvider } from "react-hook-form";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCreateRecipe } from "@/hooks/useCreateRecipe";
import { StepIndicator, Step1, Step2, Step3, Step4 } from "@/components/create-recipe";
import { createRecipeStyles } from "@/styles/create-recipe.styles";

export default function CreateRecipeScreen() {
  const {
    methods,
    currentStep,
    handleNext,
    handlePrevious,
    slideAnim,
    router,
  } = useCreateRecipe();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1 />;
      case 2:
        return <Step2 />;
      case 3:
        return <Step3 />;
      case 4:
        return <Step4 />;
      default:
        return null;
    }
  };

  return (
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
              style={[
                createRecipeStyles.stepsContainer,
                {
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [-300, 0],
                        outputRange: [-300, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {renderStep()}
            </Animated.View>
          </ScrollView>

          {/* Navigation Buttons */}
          <View style={createRecipeStyles.navigationButtons}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={[createRecipeStyles.navButton, createRecipeStyles.previousButton]}
                onPress={handlePrevious}
              >
                <Text style={createRecipeStyles.previousButtonText}>이전 버튼</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                createRecipeStyles.navButton,
                createRecipeStyles.nextButton,
                currentStep === 1 && createRecipeStyles.fullWidthButton,
              ]}
              onPress={handleNext}
            >
              <Text style={createRecipeStyles.nextButtonText}>
                {currentStep === 4 ? "완료" : "다음 버튼"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </FormProvider>
  );
}