import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface CupNoteTagProps {
  note: string;
  onRemove?: () => void;
}

export const CupNoteTag = memo(function CupNoteTag({
  note,
  onRemove,
}: CupNoteTagProps) {
  return (
    <View style={styles.tag}>
      <Text style={styles.text}>{note}</Text>
      {onRemove && (
        <Pressable hitSlop={8} onPress={onRemove}>
          <Ionicons
            color="#8B4513"
            name="close-circle"
            size={16}
            style={styles.removeIcon}
          />
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139,69,19,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8B4513',
  },
  removeIcon: {
    marginLeft: 4,
    opacity: 0.6,
  },
});
