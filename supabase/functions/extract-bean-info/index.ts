import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const MAX_BASE64_LENGTH = 4 * 1024 * 1024; // ~3MB 원본 기준 (base64 인코딩 시 ~33% 증가)
const GEMINI_TIMEOUT_MS = 25_000;

const GEMINI_PROMPT = `이 이미지는 커피 원두 봉투 사진입니다. 다음 정보를 추출하세요:
- name: 원두 이름
- roastery_name: 로스터리(카페) 이름
- roast_level: light, medium_light, medium, medium_dark, dark 중 하나
- bean_type: blend 또는 single_origin
- weight_g: 무게 (그램 단위 정수)
- price: 가격 (원 단위 정수)
- cup_notes: 컵노트 배열 (한국어)

각 필드에 대해 0.0~1.0 사이의 confidence 값도 함께 반환하세요.
정보를 확인할 수 없는 필드는 null로, confidence는 0.0으로 설정하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "name": "string | null",
  "roastery_name": "string | null",
  "roast_level": "string | null",
  "bean_type": "string | null",
  "weight_g": "number | null",
  "price": "number | null",
  "cup_notes": ["string"],
  "confidence": {
    "name": 0.0,
    "roastery_name": 0.0,
    "roast_level": 0.0,
    "bean_type": 0.0,
    "weight_g": 0.0,
    "price": 0.0,
    "cup_notes": 0.0
  }
}`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    // JWT 검증
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Authorization header required' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace('Bearer ', '');
    const { error: authError } = await supabase.auth.getUser(token);
    if (authError) {
      return jsonResponse({ error: 'Invalid token' }, 401);
    }

    // Request body 파싱
    const { image_base64, mime_type } = await req.json();
    if (!image_base64 || !mime_type) {
      return jsonResponse(
        { error: 'image_base64 and mime_type are required' },
        400,
      );
    }

    // base64 페이로드 크기 검증
    if (image_base64.length > MAX_BASE64_LENGTH) {
      return jsonResponse(
        { error: 'Image too large. Max 3MB allowed.' },
        413,
      );
    }

    // Gemini 3.0 Flash API 호출
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      return jsonResponse({ error: 'Gemini API key not configured' }, 500);
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;

    // AbortController로 타임아웃 설정 (Gemini API 무한 대기 방지)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    let geminiResponse: Response;
    try {
      geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type, data: image_base64 } },
                { text: GEMINI_PROMPT },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });
    } catch (fetchError) {
      if ((fetchError as Error).name === 'AbortError') {
        return jsonResponse(
          { success: false, error: 'Gemini API request timed out' },
          504,
        );
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      return jsonResponse(
        {
          success: false,
          error: 'Gemini API call failed',
          details: errorText,
        },
        502,
      );
    }

    const geminiResult = await geminiResponse.json();
    const rawText =
      geminiResult.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // JSON 파싱 실패를 별도로 처리 (Gemini JSON 모드라도 100% 보장 아님)
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return jsonResponse(
        {
          success: false,
          error: 'Failed to parse Gemini response as JSON',
          details: rawText.slice(0, 200),
        },
        502,
      );
    }

    return jsonResponse({
      success: true,
      data: {
        name: parsed.name ?? null,
        roastery_name: parsed.roastery_name ?? null,
        roast_level: parsed.roast_level ?? null,
        bean_type: parsed.bean_type ?? null,
        weight_g: parsed.weight_g ?? null,
        price: parsed.price ?? null,
        cup_notes: Array.isArray(parsed.cup_notes) ? parsed.cup_notes : [],
        confidence: {
          name: parsed.confidence?.name ?? 0,
          roastery_name: parsed.confidence?.roastery_name ?? 0,
          roast_level: parsed.confidence?.roast_level ?? 0,
          bean_type: parsed.confidence?.bean_type ?? 0,
          weight_g: parsed.confidence?.weight_g ?? 0,
          price: parsed.confidence?.price ?? 0,
          cup_notes: parsed.confidence?.cup_notes ?? 0,
        },
      },
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: 'Failed to analyze image',
        details: (error as Error).message,
      },
      500,
    );
  }
});
