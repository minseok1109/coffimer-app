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

interface FeaturedRoasteryCardProps {
  roastery: Roastery;
}

export function FeaturedRoasteryCard({ roastery }: FeaturedRoasteryCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/roasteries/${roastery.id}`);
  };

  return (
    <Pressable onPress={handlePress} style={styles.card}>
      {roastery.featured_image ? (
        <Image
          source={{ uri: roastery.featured_image }}
          style={styles.image}
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons color="#A56A49" name="cafe" size={48} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.label}>오늘의 추천 로스터리</Text>
        <Text numberOfLines={2} style={styles.description}>
          이번 주문에서 이번주의 추천 로스터리를 만나보세요.
        </Text>
        <Text style={styles.highlight}>{roastery.name}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#F3F4F6',
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    gap: 4,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#A56A49',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  highlight: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A56A49',
    marginTop: 4,
  },
});
