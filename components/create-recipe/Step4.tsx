import React from "react";
import { View, Text } from "react-native";
import { useFormContext } from "react-hook-form";
import { RecipeFormData } from "@/types/recipe-form";
import { createRecipeStyles } from "@/styles/create-recipe.styles";

export const Step4: React.FC = () => {
  const { watch } = useFormContext<RecipeFormData>();
  const formData = watch();

  return (
    <View style={createRecipeStyles.stepContent}>
      <Text style={createRecipeStyles.reviewTitle}>작성한 레시피 검토</Text>

      <View style={createRecipeStyles.reviewSection}>
        <Text style={createRecipeStyles.reviewLabel}>레시피 제목</Text>
        <Text style={createRecipeStyles.reviewValue}>{formData.title || "-"}</Text>
      </View>

      <View style={createRecipeStyles.reviewSection}>
        <Text style={createRecipeStyles.reviewLabel}>설명</Text>
        <Text style={createRecipeStyles.reviewValue}>
          {formData.description || "설명 없음"}
        </Text>
      </View>

      <View style={createRecipeStyles.reviewSection}>
        <Text style={createRecipeStyles.reviewLabel}>공개 여부</Text>
        <Text style={createRecipeStyles.reviewValue}>
          {formData.isPublic ? "공개" : "비공개"}
        </Text>
      </View>

      <View style={createRecipeStyles.reviewSection}>
        <Text style={createRecipeStyles.reviewLabel}>커피 정보</Text>
        <Text style={createRecipeStyles.reviewValue}>
          원두: {formData.coffeeAmount || 0}g / 물: {formData.waterAmount || 0}
          ml
        </Text>
        <Text style={createRecipeStyles.reviewValue}>비율: 1:{formData.ratio || "0"}</Text>
        <Text style={createRecipeStyles.reviewValue}>
          드리퍼: {formData.dripper || "-"}
        </Text>
      </View>

      <View style={createRecipeStyles.reviewSection}>
        <Text style={createRecipeStyles.reviewLabel}>추출 가이드</Text>
        {formData.steps?.map((step, index) => (
          <Text key={index} style={createRecipeStyles.reviewValue}>
            {index + 1}단계: {step.startTime || "0"}~{step.endTime || "0"}초,{" "}
            {step.waterAmount || "0"}ml
          </Text>
        ))}
      </View>

      <Text style={createRecipeStyles.confirmText}>
        앞의 단계에서 작성한 폼의 정보들이{"\n"}
        한눈에 보일 수 있도록 구성
      </Text>
    </View>
  );
};