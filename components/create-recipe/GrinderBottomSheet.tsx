// 그라인더 기능 비활성화로 인해 전체 컴포넌트 주석처리
/* 
import { useGrinders, type Grinder } from "@/hooks/useGrinders";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import React, { forwardRef, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface BottomSheetRef {
  expand: () => void;
  close: () => void;
}

interface GrinderBottomSheetProps {
  selectedValue?: string;
  onSelect: (value: string) => void;
}

export const GrinderBottomSheet = forwardRef<
  BottomSheetRef,
  GrinderBottomSheetProps
>(({ selectedValue, onSelect }, ref) => {
  const bottomSheetModalRef = React.useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["50%", "70%"], []);
  const { data: grinders = [], isLoading } = useGrinders();

  React.useImperativeHandle(ref, () => ({
    expand: () => bottomSheetModalRef.current?.present(),
    close: () => bottomSheetModalRef.current?.dismiss(),
  }));

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
      />
    ),
    []
  );

  const handleSelect = useCallback(
    (grinderId: string) => {
      onSelect(grinderId);
      bottomSheetModalRef.current?.dismiss();
    },
    [onSelect]
  );

  const renderGrinderItem = useCallback(
    ({ item }: { item: Grinder }) => (
      <TouchableOpacity
        onPress={() => handleSelect(item.id)}
        style={[
          styles.optionItem,
          selectedValue === item.id && styles.selectedOption,
        ]}
      >
        <View style={styles.optionContent}>
          <View style={styles.optionHeader}>
            <Text
              style={[
                styles.optionText,
                selectedValue === item.id && styles.selectedOptionText,
              ]}
            >
              {item.brand} {item.name}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoText}>
              클릭 범위: {item.min_clicks}-{item.max_clicks}
            </Text>
            {item.micron_range_min && item.micron_range_max && (
              <Text style={styles.infoText}>
                분쇄 범위: {item.micron_range_min}-{item.micron_range_max}μm
              </Text>
            )}
          </View>
        </View>

        {selectedValue === item.id && (
          <Ionicons color="#8B4513" name="checkmark" size={24} />
        )}
      </TouchableOpacity>
    ),
    [selectedValue, handleSelect]
  );

  return (
    <BottomSheetModal
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      enablePanDownToClose
      handleIndicatorStyle={styles.indicator}
      index={1}
      ref={bottomSheetModalRef}
      snapPoints={snapPoints}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>그라인더 선택</Text>
          <Text style={styles.subtitle}>
            사용하시는 그라인더를 선택해주세요
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B4513" />
            <Text style={styles.loadingText}>그라인더 목록을 불러오는 중...</Text>
          </View>
        ) : (
          <FlatList
            contentContainerStyle={styles.listContent}
            data={grinders}
            keyExtractor={(item) => item.id}
            renderItem={renderGrinderItem}
            showsVerticalScrollIndicator={false}
            style={styles.list}
          />
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

GrinderBottomSheet.displayName = "GrinderBottomSheet";

*/

// 그라인더 기능 비활성화로 인해 임시 더미 컴포넌트 제공
import React, { forwardRef } from "react";

export interface BottomSheetRef {
  expand: () => void;
  close: () => void;
}

interface GrinderBottomSheetProps {
  selectedValue?: string;
  onSelect: (value: string) => void;
}

export const GrinderBottomSheet = forwardRef<
  BottomSheetRef,
  GrinderBottomSheetProps
>((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    expand: () => {},
    close: () => {},
  }));

  return null;
});

GrinderBottomSheet.displayName = "GrinderBottomSheet";

/*
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedOption: {
    borderColor: "#8B4513",
    backgroundColor: "#fef7f0",
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  selectedOptionText: {
    color: "#8B4513",
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  manualTag: {
    backgroundColor: "#e3f2fd",
  },
  electricTag: {
    backgroundColor: "#f3e5f5",
  },
  typeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  manualText: {
    color: "#1976d2",
  },
  electricText: {
    color: "#7b1fa2",
  },
  descriptionText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: "#888",
    flex: 1,
  },
  recommendedRow: {
    marginTop: 4,
  },
  recommendedTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#8B4513",
    marginBottom: 2,
  },
  recommendedText: {
    fontSize: 11,
    color: "#666",
    lineHeight: 16,
  },
  indicator: {
    backgroundColor: "#ccc",
    width: 40,
  },
  background: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#666",
  },
});
*/
