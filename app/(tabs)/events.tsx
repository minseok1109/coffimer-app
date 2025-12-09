import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { EventCard } from '@/components/events';
import { useEventsByMonth } from '@/hooks/useEvents';
import type { Event } from '@/types/event';
import { EVENT_COLORS, type EventCategory, type MarkedDates } from '@/types/event';

LocaleConfig.locales['ko'] = {
  monthNames: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월',
  ],
  monthNamesShort: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월',
  ],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'ko';

export default function EventsScreen() {
  const router = useRouter();
  const today = dayjs().format('YYYY-MM-DD');
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  const { data: events, isLoading } = useEventsByMonth(
    currentMonth.year(),
    currentMonth.month() + 1
  );

  const markedDates = useMemo<MarkedDates>(() => {
    const marks: MarkedDates = {};

    if (events) {
      for (const event of events) {
        const dateStr = event.event_date;
        const color = EVENT_COLORS[event.category as EventCategory] || '#FF6B35';

        if (!marks[dateStr]) {
          marks[dateStr] = { marked: true, dotColor: color };
        }
      }
    }

    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
      selectedColor: '#FF6B35',
    };

    return marks;
  }, [events, selectedDate]);

  const selectedDateEvents = useMemo(() => {
    if (!events) return [];
    return events.filter((event) => event.event_date === selectedDate);
  }, [events, selectedDate]);

  const formattedSelectedDate = dayjs(selectedDate).locale('ko').format('M월 D일');

  const renderEventItem = ({ item }: { item: Event }) => (
    <EventCard event={item} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color="#1C1C1E" name="arrow-back" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Cafe Event Calendar</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.calendarContainer}>
        <Calendar
          current={currentMonth.format('YYYY-MM-DD')}
          markedDates={markedDates}
          monthFormat={'yyyy년 M월'}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          onMonthChange={(month) => {
            setCurrentMonth(dayjs(`${month.year}-${month.month}-01`));
          }}
          theme={{
            backgroundColor: '#FFFFFF',
            calendarBackground: '#FFFFFF',
            textSectionTitleColor: '#6B7280',
            selectedDayBackgroundColor: '#FF6B35',
            selectedDayTextColor: '#FFFFFF',
            todayTextColor: '#FF6B35',
            dayTextColor: '#1C1C1E',
            textDisabledColor: '#9CA3AF',
            arrowColor: '#6B7280',
            monthTextColor: '#1C1C1E',
            textDayFontWeight: '400',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '500',
            textDayFontSize: 14,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 12,
          }}
        />
      </View>

      <View style={styles.eventsSection}>
        <Text style={styles.eventsTitle}>Events on {formattedSelectedDate}</Text>
        {isLoading ? (
          <ActivityIndicator color="#FF6B35" style={styles.loader} />
        ) : selectedDateEvents.length > 0 ? (
          <FlatList
            contentContainerStyle={styles.eventsList}
            data={selectedDateEvents}
            keyExtractor={(item) => item.id}
            renderItem={renderEventItem}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>이 날짜에 예정된 이벤트가 없습니다</Text>
          </View>
        )}
      </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
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
  eventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  eventsList: {
    paddingBottom: 16,
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
