import { Controller } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';
import type { BeanFormContext } from './types';
import { formStyles as styles } from './styles';

interface WeightPriceSectionProps extends BeanFormContext {
  showRemaining?: boolean;
}

export function WeightPriceSection({
  control,
  errors,
  showRemaining,
}: WeightPriceSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>무게 및 가격</Text>
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>무게 *</Text>
          <Controller
            control={control}
            name="weight_g"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <View
                  style={[
                    styles.inputWithSuffix,
                    errors.weight_g && styles.inputError,
                  ]}
                >
                  <TextInput
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(Number(text) || 0)}
                    placeholder="200"
                    placeholderTextColor="#999"
                    style={styles.numberInput}
                    value={value ? value.toString() : ''}
                  />
                  <Text style={styles.suffix}>g</Text>
                </View>
                {errors.weight_g && (
                  <Text style={styles.errorText}>{errors.weight_g.message}</Text>
                )}
              </>
            )}
          />
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>가격</Text>
          <Controller
            control={control}
            name="price"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputWithSuffix}>
                <TextInput
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={(text) => {
                    const num = Number(text);
                    onChange(Number.isNaN(num) ? null : num);
                  }}
                  placeholder="25000"
                  placeholderTextColor="#999"
                  style={styles.numberInput}
                  value={value?.toString() ?? ''}
                />
                <Text style={styles.suffix}>원</Text>
              </View>
            )}
          />
        </View>
      </View>

      {showRemaining && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>잔여량</Text>
          <Controller
            control={control}
            name="remaining_g"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <View style={[styles.inputWithSuffix, errors.remaining_g && styles.inputError]}>
                  <TextInput
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(Number(text) || 0)}
                    placeholder="0"
                    placeholderTextColor="#999"
                    style={styles.numberInput}
                    value={value !== undefined ? value.toString() : ''}
                  />
                  <Text style={styles.suffix}>g</Text>
                </View>
                {errors.remaining_g && (
                  <Text style={styles.errorText}>{errors.remaining_g.message}</Text>
                )}
              </>
            )}
          />
        </View>
      )}
    </View>
  );
}
