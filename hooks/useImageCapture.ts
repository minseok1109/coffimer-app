import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import type { AIExtractionResult } from '@/types/bean';

// undefined = 사진 미선택(취소/권한 거부), null = 분석 실패, AIExtractionResult = 성공
type ImageCaptureResult = AIExtractionResult | null | undefined;

interface UseImageCaptureOptions {
  analyze: (uri: string) => Promise<AIExtractionResult | null>;
  onPhotoSelected: (uri: string) => void;
}

export function useImageCapture({ analyze, onPhotoSelected }: UseImageCaptureOptions) {
  const processImage = async (uri: string): Promise<AIExtractionResult | null> => {
    onPhotoSelected(uri);
    return analyze(uri);
  };

  const handleCapture = async (): Promise<ImageCaptureResult> => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '카메라 권한을 허용해주세요.');
      return undefined;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.at(0)) {
      return processImage(result.assets[0].uri);
    }
    return undefined;
  };

  const handleGallery = async (): Promise<ImageCaptureResult> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '갤러리 접근 권한을 허용해주세요.');
      return undefined;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.at(0)) {
      return processImage(result.assets[0].uri);
    }
    return undefined;
  };

  return { handleCapture, handleGallery };
}
