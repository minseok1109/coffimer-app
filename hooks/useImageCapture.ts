import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

interface UseImageCaptureOptions {
  maxImages?: number;
  currentCount: number;
  onImagesSelected: (uris: string[]) => void;
}

function clampToLimit(uris: string[], remain: number): string[] {
  return remain > 0 ? uris.slice(0, remain) : [];
}

export function useImageCapture({
  maxImages = 5,
  currentCount,
  onImagesSelected,
}: UseImageCaptureOptions) {
  const handleCapture = async (): Promise<string[] | undefined> => {
    if (currentCount >= maxImages) {
      Alert.alert('이미지 제한', `이미지는 최대 ${maxImages}장까지 선택할 수 있습니다.`);
      return undefined;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '카메라 권한을 허용해주세요.');
      return undefined;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled || !result.assets.length) {
      return undefined;
    }

    const selected = clampToLimit([result.assets[0].uri], maxImages - currentCount);
    if (selected.length) {
      onImagesSelected(selected);
    }
    return selected;
  };

  const handleGallery = async (): Promise<string[] | undefined> => {
    if (currentCount >= maxImages) {
      Alert.alert('이미지 제한', `이미지는 최대 ${maxImages}장까지 선택할 수 있습니다.`);
      return undefined;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '갤러리 접근 권한을 허용해주세요.');
      return undefined;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: maxImages - currentCount,
    });

    if (result.canceled || !result.assets.length) {
      return undefined;
    }

    const selected = clampToLimit(
      result.assets.map((asset) => asset.uri),
      maxImages - currentCount,
    );

    if (selected.length) {
      onImagesSelected(selected);
    }

    return selected;
  };

  return { handleCapture, handleGallery };
}
