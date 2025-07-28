import type React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Switch, Text, TextInput, View } from 'react-native';
import { isValidYouTubeUrl } from '@/lib/youtube';
import { createRecipeStyles } from '@/styles/create-recipe.styles';
import type { RecipeFormData } from '@/types/recipe-form';
import { YouTubePreview } from './YouTubePreview';

interface Step1Props {
  hasAttemptedNext?: boolean;
}

export const Step1: React.FC<Step1Props> = ({ hasAttemptedNext = false }) => {
  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext<RecipeFormData>();

  const youtubeUrl = watch('youtubeUrl');

  return (
    <View style={createRecipeStyles.stepContent}>
      <View style={createRecipeStyles.inputGroup}>
        <Text style={createRecipeStyles.label}>레시피 제목</Text>
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="예) 케냐 AA 핸드드립"
                placeholderTextColor="#999"
                style={[
                  createRecipeStyles.input,
                  hasAttemptedNext &&
                    errors.title &&
                    createRecipeStyles.inputError,
                ]}
                value={value}
              />
              {hasAttemptedNext && errors.title && (
                <Text style={createRecipeStyles.errorText}>
                  {errors.title.message}
                </Text>
              )}
            </>
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
              multiline
              numberOfLines={4}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="이 레시피의 특징이나 맛의 포인트를 적어주세요"
              placeholderTextColor="#999"
              style={[createRecipeStyles.input, createRecipeStyles.textArea]}
              value={value}
            />
          )}
        />
      </View>

      <View style={createRecipeStyles.inputGroup}>
        <Text style={createRecipeStyles.label}>YouTube URL (선택)</Text>
        <Controller
          control={control}
          name="youtubeUrl"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="https://youtube.com/watch?v=..."
                placeholderTextColor="#999"
                style={[
                  createRecipeStyles.input,
                  hasAttemptedNext &&
                    errors.youtubeUrl &&
                    createRecipeStyles.inputError,
                ]}
                value={value}
              />
              {hasAttemptedNext && errors.youtubeUrl && (
                <Text style={createRecipeStyles.errorText}>
                  {errors.youtubeUrl.message}
                </Text>
              )}
            </>
          )}
        />
        {youtubeUrl && isValidYouTubeUrl(youtubeUrl) && (
          <YouTubePreview url={youtubeUrl} />
        )}
      </View>

      <View style={createRecipeStyles.switchGroup}>
        <Text style={createRecipeStyles.label}>공개 여부</Text>
        <Controller
          control={control}
          name="isPublic"
          render={({ field: { onChange, value } }) => (
            <Switch
              onValueChange={onChange}
              thumbColor="#fff"
              trackColor={{ false: '#ddd', true: '#8B4513' }}
              value={value}
            />
          )}
        />
      </View>
    </View>
  );
};
