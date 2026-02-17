import type { AIExtractionResult } from '@/types/bean';
import { supabase } from '@/lib/supabaseClient';

export async function analyzeBeanImage(
  base64: string,
  mimeType = 'image/jpeg',
): Promise<AIExtractionResult> {
  const { data, error } = await supabase.functions.invoke('extract-bean-info', {
    body: { image_base64: base64, mime_type: mimeType },
  });

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error ?? 'Analysis failed');

  return data.data as AIExtractionResult;
}
