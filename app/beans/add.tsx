import { Ionicons } from '@expo/vector-icons';
import { randomUUID } from 'expo-crypto';
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
import { useAnalytics } from '@/hooks/useAnalytics';
import { useCreateBeanMutation, useCreateBeanWithImagesMutation } from '@/hooks/useBeans';
import { normalizeInput } from '@/lib/beans/normalizeBeanInput';
import {
  deleteBeanImagesByPaths,
  uploadBeanImages,
} from '@/lib/storage/beanImage';
import { supabase } from '@/lib/supabaseClient';
import type { BeanFormData, EncodedImageData } from '@/lib/validation/beanSchema';

interface BeanFormSubmitPayload {
  encodedImages: EncodedImageData[];
  imageUris: string[];
  primaryIndex: number | null;
}

function countFilledFields(data: BeanFormData): number {
  let count = 0;
  if (data.name.trim()) count++;
  if (data.roastery_name?.trim()) count++;
  if (data.roast_date?.trim()) count++;
  if (data.opened_date?.trim()) count++;
  if (data.roast_level) count++;
  if (data.bean_type) count++;
  if (data.weight_g > 0) count++;
  if (data.price !== null && data.price !== undefined && data.price > 0) count++;
  if (data.cup_notes.length > 0) count++;
  if (data.degassing_days !== null && data.degassing_days !== undefined) count++;
  if (data.variety?.trim()) count++;
  if (data.process_method) count++;
  if (data.notes?.trim()) count++;
  return count;
}

export default function AddBeanScreen() {
  const router = useRouter();
  const { track } = useAnalytics();

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

  const createBeanWithImagesMutation = useCreateBeanWithImagesMutation({
    onSuccess: () => {
      Alert.alert('등록 완료', '원두가 등록되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    },
    onError: () => {
      Alert.alert('등록 실패', '원두 등록 중 오류가 발생했습니다.');
    },
  });

  const handleSubmit = async (data: BeanFormData, payload: BeanFormSubmitPayload) => {
    const normalized = normalizeInput(data as unknown as Record<string, unknown>);
    const fieldCount = countFilledFields(data);
    const usedAiAnalysis = payload.encodedImages.length > 0;

    if (!payload.imageUris.length) {
      const bean = await createBeanMutation.mutateAsync(normalized);
      track('bean_added', {
        bean_id: bean.id,
        has_images: false,
        used_ai_analysis: usedAiAnalysis,
        field_count: fieldCount,
      });
      return;
    }

    if (!payload.encodedImages.length) {
      throw new Error('이미지 분석 결과가 없습니다. 다시 분석해주세요.');
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;

    if (!userId) {
      throw new Error('사용자 인증이 필요합니다.');
    }

    const beanId = randomUUID();
    const uploadedImages = await uploadBeanImages(payload.encodedImages, userId, beanId);

    try {
      const primaryIndex = payload.primaryIndex ?? 0;

      const bean = await createBeanWithImagesMutation.mutateAsync({
        beanId,
        input: normalized,
        images: uploadedImages.map((uploadedImage, index) => ({
          image_url: uploadedImage.publicUrl,
          storage_path: uploadedImage.storagePath,
          sort_order: index,
          is_primary: index === primaryIndex,
        })),
      });
      track('bean_added', {
        bean_id: bean.id,
        has_images: true,
        used_ai_analysis: usedAiAnalysis,
        field_count: fieldCount,
      });
    } catch (error) {
      await deleteBeanImagesByPaths(uploadedImages.map((image) => image.storagePath));
      throw error;
    }
  };

  const isSubmitting =
    createBeanMutation.isPending || createBeanWithImagesMutation.isPending;

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
        isLoading={isSubmitting}
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
