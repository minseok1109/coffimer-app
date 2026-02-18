import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  ROAST_LEVELS,
  ROAST_LEVEL_CONFIG,
  type RoastLevel,
} from '@/types/bean';

export interface RoastLevelSelectorRef {
  expand: () => void;
  close: () => void;
}

interface RoastLevelSelectorProps {
  selectedLevel: RoastLevel | null;
  onSelect: (level: RoastLevel) => void;
}

export const RoastLevelSelector = forwardRef<
  RoastLevelSelectorRef,
  RoastLevelSelectorProps
>(({ selectedLevel, onSelect }, ref) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%'], []);

  useImperativeHandle(ref, () => ({
    expand: () => bottomSheetRef.current?.snapToIndex(0),
    close: () => bottomSheetRef.current?.close(),
  }));

  const handleSelect = useCallback(
    (level: RoastLevel) => {
      onSelect(level);
      bottomSheetRef.current?.close();
    },
    [onSelect],
  );

  return (
    <BottomSheet
      backgroundStyle={styles.bottomSheetBg}
      enablePanDownToClose
      handleIndicatorStyle={styles.handleIndicator}
      index={-1}
      ref={bottomSheetRef}
      snapPoints={snapPoints}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>배전도 선택</Text>
          <TouchableOpacity
            onPress={() => bottomSheetRef.current?.close()}
            style={styles.closeButton}
          >
            <Ionicons color="#666" name="close" size={24} />
          </TouchableOpacity>
        </View>

        <BottomSheetScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {ROAST_LEVELS.map((level) => {
            const config = ROAST_LEVEL_CONFIG[level];
            const isSelected = selectedLevel === level;

            return (
              <TouchableOpacity
                key={level}
                onPress={() => handleSelect(level)}
                style={[styles.option, isSelected && styles.selectedOption]}
              >
                <View
                  style={[styles.colorDot, { backgroundColor: config.color }]}
                />
                <Text
                  style={[
                    styles.optionLabel,
                    isSelected && styles.selectedLabel,
                  ]}
                >
                  {config.label}
                </Text>
                {isSelected && (
                  <Ionicons color="#8B4513" name="checkmark" size={22} />
                )}
              </TouchableOpacity>
            );
          })}
        </BottomSheetScrollView>
      </View>
    </BottomSheet>
  );
});

RoastLevelSelector.displayName = 'RoastLevelSelector';

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
  content: {
    flex: 1,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 4,
  },
  selectedOption: {
    backgroundColor: 'rgba(139,69,19,0.06)',
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 14,
  },
  optionLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedLabel: {
    fontWeight: '600',
    color: '#8B4513',
  },
});
