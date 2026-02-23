import { useState } from 'react';
import { useWatch } from 'react-hook-form';
import { LayoutAnimation, Pressable, Text, TextInput, View } from 'react-native';
import type { BeanFormContext } from './types';
import { formStyles as styles } from './styles';

const PROCESS_METHOD_PRESETS = ['워시드', '내추럴', '허니', '무산소 발효', '기타'] as const;

export function ProcessMethodSection({ control, setValue, shouldDirty }: BeanFormContext) {
  const [customProcessInput, setCustomProcessInput] = useState('');
  const [isCustomProcess, setIsCustomProcess] = useState(false);
  const processMethod = useWatch({ control, name: 'process_method' });
  const setValueOptions = shouldDirty ? { shouldDirty: true } as const : undefined;

  const handleSelect = (preset: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (preset === '기타') {
      if (isCustomProcess) {
        setIsCustomProcess(false);
        setCustomProcessInput('');
        setValue('process_method', null, setValueOptions);
      } else {
        setIsCustomProcess(true);
        setValue('process_method', null, setValueOptions);
      }
    } else {
      const isAlreadySelected = processMethod === preset && !isCustomProcess;
      setIsCustomProcess(false);
      setCustomProcessInput('');
      setValue('process_method', isAlreadySelected ? null : preset, setValueOptions);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>가공 방식</Text>
      <View style={styles.processChipsWrap}>
        {PROCESS_METHOD_PRESETS.map((preset) => {
          const isSelected =
            preset === '기타'
              ? isCustomProcess
              : processMethod === preset && !isCustomProcess;
          return (
            <Pressable
              key={preset}
              onPress={() => handleSelect(preset)}
              style={[styles.processChip, isSelected && styles.processChipActive]}
            >
              <Text
                style={[styles.processChipText, isSelected && styles.processChipTextActive]}
              >
                {preset}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {isCustomProcess && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>직접 입력</Text>
          <TextInput
            onChangeText={(text) => {
              setCustomProcessInput(text);
              setValue('process_method', text || null, setValueOptions);
            }}
            placeholder="가공 방식을 입력하세요"
            placeholderTextColor="#999"
            style={styles.input}
            value={customProcessInput}
          />
        </View>
      )}
    </View>
  );
}
