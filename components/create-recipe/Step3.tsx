import { createRecipeStyles } from "@/styles/create-recipe.styles";
import { RecipeFormData } from "@/types/recipe-form";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Step3Props {
  hasAttemptedNext?: boolean;
}

export const Step3: React.FC<Step3Props> = ({ hasAttemptedNext = false }) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<RecipeFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "steps",
  });
  const addStep = () => {
    append({ time: "", waterAmount: "" });
  };

  return (
    <View style={createRecipeStyles.stepContent}>
      <View style={{ gap: 20 }}>
        <Text style={createRecipeStyles.description}>
          시간은 누적으로 작성해주세요{"\n"}
          ex) 30 → 60 → 90
        </Text>

        {/* Sticky Header - ScrollView 밖으로 이동 */}
        <View style={createRecipeStyles.stepHeader}>
          <Text style={createRecipeStyles.label}>단계별 추출 가이드</Text>
          <TouchableOpacity
            style={createRecipeStyles.addButton}
            onPress={addStep}
          >
            <Ionicons name="add-circle-outline" size={24} color="#8B4513" />
            <Text style={createRecipeStyles.addButtonText}>단계 추가</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 스크롤 가능한 컨텐츠만 ScrollView에 포함 */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={createRecipeStyles.stepsList}>
          {fields.map((field, index) => (
            <View key={field.id} style={createRecipeStyles.brewStep}>
              <View style={createRecipeStyles.stepTitleRow}>
                <Text style={createRecipeStyles.stepTitle}>
                  {index + 1}단계
                </Text>
                {index > 0 && (
                  <TouchableOpacity onPress={() => remove(index)}>
                    <Ionicons name="close-circle" size={24} color="#ff4444" />
                  </TouchableOpacity>
                )}
              </View>
              <View
                style={{
                  gap: 16,
                }}
              >
                <View style={createRecipeStyles.timeRow}>
                  <View style={createRecipeStyles.timeInput}>
                    <Text style={createRecipeStyles.subLabel}>시간</Text>
                    <Controller
                      control={control}
                      name={`steps.${index}.time`}
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
                <View>
                  <Controller
                    control={control}
                    name={`steps.${index}.description`}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[
                          createRecipeStyles.input,
                          createRecipeStyles.textArea,
                        ]}
                        placeholder="설명"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        multiline
                        numberOfLines={4}
                      />
                    )}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {hasAttemptedNext && errors.steps && (
          <Text style={createRecipeStyles.errorText}>
            {errors.steps.message || "단계 정보를 모두 입력해주세요"}
          </Text>
        )}
      </ScrollView>
    </View>
  );
};
