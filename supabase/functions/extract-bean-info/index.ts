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
const API_TIMEOUT_MS = 25_000;

const ANALYSIS_PROMPT = `이 이미지는 커피 원두 봉투 사진입니다. 다음 정보를 추출하세요:
- name: 원두 이름
- roastery_name: 로스터리(카페) 이름
- roast_level: light, medium_light, medium, medium_dark, dark 중 하나
- bean_type: blend 또는 single_origin
- weight_g: 무게 (그램 단위 정수)
- price: 가격 (원 단위 정수)
- cup_notes: 컵노트 배열 (한국어)
- roast_date: 로스팅 날짜 (YYYY-MM-DD 형식)
- variety: 품종 (예: Geisha, Typica, SL28, Caturra, Bourbon)
- process_method: 가공 방식 (예: Washed, Natural, Honey, Anaerobic)

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
  "roast_date": "string | null",
  "variety": "string | null",
  "process_method": "string | null",
  "confidence": {
    "name": 0.0,
    "roastery_name": 0.0,
    "roast_level": 0.0,
    "bean_type": 0.0,
    "weight_g": 0.0,
    "price": 0.0,
    "cup_notes": 0.0,
    "roast_date": 0.0,
    "variety": 0.0,
    "process_method": 0.0
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

    // OpenRouter API 호출
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      return jsonResponse(
        { error: 'OpenRouter API key not configured' },
        500,
      );
    }

    // AbortController로 타임아웃 설정 (API 무한 대기 방지)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    let apiResponse: Response;
    try {
      apiResponse = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openRouterKey}`,
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${mime_type};base64,${image_base64}`,
                    },
                  },
                  { type: 'text', text: ANALYSIS_PROMPT },
                ],
              },
            ],
            response_format: { type: 'json_object' },
          }),
          signal: controller.signal,
        },
      );
    } catch (fetchError) {
      if ((fetchError as Error).name === 'AbortError') {
        return jsonResponse(
          { success: false, error: 'OpenRouter API request timed out' },
          504,
        );
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return jsonResponse(
        {
          success: false,
          error: 'OpenRouter API call failed',
          details: errorText,
        },
        502,
      );
    }

    const result = await apiResponse.json();
    const rawText = result.choices?.[0]?.message?.content ?? '';

    // JSON 파싱 실패를 별도로 처리 (JSON 모드라도 100% 보장 아님)
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return jsonResponse(
        {
          success: false,
          error: 'Failed to parse API response as JSON',
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
        roast_date: parsed.roast_date ?? null,
        variety: parsed.variety ?? null,
        process_method: parsed.process_method ?? null,
        confidence: {
          name: parsed.confidence?.name ?? 0,
          roastery_name: parsed.confidence?.roastery_name ?? 0,
          roast_level: parsed.confidence?.roast_level ?? 0,
          bean_type: parsed.confidence?.bean_type ?? 0,
          weight_g: parsed.confidence?.weight_g ?? 0,
          price: parsed.confidence?.price ?? 0,
          cup_notes: parsed.confidence?.cup_notes ?? 0,
          roast_date: parsed.confidence?.roast_date ?? 0,
          variety: parsed.confidence?.variety ?? 0,
          process_method: parsed.confidence?.process_method ?? 0,
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
