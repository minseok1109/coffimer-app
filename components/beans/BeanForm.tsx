import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { z } from 'zod';
import type {
  BeanFieldConfidence,
  RoastLevel,
} from '@/types/bean';
import { PRESET_CUP_NOTES } from '@/types/bean';
import { ConfidenceBadge } from './ConfidenceBadge';
import { CupNoteTag } from './CupNoteTag';
import {
  RoastLevelSelector,
  type RoastLevelSelectorRef,
} from './RoastLevelSelector';

// --- Zod Schema ---
const beanFormSchema = z.object({
  name: z.string().min(1, '원두 이름을 입력해주세요'),
  roastery_name: z.string().optional(),
  roast_date: z.string().optional(),
  roast_level: z
    .enum(['light', 'medium_light', 'medium', 'medium_dark', 'dark'])
    .nullable()
    .optional(),
  bean_type: z.enum(['blend', 'single_origin']),
  weight_g: z.number().min(1, '무게를 입력해주세요'),
  price: z.number().nullable().optional(),
  cup_notes: z.array(z.string()),
});

type BeanFormData = z.infer<typeof beanFormSchema>;

type Phase = 'capture' | 'analyzing' | 'form';

interface BeanFormProps {
  onSubmit: (data: BeanFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BeanForm({ onSubmit, onCancel, isLoading = false }: BeanFormProps) {
  const [phase, setPhase] = useState<Phase>('capture');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const confidence: BeanFieldConfidence = {
    name: null,
    roastery_name: null,
    roast_level: null,
    bean_type: null,
    weight_g: null,
    price: null,
    cup_notes: null,
  };
  const [cupNoteInput, setCupNoteInput] = useState('');

  const roastLevelRef = useRef<RoastLevelSelectorRef>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BeanFormData>({
    resolver: zodResolver(beanFormSchema),
    defaultValues: {
      name: '',
      roastery_name: '',
      roast_date: '',
      roast_level: null,
      bean_type: 'blend',
      weight_g: 0,
      price: null,
      cup_notes: [],
    },
  });

  const cupNotes = watch('cup_notes');
  const beanType = watch('bean_type');
  const roastLevel = watch('roast_level');

  // --- Phase handlers ---
  const handleCapture = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '카메라 권한을 허용해주세요.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.at(0)) {
      setImageUri(result.assets[0].uri);
      setPhase('form');
    }
  };

