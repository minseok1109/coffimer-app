import React from "react";
import { View, Text, TextInput } from "react-native";
import { Controller, useFormContext } from "react-hook-form";
import { RecipeFormData } from "@/types/recipe-form";
import { createRecipeStyles } from "@/styles/create-recipe.styles";

export const Step2: React.FC = () => {
  const { control, watch, setValue } = useFormContext<RecipeFormData>();
  const coffeeAmount = watch("coffeeAmount");
  const waterAmount = watch("waterAmount");

  React.useEffect(() => {
    if (coffeeAmount && waterAmount) {
      const coffee = parseFloat(coffeeAmount);
      const water = parseFloat(waterAmount);
      if (!isNaN(coffee) && !isNaN(water) && coffee > 0) {
        const ratioValue = (water / coffee).toFixed(2);
        setValue("ratio", ratioValue);
      }
    }
  }, [coffeeAmount, waterAmount, setValue]);

  return (
    <View style={createRecipeStyles.stepContent}>
      <View style={createRecipeStyles.inputGroup}>
        <Text style={createRecipeStyles.label}>커피 원두 량 (g)</Text>
        <Controller
          control={control}
          name="coffeeAmount"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={createRecipeStyles.inputWithSuffix}>
              <TextInput
                style={createRecipeStyles.numberInput}
                placeholder="0"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="numeric"
              />
              <Text style={createRecipeStyles.suffix}>g</Text>
            </View>
          )}
        />
      </View>

      <View style={createRecipeStyles.inputGroup}>
        <Text style={createRecipeStyles.label}>물양 (ml)</Text>
        <Controller
          control={control}
          name="waterAmount"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={createRecipeStyles.inputWithSuffix}>
              <TextInput
                style={createRecipeStyles.numberInput}
                placeholder="0"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="numeric"
              />
              <Text style={createRecipeStyles.suffix}>ml</Text>
            </View>
          )}
        />
      </View>

      <View style={createRecipeStyles.inputGroup}>
        <Text style={createRecipeStyles.label}>비율 (ratio)</Text>
        <Text style={createRecipeStyles.ratioDescription}>
          커피원두 물양으로 나눈서 자동 표시 (소수점 2째자리까지)
        </Text>
        <Text style={createRecipeStyles.ratioInfo}>
          커지만 사용자가 추정가능하도록 input
        </Text>
        <Controller
          control={control}
          name="ratio"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={createRecipeStyles.input}
              placeholder="자동 계산됨"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              keyboardType="numeric"
            />
          )}
        />
      </View>

      <View style={createRecipeStyles.inputGroup}>
        <Text style={createRecipeStyles.label}>사용할 드리퍼</Text>
        <Controller
          control={control}
          name="dripper"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={createRecipeStyles.input}
              placeholder="Select"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
      </View>
    </View>
  );
};