import { useBeanAnalysis } from '@/hooks/useBeanAnalysis';
import { useBeanForm } from '@/hooks/useBeanForm';
import { useBeanMultiImageFlow } from '@/hooks/useBeanMultiImageFlow';
import { useImageCapture } from '@/hooks/useImageCapture';
import type { BeanFormData, EncodedImageData } from '@/lib/validation/beanSchema';
import { useState } from 'react';
import { Alert } from 'react-native';
import { BeanAnalyzingPhase } from './BeanAnalyzingPhase';
import { BeanCapturePhase } from './BeanCapturePhase';
import { BeanFormPhase } from './BeanFormPhase';

type Phase = 'capture' | 'analyzing' | 'form';

interface BeanFormSubmitPayload {
  encodedImages: EncodedImageData[];
  imageUris: string[];
  primaryIndex: number | null;
}

interface BeanFormProps {
  onSubmit: (data: BeanFormData, payload: BeanFormSubmitPayload) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BeanForm({ onSubmit, onCancel, isLoading = false }: BeanFormProps) {
  const [phase, setPhase] = useState<Phase>('capture');
  const {
    imageUris,
    primaryIndex,
    primaryImageUri,
    appendImages,
    removeImage,
    setPrimaryIndex,
  } = useBeanMultiImageFlow();

  const { isAnalyzing, confidence, encodedImages, analyze } = useBeanAnalysis();

  const { control, handleSubmit, setValue, errors, cupNotes, beanType, roastLevel, addCupNote, removeCupNote, applyAnalysisResult, handleFormSubmit } =
    useBeanForm({
      onSubmit: async (data, encoded) => {
        await onSubmit(data, {
          encodedImages: encoded,
          imageUris,
          primaryIndex: imageUris.length ? primaryIndex : null,
        });
      },
      encodedImages,
    });

  const { handleCapture, handleGallery } = useImageCapture({
    currentCount: imageUris.length,
    onImagesSelected: (newUris) => {
      appendImages(newUris);
    },
  });

  const analyzeSelectedImages = async () => {
    if (!imageUris.length) {
      Alert.alert('사진 필요', '최소 1장의 사진을 선택해주세요.');
      return;
    }

    setPhase('analyzing');

    try {
      const result = await analyze(imageUris);
      applyAnalysisResult(result);
      setPhase('form');
      return;
    } catch (analysisError) {
      const detail =
        analysisError instanceof Error && analysisError.message
          ? analysisError.message
          : 'AI 분석에 실패했습니다.';
      console.error('[BeanForm] analyzeSelectedImages failed', analysisError);
      Alert.alert('분석 실패', `${detail}\n직접 입력으로 계속할 수 있습니다.`);
      setPhase('form');
    }
  };

  if (phase === 'capture') {
    return (
      <BeanCapturePhase
        isDisabled={isAnalyzing || isLoading}
        onAnalyze={analyzeSelectedImages}
        onCapture={async () => {
          await handleCapture();
        }}
        onGallery={async () => {
          await handleGallery();
        }}
        onRemoveImage={removeImage}
        onSetPrimary={setPrimaryIndex}
        onSkip={() => setPhase('form')}
        primaryIndex={primaryIndex}
        selectedImageUris={imageUris}
      />
    );
  }

  if (phase === 'analyzing') {
    return <BeanAnalyzingPhase imageUris={imageUris} />;
  }

  return (
    <BeanFormPhase
      beanType={beanType}
      confidence={confidence}
      control={control}
      cupNotes={cupNotes}
      errors={errors}
      isLoading={isLoading}
      onAddCupNote={addCupNote}
      onCancel={onCancel}
      onChangeImages={() => setPhase('capture')}
      onRemoveCupNote={removeCupNote}
      onSubmit={handleSubmit(handleFormSubmit)}
      primaryImageUri={primaryImageUri}
      roastLevel={roastLevel ?? null}
      setValue={setValue}
    />
  );
}
