import { createRecipeStyles } from "@/styles/create-recipe.styles";
import { RecipeFormData } from "@/types/recipe-form";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

interface Step2Props {
  hasAttemptedNext?: boolean;
  onDripperPress?: () => void;
  onFilterPress?: () => void;
}

export const Step2: React.FC<Step2Props> = ({
  hasAttemptedNext = false,
  onDripperPress,
  onFilterPress,
}) => {
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<RecipeFormData>();

  const coffeeAmount = watch("coffeeAmount");
  const waterAmount = watch("waterAmount");
  const dripper = watch("dripper");
  const filter = watch("filter");

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

  const getSelectedDripperLabel = () => {
    const dripperOptions = [
      { label: "V60", value: "v60" },
      { label: "칼리타", value: "kalita" },
      { label: "케멕스", value: "chemex" },
      { label: "하리오", value: "hario" },
      { label: "오리가미", value: "origami" },
      { label: "솔로 드리퍼", value: "solo" },
    ];
    const selected = dripperOptions.find((option) => option.value === dripper);

    // 미리 정의된 옵션에서 찾은 경우 해당 label 반환
    if (selected) {
      return selected.label;
    }

    // 미리 정의된 옵션에 없지만 dripper 값이 있는 경우 (사용자 직접 입력) 그 값을 그대로 반환
    if (dripper) {
      return dripper;
    }

    // dripper 값이 없는 경우 placeholder 반환
    return "드리퍼를 선택하세요";
  };

  const getSelectedFilterLabel = () => {
    const filterOptions = [
      { label: "V60 종이 필터", value: "v60_paper" },
      { label: "카펙 아바카 필터", value: "cafec_abaca" },
      { label: "오리가미 콘 필터", value: "origami_cone" },
      { label: "칼리타 웨이브 185 필터", value: "kalita_wave_185" },
      { label: "칼리타 웨이브 155", value: "kalita_wave_155" },
      { label: "V60 전용 필터", value: "v60_exclusive" },
    ];
    const selected = filterOptions.find((option) => option.value === filter);

    // 미리 정의된 옵션에서 찾은 경우 해당 label 반환
    if (selected) {
      return selected.label;
    }

    // 미리 정의된 옵션에 없지만 filter 값이 있는 경우 (사용자 직접 입력) 그 값을 그대로 반환
    if (filter) {
      return filter;
    }

    // filter 값이 없는 경우 placeholder 반환
    return "필터를 선택하세요";
  };

  return (
    <View style={createRecipeStyles.stepContent}>
      <View style={createRecipeStyles.inputGroup}>
        <Text style={createRecipeStyles.label}>커피 원두 량 (g)</Text>
        <Controller
          control={control}
          name="coffeeAmount"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <View
                style={[
                  createRecipeStyles.inputWithSuffix,
                  hasAttemptedNext &&
                    errors.coffeeAmount &&
                    createRecipeStyles.inputError,
                ]}
              >
                <TextInput
                  style={createRecipeStyles.numberInput}
                  placeholder="0"
                  placeholderTextColor="#999"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="numeric"
                />
                <Text style={createRecipeStyles.suffix}>g</Text>
              </View>
              {hasAttemptedNext && errors.coffeeAmount && (
                <Text style={createRecipeStyles.errorText}>
                  {errors.coffeeAmount.message}
                </Text>
              )}
            </>
          )}
        />
      </View>

      <View style={createRecipeStyles.inputGroup}>
        <Text style={createRecipeStyles.label}>물양 (ml)</Text>
        <Controller
          control={control}
          name="waterAmount"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <View
                style={[
                  createRecipeStyles.inputWithSuffix,
                  hasAttemptedNext &&
                    errors.waterAmount &&
                    createRecipeStyles.inputError,
                ]}
              >
                <TextInput
                  style={createRecipeStyles.numberInput}
                  placeholder="0"
                  placeholderTextColor="#999"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="numeric"
                />
                <Text style={createRecipeStyles.suffix}>ml</Text>
              </View>
              {hasAttemptedNext && errors.waterAmount && (
                <Text style={createRecipeStyles.errorText}>
                  {errors.waterAmount.message}
                </Text>
              )}
            </>
          )}
        />
      </View>

      <View style={createRecipeStyles.inputGroup}>
        <Text style={createRecipeStyles.label}>비율 (ratio)</Text>
        <Controller
          control={control}
          name="ratio"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={createRecipeStyles.input}
              placeholder="자동 계산됨"
              placeholderTextColor="#999"
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
          render={({ field: { value } }) => (
            <>
              <TouchableOpacity
                style={[
                  createRecipeStyles.dripperSelector,
                  hasAttemptedNext &&
                    errors.dripper &&
                    createRecipeStyles.inputError,
                ]}
                onPress={onDripperPress}
              >
                <Text
                  style={[
                    createRecipeStyles.dripperSelectorText,
                    !value && createRecipeStyles.dripperPlaceholderText,
                  ]}
                >
                  {getSelectedDripperLabel()}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#8B4513" />
              </TouchableOpacity>
              {hasAttemptedNext && errors.dripper && (
                <Text style={createRecipeStyles.errorText}>
                  {errors.dripper.message}
                </Text>
              )}
            </>
          )}
        />
      </View>

      <View style={createRecipeStyles.inputGroup}>
        <Text style={createRecipeStyles.label}>필터</Text>
        <Controller
          control={control}
          name="filter"
          render={({ field: { value } }) => (
            <>
              <TouchableOpacity
                style={[
                  createRecipeStyles.dripperSelector,
                  hasAttemptedNext &&
                    errors.filter &&
                    createRecipeStyles.inputError,
                ]}
                onPress={onFilterPress}
              >
                <Text
                  style={[
                    createRecipeStyles.dripperSelectorText,
                    !value && createRecipeStyles.dripperPlaceholderText,
                  ]}
                >
                  {getSelectedFilterLabel()}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#8B4513" />
              </TouchableOpacity>
              {hasAttemptedNext && errors.filter && (
                <Text style={createRecipeStyles.errorText}>
                  {errors.filter.message}
                </Text>
              )}
            </>
          )}
        />
      </View>
    </View>
  );
};
