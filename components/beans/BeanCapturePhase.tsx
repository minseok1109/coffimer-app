import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface BeanCapturePhaseProps {
  isDisabled: boolean;
  selectedImageUris: string[];
  primaryIndex: number;
  onCapture: () => void;
  onGallery: () => void;
  onAnalyze: () => void;
  onSetPrimary: (index: number) => void;
  onRemoveImage: (index: number) => void;
  onSkip: () => void;
}

export function BeanCapturePhase({
  isDisabled,
  selectedImageUris,
  primaryIndex,
  onCapture,
  onGallery,
  onAnalyze,
  onSetPrimary,
  onRemoveImage,
  onSkip,
}: BeanCapturePhaseProps) {
  const hasImages = selectedImageUris.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.captureArea}>
        {hasImages ? (
          <>
            <Text style={styles.title}>선택한 사진 ({selectedImageUris.length}/5)</Text>
            <View style={styles.grid}>
              {selectedImageUris.map((uri, index) => {
                const isPrimary = index === primaryIndex;
                return (
                  <Pressable
                    key={`${uri}-${index}`}
                    onPress={() => onSetPrimary(index)}
                    style={styles.thumbnailWrapper}
                  >
                    <Image
                      cachePolicy="memory-disk"
                      contentFit="cover"
                      source={{ uri }}
                      style={styles.thumbnail}
                    />
                    {isPrimary ? (
                      <View style={styles.primaryBadge}>
                        <Ionicons color="#FFFFFF" name="star" size={12} />
                      </View>
                    ) : null}
                    <Pressable
                      hitSlop={10}
                      onPress={() => onRemoveImage(index)}
                      style={styles.removeButton}
                    >
                      <Ionicons color="#FFFFFF" name="close" size={14} />
                    </Pressable>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.helperText}>썸네일을 탭하면 대표 이미지로 지정됩니다.</Text>
          </>
        ) : (
          <>
            <Ionicons color="#A56A49" name="camera-outline" size={64} />
            <Text style={styles.title}>원두 봉투를 촬영하세요</Text>
            <Text style={styles.subtitle}>AI가 원두 정보를 자동으로 추출합니다</Text>
          </>
        )}
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          disabled={isDisabled}
          onPress={onCapture}
          style={[styles.primaryButton, isDisabled && styles.disabledButton]}
        >
          <Ionicons color="#FFFFFF" name="camera" size={20} />
          <Text style={styles.primaryButtonText}>촬영</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={isDisabled}
          onPress={onGallery}
          style={[styles.secondaryButton, isDisabled && styles.disabledButton]}
        >
          <Ionicons color="#8B4513" name="images-outline" size={20} />
          <Text style={styles.secondaryButtonText}>갤러리</Text>
        </TouchableOpacity>
      </View>

      {hasImages ? (
        <TouchableOpacity
          disabled={isDisabled}
          onPress={onAnalyze}
          style={[styles.analyzeButton, isDisabled && styles.disabledButton]}
        >
          <Text style={styles.analyzeButtonText}>분석하기</Text>
        </TouchableOpacity>
      ) : null}

      <Pressable onPress={onSkip}>
        <Text style={styles.skipText}>사진 없이 직접 입력</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 20,
  },
  captureArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
    width: '100%',
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  thumbnailWrapper: {
    width: 96,
    height: 96,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#F59E0B',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#8B4513',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#8B4513',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
  },
  secondaryButtonText: {
    color: '#8B4513',
    fontSize: 16,
    fontWeight: '600',
  },
  analyzeButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A56A49',
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  skipText: {
    fontSize: 14,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
