import type { Event } from "@/types/event";
import { Ionicons } from "@expo/vector-icons";
import { type Href, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface EventCardProps {
  event: Event;
}

function formatTime(time: string | null): string {
  if (!time) {
    return "";
  }
  const [hours, minutes] = time.split(":");
  const hour = Number.parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, "0")}:${minutes} ${ampm}`;
}

export function EventCard({ event }: EventCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/events/${event.id}` as Href);
  };

  const displayTitle = event.roastery_name
    ? `${event.roastery_name} - ${event.title}`
    : event.title;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>
          {displayTitle}
        </Text>
        <Text style={styles.time}>
          {formatTime(event.start_time)} - {formatTime(event.end_time)}
        </Text>
        <Ionicons color="#9CA3AF" name="chevron-forward" size={20} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
  },
});
