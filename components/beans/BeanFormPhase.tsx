import { useRef } from 'react';
import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import type { BeanFieldConfidence, BeanType, RoastLevel } from '@/types/bean';
import type { BeanFormData } from '@/lib/validation/beanSchema';
import {
  RoastDateSelector,
  type RoastDateSelectorRef,
} from './RoastDateSelector';
import {
  RoastLevelSelector,
  type RoastLevelSelectorRef,
} from './RoastLevelSelector';
import {
  BasicInfoSection,
  CupNotesSection,
  FormActionButtons,
  NotesSection,
  ProcessMethodSection,
  RoastInfoSection,
  WeightPriceSection,
  formStyles as styles,
} from './form';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

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
  const scrollViewRef = useRef<ScrollView>(null);
  const roastLevelRef = useRef<RoastLevelSelectorRef>(null);
  const roastDateRef = useRef<RoastDateSelectorRef>(null);
  const openedDateRef = useRef<RoastDateSelectorRef>(null);
  const roastDate = useWatch({ control, name: 'roast_date' });
  const openedDate = useWatch({ control, name: 'opened_date' });

  const formCtx = { control, errors, setValue };

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

        <BasicInfoSection {...formCtx} confidence={confidence} />
        <ProcessMethodSection {...formCtx} />
        <RoastInfoSection
          {...formCtx}
          beanType={beanType}
          openedDateRef={openedDateRef}
          roastDateRef={roastDateRef}
          roastLevel={roastLevel}
          roastLevelRef={roastLevelRef}
        />
        <WeightPriceSection {...formCtx} />
        <CupNotesSection cupNotes={cupNotes} onAdd={onAddCupNote} onRemove={onRemoveCupNote} />
        <NotesSection control={control} scrollViewRef={scrollViewRef} />
      </ScrollView>

      <FormActionButtons
        isLoading={isLoading}
        loadingLabel="등록 중..."
        onCancel={onCancel}
        onSubmit={onSubmit}
        submitLabel="등록하기"
      />

      <RoastLevelSelector
        onSelect={(level: RoastLevel) => setValue('roast_level', level)}
        ref={roastLevelRef}
        selectedLevel={roastLevel ?? null}
      />
      <RoastDateSelector
        onSelect={(date: string) => setValue('roast_date', date)}
        ref={roastDateRef}
        selectedDate={roastDate ?? null}
        title="로스팅 날짜 선택"
      />
      <RoastDateSelector
        onSelect={(date: string) => setValue('opened_date', date)}
        ref={openedDateRef}
        selectedDate={openedDate ?? null}
        title="개봉일 선택"
      />
    </KeyboardAvoidingView>
  );
}