  const handleGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '갤러리 접근 권한을 허용해주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.at(0)) {
      setImageUri(result.assets[0].uri);
      setPhase('form');
    }
  };

  const handleSkipPhoto = () => {
    setPhase('form');
  };

  // --- Cup note handlers ---
  const addCupNote = (note: string) => {
    const trimmed = note.trim();
    if (trimmed && !cupNotes.includes(trimmed)) {
      setValue('cup_notes', [...cupNotes, trimmed]);
    }
    setCupNoteInput('');
  };

  const removeCupNote = (note: string) => {
    setValue(
      'cup_notes',
      cupNotes.filter((n) => n !== note),
    );
  };

  const handleFormSubmit = async (data: BeanFormData) => {
    try {
      await onSubmit(data);
    } catch {
      Alert.alert('저장 실패', '원두 등록 중 오류가 발생했습니다.');
    }
  };

  // --- Phase 1: Capture ---
  if (phase === 'capture') {
    return (
      <View style={styles.captureContainer}>
        <View style={styles.captureArea}>
          <Ionicons color="#A56A49" name="camera-outline" size={64} />
          <Text style={styles.captureTitle}>원두 봉투를 촬영하세요</Text>
          <Text style={styles.captureSubtitle}>
            AI가 원두 정보를 자동으로 추출합니다
          </Text>
        </View>

        <View style={styles.captureButtons}>
          <TouchableOpacity
            onPress={handleCapture}
            style={styles.primaryButton}
          >
            <Ionicons color="#FFFFFF" name="camera" size={20} />
            <Text style={styles.primaryButtonText}>촬영</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleGallery}
            style={styles.secondaryButton}
          >
            <Ionicons color="#8B4513" name="image-outline" size={20} />
            <Text style={styles.secondaryButtonText}>갤러리</Text>
          </TouchableOpacity>
        </View>

        <Pressable onPress={handleSkipPhoto}>
          <Text style={styles.skipText}>사진 없이 직접 입력</Text>
        </Pressable>
      </View>
    );
  }

  // --- Phase 2: Analyzing ---
  if (phase === 'analyzing') {
    return (
      <View style={styles.analyzingContainer}>
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        )}
        <View style={styles.analyzingCard}>
          <ActivityIndicator color="#8B4513" size="large" />
          <Text style={styles.analyzingTitle}>
            AI가 원두 정보를 분석 중입니다...
          </Text>
          <Text style={styles.analyzingSubtitle}>잠시만 기다려주세요</Text>
        </View>
      </View>
    );
  }

  // --- Phase 3: Form ---
  return (
    <View style={styles.formContainer}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Image Preview */}
        {imageUri && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.formPreviewImage} />
            <TouchableOpacity
              onPress={() => setPhase('capture')}
              style={styles.changeImageButton}
            >
              <Text style={styles.changeImageText}>변경</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Section: Basic Info */}
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
        </View>

        {/* Section: Roasting Info */}
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
                    onPress={() => {
                      // TODO: DatePicker 연동
                    }}
                    style={styles.selector}
                  >
                    <Text
                      style={[
                        styles.selectorText,
                        !value && styles.selectorPlaceholder,
                      ]}
                    >
                      {value || '날짜 선택'}
                    </Text>
                    <Ionicons
                      color="#8B4513"
                      name="calendar-outline"
                      size={20}
                    />
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
                  style={[
                    styles.selectorText,
                    !roastLevel && styles.selectorPlaceholder,
                  ]}
                >
                  {roastLevel
                    ? (() => {
                        const labels: Record<string, string> = {
                          light: '라이트',
                          medium_light: '미디엄 라이트',
                          medium: '미디엄',
                          medium_dark: '미디엄 다크',
                          dark: '다크',
                        };
                        return labels[roastLevel] ?? roastLevel;
                      })()
                    : '선택'}
                </Text>
                <Ionicons color="#8B4513" name="chevron-down" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bean Type Segmented Control */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>원두 종류</Text>
            <View style={styles.segmentedControl}>
              <Pressable
                onPress={() => setValue('bean_type', 'blend')}
                style={[
                  styles.segment,
                  beanType === 'blend' && styles.segmentActive,
                ]}
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
                style={[
                  styles.segment,
                  beanType === 'single_origin' && styles.segmentActive,
                ]}
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

        {/* Section: Weight & Price */}
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
                      <Text style={styles.errorText}>
                        {errors.weight_g.message}
                      </Text>
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

        {/* Section: Cup Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>컵노트</Text>

          {cupNotes.length > 0 && (
            <View style={styles.cupNotesWrap}>
              {cupNotes.map((note) => (
                <CupNoteTag
                  key={note}
                  note={note}
                  onRemove={() => removeCupNote(note)}
                />
              ))}
            </View>
          )}

          <View style={styles.cupNoteInputRow}>
            <TextInput
              onChangeText={setCupNoteInput}
              onSubmitEditing={() => addCupNote(cupNoteInput)}
              placeholder="컵노트 추가"
              placeholderTextColor="#999"
              returnKeyType="done"
              style={[styles.input, styles.cupNoteInput]}
              value={cupNoteInput}
            />
            <TouchableOpacity
              disabled={!cupNoteInput.trim()}
              onPress={() => addCupNote(cupNoteInput)}
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
            {PRESET_CUP_NOTES.filter((note) => !cupNotes.includes(note)).map(
              (note) => (
                <Pressable
                  key={note}
                  onPress={() => addCupNote(note)}
                  style={styles.presetChip}
                >
                  <Text style={styles.presetChipText}>{note}</Text>
                </Pressable>
              ),
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          disabled={isLoading}
          onPress={onCancel}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelButtonText}>취소</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={isLoading}
          onPress={handleSubmit(handleFormSubmit)}
          style={[styles.submitButton, isLoading && styles.disabledButton]}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? '등록 중...' : '등록하기'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <RoastLevelSelector
        onSelect={(level: RoastLevel) => setValue('roast_level', level)}
        ref={roastLevelRef}
        selectedLevel={roastLevel ?? null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Phase 1: Capture
  captureContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 32,
  },
  captureArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
    width: '100%',
    aspectRatio: 4 / 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  captureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  captureSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  captureButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#8B4513',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#8B4513',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#8B4513',
    fontSize: 16,
    fontWeight: '600',
  },
  skipText: {
    fontSize: 14,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },

  // Phase 2: Analyzing
  analyzingContainer: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  analyzingCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  analyzingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  analyzingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Phase 3: Form
  formContainer: {
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

  // Segmented Control
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

  // Cup Notes
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

  // Bottom Bar
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
