import { Ionicons } from '@expo/vector-icons';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  REFERRAL_OPTIONS,
  type ReferralOption,
} from '@/constants/referralOptions';

export interface BottomSheetRef {
  expand: () => void;
  close: () => void;
}

interface ReferralSourceBottomSheetProps {
  onSelect: (value: string | null) => void;
  selectedValue?: string | null;
}

export const ReferralSourceBottomSheet = forwardRef<
  BottomSheetRef,
  ReferralSourceBottomSheetProps
>(({ onSelect, selectedValue }, ref) => {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const [inputValue, setInputValue] = useState('');

  const snapPoints = useMemo(() => ['75%'], []);

  useImperativeHandle(ref, () => ({
    expand: () => {
      setInputValue('');
      bottomSheetRef.current?.snapToIndex(0);
    },
    close: () => {
      bottomSheetRef.current?.close();
    },
  }));

  const handleSelect = useCallback(
    (value: string) => {
      if (selectedValue === value) {
        onSelect(null);
      } else {
        onSelect(value);
      }
      setInputValue('');
      bottomSheetRef.current?.close();
    },
    [onSelect, selectedValue]
  );

  const handleSubmitEditing = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      onSelect(trimmed);
      setInputValue('');
      bottomSheetRef.current?.close();
    }
  }, [inputValue, onSelect]);

  const handleSheetChanges = useCallback((_index: number) => {}, []);

  const isSelected = (option: ReferralOption) =>
    selectedValue === option.value;

  return (
    <BottomSheet
      backgroundStyle={styles.bottomSheetBackground}
      enablePanDownToClose
      handleIndicatorStyle={styles.handleIndicator}
      index={-1}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      onChange={handleSheetChanges}
      ref={bottomSheetRef}
      snapPoints={snapPoints}
    >
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>어디서 알고 오셨나요?</Text>
          <TouchableOpacity
            onPress={() => bottomSheetRef.current?.close()}
            style={styles.closeButton}
          >
            <Ionicons color="#666" name="close" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <BottomSheetTextInput
              maxLength={100}
              onChangeText={setInputValue}
              onSubmitEditing={handleSubmitEditing}
              placeholder="직접 입력하세요..."
              placeholderTextColor="#999"
              returnKeyType="done"
              style={styles.textInput}
              value={inputValue}
            />
            <TouchableOpacity
              disabled={!inputValue.trim()}
              onPress={handleSubmitEditing}
              style={[
                styles.doneButton,
                !inputValue.trim() && styles.doneButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.doneButtonText,
                  !inputValue.trim() && styles.doneButtonTextDisabled,
                ]}
              >
                완료
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.separator} />

        <BottomSheetScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {REFERRAL_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => handleSelect(option.value)}
              style={[
                styles.option,
                isSelected(option) && styles.selectedOption,
              ]}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionLeft}>
                  <Ionicons
                    color={isSelected(option) ? '#8B4513' : '#666'}
                    name={option.icon as keyof typeof Ionicons.glyphMap}
                    size={24}
                    style={styles.optionIcon}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      isSelected(option) && styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                {isSelected(option) && (
                  <Ionicons color="#8B4513" name="checkmark-circle" size={24} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </BottomSheetScrollView>
      </View>
    </BottomSheet>
  );
});

ReferralSourceBottomSheet.displayName = 'ReferralSourceBottomSheet';

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    fontSize: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flex: 1,
  },
  doneButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#8B4513',
    marginLeft: 12,
  },
  doneButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  doneButtonTextDisabled: {
    color: '#D1D5DB',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
    marginTop: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
  },
  option: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  selectedOption: {
    borderColor: '#8B4513',
    backgroundColor: '#FEF7F0',
    shadowColor: '#8B4513',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    marginRight: 16,
  },
  optionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  selectedOptionText: {
    color: '#8B4513',
    fontWeight: '700',
  },
});
