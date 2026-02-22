import { analyzeBeanImages } from '@/lib/api/beanAnalysis';
import type { EncodedImageData } from '@/lib/validation/beanSchema';
import type { AIExtractionResult, BeanFieldConfidence } from '@/types/bean';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useCallback, useRef, useState } from 'react';

const MAX_IMAGE_WIDTH = 1024;
const COMPRESS_QUALITY = 0.6;

const INITIAL_CONFIDENCE: BeanFieldConfidence = {
  name: null,
  roastery_name: null,
  roast_level: null,
  bean_type: null,
  weight_g: null,
  price: null,
  cup_notes: null,
  roast_date: null,
  variety: null,
  process_method: null,
};

interface UseBeanAnalysisReturn {
  isAnalyzing: boolean;
  confidence: BeanFieldConfidence;
  encodedImages: EncodedImageData[];
  extractedData: AIExtractionResult | null;
  error: string | null;
  analyze: (uris: string[]) => Promise<AIExtractionResult>;
  resetConfidence: () => void;
}

async function encodeImage(uri: string): Promise<EncodedImageData> {
  const imageRef = await ImageManipulator.manipulate(uri)
    .resize({ width: MAX_IMAGE_WIDTH })
    .renderAsync();

  const { base64: encodedBase64 } = await imageRef.saveAsync({
    format: SaveFormat.JPEG,
    compress: COMPRESS_QUALITY,
    base64: true,
  });

  return {
    base64: encodedBase64 ?? '',
    mimeType: 'image/jpeg',
  };
}

export function useBeanAnalysis(): UseBeanAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [confidence, setConfidence] = useState<BeanFieldConfidence>(INITIAL_CONFIDENCE);
  const [extractedData, setExtractedData] = useState<AIExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const encodedImagesRef = useRef<EncodedImageData[]>([]);

  const analyze = useCallback(async (uris: string[]): Promise<AIExtractionResult> => {
    if (!uris.length) {
      const message = '최소 1장의 이미지가 필요합니다.';
      setError(message);
      throw new Error(message);
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const encodedImages: EncodedImageData[] = [];
      for (const uri of uris) {
        encodedImages.push(await encodeImage(uri));
      }

      encodedImagesRef.current = encodedImages;

      const result = await analyzeBeanImages(encodedImages);
      setConfidence(result.confidence);
      setExtractedData(result);
      return result;
    } catch (analysisError) {
      const message =
        analysisError instanceof Error ? analysisError.message : '이미지 분석에 실패했습니다.';
      setError(message);
      console.error('[useBeanAnalysis] analyze failed', analysisError);
      throw analysisError instanceof Error ? analysisError : new Error(message);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const resetConfidence = useCallback(() => {
    setConfidence(INITIAL_CONFIDENCE);
    setExtractedData(null);
    setError(null);
  }, []);

  return {
    isAnalyzing,
    confidence,
    encodedImages: encodedImagesRef.current,
    extractedData,
    error,
    analyze,
    resetConfidence,
  };
}
