import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEvent } from '@/hooks/useEvents';
import { EVENT_COLORS, type EventCategory } from '@/types/event';

function formatTime(time: string | null): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = Number.parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, '0')}:${minutes} ${ampm}`;
}

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: event, isLoading, error } = useEvent(id);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#FF6B35" size="large" style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons color="#1C1C1E" name="arrow-back" size={24} />
          </Pressable>
        </View>
        <View style={styles.errorState}>
          <Text style={styles.errorText}>이벤트를 찾을 수 없습니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  const categoryColor = EVENT_COLORS[event.category as EventCategory] || '#FF6B35';
  const formattedDate = dayjs(event.event_date).locale('ko').format('YYYY년 M월 D일 (ddd)');

  const handleRegistration = () => {
    if (event.registration_url) {
      Linking.openURL(event.registration_url);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color="#1C1C1E" name="arrow-back" size={24} />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {event.title}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {event.image_url && (
          <Image
            contentFit="cover"
            source={{ uri: event.image_url }}
            style={styles.image}
          />
        )}

        <View style={styles.infoSection}>
          <View style={styles.categoryBadge}>
            <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
            <Text style={styles.categoryText}>
              {event.category === 'cupping' ? '커핑' : '팝업'}
            </Text>
          </View>

          <Text style={styles.title}>{event.roastery_name}</Text>
          <Text style={styles.subtitle}>{event.title}</Text>

          <View style={styles.detailRow}>
            <Ionicons color="#6B7280" name="calendar-outline" size={20} />
            <Text style={styles.detailText}>{formattedDate}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons color="#6B7280" name="time-outline" size={20} />
            <Text style={styles.detailText}>
              {formatTime(event.start_time)} - {formatTime(event.end_time)}
            </Text>
          </View>

          {event.location && (
            <View style={styles.detailRow}>
              <Ionicons color="#6B7280" name="location-outline" size={20} />
              <Text style={styles.detailText}>{event.location}</Text>
            </View>
          )}

          {event.price !== null && event.price !== undefined && (
            <View style={styles.detailRow}>
              <Ionicons color="#6B7280" name="pricetag-outline" size={20} />
              <Text style={styles.detailText}>
                {event.price === 0 ? '무료' : `${event.price.toLocaleString()}원`}
              </Text>
            </View>
          )}

          {event.max_participants && (
            <View style={styles.detailRow}>
              <Ionicons color="#6B7280" name="people-outline" size={20} />
              <Text style={styles.detailText}>최대 {event.max_participants}명</Text>
            </View>
          )}
        </View>

        {event.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>상세 설명</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        )}
      </ScrollView>

      {event.registration_url && (
        <View style={styles.footer}>
          <Pressable
            onPress={handleRegistration}
            style={({ pressed }) => [
              styles.registerButton,
              { backgroundColor: categoryColor },
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.registerButtonText}>등록하기</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    paddingBottom: 100,
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 16,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#1C1C1E',
    flex: 1,
  },
  descriptionSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  registerButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
