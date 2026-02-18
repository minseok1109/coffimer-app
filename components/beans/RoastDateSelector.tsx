import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import dayjs from 'dayjs';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import type { DateData } from 'react-native-calendars';

export interface RoastDateSelectorRef {
  expand: () => void;
  close: () => void;
}

interface RoastDateSelectorProps {
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

const TODAY = dayjs().format('YYYY-MM-DD');

const CALENDAR_THEME = {
  backgroundColor: '#FFFFFF',
  calendarBackground: '#FFFFFF',
  selectedDayBackgroundColor: '#8B4513',
  selectedDayTextColor: '#FFFFFF',
  todayTextColor: '#8B4513',
  dayTextColor: '#333',
  textDisabledColor: '#D1D5DB',
  arrowColor: '#8B4513',
  monthTextColor: '#1F2937',
  textMonthFontWeight: 'bold' as const,
  textDayHeaderFontWeight: '500' as const,
  textSectionTitleColor: '#6B7280',
} as const;

export const RoastDateSelector = forwardRef<
  RoastDateSelectorRef,
  RoastDateSelectorProps
>(({ selectedDate, onSelect }, ref) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['60%'], []);

  useImperativeHandle(ref, () => ({
    expand: () => bottomSheetRef.current?.snapToIndex(0),
    close: () => bottomSheetRef.current?.close(),
  }));

  const handleDayPress = useCallback(
    (day: DateData) => {
      onSelect(day.dateString);
      bottomSheetRef.current?.close();
    },
    [onSelect],
  );

  const markedDates = useMemo(() => {
    if (!selectedDate) return {};
    return {
      [selectedDate]: {
        selected: true,
        selectedColor: '#8B4513',
        selectedTextColor: '#FFFFFF',
      },
    };
  }, [selectedDate]);

  return (
    <BottomSheet
      backgroundStyle={styles.bottomSheetBg}
      enableDynamicSizing={false}
      enablePanDownToClose
      handleIndicatorStyle={styles.handleIndicator}
      index={-1}
      ref={bottomSheetRef}
      snapPoints={snapPoints}
    >
      <View style={styles.header}>
        <Text style={styles.title}>로스팅 날짜 선택</Text>
        <TouchableOpacity
          onPress={() => bottomSheetRef.current?.close()}
          style={styles.closeButton}
        >
          <Ionicons color="#666" name="close" size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.calendarContainer}>
        <Calendar
          markedDates={markedDates}
          maxDate={TODAY}
          monthFormat={'yyyy년 M월'}
          onDayPress={handleDayPress}
          theme={CALENDAR_THEME}
        />
      </View>
    </BottomSheet>
  );
});

RoastDateSelector.displayName = 'RoastDateSelector';

const styles = StyleSheet.create({
  bottomSheetBg: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handleIndicator: {
    backgroundColor: '#D1D5DB',
    width: 40,
    height: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  calendarContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
});
