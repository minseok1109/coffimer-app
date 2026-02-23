import { NotCoffeeImageError } from '@/lib/errors';
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
  currentDate?: string,
): Promise<AIExtractionResult> {
  if (!images.length) {
    throw new Error('최소 1장의 이미지가 필요합니다.');
  }

  const { data, error } = await supabase.functions.invoke('extract-bean-info', {
    body: { images, ...(currentDate ? { currentDate } : {}) },
  });

  if (error) {
    // 에러 body를 한 번만 파싱하여 stream 소비 문제를 방지한다.
    let body: { error?: string; message?: string; details?: string } | undefined;
    try {
      body = await (error as { context?: { json?: () => Promise<unknown> } })
        .context?.json?.() as typeof body;
    } catch {
      // JSON 파싱 실패 — 일반 에러로 처리
    }

    if (body?.error === 'not_coffee_image') {
      throw new NotCoffeeImageError(
        body?.message ?? '커피 원두 이미지를 인식할 수 없습니다.',
      );
    }

    // 이미 파싱된 body가 있으면 그로부터 메시지를 추출, 없으면 fallback
    const message = body
      ? buildErrorMessage(body.error, body.details ?? body.message)
      : await extractInvokeErrorMessage(error);

    throw new Error(message ?? '이미지 분석 요청에 실패했습니다.');
  }

  if (!data?.success) {
    const message = buildErrorMessage(data?.error, data?.details);
    throw new Error(message ?? '이미지 분석에 실패했습니다.');
  }

  return data.data as AIExtractionResult;
}
