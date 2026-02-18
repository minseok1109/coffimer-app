import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface BeanCapturePhaseProps {
  isDisabled: boolean;
  onCapture: () => void;
  onGallery: () => void;
  onSkip: () => void;
}

export function BeanCapturePhase({
  isDisabled,
  onCapture,
  onGallery,
  onSkip,
}: BeanCapturePhaseProps) {
  return (
    <View style={styles.container}>
      <View style={styles.captureArea}>
        <Ionicons color="#A56A49" name="camera-outline" size={64} />
        <Text style={styles.title}>원두 봉투를 촬영하세요</Text>
        <Text style={styles.subtitle}>AI가 원두 정보를 자동으로 추출합니다</Text>
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
          <Ionicons color="#8B4513" name="image-outline" size={20} />
          <Text style={styles.secondaryButtonText}>갤러리</Text>
        </TouchableOpacity>
      </View>

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
    padding: 40,
    gap: 32,
  },
  captureArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
    width: '100%',
    aspectRatio: 4 / 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
  },
  secondaryButtonText: {
    color: '#8B4513',
    fontSize: 16,
    fontWeight: '600',
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
