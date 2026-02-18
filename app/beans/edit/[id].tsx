import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BeanEditForm } from '@/components/beans';
import { useBeanDetail, useUpdateBeanMutation } from '@/hooks/useBeans';
import type { UpdateBeanInput } from '@/types/bean';

export default function BeanEditPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: bean, isLoading } = useBeanDetail(id ?? '');

  // IMPORTANT: Do NOT pass onError to useUpdateBeanMutation
  // Error handling is single-path through useBeanForm's submitErrorMessage
  const updateMutation = useUpdateBeanMutation({
    onSuccess: () => router.replace(`/beans/${id}`),
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons color="#1C1C1E" name="arrow-back" size={24} />
          </Pressable>
          <Text style={styles.headerTitle}>원두 수정</Text>
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
          <Text style={styles.headerTitle}>원두 수정</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons color="#ccc" name="bag-outline" size={64} />
          <Text style={styles.emptyText}>원두를 찾을 수 없습니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSubmit = async (input: UpdateBeanInput) => {
    await updateMutation.mutateAsync({ beanId: bean.id, input });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color="#1C1C1E" name="arrow-back" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>원두 수정</Text>
        <View style={styles.placeholder} />
      </View>
      <BeanEditForm
        bean={bean}
        isLoading={updateMutation.isPending}
        onCancel={() => router.back()}
        onSubmit={handleSubmit}
      />
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
});
