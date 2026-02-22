import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useRef, useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import {
  Image,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const PROCESS_METHOD_PRESETS = ['워시드', '내추럴', '허니', '무산소 발효', '기타'] as const;
import type { BeanFieldConfidence, BeanType, RoastLevel } from '@/types/bean';
import { PRESET_CUP_NOTES, ROAST_LEVEL_CONFIG } from '@/types/bean';
import type { BeanFormData } from '@/lib/validation/beanSchema';
import { ConfidenceBadge } from './ConfidenceBadge';
import { CupNoteTag } from './CupNoteTag';
import {
  RoastDateSelector,
  type RoastDateSelectorRef,
} from './RoastDateSelector';
import {
  RoastLevelSelector,
  type RoastLevelSelectorRef,
} from './RoastLevelSelector';

interface BeanFormPhaseProps {
  primaryImageUri: string | null;
  onChangeImages: () => void;
  control: Control<BeanFormData>;
  errors: FieldErrors<BeanFormData>;
  cupNotes: string[];
  beanType: BeanType;
  roastLevel: RoastLevel | null | undefined;
  confidence: BeanFieldConfidence;
  onAddCupNote: (note: string) => void;
  onRemoveCupNote: (note: string) => void;
  setValue: UseFormSetValue<BeanFormData>;
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export function BeanFormPhase({
  primaryImageUri,
  onChangeImages,
  control,
  errors,
  cupNotes,
  beanType,
  roastLevel,
  confidence,
  onAddCupNote,
  onRemoveCupNote,
  setValue,
  isLoading,
  onCancel,
  onSubmit,
}: BeanFormPhaseProps) {
  const [cupNoteInput, setCupNoteInput] = useState('');
  const [customProcessInput, setCustomProcessInput] = useState('');
  const [isCustomProcess, setIsCustomProcess] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const noteSectionY = useRef(0);
  const roastLevelRef = useRef<RoastLevelSelectorRef>(null);
  const roastDateRef = useRef<RoastDateSelectorRef>(null);
  const roastDate = useWatch({ control, name: 'roast_date' });
  const processMethod = useWatch({ control, name: 'process_method' });

  const handleAddCupNote = () => {
    onAddCupNote(cupNoteInput);
    setCupNoteInput('');
  };

  const handleProcessMethodSelect = (preset: string, setFormValue: UseFormSetValue<BeanFormData>) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (preset === '기타') {
      if (isCustomProcess) {
        setIsCustomProcess(false);
        setCustomProcessInput('');
        setFormValue('process_method', null);
      } else {
        setIsCustomProcess(true);
        setFormValue('process_method', null);
      }
    } else {
      const isAlreadySelected = processMethod === preset && !isCustomProcess;
      setIsCustomProcess(false);
      setCustomProcessInput('');
      setFormValue('process_method', isAlreadySelected ? null : preset);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {primaryImageUri && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: primaryImageUri }} style={styles.formPreviewImage} />
            <TouchableOpacity onPress={onChangeImages} style={styles.changeImageButton}>
              <Text style={styles.changeImageText}>변경</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 기본 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>원두 기본 정보</Text>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>원두 이름 *</Text>
              <ConfidenceBadge confidence={confidence.name} />
            </View>
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
            <View style={styles.labelRow}>
              <Text style={styles.label}>로스터리</Text>
              <ConfidenceBadge confidence={confidence.roastery_name} />
            </View>
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

        {/* 가공 방식 */}
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
                  onPress={() => handleProcessMethodSelect(preset, setValue)}
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
                  setValue('process_method', text || null);
                }}
                placeholder="가공 방식을 입력하세요"
                placeholderTextColor="#999"
                style={styles.input}
                value={customProcessInput}
              />
            </View>
          )}
        </View>

        {/* 로스팅 정보 */}
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
                onPress={() => setValue('bean_type', 'blend')}
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
                onPress={() => setValue('bean_type', 'single_origin')}
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

        {/* 무게 및 가격 */}
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
        </View>

        {/* 컵노트 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>컵노트</Text>

          {cupNotes.length > 0 && (
            <View style={styles.cupNotesWrap}>
              {cupNotes.map((note) => (
                <CupNoteTag key={note} note={note} onRemove={() => onRemoveCupNote(note)} />
              ))}
            </View>
          )}

          <View style={styles.cupNoteInputRow}>
            <TextInput
              onChangeText={setCupNoteInput}
              onSubmitEditing={handleAddCupNote}
              placeholder="컵노트 추가"
              placeholderTextColor="#999"
              returnKeyType="done"
              style={[styles.input, styles.cupNoteInput]}
              value={cupNoteInput}
            />
            <TouchableOpacity
              disabled={!cupNoteInput.trim()}
              onPress={handleAddCupNote}
              style={[
                styles.addNoteButton,
                !cupNoteInput.trim() && styles.addNoteButtonDisabled,
              ]}
            >
              <Ionicons
                color={cupNoteInput.trim() ? '#FFFFFF' : '#D1D5DB'}
                name="add"
                size={20}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.presetNotesWrap}>
            {PRESET_CUP_NOTES.filter((note) => !cupNotes.includes(note)).map((note) => (
              <Pressable key={note} onPress={() => onAddCupNote(note)} style={styles.presetChip}>
                <Text style={styles.presetChipText}>{note}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 메모 */}
        <View
          onLayout={(e) => { noteSectionY.current = e.nativeEvent.layout.y; }}
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
                    scrollViewRef.current?.scrollTo({ y: noteSectionY.current, animated: true });
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
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity disabled={isLoading} onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>취소</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={isLoading}
          onPress={onSubmit}
          style={[styles.submitButton, isLoading && styles.disabledButton]}
        >
          <Text style={styles.submitButtonText}>{isLoading ? '등록 중...' : '등록하기'}</Text>
        </TouchableOpacity>
      </View>

      {/* BottomSheet */}
      <RoastLevelSelector
        onSelect={(level: RoastLevel) => setValue('roast_level', level)}
        ref={roastLevelRef}
        selectedLevel={roastLevel ?? null}
      />
      <RoastDateSelector
        onSelect={(date: string) => setValue('roast_date', date)}
        ref={roastDateRef}
        selectedDate={roastDate ?? null}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  formPreviewImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#E5E7EB',
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changeImageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  selector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectorPlaceholder: {
    color: '#999',
  },
  inputWithSuffix: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  numberInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  suffix: {
    paddingRight: 16,
    fontSize: 16,
    color: '#666',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  segmentTextActive: {
    color: '#8B4513',
    fontWeight: '600',
  },
  cupNotesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  cupNoteInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  cupNoteInput: {
    flex: 1,
  },
  addNoteButton: {
    width: 48,
    backgroundColor: '#8B4513',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNoteButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  presetNotesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  presetChipText: {
    fontSize: 13,
    color: '#666',
  },
  processChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  processChip: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  processChipActive: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  processChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  processChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#8B4513',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#8B4513',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#8B4513',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
