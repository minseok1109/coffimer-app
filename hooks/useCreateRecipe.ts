import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Animated } from "react-native";
import { zodResolver } from "@hookform/resolvers/zod";
import { recipeFormSchema, RecipeFormData } from "@/types/recipe-form";

export const useCreateRecipe = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  const methods = useForm<RecipeFormData>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      title: "",
      description: "",
      isPublic: false,
      coffeeAmount: "",
      waterAmount: "",
      ratio: "",
      dripper: "",
      steps: [{ startTime: "", endTime: "", waterAmount: "" }],
    },
  });

  const { handleSubmit, trigger } = methods;

  const animateSlide = (toValue: number) => {
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleNext = async () => {
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
      animateSlide(-currentStep * 100);
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 4) {
      onSubmit(methods.getValues());
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      animateSlide(-(currentStep - 2) * 100);
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: RecipeFormData) => {
    console.log("레시피 저장:", data);
    router.back();
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
    
    // Animation
    slideAnim,
    
    // Navigation
    router,
    
    // Submit handler
    onSubmit,
  };
};