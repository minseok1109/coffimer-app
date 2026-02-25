import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BeanDetail } from '@/components/beans';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useBeanDetail, useDeleteBeanMutation } from '@/hooks/useBeans';

export default function BeanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { track } = useAnalytics();

  const { data: bean, isLoading } = useBeanDetail(id ?? '');

  const deleteMutation = useDeleteBeanMutation({
    onSuccess: () => router.back(),
    onError: (error) =>
      Alert.alert('삭제 실패', error.message ?? '원두 삭제 중 오류가 발생했습니다.'),
  });

  const [showActionSheet, setShowActionSheet] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const openActionSheet = () => {
    setShowActionSheet(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeActionSheet = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowActionSheet(false);
    });
  };

  const handleEdit = () => {
    closeActionSheet();
    router.push(`/beans/edit/${id}`);
  };

  const handleDelete = () => {
    closeActionSheet();
    Alert.alert('원두 삭제', '이 원두를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          if (id) {
            track('bean_deleted', { bean_id: id });
            deleteMutation.mutate(id);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons color="#1C1C1E" name="arrow-back" size={24} />
          </Pressable>
          <Text style={styles.headerTitle}>원두 상세</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#A56A49" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!bean) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons color="#1C1C1E" name="arrow-back" size={24} />
          </Pressable>
          <Text style={styles.headerTitle}>원두 상세</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons color="#ccc" name="bag-outline" size={64} />
          <Text style={styles.emptyText}>원두를 찾을 수 없습니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color="#1C1C1E" name="arrow-back" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>원두 상세</Text>
        <Pressable
          accessibilityLabel="더보기 메뉴"
          onPress={openActionSheet}
          style={styles.moreButton}
        >
          <Ionicons color="#1C1C1E" name="ellipsis-vertical" size={20} />
        </Pressable>
      </View>

      <BeanDetail bean={bean} />

      <Modal
        animationType="none"
        onRequestClose={closeActionSheet}
        transparent
        visible={showActionSheet}
      >
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={closeActionSheet}
            style={styles.overlayTouchable}
          >
            <Animated.View
              style={[
                styles.bottomSheetContent,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              <TouchableOpacity
                onPress={handleEdit}
                style={styles.actionButton}
              >
                <Ionicons color="#8B4513" name="create-outline" size={20} />
                <Text style={styles.actionButtonText}>수정</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDelete}
                style={styles.actionButton}
              >
                <Ionicons color="#ff4444" name="trash-outline" size={20} />
                <Text style={[styles.actionButtonText, { color: '#ff4444' }]}>
                  삭제
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={closeActionSheet}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
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
    backgroundColor: '#F7F8FA',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  moreButton: {
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheetContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    minHeight: 200,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});
