import { decode } from 'base64-arraybuffer';
import { randomUUID } from 'expo-crypto';
import type { EncodedImageData } from '@/lib/validation/beanSchema';
import { supabase } from '@/lib/supabaseClient';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'image/webp': 'webp',
};

export interface UploadedBeanImage {
  publicUrl: string;
  storagePath: string;
  mimeType: string;
}

function createStoragePath(userId: string, beanId: string, mimeType: string): string {
  const ext = MIME_TO_EXT[mimeType] ?? 'jpg';
  return `${userId}/${beanId}/${randomUUID()}.${ext}`;
}

async function uploadSingleImage(
  image: EncodedImageData,
  userId: string,
  beanId: string,
): Promise<UploadedBeanImage> {
  const storagePath = createStoragePath(userId, beanId, image.mimeType);

  const { error } = await supabase.storage
    .from('bean-images')
    .upload(storagePath, decode(image.base64), {
      contentType: image.mimeType,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from('bean-images').getPublicUrl(storagePath);

  return {
    publicUrl: data.publicUrl,
    storagePath,
    mimeType: image.mimeType,
  };
}

export async function deleteBeanImagesByPaths(paths: string[]): Promise<void> {
  if (!paths.length) return;

  const { error } = await supabase.storage.from('bean-images').remove(paths);
  if (error) {
    throw error;
  }
}

export async function uploadBeanImages(
  images: EncodedImageData[],
  userId: string,
  beanId: string,
): Promise<UploadedBeanImage[]> {
  if (!images.length) return [];

  const settled = await Promise.allSettled(
    images.map((image) => uploadSingleImage(image, userId, beanId)),
  );

  const succeeded = settled
    .filter(
      (result): result is PromiseFulfilledResult<UploadedBeanImage> =>
        result.status === 'fulfilled',
    )
    .map((result) => result.value);

  const failed = settled.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );

  if (failed.length) {
    if (succeeded.length) {
      await deleteBeanImagesByPaths(succeeded.map((image) => image.storagePath));
    }
    throw failed[0].reason instanceof Error
      ? failed[0].reason
      : new Error('이미지 업로드에 실패했습니다.');
  }

  return succeeded;
}
