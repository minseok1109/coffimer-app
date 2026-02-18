import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Roastery } from '@/types/roastery';

interface RoasteryCardProps {
  roastery: Roastery;
}

export function RoasteryCard({ roastery }: RoasteryCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/roasteries/${roastery.id}`);
  };

  return (
    <Pressable onPress={handlePress} style={styles.card}>
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>
          {roastery.name}
        </Text>
        <Text numberOfLines={2} style={styles.description}>
          {roastery.description}
        </Text>
        <View style={styles.detailButton}>
          <Text style={styles.detailButtonText}>자세히 보기</Text>
        </View>
      </View>
      {roastery.featured_image ? (
        <Image
          source={{ uri: roastery.featured_image }}
          style={styles.image}
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons color="#A56A49" name="cafe-outline" size={32} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  detailButton: {
    backgroundColor: 'rgba(165, 106, 73, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  detailButtonText: {
    color: '#A56A49',
    fontSize: 14,
    fontWeight: '600',
  },
  image: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  imagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
