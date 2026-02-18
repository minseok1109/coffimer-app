import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BeanForm } from '@/components/beans';
import { useCreateBeanMutation } from '@/hooks/useBeans';
import { normalizeInput } from '@/lib/beans/normalizeBeanInput';
import { uploadBeanImage } from '@/lib/storage/beanImage';
import { supabase } from '@/lib/supabaseClient';

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

  const handleSubmit = async (
    data: Record<string, unknown>,
    imageData: { base64: string; mimeType: string } | null,
  ) => {
    let imageUrl: string | null = null;

    if (imageData) {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (userId) {
        imageUrl = await uploadBeanImage(imageData.base64, userId, imageData.mimeType);
      }
    }

    await createBeanMutation.mutateAsync(
      normalizeInput({ ...data, image_url: imageUrl }),
    );
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
