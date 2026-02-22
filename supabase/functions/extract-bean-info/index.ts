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

interface ImagePayload {
  base64: string;
  mimeType: string;
}

type RequestShape = 'new' | 'legacy';

interface RequestContext {
  requestId: string;
  requestShape: RequestShape;
  imageCount: number;
  totalBase64Length: number;
}

const MAX_IMAGE_COUNT = 5;
const MAX_IMAGE_BASE64_LENGTH = 1_500_000;
const MAX_TOTAL_BASE64_LENGTH = 6_000_000;
const API_TIMEOUT_MS = 40_000;

const ANALYSIS_PROMPT = `다음 이미지들은 같은 커피 원두 봉투의 여러 면/각도입니다.
모든 이미지를 종합적으로 분석하여 하나의 결과를 반환하세요.

추출 필드:
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

function validateImages(images: ImagePayload[]) {
  if (!Array.isArray(images) || images.length === 0) {
    return { valid: false, status: 400, message: 'images is required' };
  }

  if (images.length > MAX_IMAGE_COUNT) {
    return {
      valid: false,
      status: 400,
      message: `Up to ${MAX_IMAGE_COUNT} images are allowed`,
    };
  }

  let totalLength = 0;

  for (const image of images) {
    if (
      typeof image?.base64 !== 'string' ||
      typeof image?.mimeType !== 'string' ||
      !image.base64 ||
      !image.mimeType
    ) {
      return {
        valid: false,
        status: 400,
        message: 'Each image requires base64 and mimeType',
      };
    }

    if (image.base64.length > MAX_IMAGE_BASE64_LENGTH) {
      return {
        valid: false,
        status: 413,
        message: 'Each image must be under size limit',
      };
    }

    totalLength += image.base64.length;
  }

  if (totalLength > MAX_TOTAL_BASE64_LENGTH) {
    return {
      valid: false,
      status: 413,
      message: 'Total image payload is too large',
    };
  }

  return { valid: true, status: 200, message: '' };
}

function getTotalBase64Length(images: ImagePayload[]) {
  return images.reduce((sum, image) => {
    const base64 = typeof image?.base64 === 'string' ? image.base64 : '';
    return sum + base64.length;
  }, 0);
}

function logEdge(
  level: 'log' | 'warn' | 'error',
  event: string,
  payload: Record<string, unknown>,
) {
  const message = '[extract-bean-info]';
  if (level === 'error') {
    console.error(message, { event, ...payload });
    return;
  }
  if (level === 'warn') {
    console.warn(message, { event, ...payload });
    return;
  }
  console.log(message, { event, ...payload });
}

function parseImagesFromRequestBody(body: unknown) {
  if (!body || typeof body !== 'object') {
    return { ok: false as const, status: 400, message: 'Invalid request body' };
  }

  const payload = body as {
    images?: unknown;
    image_base64?: unknown;
    mime_type?: unknown;
  };

  if (payload.images !== undefined) {
    if (!Array.isArray(payload.images)) {
      return {
        ok: false as const,
        status: 400,
        message: 'images must be an array',
      };
    }

    return {
      ok: true as const,
      images: payload.images as ImagePayload[],
      requestShape: 'new' as RequestShape,
    };
  }

  if (payload.image_base64 !== undefined || payload.mime_type !== undefined) {
    if (
      typeof payload.image_base64 !== 'string' ||
      typeof payload.mime_type !== 'string'
    ) {
      return {
        ok: false as const,
        status: 400,
        message: 'image_base64 and mime_type are required',
      };
    }

    return {
      ok: true as const,
      requestShape: 'legacy' as RequestShape,
      images: [
        {
          base64: payload.image_base64,
          mimeType: payload.mime_type,
        },
      ],
    };
  }

  return { ok: false as const, status: 400, message: 'images is required' };
}

Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID();

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
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

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      logEdge('warn', 'request.invalid_json', { requestId, status: 400 });
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const parsedRequest = parseImagesFromRequestBody(body);
    if (!parsedRequest.ok) {
      logEdge('warn', 'request.invalid_payload', {
        requestId,
        status: parsedRequest.status,
        reason: parsedRequest.message,
      });
      return jsonResponse({ error: parsedRequest.message }, parsedRequest.status);
    }

    const { images, requestShape } = parsedRequest;
    const requestContext: RequestContext = {
      requestId,
      requestShape,
      imageCount: images.length,
      totalBase64Length: getTotalBase64Length(images),
    };

    logEdge('log', 'request.received', requestContext);

    const validation = validateImages(images);

    if (!validation.valid) {
      logEdge(
        validation.status >= 500 ? 'error' : 'warn',
        'request.validation_failed',
        {
          ...requestContext,
          status: validation.status,
          reason: validation.message,
        },
      );
      return jsonResponse({ error: validation.message }, validation.status);
    }

    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      return jsonResponse(
        { error: 'OpenRouter API key not configured' },
        500,
      );
    }

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
                  { type: 'text', text: ANALYSIS_PROMPT },
                  ...images.map((image) => ({
                    type: 'image_url',
                    image_url: {
                      url: `data:${image.mimeType};base64,${image.base64}`,
                    },
                  })),
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
        logEdge('error', 'openrouter.timeout', {
          ...requestContext,
          status: 504,
        });
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
      logEdge('error', 'openrouter.non_ok_response', {
        ...requestContext,
        status: 502,
        providerStatus: apiResponse.status,
        providerBodyPreview: errorText.slice(0, 200),
      });
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

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      logEdge('error', 'openrouter.parse_failed', {
        ...requestContext,
        status: 502,
        responsePreview: rawText.slice(0, 200),
      });
      return jsonResponse(
        {
          success: false,
          error: 'Failed to parse API response as JSON',
          details: rawText.slice(0, 200),
        },
        502,
      );
    }

    logEdge('log', 'analysis.success', {
      ...requestContext,
      status: 200,
    });

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
    logEdge('error', 'request.unhandled_error', {
      requestId,
      status: 500,
      error: (error as Error).message,
    });
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
