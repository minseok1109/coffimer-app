import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Controller, useWatch } from 'react-hook-form';
import { Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { BeanType, RoastLevel } from '@/types/bean';
import { ROAST_LEVEL_CONFIG } from '@/types/bean';
import type { RoastDateSelectorRef } from '../RoastDateSelector';
import type { RoastLevelSelectorRef } from '../RoastLevelSelector';
import type { BeanFormContext } from './types';
import { formStyles as styles } from './styles';

interface RoastInfoSectionProps extends BeanFormContext {
  roastLevel: RoastLevel | null | undefined;
  beanType: BeanType;
  roastLevelRef: React.RefObject<RoastLevelSelectorRef | null>;
  roastDateRef: React.RefObject<RoastDateSelectorRef | null>;
  openedDateRef: React.RefObject<RoastDateSelectorRef | null>;
}

export function RoastInfoSection({
  control,
  errors,
  setValue,
  shouldDirty,
  roastLevel,
  beanType,
  roastLevelRef,
  roastDateRef,
  openedDateRef,
}: RoastInfoSectionProps) {
  const roastDate = useWatch({ control, name: 'roast_date' });
  const openedDate = useWatch({ control, name: 'opened_date' });
  const setValueOptions = shouldDirty ? { shouldDirty: true } as const : undefined;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>로스팅 정보</Text>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>로스팅 날짜</Text>
          <Controller
            control={control}
            name="roast_date"
            render={({ field: { value } }) => (
              <TouchableOpacity
                onPress={() => roastDateRef.current?.expand()}
                style={styles.selector}
              >
                <Text
                  style={[styles.selectorText, !value && styles.selectorPlaceholder]}
                >
                  {value ? dayjs(value).format('YYYY년 M월 D일') : '날짜 선택'}
                </Text>
                <Ionicons color="#8B4513" name="calendar-outline" size={20} />
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>배전도</Text>
          <TouchableOpacity
            onPress={() => roastLevelRef.current?.expand()}
            style={styles.selector}
          >
            <Text
              style={[styles.selectorText, !roastLevel && styles.selectorPlaceholder]}
            >
              {roastLevel ? ROAST_LEVEL_CONFIG[roastLevel].label : '선택'}
            </Text>
            <Ionicons color="#8B4513" name="chevron-down" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>개봉일</Text>
          <Controller
            control={control}
            name="opened_date"
            render={({ field: { value } }) => (
              <>
                <TouchableOpacity
                  onPress={() => openedDateRef.current?.expand()}
                  style={[styles.selector, errors.opened_date && styles.inputError]}
                >
                  <Text
                    style={[styles.selectorText, !value && styles.selectorPlaceholder]}
                  >
                    {value ? dayjs(value).format('YYYY년 M월 D일') : '날짜 선택'}
                  </Text>
                  <Ionicons color="#8B4513" name="calendar-outline" size={20} />
                </TouchableOpacity>
                {errors.opened_date && (
                  <Text style={styles.errorText}>{errors.opened_date.message}</Text>
                )}
              </>
            )}
          />
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>디게싱 기간</Text>
          <Controller
            control={control}
            name="degassing_days"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputWithSuffix}>
                <TextInput
                  inputMode="numeric"
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={(text) => {
                    const num = Number.parseInt(text, 10);
                    onChange(Number.isNaN(num) ? null : num);
                  }}
                  placeholder="14"
                  placeholderTextColor="#999"
                  style={styles.numberInput}
                  value={value?.toString() ?? ''}
                />
                <Text style={styles.suffix}>일</Text>
              </View>
            )}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>원두 종류</Text>
        <View style={styles.segmentedControl}>
          <Pressable
            onPress={() => setValue('bean_type', 'blend', setValueOptions)}
            style={[styles.segment, beanType === 'blend' && styles.segmentActive]}
          >
            <Text
              style={[
                styles.segmentText,
                beanType === 'blend' && styles.segmentTextActive,
              ]}
            >
              블렌드
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setValue('bean_type', 'single_origin', setValueOptions)}
            style={[styles.segment, beanType === 'single_origin' && styles.segmentActive]}
          >
            <Text
              style={[
                styles.segmentText,
                beanType === 'single_origin' && styles.segmentTextActive,
              ]}
            >
              싱글 오리진
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
