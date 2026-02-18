import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import type { AIExtractionResult } from '@/types/bean';
import { beanFormSchema } from '@/lib/validation/beanSchema';
import type { BeanFormData, ImageData } from '@/lib/validation/beanSchema';

const DEFAULT_FORM_VALUES: BeanFormData = {
  name: '',
  roastery_name: '',
  roast_date: '',
  roast_level: null,
  bean_type: 'blend',
  weight_g: 0,
  price: null,
  cup_notes: [],
  degassing_days: null,
  variety: '',
  process_method: null,
  notes: '',
};

interface UseBeanFormOptions {
  onSubmit: (data: BeanFormData, imageData: ImageData | null) => Promise<void>;
  imageData: ImageData | null;
  defaultValues?: Partial<BeanFormData>;
  submitErrorMessage?: string;
}

export function useBeanForm({
  onSubmit,
  imageData,
  defaultValues,
  submitErrorMessage = '원두 저장 중 오류가 발생했습니다.',
}: UseBeanFormOptions) {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<BeanFormData>({
    resolver: zodResolver(beanFormSchema),
    defaultValues: { ...DEFAULT_FORM_VALUES, ...defaultValues },
  });

  const cupNotes = watch('cup_notes');
  const beanType = watch('bean_type');
  const roastLevel = watch('roast_level');

  const addCupNote = (note: string) => {
    const trimmed = note.trim();
    if (trimmed && !cupNotes.includes(trimmed)) {
      setValue('cup_notes', [...cupNotes, trimmed], { shouldDirty: true });
    }
  };

  const removeCupNote = (note: string) => {
    setValue(
      'cup_notes',
      cupNotes.filter((n) => n !== note),
      { shouldDirty: true },
    );
  };

  const applyAnalysisResult = (result: AIExtractionResult) => {
    if (result.name) setValue('name', result.name);
    if (result.roastery_name) setValue('roastery_name', result.roastery_name);
    if (result.roast_level) setValue('roast_level', result.roast_level);
    if (result.bean_type) setValue('bean_type', result.bean_type);
    if (result.weight_g) setValue('weight_g', result.weight_g);
    if (result.price) setValue('price', result.price);
    if (result.cup_notes?.length) setValue('cup_notes', result.cup_notes);
    if (result.roast_date) setValue('roast_date', result.roast_date);
    if (result.variety) setValue('variety', result.variety);
    if (result.process_method) setValue('process_method', result.process_method);
  };

  const handleFormSubmit = async (data: BeanFormData) => {
    try {
      await onSubmit(data, imageData);
    } catch {
      Alert.alert('저장 실패', submitErrorMessage);
    }
  };

  return {
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
    applyAnalysisResult,
    handleFormSubmit,
  };
}
