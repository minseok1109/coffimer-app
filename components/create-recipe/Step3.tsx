import React from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { Controller, useFormContext, useFieldArray } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { RecipeFormData } from "@/types/recipe-form";
import { createRecipeStyles } from "@/styles/create-recipe.styles";

export const Step3: React.FC = () => {
  const { control } = useFormContext<RecipeFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "steps",
  });

  const addStep = () => {
    append({ startTime: "", endTime: "", waterAmount: "" });
  };

  return (
    <View style={createRecipeStyles.stepContent}>
      <View style={createRecipeStyles.stepHeader}>
        <Text style={createRecipeStyles.label}>단계별 추출 가이드</Text>
        <TouchableOpacity style={createRecipeStyles.addButton} onPress={addStep}>
          <Ionicons name="add-circle-outline" size={24} color="#8B4513" />
          <Text style={createRecipeStyles.addButtonText}>단계 추가</Text>
        </TouchableOpacity>
      </View>

      <Text style={createRecipeStyles.helperText}>클릭하면 동적으로 필드 추가</Text>

      <ScrollView style={createRecipeStyles.stepsList}>
        {fields.map((field, index) => (
          <View key={field.id} style={createRecipeStyles.brewStep}>
            <View style={createRecipeStyles.stepTitleRow}>
              <Text style={createRecipeStyles.stepTitle}>{index + 1}단계부터 + 1씩</Text>
              {index > 0 && (
                <TouchableOpacity onPress={() => remove(index)}>
                  <Ionicons name="close-circle" size={24} color="#ff4444" />
                </TouchableOpacity>
              )}
            </View>

            <View style={createRecipeStyles.timeRow}>
              <View style={createRecipeStyles.timeInput}>
                <Text style={createRecipeStyles.subLabel}>시간</Text>
                <Controller
                  control={control}
                  name={`steps.${index}.startTime`}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={createRecipeStyles.smallInput}
                      placeholder="00"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="numeric"
                    />
                  )}
                />
              </View>
              <Text style={createRecipeStyles.timeSeparator}>~</Text>
              <View style={createRecipeStyles.timeInput}>
                <Text style={createRecipeStyles.subLabel}>&nbsp;</Text>
                <Controller
                  control={control}
                  name={`steps.${index}.endTime`}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={createRecipeStyles.smallInput}
                      placeholder="00"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="numeric"
                    />
                  )}
                />
              </View>
              <View style={createRecipeStyles.waterInput}>
                <Text style={createRecipeStyles.subLabel}>물양</Text>
                <Controller
                  control={control}
                  name={`steps.${index}.waterAmount`}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={createRecipeStyles.smallInput}
                      placeholder="0"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="numeric"
                    />
                  )}
                />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Text style={createRecipeStyles.description}>
        description: 시간은 누적으로 작성해주세요{"\n"}
        ex) 30 → 60 → 90
      </Text>
    </View>
  );
};