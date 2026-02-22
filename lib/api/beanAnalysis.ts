import type { EncodedImageData } from '@/lib/validation/beanSchema';
import type { AIExtractionResult } from '@/types/bean';
import { supabase } from '@/lib/supabaseClient';

function buildErrorMessage(
  error: string | null | undefined,
  details: string | null | undefined,
) {
  if (error && details) return `${error}: ${details}`;
  return error ?? details ?? null;
}

async function extractInvokeErrorMessage(error: unknown): Promise<string> {
  const fallback =
    error instanceof Error && error.message
      ? error.message
      : '이미지 분석 요청에 실패했습니다.';

  const maybeError = error as {
    details?: unknown;
    context?: { json?: () => Promise<unknown>; text?: () => Promise<string> };
  };

  if (typeof maybeError?.details === 'string' && maybeError.details) {
    return maybeError.details;
  }

  if (!maybeError?.context) {
    return fallback;
  }

  try {
    const parsed = (await maybeError.context.json?.()) as
      | { error?: string; details?: string }
      | undefined;
    const message = buildErrorMessage(parsed?.error, parsed?.details);
    if (message) return message;
  } catch {
    // no-op: fallback to text parser
  }

  try {
    const text = await maybeError.context.text?.();
    if (typeof text === 'string' && text.trim()) return text;
  } catch {
    // no-op: use fallback
  }

  return fallback;
}

export async function analyzeBeanImages(
  images: EncodedImageData[],
): Promise<AIExtractionResult> {
  if (!images.length) {
    throw new Error('최소 1장의 이미지가 필요합니다.');
  }

  const { data, error } = await supabase.functions.invoke('extract-bean-info', {
    body: { images },
  });

  if (error) {
    throw new Error(await extractInvokeErrorMessage(error));
  }

  if (!data?.success) {
    const message = buildErrorMessage(data?.error, data?.details);
    throw new Error(message ?? '이미지 분석에 실패했습니다.');
  }

  return data.data as AIExtractionResult;
}
