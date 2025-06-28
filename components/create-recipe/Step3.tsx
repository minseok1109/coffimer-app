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
    append({ title: "", time: "", waterAmount: "", description: "" });
  };

  return (
    <View style={createRecipeStyles.stepContent}>
      <View style={{ gap: 20 }}>
        <View style={createRecipeStyles.stepHeader}>
          <Text style={createRecipeStyles.label}>단계별 추출 가이드</Text>
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
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "white",
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: "#e0e0e0",
                      }}
                    >
                      <Controller
                        control={control}
                        name={`steps.${index}.time`}
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            style={[
                              createRecipeStyles.smallInput,
                              {
                                backgroundColor: "transparent",
                                borderWidth: 0,
                                flex: 1,
                              },
                            ]}
                            placeholder="00"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            keyboardType="numeric"
                          />
                        )}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#666",
                          paddingRight: 12,
                          fontWeight: "500",
                        }}
                      >
                        초
                      </Text>
                    </View>
                  </View>
                  <View style={createRecipeStyles.waterInput}>
                    <Text style={createRecipeStyles.subLabel}>물양</Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "white",
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: "#e0e0e0",
                      }}
                    >
                      <Controller
                        control={control}
                        name={`steps.${index}.waterAmount`}
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            style={[
                              createRecipeStyles.smallInput,
                              {
                                backgroundColor: "transparent",
                                borderWidth: 0,
                                flex: 1,
                              },
                            ]}
                            placeholder="0"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            keyboardType="numeric"
                          />
                        )}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#666",
                          paddingRight: 12,
                          fontWeight: "500",
                        }}
                      >
                        ml
                      </Text>
                    </View>
                  </View>
                </View>
                <View>
                  <Text style={createRecipeStyles.subLabel}>단계 제목</Text>
                  <Controller
                    control={control}
                    name={`steps.${index}.title`}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={{
                          backgroundColor: "white",
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: "#e0e0e0",
                          paddingHorizontal: 12,
                          paddingVertical: 12,
                          fontSize: 16,
                          color: "#333",
                        }}
                        placeholder="단계 제목을 입력하세요 (예: 뜸들이기, 1차 추출)"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                </View>
                <View>
                  <Text style={createRecipeStyles.subLabel}>설명</Text>
                  <Controller
                    control={control}
                    name={`steps.${index}.description`}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={{
                          backgroundColor: "white",
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: "#e0e0e0",
                          paddingHorizontal: 12,
                          paddingVertical: 12,
                          fontSize: 16,
                          color: "#333",
                          textAlignVertical: "top",
                          height: 80,
                        }}
                        placeholder="단계에 대한 설명을 입력하세요"
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

        {/* Add Step Button - moved to bottom */}
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 16,
            marginBottom: 20,
            paddingVertical: 12,
            paddingHorizontal: 16,
          }}
          onPress={addStep}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={20} color="#8B4513" />
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: "#8B4513",
              marginLeft: 6,
            }}
          >
            단계 추가
          </Text>
        </TouchableOpacity>

        {hasAttemptedNext && errors.steps && (
          <Text style={createRecipeStyles.errorText}>
            {errors.steps.message || "단계 정보를 모두 입력해주세요"}
          </Text>
        )}
      </ScrollView>
    </View>
  );
};
