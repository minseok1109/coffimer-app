import React from "react";
import { View, Text, TextInput, Switch } from "react-native";
import { Controller, useFormContext } from "react-hook-form";
import { RecipeFormData } from "@/types/recipe-form";
import { createRecipeStyles } from "@/styles/create-recipe.styles";

export const Step1: React.FC = () => {
  const { control } = useFormContext<RecipeFormData>();

  return (
    <View style={createRecipeStyles.stepContent}>
      <View style={createRecipeStyles.inputGroup}>
        <Text style={createRecipeStyles.label}>레시피 제목</Text>
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={createRecipeStyles.input}
              placeholder="예) 케냐 AA 핸드드립"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
      </View>

      <View style={createRecipeStyles.inputGroup}>
        <Text style={createRecipeStyles.label}>레시피에 대한 설명 (선택)</Text>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[createRecipeStyles.input, createRecipeStyles.textArea]}
              placeholder="이 레시피의 특징이나 맛의 포인트를 적어주세요"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              multiline
              numberOfLines={4}
            />
          )}
        />
      </View>

      <View style={createRecipeStyles.switchGroup}>
        <Text style={createRecipeStyles.label}>공개 여부</Text>
        <Controller
          control={control}
          name="isPublic"
          render={({ field: { onChange, value } }) => (
            <Switch
              value={value}
              onValueChange={onChange}
              trackColor={{ false: "#ddd", true: "#8B4513" }}
              thumbColor="#fff"
            />
          )}
        />
      </View>
    </View>
  );
};