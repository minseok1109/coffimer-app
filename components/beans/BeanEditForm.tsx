import { useRef } from 'react';
import { useWatch } from 'react-hook-form';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  UIManager,
  View,
} from 'react-native';
import type { Bean, RoastLevel, UpdateBeanInput } from '@/types/bean';
import { useBeanForm } from '@/hooks/useBeanForm';
import type { BeanFormData } from '@/lib/validation/beanSchema';
import { beanToFormData, normalizeEditInput } from '@/lib/beans/normalizeBeanInput';
import { getPrimaryBeanImage } from '@/utils/beanImages';
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

interface BeanEditFormProps {
  bean: Bean;
  onSubmit: (data: UpdateBeanInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BeanEditForm({
  bean,
  onSubmit,
  onCancel,
  isLoading = false,
}: BeanEditFormProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const roastLevelRef = useRef<RoastLevelSelectorRef>(null);
  const roastDateRef = useRef<RoastDateSelectorRef>(null);
  const openedDateRef = useRef<RoastDateSelectorRef>(null);

  const {
    control,
    handleSubmit,
    setValue,
    errors,
    isDirty,
    cupNotes,
    beanType,
    roastLevel,
    addCupNote,
    removeCupNote,
    handleFormSubmit,
  } = useBeanForm({
    onSubmit: async (data: BeanFormData) => {
      const normalized = normalizeEditInput(data as unknown as Record<string, unknown>);
      await onSubmit(normalized);
    },
    encodedImages: [],
    defaultValues: beanToFormData(bean),
    submitErrorMessage: '원두 수정 중 오류가 발생했습니다.',
  });

  const primaryImage = getPrimaryBeanImage(bean.images);
  const roastDate = useWatch({ control, name: 'roast_date' });
  const openedDate = useWatch({ control, name: 'opened_date' });

  const formCtx = { control, errors, setValue, shouldDirty: true };

  const handleCancel = () => {
    if (!isDirty) {
      onCancel();
      return;
    }
    Alert.alert(
      '변경사항이 있습니다',
      '수정 중인 내용을 버리고 나가시겠습니까?',
      [
        { text: '계속 수정', style: 'cancel' },
        { text: '나가기', style: 'destructive', onPress: onCancel },
      ],
    );
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
        {primaryImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: primaryImage.image_url }} style={styles.formPreviewImage} />
          </View>
        )}

        <BasicInfoSection {...formCtx} />
        <ProcessMethodSection {...formCtx} />
        <RoastInfoSection
          {...formCtx}
          beanType={beanType}
          openedDateRef={openedDateRef}
          roastDateRef={roastDateRef}
          roastLevel={roastLevel}
          roastLevelRef={roastLevelRef}
        />
        <WeightPriceSection {...formCtx} showRemaining />
        <CupNotesSection cupNotes={cupNotes} onAdd={addCupNote} onRemove={removeCupNote} />
        <NotesSection control={control} scrollViewRef={scrollViewRef} />
      </ScrollView>

      <FormActionButtons
        isLoading={isLoading}
        loadingLabel="저장 중..."
        onCancel={handleCancel}
        onSubmit={handleSubmit(handleFormSubmit)}
        submitLabel="저장하기"
      />

      <RoastLevelSelector
        onSelect={(level: RoastLevel) => setValue('roast_level', level, { shouldDirty: true })}
        ref={roastLevelRef}
        selectedLevel={roastLevel ?? null}
      />
      <RoastDateSelector
        onSelect={(date: string) => setValue('roast_date', date, { shouldDirty: true })}
        ref={roastDateRef}
        selectedDate={roastDate ?? null}
        title="로스팅 날짜 선택"
      />
      <RoastDateSelector
        onSelect={(date: string) => setValue('opened_date', date, { shouldDirty: true })}
        ref={openedDateRef}
        selectedDate={openedDate ?? null}
        title="개봉일 선택"
      />
    </KeyboardAvoidingView>
  );
}
