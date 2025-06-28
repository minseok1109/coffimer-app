import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput, // TextInput을 위해 import 추가
} from "@gorhom/bottom-sheet";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState, // useState import 추가
} from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface BottomSheetRef {
  expand: () => void;
  close: () => void;
}

interface DripperOption {
  label: string;
  value: string;
  icon?: string;
}

interface DripperBottomSheetProps {
  onSelect: (value: string) => void;
  selectedValue?: string;
  options: DripperOption[];
}

export const DripperBottomSheet = forwardRef<
  BottomSheetRef,
  DripperBottomSheetProps
>(({ onSelect, selectedValue, options }, ref) => {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const [inputValue, setInputValue] = useState(""); // TextInput 상태 관리

  // 스냅 포인트 설정
  const snapPoints = useMemo(() => ["80%"], []);

  useImperativeHandle(ref, () => ({
    expand: () => {
      setInputValue(""); // BottomSheet가 열릴 때 TextInput 초기화
      bottomSheetRef.current?.snapToIndex(0);
    },
    close: () => {
      bottomSheetRef.current?.close();
    },
  }));

  // 목록에서 아이템을 선택했을 때
  const handleSelect = useCallback(
    (value: string) => {
      onSelect(value);
      setInputValue(""); // 선택 후 TextInput 초기화
      bottomSheetRef.current?.close();
    },
    [onSelect]
  );

  // TextInput에서 직접 입력 후 '완료'를 눌렀을 때
  const handleSubmitEditing = useCallback(() => {
    if (inputValue.trim()) {
      onSelect(inputValue.trim());
      setInputValue(""); // 제출 후 TextInput 초기화
      bottomSheetRef.current?.close();
    }
  }, [inputValue, onSelect]);

  const handleSheetChanges = useCallback((index: number) => {
    // Bottom sheet 상태 변경 시 필요한 로직
  }, []);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={true}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      keyboardBehavior="interactive" // 키보드 인터랙션 설정
      keyboardBlurBehavior="restore"
    >
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>드리퍼 선택</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => bottomSheetRef.current?.close()}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* --- TextInput 추가된 부분 --- */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <BottomSheetTextInput
              style={styles.textInput}
              placeholder="원하는 드리퍼를 직접 입력하세요..."
              placeholderTextColor="#999"
              value={inputValue}
              onChangeText={setInputValue}
              onSubmitEditing={handleSubmitEditing}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[
                styles.doneButton,
                !inputValue.trim() && styles.doneButtonDisabled,
              ]}
              onPress={handleSubmitEditing}
              disabled={!inputValue.trim()}
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
        {/* --- 여기까지 --- */}

        <BottomSheetScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                selectedValue === option.value && styles.selectedOption,
              ]}
              onPress={() => handleSelect(option.value)}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionLeft}>
                  {option.icon && (
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color={
                        selectedValue === option.value ? "#8B4513" : "#666"
                      }
                      style={styles.optionIcon}
                    />
                  )}
                  <Text
                    style={[
                      styles.optionText,
                      selectedValue === option.value &&
                        styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                {selectedValue === option.value && (
                  <Ionicons name="checkmark-circle" size={24} color="#8B4513" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </BottomSheetScrollView>
      </View>
    </BottomSheet>
  );
});

DripperBottomSheet.displayName = "DripperBottomSheet";

const styles = StyleSheet.create({
  // 기존 스타일은 그대로 유지
  bottomSheetBackground: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handleIndicator: {
    backgroundColor: "#D1D5DB",
    width: 40,
    height: 4,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "white",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  // --- TextInput 관련 스타일 추가 ---
  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  textInput: {
    fontSize: 16,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flex: 1,
  },
  doneButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#8B4513",
    marginLeft: 12,
  },
  doneButtonDisabled: {
    backgroundColor: "#F3F4F6",
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  doneButtonTextDisabled: {
    color: "#D1D5DB",
  },
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 20,
    marginTop: 16,
  },
  // --- 여기까지 ---
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
  },
  option: {
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  selectedOption: {
    borderColor: "#8B4513",
    backgroundColor: "#FEF7F0",
    shadowColor: "#8B4513",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  optionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionIcon: {
    marginRight: 16,
  },
  optionText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
  },
  selectedOptionText: {
    color: "#8B4513",
    fontWeight: "700",
  },
});
