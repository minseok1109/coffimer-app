import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BeanForm } from '@/components/beans';
import { useCreateBeanMutation } from '@/hooks/useBeans';
import type { CreateBeanInput } from '@/types/bean';

export default function AddBeanScreen() {
  const router = useRouter();

  const createBeanMutation = useCreateBeanMutation({
    onSuccess: () => {
      Alert.alert('등록 완료', '원두가 등록되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    },
    onError: () => {
      Alert.alert('등록 실패', '원두 등록 중 오류가 발생했습니다.');
    },
  });

  const normalizeInput = (data: Record<string, unknown>): CreateBeanInput => ({
    name: data.name as string,
    roastery_name: (data.roastery_name as string) || null,
    roast_date: (data.roast_date as string) || null,
    roast_level: data.roast_level as CreateBeanInput['roast_level'],
    bean_type: data.bean_type as CreateBeanInput['bean_type'],
    weight_g: data.weight_g as number,
    price: data.price as number | null | undefined,
    cup_notes: data.cup_notes as string[] | undefined,
  });

  const handleSubmit = async (data: Record<string, unknown>) => {
    await createBeanMutation.mutateAsync(normalizeInput(data));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color="#1C1C1E" name="arrow-back" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>원두 등록</Text>
        <View style={styles.placeholder} />
      </View>

      <BeanForm
        isLoading={createBeanMutation.isPending}
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
});
