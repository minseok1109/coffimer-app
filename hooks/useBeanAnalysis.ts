import { useState, useRef, useCallback } from 'react';
import { File } from 'expo-file-system';
import { encode } from 'base64-arraybuffer';
import type { BeanFieldConfidence, AIExtractionResult } from '@/types/bean';
import { analyzeBeanImage } from '@/lib/api/beanAnalysis';

const INITIAL_CONFIDENCE: BeanFieldConfidence = {
  name: null,
  roastery_name: null,
  roast_level: null,
  bean_type: null,
  weight_g: null,
  price: null,
  cup_notes: null,
};

interface ImageData {
  base64: string;
  mimeType: string;
}

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
      const file = new File(uri);
      const arrayBuffer = await file.arrayBuffer();
      const base64 = encode(arrayBuffer);

      const mimeType = uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

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
