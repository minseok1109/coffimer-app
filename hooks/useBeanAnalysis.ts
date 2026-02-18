import { analyzeBeanImage } from '@/lib/api/beanAnalysis';
import type { ImageData } from '@/lib/validation/beanSchema';
import type { AIExtractionResult, BeanFieldConfidence } from '@/types/bean';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useCallback, useRef, useState } from 'react';

const MAX_IMAGE_WIDTH = 1280;
const COMPRESS_QUALITY = 0.7;

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
  imageData: ImageData | null;
  analyze: (uri: string) => Promise<AIExtractionResult | null>;
  resetConfidence: () => void;
}

export function useBeanAnalysis(): UseBeanAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [confidence, setConfidence] = useState<BeanFieldConfidence>(INITIAL_CONFIDENCE);
  const imageDataRef = useRef<ImageData | null>(null);
  const abortRef = useRef(false);

  const analyze = useCallback(async (uri: string): Promise<AIExtractionResult | null> => {
    abortRef.current = false;
    setIsAnalyzing(true);

    try {
      const imageRef = await ImageManipulator.manipulate(uri)
        .resize({ width: MAX_IMAGE_WIDTH })
        .renderAsync();
      const { base64: encodedBase64 } = await imageRef.saveAsync({
        format: SaveFormat.JPEG,
        compress: COMPRESS_QUALITY,
        base64: true,
      });
      const base64 = encodedBase64 ?? '';
      const mimeType = 'image/jpeg';

      // base64를 캐시하여 업로드 시 재사용
      imageDataRef.current = { base64, mimeType };

      if (abortRef.current) return null;

      const result = await analyzeBeanImage(base64, mimeType);

      if (abortRef.current) return null;

      setConfidence(result.confidence);
      return result;
    } catch {
      return null;
    } finally {
      if (!abortRef.current) {
        setIsAnalyzing(false);
      }
    }
  }, []);

  const resetConfidence = useCallback(() => {
    setConfidence(INITIAL_CONFIDENCE);
  }, []);

  return {
    isAnalyzing,
    confidence,
    imageData: imageDataRef.current,
    analyze,
    resetConfidence,
  };
}
