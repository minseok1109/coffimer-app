import type { RefObject } from 'react';
import { useRef } from 'react';
import { Controller } from 'react-hook-form';
import type { ScrollView } from 'react-native';
import { Text, TextInput, View } from 'react-native';
import type { BeanFormContext } from './types';
import { formStyles as styles } from './styles';

interface NotesSectionProps extends Pick<BeanFormContext, 'control'> {
  scrollViewRef: RefObject<ScrollView | null>;
}

export function NotesSection({ control, scrollViewRef }: NotesSectionProps) {
  const sectionY = useRef(0);

  return (
    <View
      onLayout={(e) => { sectionY.current = e.nativeEvent.layout.y; }}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>메모</Text>
      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            multiline
            numberOfLines={4}
            onBlur={onBlur}
            onChangeText={onChange}
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollTo({ y: sectionY.current, animated: true });
              }, 300);
            }}
            placeholder="원두에 대한 메모를 남겨보세요"
            placeholderTextColor="#999"
            style={styles.notesInput}
            textAlignVertical="top"
            value={value ?? ''}
          />
        )}
      />
    </View>
  );
}
