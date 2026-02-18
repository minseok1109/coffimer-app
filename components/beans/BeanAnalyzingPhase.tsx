import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

interface BeanAnalyzingPhaseProps {
  imageUri: string | null;
}

export function BeanAnalyzingPhase({ imageUri }: BeanAnalyzingPhaseProps) {
  return (
    <View style={styles.container}>
      {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}
      <View style={styles.card}>
        <ActivityIndicator color="#8B4513" size="large" />
        <Text style={styles.title}>AI가 원두 정보를 분석 중입니다...</Text>
        <Text style={styles.subtitle}>잠시만 기다려주세요</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
});
