import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

interface BeanAnalyzingPhaseProps {
  imageUris: string[];
}

export function BeanAnalyzingPhase({ imageUris }: BeanAnalyzingPhaseProps) {
  return (
    <View style={styles.container}>
      {imageUris.length > 0 ? (
        <FlatList
          data={imageUris}
          horizontal
          keyExtractor={(item, index) => `${item}-${index}`}
          pagingEnabled
          renderItem={({ item }) => (
            <Image cachePolicy="memory-disk" contentFit="cover" source={{ uri: item }} style={styles.previewImage} />
          )}
          showsHorizontalScrollIndicator={false}
        />
      ) : null}
      <View style={styles.card}>
        <ActivityIndicator color="#8B4513" size="large" />
        <Text style={styles.title}>AI가 원두 정보를 분석 중입니다...</Text>
        <Text style={styles.subtitle}>총 {imageUris.length}장의 사진을 종합 분석합니다.</Text>
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
    width: 320,
    height: 240,
    marginRight: 12,
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
