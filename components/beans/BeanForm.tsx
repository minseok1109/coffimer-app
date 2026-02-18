import { useBeanAnalysis } from '@/hooks/useBeanAnalysis';
import { useBeanForm } from '@/hooks/useBeanForm';
import { useImageCapture } from '@/hooks/useImageCapture';
import type { BeanFormData, ImageData } from '@/lib/validation/beanSchema';
import { useState } from 'react';
import { Alert } from 'react-native';
import { BeanAnalyzingPhase } from './BeanAnalyzingPhase';
import { BeanCapturePhase } from './BeanCapturePhase';
import { BeanFormPhase } from './BeanFormPhase';

type Phase = 'capture' | 'analyzing' | 'form';

interface BeanFormProps {
  onSubmit: (data: BeanFormData, imageData: ImageData | null) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BeanForm({ onSubmit, onCancel, isLoading = false }: BeanFormProps) {
  const [phase, setPhase] = useState<Phase>('capture');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const { isAnalyzing, confidence, imageData, analyze } = useBeanAnalysis();
  
  const {
    control,
    handleSubmit,
    setValue,
    errors,
    cupNotes,
    beanType,
    roastLevel,
    addCupNote,
    removeCupNote,
    applyAnalysisResult,
    handleFormSubmit,
  } = useBeanForm({ onSubmit, imageData });
  
  const { handleCapture, handleGallery } = useImageCapture({
    analyze,
    onPhotoSelected: (uri) => {
      setImageUri(uri);
      setPhase('analyzing');
    },
  });

  const captureAndAnalyze = async (captureFunc: () => ReturnType<typeof handleCapture>) => {
    const result = await captureFunc();
    if (result === undefined) return; // 취소 또는 권한 거부 → capture 단계 유지
    if (result) applyAnalysisResult(result);
    else Alert.alert('분석 실패', 'AI 분석에 실패했습니다. 직접 입력해주세요.');
    setPhase('form');
  };

  if (phase === 'capture') {
    return (
      <BeanCapturePhase
        isDisabled={isAnalyzing || isLoading}
        onCapture={() => captureAndAnalyze(handleCapture)}
        onGallery={() => captureAndAnalyze(handleGallery)}
        onSkip={() => setPhase('form')}
      />
    );
  }

  if (phase === 'analyzing') {
    return <BeanAnalyzingPhase imageUri={imageUri} />;
  }

  return (
    <BeanFormPhase
      beanType={beanType}
      confidence={confidence}
      control={control}
      cupNotes={cupNotes}
      errors={errors}
      imageUri={imageUri}
      isLoading={isLoading}
      onAddCupNote={addCupNote}
      onCancel={onCancel}
      onChangeImage={() => setPhase('capture')}
      onRemoveCupNote={removeCupNote}
      onSubmit={handleSubmit(handleFormSubmit)}
      roastLevel={roastLevel ?? null}
      setValue={setValue}
    />
  );
}
