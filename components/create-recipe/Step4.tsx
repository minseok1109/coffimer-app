import { createRecipeStyles } from "@/styles/create-recipe.styles";
import { RecipeFormData } from "@/types/recipe-form";
import React from "react";
import { useFormContext } from "react-hook-form";
import { Text, View } from "react-native";

export const Step4: React.FC = () => {
  const { watch } = useFormContext<RecipeFormData>();
  const formData = watch();

  return (
    <View style={createRecipeStyles.stepContent}>
      <Text style={createRecipeStyles.reviewTitle}>레시피 정보</Text>

      <View style={createRecipeStyles.reviewSection}>
        <Text style={createRecipeStyles.reviewLabel}>레시피 제목</Text>
        <Text style={createRecipeStyles.reviewValue}>
          {formData.title || "-"}
        </Text>
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
        <View style={{ gap: 8 }}>
          <Text style={createRecipeStyles.reviewValue}>
            원두: {formData.coffeeAmount || 0}g / 물:{" "}
            {formData.waterAmount || 0}
            ml
          </Text>
          <Text style={createRecipeStyles.reviewValue}>
            비율: 1:{formData.ratio || "0"}
          </Text>
          <Text style={createRecipeStyles.reviewValue}>
            드리퍼: {formData.dripper || "-"}
          </Text>
        </View>
      </View>

      <View style={createRecipeStyles.reviewSection}>
        <Text style={createRecipeStyles.reviewLabel}>추출 가이드</Text>
        {formData.steps?.map((step, index) => (
          <View
            key={index}
            style={{
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={createRecipeStyles.reviewValue}>
              {index + 1}단계: {step.time || "0"}초
            </Text>
            <Text style={createRecipeStyles.reviewValue}>
              {step.waterAmount || "0"}ml
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};
