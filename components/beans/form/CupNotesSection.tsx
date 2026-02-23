import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { PRESET_CUP_NOTES } from '@/types/bean';
import { CupNoteTag } from '../CupNoteTag';
import { formStyles as styles } from './styles';

interface CupNotesSectionProps {
  cupNotes: string[];
  onAdd: (note: string) => void;
  onRemove: (note: string) => void;
}

export function CupNotesSection({ cupNotes, onAdd, onRemove }: CupNotesSectionProps) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    onAdd(input);
    setInput('');
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>컵노트</Text>

      {cupNotes.length > 0 && (
        <View style={styles.cupNotesWrap}>
          {cupNotes.map((note) => (
            <CupNoteTag key={note} note={note} onRemove={() => onRemove(note)} />
          ))}
        </View>
      )}

      <View style={styles.cupNoteInputRow}>
        <TextInput
          onChangeText={setInput}
          onSubmitEditing={handleAdd}
          placeholder="컵노트 추가"
          placeholderTextColor="#999"
          returnKeyType="done"
          style={[styles.input, styles.cupNoteInput]}
          value={input}
        />
        <TouchableOpacity
          disabled={!input.trim()}
          onPress={handleAdd}
          style={[
            styles.addNoteButton,
            !input.trim() && styles.addNoteButtonDisabled,
          ]}
        >
          <Ionicons
            color={input.trim() ? '#FFFFFF' : '#D1D5DB'}
            name="add"
            size={20}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.presetNotesWrap}>
        {PRESET_CUP_NOTES.filter((note) => !cupNotes.includes(note)).map((note) => (
          <Pressable key={note} onPress={() => onAdd(note)} style={styles.presetChip}>
            <Text style={styles.presetChipText}>{note}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
