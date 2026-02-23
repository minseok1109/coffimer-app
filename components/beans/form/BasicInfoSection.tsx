import { Controller } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';
import type { BeanFieldConfidence } from '@/types/bean';
import { ConfidenceBadge } from '../ConfidenceBadge';
import type { BeanFormContext } from './types';
import { formStyles as styles } from './styles';

interface BasicInfoSectionProps extends BeanFormContext {
  confidence?: BeanFieldConfidence;
}

export function BasicInfoSection({ control, errors, confidence }: BasicInfoSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>원두 기본 정보</Text>

      <View style={styles.inputGroup}>
        {confidence ? (
          <View style={styles.labelRow}>
            <Text style={styles.label}>원두 이름 *</Text>
            <ConfidenceBadge confidence={confidence.name} />
          </View>
        ) : (
          <Text style={styles.label}>원두 이름 *</Text>
        )}
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="원두 이름을 입력하세요"
                placeholderTextColor="#999"
                style={[styles.input, errors.name && styles.inputError]}
                value={value}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name.message}</Text>
              )}
            </>
          )}
        />
      </View>

      <View style={styles.inputGroup}>
        {confidence ? (
          <View style={styles.labelRow}>
            <Text style={styles.label}>로스터리</Text>
            <ConfidenceBadge confidence={confidence.roastery_name} />
          </View>
        ) : (
          <Text style={styles.label}>로스터리</Text>
        )}
        <Controller
          control={control}
          name="roastery_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="로스터리명을 입력하세요"
              placeholderTextColor="#999"
              style={styles.input}
              value={value ?? ''}
            />
          )}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>품종</Text>
        <Controller
          control={control}
          name="variety"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="예: 게이샤, SL28, 버번"
              placeholderTextColor="#999"
              style={styles.input}
              value={value ?? ''}
            />
          )}
        />
      </View>
    </View>
  );
}
