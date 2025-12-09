import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Event } from '@/types/event';
import { EVENT_COLORS, type EventCategory } from '@/types/event';

interface EventCardProps {
  event: Event;
}

function formatTime(time: string | null): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = Number.parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, '0')}:${minutes} ${ampm}`;
}

export const EventCard = memo(function EventCard({ event }: EventCardProps) {
  const router = useRouter();
  const categoryColor = EVENT_COLORS[event.category as EventCategory] || '#FF6B35';

  const handlePress = () => {
    router.push(`/events/${event.id}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={[styles.colorBar, { backgroundColor: categoryColor }]} />
      <View style={styles.content}>
        <Text style={styles.title}>
          {event.roastery_name} - {event.title}
        </Text>
        <Text style={styles.time}>
          {formatTime(event.start_time)} - {formatTime(event.end_time)}
        </Text>
      </View>
      <Ionicons color="#9CA3AF" name="chevron-forward" size={20} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  colorBar: {
    width: 6,
    height: 64,
    borderRadius: 3,
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
    color: '#6B7280',
  },
});
