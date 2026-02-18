import { CustomDayComponent } from "@/components/calendar";
import { EventCard } from "@/components/events";
import { useEventsByMonth } from "@/hooks/useEvents";
import {
  type CustomMarkedDates,
  EVENT_COLORS,
  type Event,
  type EventCategory,
} from "@/types/event";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";

const TODAY = dayjs().format("YYYY-MM-DD");

function buildDateColorsMap(
  events: Event[]
): Record<string, string[]> {
  const map: Record<string, string[]> = {};

  for (const event of events) {
    const dateStr = event.event_date;
    const color = EVENT_COLORS[event.category as EventCategory] || "#FF6B35";

    if (!map[dateStr]) {
      map[dateStr] = [];
    }
    if (!map[dateStr].includes(color)) {
      map[dateStr].push(color);
    }
  }

  return map;
}

export default function EventsScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  const { data: events, isLoading } = useEventsByMonth(
    currentMonth.year(),
    currentMonth.month() + 1
  );

  const markedDates = useMemo<CustomMarkedDates>(() => {
    const marks: CustomMarkedDates = {};

    if (events) {
      const dateColorsMap = buildDateColorsMap(events);
      for (const [dateStr, colors] of Object.entries(dateColorsMap)) {
        marks[dateStr] = { colors };
      }
    }

    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
    };

    return marks;
  }, [events, selectedDate]);

  const selectedDateEvents = useMemo(
    () => events?.filter((event) => event.event_date === selectedDate) ?? [],
    [events, selectedDate],
  );

  const renderEventItem = ({ item }: { item: Event }) => (
    <EventCard event={item} />
  );

  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator color="#FF6B35" style={styles.loader} />;
    }

    if (selectedDateEvents.length > 0) {
      return (
        <FlatList
          contentContainerStyle={styles.eventsList}
          data={selectedDateEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEventItem}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>이 날짜에 예정된 이벤트가 없습니다</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color="#1C1C1E" name="arrow-back" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>캘린더</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.calendarContainer}>
        <Calendar
          current={currentMonth.format("YYYY-MM-DD")}
          dayComponent={(props) => (
            <CustomDayComponent
              {...props}
              marking={markedDates[props.date?.dateString ?? ""]}
              onPress={(date) => setSelectedDate(date.dateString)}
            />
          )}
          monthFormat={"yyyy년 M월"}
          onMonthChange={(month) => {
            setCurrentMonth(dayjs(`${month.year}-${month.month}-01`));
          }}
          theme={{
            backgroundColor: "#FFFFFF",
            calendarBackground: "#FFFFFF",
            textSectionTitleColor: "#6B7280",
            arrowColor: "#6B7280",
            monthTextColor: "#1C1C1E",
            textMonthFontWeight: "bold",
            textDayHeaderFontWeight: "500",
            textMonthFontSize: 18,
            textDayHeaderFontSize: 12,
          }}
        />
      </View>

      <View style={styles.eventsSection}>{renderContent()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1C1C1E",
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  calendarContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventsSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  eventsList: {
    paddingBottom: 16,
    gap: 12,
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
  },
});
