import { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { createRecipeStyles } from '@/styles/create-recipe.styles';
import type { RecipeFormData } from '@/types/recipe-form';

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
    name: 'steps',
  });
  const addStep = () => {
    append({ title: '', time: '', waterAmount: '', description: '' });
  };

  return (
    <View style={createRecipeStyles.stepContent}>
      <View style={{ gap: 20 }}>
        <View style={createRecipeStyles.stepHeader}>
          <Text style={createRecipeStyles.label}>단계별 추출 가이드</Text>
        </View>
      </View>

      {/* 스크롤 가능한 컨텐츠만 ScrollView에 포함 */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={createRecipeStyles.stepsList}>
          {fields.map((field, index) => (
            <View key={field.id} style={createRecipeStyles.brewStep}>
              <View style={createRecipeStyles.stepTitleRow}>
                <Text style={createRecipeStyles.stepTitle}>
                  {index + 1}단계
                </Text>
                {index > 0 && (
                  <TouchableOpacity onPress={() => remove(index)}>
                    <Ionicons color="#ff4444" name="close-circle" size={24} />
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
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'white',
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#e0e0e0',
                      }}
                    >
                      <Controller
                        control={control}
                        name={`steps.${index}.time`}
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            keyboardType="numeric"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            placeholder="00"
                            placeholderTextColor="#999"
                            style={[
                              createRecipeStyles.smallInput,
                              {
                                backgroundColor: 'transparent',
                                borderWidth: 0,
                                flex: 1,
                              },
                            ]}
                            value={value}
                          />
                        )}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          color: '#666',
                          paddingRight: 12,
                          fontWeight: '500',
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
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'white',
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#e0e0e0',
                      }}
                    >
                      <Controller
                        control={control}
                        name={`steps.${index}.waterAmount`}
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            keyboardType="numeric"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            placeholder="0"
                            placeholderTextColor="#999"
                            style={[
                              createRecipeStyles.smallInput,
                              {
                                backgroundColor: 'transparent',
                                borderWidth: 0,
                                flex: 1,
                              },
                            ]}
                            value={value}
                          />
                        )}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          color: '#666',
                          paddingRight: 12,
                          fontWeight: '500',
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
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="단계 제목을 입력하세요 (예: 뜸들이기, 1차 추출)"
                        placeholderTextColor="#999"
                        style={{
                          backgroundColor: 'white',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: '#e0e0e0',
                          paddingHorizontal: 12,
                          paddingVertical: 12,
                          fontSize: 16,
                          color: '#333',
                        }}
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
                        multiline
                        numberOfLines={4}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="단계에 대한 설명을 입력하세요"
                        placeholderTextColor="#999"
                        style={{
                          backgroundColor: 'white',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: '#e0e0e0',
                          paddingHorizontal: 12,
                          paddingVertical: 12,
                          fontSize: 16,
                          color: '#333',
                          textAlignVertical: 'top',
                          height: 80,
                        }}
                        value={value}
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
          activeOpacity={0.7}
          onPress={addStep}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 16,
            marginBottom: 20,
            paddingVertical: 12,
            paddingHorizontal: 16,
          }}
        >
          <Ionicons color="#8B4513" name="add-circle-outline" size={20} />
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: '#8B4513',
              marginLeft: 6,
            }}
          >
            단계 추가
          </Text>
        </TouchableOpacity>

        {hasAttemptedNext && errors.steps && (
          <Text style={createRecipeStyles.errorText}>
            {errors.steps.message || '단계 정보를 모두 입력해주세요'}
          </Text>
        )}
      </ScrollView>
    </View>
  );
};
