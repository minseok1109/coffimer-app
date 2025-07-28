import { useAuth } from "@/hooks/useAuth";
import { transformFormDataToRecipe } from "@/lib/recipeApi";
import { type RecipeFormData, recipeFormSchema } from "@/types/recipe-form";
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
import { useCreateRecipeMutation } from "./useCreateRecipeMutation";

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
      filter: "",
      grindInputMode: "micron" as const, // 그라인더 기능 비활성화로 인해 micron만 사용
      grindMicrons: "",
      // grindGrinder: "", // 그라인더 기능 비활성화로 인해 주석처리
      // grindClicks: "", // 그라인더 기능 비활성화로 인해 주석처리
      grindNotes: "",
      steps: [{ title: "", time: "", waterAmount: "", description: "" }],
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

  // 새로운 뮤테이션 훅 사용
  const createRecipeMutation = useCreateRecipeMutation({
    onSuccess: (recipe) => {
      Alert.alert("성공", "레시피가 성공적으로 저장되었습니다!", [
        {
          text: "확인",
          onPress: () => {
            router.back();
          },
        },
      ]);
    },
    onError: (error) => {
      Alert.alert("오류", error.message || "레시피 저장에 실패했습니다.");
    },
  });

  const onSubmit = async (data: RecipeFormData) => {
    if (!user) {
      Alert.alert("오류", "로그인이 필요합니다.");
      return;
    }

    try {
      setIsSaving(true);

      // 폼 데이터를 CreateRecipeInput 형태로 변환
      const { recipe, steps } = transformFormDataToRecipe(data, user.id);

      // CreateRecipeInput 타입으로 변환
      const input = {
        recipe: {
          name: recipe.name,
          total_time: recipe.total_time,
          coffee: recipe.coffee,
          water: recipe.water,
          water_temperature: recipe.water_temperature,
          dripper: recipe.dripper,
          filter: recipe.filter,
          ratio: recipe.ratio,
          description: recipe.description,
          micron: recipe.micron,
          youtube_url: recipe.youtube_url,
          is_public: recipe.is_public,
        },
        steps: steps.map((step) => ({
          step_index: step.step_index,
          time: step.time,
          title: step.title,
          description: step.description,
          water: step.water,
          total_water: step.total_water,
        })),
      };

      await createRecipeMutation.mutateAsync(input);
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
