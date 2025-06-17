import { useAuth } from "@/hooks/useAuth";
import { createRecipe } from "@/lib/recipeApi";
import { RecipeFormData, recipeFormSchema } from "@/types/recipe-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "react-native";
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export const useCreateRecipe = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [hasAttemptedNext, setHasAttemptedNext] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);

  const methods = useForm<RecipeFormData>({
    resolver: zodResolver(recipeFormSchema as any),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      isPublic: false,
      coffeeAmount: "",
      waterAmount: "",
      ratio: "",
      dripper: "",
      steps: [{ time: "", waterAmount: "" }],
    },
  });

  const { handleSubmit, trigger } = methods;

  const animateStepTransition = async (direction: "next" | "prev") => {
    setIsTransitioning(true);

    // 페이드 아웃 + 슬라이드 아웃
    opacity.value = withTiming(0, { duration: 200 });
    translateX.value = withTiming(direction === "next" ? -30 : 30, {
      duration: 200,
    });

    // 애니메이션 완료 후 Step 변경
    setTimeout(() => {
      // 새로운 Step으로 변경 후 페이드 인 + 슬라이드 인
      translateX.value = direction === "next" ? 30 : -30;
      opacity.value = withTiming(1, { duration: 200 });
      translateX.value = withTiming(0, { duration: 200 });
      setIsTransitioning(false);
    }, 200);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateX: translateX.value }],
    };
  });

  const handleNext = async () => {
    setHasAttemptedNext(true);

    let fieldsToValidate: (keyof RecipeFormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ["title"];
        break;
      case 2:
        fieldsToValidate = ["coffeeAmount", "waterAmount", "dripper"];
        break;
      case 3:
        fieldsToValidate = ["steps"];
        break;
    }

    const isValid = await trigger(fieldsToValidate);

    if (isValid && currentStep < 4) {
      setHasAttemptedNext(false);
      await animateStepTransition("next");
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 4) {
      await onSubmit(methods.getValues());
    }
  };

  const handlePrevious = async () => {
    if (currentStep > 1) {
      setHasAttemptedNext(false);
      await animateStepTransition("prev");
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: RecipeFormData) => {
    // if (!user) {
    //   Alert.alert("오류", "로그인이 필요합니다.");
    //   return;
    // }

    try {
      setIsSaving(true);

      const result = await createRecipe(data, "c8482dd6-f094-4a07-b66a-3d4f8acc4c58");

      if (result.success) {
        Alert.alert("성공", "레시피가 성공적으로 저장되었습니다!", [
          {
            text: "확인",
            onPress: () => {
              router.back();
            },
          },
        ]);
      } else {
        Alert.alert("오류", result.error || "레시피 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("레시피 저장 오류:", error);
      Alert.alert("오류", "레시피 저장 중 예상치 못한 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentStepComponent = () => {
    return currentStep;
  };

  return {
    // Form methods
    methods,
    handleSubmit,

    // Step navigation
    currentStep,
    handleNext,
    handlePrevious,
    getCurrentStepComponent,

    // Error state
    hasAttemptedNext,

    // Animation
    animatedStyle,
    isTransitioning,

    // Navigation
    router,

    // Submit handler
    onSubmit,

    // Saving state
    isSaving,
  };
};
