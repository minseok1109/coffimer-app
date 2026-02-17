import { randomUUID } from 'expo-crypto';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabaseClient';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'image/webp': 'webp',
};

export async function uploadBeanImage(
  base64: string,
  userId: string,
  mimeType = 'image/jpeg',
): Promise<string | null> {
  try {
    const ext = MIME_TO_EXT[mimeType] ?? 'jpg';
    const fileName = `${userId}/${randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from('bean-images')
      .upload(fileName, decode(base64), {
        contentType: mimeType,
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('bean-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch {
    return null;
  }
}
