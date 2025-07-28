import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import React, { useRef } from 'react';
import { FormProvider } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Step1,
  Step2,
  Step3,
  Step4,
  StepIndicator,
} from '@/components/create-recipe';
import {
  type BottomSheetRef,
  DripperBottomSheet,
} from '@/components/create-recipe/DripperBottomSheet';
import { FilterBottomSheet } from '@/components/create-recipe/FilterBottomSheet';
import { GrinderBottomSheet } from '@/components/create-recipe/GrinderBottomSheet';
import { useCreateRecipe } from '@/hooks/useCreateRecipe';
import { createRecipeStyles } from '@/styles/create-recipe.styles';
import { DRIPPER_OPTIONS } from '@/utils/selectorUtils';

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
    isSaving,
  } = useCreateRecipe();

  const bottomSheetRef = useRef<BottomSheetRef>(null);
  const filterBottomSheetRef = useRef<BottomSheetRef>(null);
  const grinderBottomSheetRef = useRef<BottomSheetRef>(null);

  // 아이콘 정보를 추가한 드리퍼 옵션
  const dripperOptionsWithIcons = DRIPPER_OPTIONS.map((option) => ({
    ...option,
    icon: 'funnel-outline' as const,
  }));

  const handleDripperSelect = (value: string) => {
    methods.setValue('dripper', value);
  };

  const handleDripperPress = () => {
    bottomSheetRef.current?.expand();
  };

  const handleFilterSelect = (value: string) => {
    methods.setValue('filter', value);
  };

  const handleFilterPress = () => {
    filterBottomSheetRef.current?.expand();
  };

  const handleGrinderSelect = (value: string) => {
    methods.setValue('grindGrinder', value);
  };

  const handleGrinderPress = () => {
    grinderBottomSheetRef.current?.expand();
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
            onFilterPress={handleFilterPress}
            onGrinderPress={handleGrinderPress}
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
                onPress={() => router.back()}
                style={createRecipeStyles.backButton}
              >
                <Ionicons color="#333" name="arrow-back" size={24} />
              </TouchableOpacity>
              <Text style={createRecipeStyles.title}>레시피 작성</Text>
              <View style={createRecipeStyles.placeholder} />
            </View>

            {/* Step Indicator */}
            <StepIndicator currentStep={currentStep} />

            {/* Form Content */}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={createRecipeStyles.content}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={createRecipeStyles.scrollView}
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
                    disabled={isTransitioning}
                    onPress={handlePrevious}
                    style={[
                      createRecipeStyles.navButton,
                      createRecipeStyles.previousButton,
                      isTransitioning && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={createRecipeStyles.previousButtonText}>
                      이전 버튼
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  disabled={isTransitioning || isSaving}
                  onPress={handleNext}
                  style={[
                    createRecipeStyles.navButton,
                    createRecipeStyles.nextButton,
                    currentStep === 1 && createRecipeStyles.fullWidthButton,
                    (isTransitioning || isSaving) && { opacity: 0.7 },
                  ]}
                >
                  <Text style={createRecipeStyles.nextButtonText}>
                    {isSaving
                      ? '저장 중...'
                      : currentStep === 4
                        ? '완료'
                        : '다음 버튼'}
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </FormProvider>

        {/* Global Bottom Sheets */}
        <DripperBottomSheet
          onSelect={handleDripperSelect}
          options={dripperOptionsWithIcons}
          ref={bottomSheetRef}
          selectedValue={methods.watch('dripper')}
        />
        <FilterBottomSheet
          onSelect={handleFilterSelect}
          ref={filterBottomSheetRef}
          selectedValue={methods.watch('filter')}
        />
        <GrinderBottomSheet
          onSelect={handleGrinderSelect}
          ref={grinderBottomSheetRef}
          selectedValue={methods.watch('grindGrinder')}
        />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
