# Events Calendar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 카페 이벤트 캘린더 탭을 추가하여 사용자가 월별 이벤트를 확인하고 상세 정보를 볼 수 있도록 구현

**Architecture:** react-native-calendars를 사용한 캘린더 UI, Supabase events 테이블 연동, React Query로 데이터 페칭. 이벤트 카테고리(cupping/popup)별 색상 구분.

**Tech Stack:** react-native-calendars, @tanstack/react-query, dayjs, expo-router, Supabase

---

## Task 1: 패키지 설치

**Files:**
- Modify: `package.json`

**Step 1: react-native-calendars 설치**

```bash
pnpm add react-native-calendars
```

**Step 2: 설치 확인**

Run: `cat package.json | grep react-native-calendars`
Expected: `"react-native-calendars": "^x.x.x"`

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: react-native-calendars 패키지 설치"
```

---

## Task 2: 이벤트 타입 정의

**Files:**
- Create: `types/event.ts`

**Step 1: 타입 파일 생성**

```typescript
import type { Tables } from './database';

export type Event = Tables<'events'>;

export type EventCategory = 'cupping' | 'popup';

export const EVENT_COLORS: Record<EventCategory, string> = {
  cupping: '#FF6B35',
  popup: '#A56A49',
};

export interface MarkedDate {
  marked?: boolean;
  dotColor?: string;
  selected?: boolean;
  selectedColor?: string;
}

export type MarkedDates = Record<string, MarkedDate>;
```

**Step 2: Commit**

```bash
git add types/event.ts
git commit -m "feat: 이벤트 타입 정의 추가"
```

---

## Task 3: 이벤트 API 서비스 생성

**Files:**
- Create: `lib/api/events.ts`

**Step 1: API 서비스 파일 생성**

```typescript
import dayjs from 'dayjs';
import { supabase } from '@/lib/supabaseClient';
import type { Event } from '@/types/event';

export const EventAPI = {
  async getEventsByMonth(year: number, month: number): Promise<Event[]> {
    const startOfMonth = dayjs()
      .year(year)
      .month(month - 1)
      .startOf('month')
      .format('YYYY-MM-DD');
    const endOfMonth = dayjs()
      .year(year)
      .month(month - 1)
      .endOf('month')
      .format('YYYY-MM-DD');

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', startOfMonth)
      .lte('event_date', endOfMonth)
      .eq('is_published', true)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  async getEventById(eventId: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async getEventsByDate(date: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('event_date', date)
      .eq('is_published', true)
      .order('start_time', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },
};
```

**Step 2: Commit**

```bash
git add lib/api/events.ts
git commit -m "feat: 이벤트 API 서비스 추가"
```

---

## Task 4: 이벤트 React Query 훅 생성

**Files:**
- Create: `hooks/useEvents.ts`

**Step 1: 훅 파일 생성**

```typescript
import { useQuery } from '@tanstack/react-query';
import { EventAPI } from '@/lib/api/events';
import type { Event } from '@/types/event';

export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  listByMonth: (year: number, month: number) =>
    [...eventKeys.lists(), year, month] as const,
  listByDate: (date: string) => [...eventKeys.lists(), 'date', date] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
};

export const useEventsByMonth = (year: number, month: number) => {
  return useQuery<Event[], Error>({
    queryKey: eventKeys.listByMonth(year, month),
    queryFn: () => EventAPI.getEventsByMonth(year, month),
  });
};

export const useEventsByDate = (date: string) => {
  return useQuery<Event[], Error>({
    queryKey: eventKeys.listByDate(date),
    queryFn: () => EventAPI.getEventsByDate(date),
    enabled: !!date,
  });
};

export const useEvent = (eventId: string) => {
  return useQuery<Event | null, Error>({
    queryKey: eventKeys.detail(eventId),
    queryFn: () => EventAPI.getEventById(eventId),
    enabled: !!eventId,
  });
};
```

**Step 2: Commit**

```bash
git add hooks/useEvents.ts
git commit -m "feat: 이벤트 React Query 훅 추가"
```

---

## Task 5: 이벤트 카드 컴포넌트 생성

**Files:**
- Create: `components/events/EventCard.tsx`
- Create: `components/events/index.ts`

**Step 1: EventCard 컴포넌트 생성**

```typescript
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
```

**Step 2: barrel export 파일 생성**

```typescript
export { EventCard } from './EventCard';
```

**Step 3: Commit**

```bash
git add components/events/EventCard.tsx components/events/index.ts
git commit -m "feat: EventCard 컴포넌트 추가"
```

---

## Task 6: 캘린더 페이지 생성

**Files:**
- Create: `app/(tabs)/events.tsx`

**Step 1: 캘린더 페이지 생성**

```typescript
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
```

**Step 2: Commit**

```bash
git add app/\(tabs\)/events.tsx
git commit -m "feat: 이벤트 캘린더 페이지 추가"
```

---

## Task 7: 탭 레이아웃 수정

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

**Step 1: events 탭 추가**

기존 `_layout.tsx`의 `</Tabs.Screen>` (profile) 앞에 다음 추가:

```typescript
      <Tabs.Screen
        name="events"
        options={{
          title: "이벤트",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              color={color}
              name={focused ? "calendar" : "calendar-outline"}
              size={24}
            />
          ),
        }}
      />
```

**Step 2: Commit**

```bash
git add app/\(tabs\)/_layout.tsx
git commit -m "feat: 탭 네비게이션에 이벤트 탭 추가"
```

---

## Task 8: 이벤트 상세 페이지 생성

**Files:**
- Create: `app/events/[id].tsx`

**Step 1: 상세 페이지 생성**

```typescript
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEvent } from '@/hooks/useEvents';
import { EVENT_COLORS, type EventCategory } from '@/types/event';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';

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
```

**Step 2: Commit**

```bash
git add app/events/[id].tsx
git commit -m "feat: 이벤트 상세 페이지 추가"
```

---

## Task 9: 최종 테스트 및 정리

**Step 1: 타입 체크**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: 린트 체크**

Run: `pnpm run lint`
Expected: No errors

**Step 3: 앱 실행 테스트**

Run: `pnpm start`
- 새로운 "이벤트" 탭 확인
- 캘린더 표시 확인
- 날짜 선택 시 이벤트 목록 표시 확인
- 이벤트 카드 탭 시 상세 페이지 이동 확인

**Step 4: 최종 커밋**

```bash
git add .
git commit -m "feat: 카페 이벤트 캘린더 기능 완성"
```

---

## Summary

| Task | Files | Description |
|------|-------|-------------|
| 1 | package.json | react-native-calendars 설치 |
| 2 | types/event.ts | 이벤트 타입 정의 |
| 3 | lib/api/events.ts | Supabase API 서비스 |
| 4 | hooks/useEvents.ts | React Query 훅 |
| 5 | components/events/* | EventCard 컴포넌트 |
| 6 | app/(tabs)/events.tsx | 캘린더 페이지 |
| 7 | app/(tabs)/_layout.tsx | 탭 레이아웃 수정 |
| 8 | app/events/[id].tsx | 이벤트 상세 페이지 |
| 9 | - | 테스트 및 정리 |
