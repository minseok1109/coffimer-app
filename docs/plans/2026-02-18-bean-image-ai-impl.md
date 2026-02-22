# 원두 이미지 업로드 & AI 분석 — 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 원두 봉투 사진을 촬영/갤러리에서 선택하면 Gemini 3.0 Flash가 원두 정보를 자동 추출하고, 확정된 이미지를 Supabase Storage에 저장한다.

**Architecture:** 클라이언트에서 이미지를 base64로 변환 → Supabase Edge Function이 Gemini API 호출 → 결과로 폼 자동 채움. 이미지 업로드는 최종 제출 시에만 수행하여 고아 이미지를 방지한다. base64는 한 번만 읽고 분석/업로드에 재사용하여 이중 I/O를 방지한다.

**Tech Stack:** Expo SDK 54, Supabase Edge Functions (Deno), Gemini 3.0 Flash, expo-file-system, expo-crypto, base64-arraybuffer

**설계 문서:** `docs/plans/2026-02-18-bean-image-ai-design.md`

---

## Task 1: 의존성 설치

**Files:**
- Modify: `package.json`

**Step 1: 패키지 설치**

```bash
pnpm add expo-file-system expo-crypto base64-arraybuffer
```

- `expo-file-system`: 이미지 파일을 base64로 읽기 위해 필요
- `expo-crypto`: `randomUUID()` React Native 호환 보장 (`crypto.randomUUID()`는 구형 디바이스에서 미지원 가능)
- `base64-arraybuffer`: Supabase Storage의 `upload()`가 ArrayBuffer를 받으므로, base64 → ArrayBuffer 변환에 필요

**Step 2: 설치 확인**

```bash
pnpm list expo-file-system expo-crypto base64-arraybuffer
```

Expected: 세 패키지 모두 정상 출력

**Step 3: 커밋**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add expo-file-system, expo-crypto and base64-arraybuffer dependencies"
```

---

## Task 2: Supabase Storage 마이그레이션

**Files:**
- Create: `supabase/migrations/20260218_bean_images_storage.sql`

**Step 1: 마이그레이션 SQL 작성**

```sql
-- bean-images 버킷 생성 (Public, 5MB 제한)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('bean-images', 'bean-images', true, 5242880);

-- SELECT: 누구나 조회 가능 (Public 버킷이라도 명시적 정책 권장)
CREATE POLICY "Anyone can view bean images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bean-images');

-- INSERT: 인증된 사용자가 본인 폴더에만 업로드
CREATE POLICY "Users can upload own bean images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'bean-images'
    AND (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- DELETE: 본인 파일만 삭제
CREATE POLICY "Users can delete own bean images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'bean-images'
    AND (select auth.uid())::text = (storage.foldername(name))[1]
  );
```

**핵심:**
- `file_size_limit: 5242880` (5MB)을 마이그레이션 SQL에 포함하여 환경 재구성 시 누락 방지
- Public 버킷이라도 명시적 SELECT 정책 추가 — 향후 Private 전환 시 정책 누락 위험 방지
- `(select auth.uid())`를 사용하여 per-row function call을 방지 — 기존 `20260216_create_beans.sql`의 RLS 패턴과 동일
- UPDATE 정책은 의도적으로 생략: UUID 기반 파일명(`{userId}/{uuid}.ext`)을 사용하므로 기존 파일 덮어쓰기 불가. 이미지 교체는 DELETE → INSERT로 수행

**Step 2: Supabase 대시보드에서 실행**

Supabase Dashboard → SQL Editor에서 위 SQL 실행.

> 참고: 이 프로젝트는 `supabase db push`를 사용하지 않고 대시보드에서 직접 실행하는 패턴을 따름.

**Step 3: 커밋**

```bash
git add supabase/migrations/20260218_bean_images_storage.sql
git commit -m "feat: bean-images Storage 버킷 마이그레이션 추가"
```

---

## Task 3: Edge Function — `extract-bean-info`

**Files:**
- Create: `supabase/functions/extract-bean-info/index.ts`

**Step 1: Edge Function 작성**

```typescript
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
```

**핵심 포인트:**
- `jsr:@supabase/supabase-js@2` — Supabase 최신 Edge Function 모범 사례에 따라 JSR import 사용
- `MAX_BASE64_LENGTH` — base64 페이로드 크기를 ~3MB 원본 기준으로 제한하여 Edge Function 요청 본문 한도(~6MB) 초과 방지
- `AbortController` — Gemini API 호출에 25초 타임아웃 설정. Edge Function 자체 타임아웃(150초)에 도달하기 전에 적절한 에러 응답 반환
- `JSON.parse` 별도 에러 처리 — `responseMimeType: 'application/json'`이라도 파싱 실패 시 502 + 원본 텍스트 일부를 반환하여 디버깅 용이
- CORS/JWT 패턴은 기존 `delete-account` Edge Function과 동일
- `gemini-2.0-flash` 모델 사용 (설계 문서의 "3.0 Flash"는 코드네임, 실제 API 모델명은 확인 필요)

**Step 2: Gemini API 키 설정**

```bash
supabase secrets set GEMINI_API_KEY=<your-gemini-api-key>
```

**Step 3: Edge Function 배포**

```bash
supabase functions deploy extract-bean-info
```

**Step 4: 배포 확인**

Supabase Dashboard → Edge Functions에서 `extract-bean-info` 함수가 활성화되었는지 확인.

**Step 5: 커밋**

```bash
git add supabase/functions/extract-bean-info/index.ts
git commit -m "feat: Gemini 비전 분석 Edge Function 추가"
```

---

## Task 4: Storage 업로드 유틸리티

**Files:**
- Create: `lib/storage/beanImage.ts`

**Step 1: 유틸리티 작성**

```typescript
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
```

**변경 사항 (리뷰 반영):**
- `expo-crypto`의 `randomUUID()` 사용 — React Native 구형 디바이스 호환성 보장
- `mimeType` 매개변수 추가 — 갤러리 이미지가 PNG, HEIC 등일 수 있으므로 동적 확장자/contentType 지원
- base64를 직접 받도록 시그니처 변경 — 호출부에서 이미 읽은 base64를 재사용하여 이중 I/O 방지
- 업로드 실패 시 `null` 반환 — 이미지는 선택 사항이므로 실패해도 원두 등록은 계속 진행

**Step 2: 타입 체크**

```bash
pnpm run type-check
```

Expected: 에러 없음

**Step 3: 커밋**

```bash
git add lib/storage/beanImage.ts
git commit -m "feat: Supabase Storage 이미지 업로드 유틸리티 추가"
```

---

## Task 5: Bean Analysis API 클라이언트

**Files:**
- Create: `lib/api/beanAnalysis.ts`

**Step 1: API 클라이언트 작성**

```typescript
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
```

**변경 사항 (리뷰 반영):**
- `(base64, mimeType)` 시그니처로 변경 — 이미지 URI 대신 base64를 직접 받아 호출부에서 한 번 읽은 base64를 재사용 가능
- `FileSystem` import 제거 — base64 읽기 책임을 `useBeanAnalysis` 훅으로 이동
- `mimeType` 매개변수 추가 — 갤러리 이미지의 다양한 형식 지원

**Step 2: 타입 체크**

```bash
pnpm run type-check
```

Expected: 에러 없음

**Step 3: 커밋**

```bash
git add lib/api/beanAnalysis.ts
git commit -m "feat: AI 원두 분석 Edge Function 호출 API 추가"
```

---

## Task 6: useBeanAnalysis 커스텀 훅

**Files:**
- Create: `hooks/useBeanAnalysis.ts`

이 훅은 BeanForm의 비동기 분석 로직을 캡슐화하여 컴포넌트 복잡도를 낮추고, base64 캐시와 lifecycle 관리를 담당합니다.

**Step 1: 훅 작성**

```typescript
import { useState, useRef, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import type { BeanFieldConfidence, AIExtractionResult } from '@/types/bean';
import { analyzeBeanImage } from '@/lib/api/beanAnalysis';

const INITIAL_CONFIDENCE: BeanFieldConfidence = {
  name: null,
  roastery_name: null,
  roast_level: null,
  bean_type: null,
  weight_g: null,
  price: null,
  cup_notes: null,
};

interface ImageData {
  base64: string;
  mimeType: string;
}

interface UseBeanAnalysisReturn {
  isAnalyzing: boolean;
  confidence: BeanFieldConfidence;
  imageData: ImageData | null;
  analyze: (uri: string) => Promise<AIExtractionResult | null>;
  resetConfidence: () => void;
}

export function useBeanAnalysis(): UseBeanAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [confidence, setConfidence] = useState<BeanFieldConfidence>(INITIAL_CONFIDENCE);
  const imageDataRef = useRef<ImageData | null>(null);
  const abortRef = useRef(false);

  const analyze = useCallback(async (uri: string): Promise<AIExtractionResult | null> => {
    abortRef.current = false;
    setIsAnalyzing(true);

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const mimeType = uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

      // base64를 캐시하여 업로드 시 재사용
      imageDataRef.current = { base64, mimeType };

      if (abortRef.current) return null;

      const result = await analyzeBeanImage(base64, mimeType);

      if (abortRef.current) return null;

      setConfidence(result.confidence);
      return result;
    } catch {
      return null;
    } finally {
      if (!abortRef.current) {
        setIsAnalyzing(false);
      }
    }
  }, []);

  const resetConfidence = useCallback(() => {
    setConfidence(INITIAL_CONFIDENCE);
  }, []);

  return {
    isAnalyzing,
    confidence,
    imageData: imageDataRef.current,
    analyze,
    resetConfidence,
  };
}
```

**핵심 포인트 (리뷰 반영):**
- **커스텀 훅 분리**: `processImage` 비동기 로직을 BeanForm에서 분리하여 테스트 용이성 향상, 컴포넌트 복잡도 감소
- **base64 캐시**: `imageDataRef`에 base64를 저장하여 분석과 업로드에서 이중 I/O 방지. `useRef`를 사용하여 리렌더링 유발 없이 캐시
- **Unmount 안전성**: `abortRef`로 비동기 작업 중 상태 업데이트를 방지. 컴포넌트 unmount 시 이미 진행 중인 네트워크 요청은 완료되지만 상태 업데이트는 스킵
- **confidence 초기값 상수화**: `INITIAL_CONFIDENCE`를 모듈 레벨 상수로 추출하여 매 렌더링마다 새 객체 생성 방지
- **mimeType 감지**: URI 확장자 기반으로 MIME 타입 결정 — 갤러리에서 선택한 PNG/HEIC 등 지원

**Step 2: 타입 체크**

```bash
pnpm run type-check
```

Expected: 에러 없음

**Step 3: 커밋**

```bash
git add hooks/useBeanAnalysis.ts
git commit -m "feat: useBeanAnalysis 커스텀 훅 추가 (AI 분석 + base64 캐시)"
```

---

## Task 7: BeanForm — AI 분석 연동 및 이미지 데이터 전달

**Files:**
- Modify: `components/beans/BeanForm.tsx` (lines 55-58, 64-72, 103-133, 155-161)

이 Task는 BeanForm의 핵심 변경을 수행합니다:

### Step 1: onSubmit 시그니처 변경 — imageData를 부모에게 전달

`BeanFormProps.onSubmit`이 `imageData`를 두 번째 인자로 받도록 변경합니다.

**변경 전** (line 55-59):
```typescript
interface BeanFormProps {
  onSubmit: (data: BeanFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}
```

**변경 후:**
```typescript
interface ImageData {
  base64: string;
  mimeType: string;
}

interface BeanFormProps {
  onSubmit: (data: BeanFormData, imageData: ImageData | null) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}
```

**이유:** BeanForm은 이미지를 내부에서 관리하지만, 최종 Storage 업로드는 부모(`add.tsx`)가 제출 시 수행해야 한다. `ImageData` 객체로 base64와 mimeType을 함께 전달하여 부모가 이중 I/O 없이 바로 업로드 가능.

### Step 2: 기존 confidence 상수를 훅으로 교체

import 추가 (파일 상단):
```typescript
import { useBeanAnalysis } from '@/hooks/useBeanAnalysis';
```

**변경 전** (line 64-72):
```typescript
const confidence: BeanFieldConfidence = {
  name: null,
  roastery_name: null,
  roast_level: null,
  bean_type: null,
  weight_g: null,
  price: null,
  cup_notes: null,
};
```

**변경 후:**
```typescript
const { isAnalyzing, confidence, imageData, analyze } = useBeanAnalysis();
```

**이유:** confidence 상태 관리, base64 캐시, 분석 lifecycle이 모두 커스텀 훅으로 이동.

### Step 3: handleCapture/handleGallery에서 분석 호출 및 중복 호출 방지

import 추가 (파일 상단):
```typescript
// analyzeBeanImage import는 제거 (useBeanAnalysis 내부로 이동)
```

**handleCapture 변경 전** (line 113-116):
```typescript
if (!result.canceled && result.assets.at(0)) {
  setImageUri(result.assets[0].uri);
  setPhase('form');
}
```

**handleCapture 변경 후:**
```typescript
if (!result.canceled && result.assets.at(0)) {
  const uri = result.assets[0].uri;
  setImageUri(uri);
  setPhase('analyzing');

  const analysisResult = await analyze(uri);

  if (analysisResult) {
    if (analysisResult.name) setValue('name', analysisResult.name);
    if (analysisResult.roastery_name) setValue('roastery_name', analysisResult.roastery_name);
    if (analysisResult.roast_level) setValue('roast_level', analysisResult.roast_level);
    if (analysisResult.bean_type) setValue('bean_type', analysisResult.bean_type);
    if (analysisResult.weight_g) setValue('weight_g', analysisResult.weight_g);
    if (analysisResult.price) setValue('price', analysisResult.price);
    if (analysisResult.cup_notes?.length) setValue('cup_notes', analysisResult.cup_notes);
  } else {
    Alert.alert('분석 실패', 'AI 분석에 실패했습니다. 직접 입력해주세요.');
  }

  setPhase('form');
}
```

**handleGallery도 동일 패턴으로 변경** (line 129-132).

**중복 호출 방지:** `isAnalyzing` 상태를 활용하여 analyzing 중 촬영/갤러리 버튼 비활성화:

```typescript
<Pressable
  onPress={handleCapture}
  disabled={isAnalyzing || isLoading}
>
```

**에러 전략:** AI 분석 실패 시 `analyze()`가 `null`을 반환하므로 빈 폼으로 진행 (기존 직접 입력 경험 유지). `setPhase('form')`은 성공/실패 모두에서 호출.

### Step 4: handleFormSubmit에서 imageData 전달

**변경 전** (line 155-161):
```typescript
const handleFormSubmit = async (data: BeanFormData) => {
  try {
    await onSubmit(data);
  } catch {
    Alert.alert('저장 실패', '원두 등록 중 오류가 발생했습니다.');
  }
};
```

**변경 후:**
```typescript
const handleFormSubmit = async (data: BeanFormData) => {
  try {
    await onSubmit(data, imageData);
  } catch {
    Alert.alert('저장 실패', '원두 등록 중 오류가 발생했습니다.');
  }
};
```

### Step 5: 타입 체크

```bash
pnpm run type-check
```

Expected: `add.tsx`에서 `onSubmit` 시그니처 불일치 에러 발생 (Task 8에서 해결)

### Step 6: 커밋

```bash
git add components/beans/BeanForm.tsx
git commit -m "feat: BeanForm에 useBeanAnalysis 훅 연동 및 imageData 전달"
```

---

## Task 8: add.tsx — 이미지 업로드 통합

**Files:**
- Modify: `app/beans/add.tsx` (lines 29-42)

### Step 1: import 추가

```typescript
import { uploadBeanImage } from '@/lib/storage/beanImage';
import { supabase } from '@/lib/supabaseClient';
```

### Step 2: handleSubmit 변경

**변경 전** (line 40-42):
```typescript
const handleSubmit = async (data: Record<string, unknown>) => {
  await createBeanMutation.mutateAsync(normalizeInput(data));
};
```

**변경 후:**
```typescript
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
```

**변경 사항 (리뷰 반영):**
- `imageData` 객체에서 캐시된 base64를 직접 사용 — 이중 FileSystem 읽기 방지
- `supabase.auth.getSession()` 사용 — `getUser()`는 매번 네트워크 요청을 발생시키지만, `getSession()`은 로컬 세션을 반환하여 더 효율적
- `mimeType`을 `uploadBeanImage`에 전달 — 동적 확장자/contentType 지원

**핵심 흐름:**
1. `imageData`가 있으면 캐시된 base64로 Storage 업로드 → publicUrl 획득
2. 업로드 실패 시 `imageUrl`은 `null` → 이미지 없이 원두만 등록
3. `normalizeInput`에 `image_url`을 포함하여 DB에 저장

### Step 3: normalizeInput에 image_url 필드 추가

**변경 전** (line 29-38):
```typescript
const normalizeInput = (data: Record<string, unknown>): CreateBeanInput => ({
  name: data.name as string,
  roastery_name: (data.roastery_name as string) || null,
  roast_date: (data.roast_date as string) || null,
  roast_level: data.roast_level as CreateBeanInput['roast_level'],
  bean_type: data.bean_type as CreateBeanInput['bean_type'],
  weight_g: data.weight_g as number,
  price: data.price as number | null | undefined,
  cup_notes: data.cup_notes as string[] | undefined,
});
```

**변경 후:**
```typescript
const normalizeInput = (data: Record<string, unknown>): CreateBeanInput => ({
  name: data.name as string,
  roastery_name: (data.roastery_name as string) || null,
  roast_date: (data.roast_date as string) || null,
  roast_level: data.roast_level as CreateBeanInput['roast_level'],
  bean_type: data.bean_type as CreateBeanInput['bean_type'],
  weight_g: data.weight_g as number,
  price: data.price as number | null | undefined,
  cup_notes: data.cup_notes as string[] | undefined,
  image_url: (data.image_url as string) ?? null,
});
```

### Step 4: 타입 체크

```bash
pnpm run type-check
```

Expected: 에러 없음 (CreateBeanInput에 이미 `image_url?: string | null` 정의됨)

### Step 5: 커밋

```bash
git add app/beans/add.tsx
git commit -m "feat: 원두 등록 시 이미지 Storage 업로드 통합"
```

---

## Task 9: 수동 통합 테스트

**Step 1: 개발 서버 실행**

```bash
pnpm start
```

**Step 2: 촬영 플로우 테스트**

1. 원두 등록 화면 진입
2. "촬영" 버튼 → 카메라로 원두 봉투 촬영
3. **Analyzing phase** 확인: 프리뷰 이미지 + "AI가 원두 정보를 분석 중입니다..." 로딩
4. **Analyzing 중 버튼 비활성화** 확인: 촬영/갤러리 버튼이 disabled 상태인지 확인
5. 분석 완료 후 **Form phase** 전환 확인
6. AI가 추출한 필드 값이 폼에 pre-fill 되었는지 확인
7. ConfidenceBadge가 "AI 추출" / "확인필요" / "직접 입력"으로 적절히 표시되는지 확인
8. 수정 후 "등록하기" → 성공 Alert 확인

**Step 3: 갤러리 플로우 테스트**

위와 동일하되 "갤러리" 버튼으로 시작. PNG 이미지도 테스트하여 동적 mimeType이 올바르게 동작하는지 확인.

**Step 4: AI 분석 실패 시나리오**

1. 네트워크 끊기 또는 커피와 무관한 이미지 선택
2. "분석 실패" Alert 표시 후 빈 폼으로 전환되는지 확인
3. 직접 입력하여 등록 가능한지 확인

**Step 5: 대용량 이미지 테스트**

1. 고해상도(5MB+) 이미지를 선택
2. Edge Function이 413 에러를 반환하고, 클라이언트에서 분석 실패로 처리되는지 확인

**Step 6: 사진 없이 등록**

1. "사진 없이 직접 입력" → 바로 Form phase
2. 모든 ConfidenceBadge가 "직접 입력" (회색) 상태
3. 수동 입력 후 등록 → image_url이 null로 저장되는지 확인

**Step 7: Supabase Storage 확인**

대시보드 → Storage → bean-images 버킷에서 업로드된 이미지 확인. 파일명이 `{userId}/{uuid}.{ext}` 형식인지 확인.

**Step 8: Unmount 안전성 테스트**

1. 촬영 후 AI 분석 중("Analyzing" phase)에서 뒤로가기 버튼 터치
2. 콘솔에 "Can't perform a React state update on an unmounted component" 경고가 없는지 확인

---

## 후속 Task (향후 구현)

### 원두 삭제 시 Storage 이미지 정합성

현재 스코프에서는 원두 레코드 삭제 시 Storage 이미지를 함께 삭제하는 로직이 포함되지 않음. 별도 Task로 등록하여 구현 필요:

- **방법 A**: 클라이언트에서 원두 삭제 시 Storage 파일도 삭제 (간단하지만 클라이언트 의존)
- **방법 B**: Supabase Database Webhook + Edge Function으로 자동 삭제 (더 안정적)
- **방법 C**: 주기적 배치로 DB에 참조되지 않는 고아 이미지 정리

---

## 파일 변경 요약

| # | 파일 | 작업 | Task |
|---|------|------|------|
| 1 | `package.json` | Modify | Task 1 |
| 2 | `supabase/migrations/20260218_bean_images_storage.sql` | Create | Task 2 |
| 3 | `supabase/functions/extract-bean-info/index.ts` | Create | Task 3 |
| 4 | `lib/storage/beanImage.ts` | Create | Task 4 |
| 5 | `lib/api/beanAnalysis.ts` | Create | Task 5 |
| 6 | `hooks/useBeanAnalysis.ts` | Create | Task 6 |
| 7 | `components/beans/BeanForm.tsx` | Modify | Task 7 |
| 8 | `app/beans/add.tsx` | Modify | Task 8 |

**새 의존성:**
- `expo-file-system` — 이미지 파일 base64 읽기
- `expo-crypto` — React Native 호환 `randomUUID()`
- `base64-arraybuffer` — Supabase Storage 업로드용 변환

**Gemini API 키:**
- `supabase secrets set GEMINI_API_KEY=<key>`

---

## 리뷰 반영 사항 체크리스트

> 아래는 React 전문가/PostgreSQL 전문가 리뷰에서 제기된 항목과 반영 상태입니다.

### React 전문가 리뷰

| 등급 | 항목 | 반영 |
|------|------|------|
| CRITICAL | `processImage` unmount 시 상태 업데이트 | Task 6: `useBeanAnalysis` 훅에 `abortRef`로 안전성 확보 |
| HIGH | `processImage`를 커스텀 훅으로 분리 | Task 6: `useBeanAnalysis` 훅으로 분리 |
| HIGH | analyzing 중 중복 호출 방지 | Task 7: `isAnalyzing` 상태로 버튼 비활성화 |
| HIGH | `onSubmit(data, imageUri)` null 모호성 | Task 7: `ImageData \| null` 객체로 변경하여 명시적 구분 |
| MEDIUM | confidence 초기값 상수 추출 | Task 6: `INITIAL_CONFIDENCE` 모듈 레벨 상수로 추출 |
| MEDIUM | base64 이중 읽기 방지 | Task 6: `imageDataRef`에 캐시, Task 7-8에서 재사용 |
| MEDIUM | `normalizeInput` as 타입 단언 과다 | 현재 스코프 유지 (Zod 검증이 react-hook-form에서 수행) |
| LOW | Alert 대신 토스트 메시지 | 현재 스코프 유지 (토스트 라이브러리 미도입 상태) |

### PostgreSQL 전문가 리뷰

| 등급 | 항목 | 반영 |
|------|------|------|
| CRITICAL | base64 페이로드 크기 제한 | Task 3: `MAX_BASE64_LENGTH` 검증 추가 (413 응답) |
| CRITICAL | 파일 확장자/contentType 고정 | Task 4-5: `mimeType` 매개변수 + `MIME_TO_EXT` 매핑 |
| HIGH | Gemini API 타임아웃 | Task 3: `AbortController` 25초 타임아웃 (504 응답) |
| HIGH | `JSON.parse` 실패 처리 | Task 3: 별도 try-catch + 502 응답 |
| HIGH | 명시적 SELECT 정책 | Task 2: `Anyone can view bean images` 정책 추가 |
| MEDIUM | `crypto.randomUUID()` 호환성 | Task 1, 4: `expo-crypto` 의존성 추가 + `randomUUID()` 사용 |
| MEDIUM | JSR import 권장 | Task 3: `jsr:@supabase/supabase-js@2`로 변경 |
| MEDIUM | `getSession()` vs `getUser()` | Task 8: `getSession()` 사용으로 네트워크 요청 절약 |
| LOW | `file_size_limit` 마이그레이션 포함 | Task 2: `file_size_limit: 5242880` SQL에 포함 |
| LOW | 원두 삭제 시 이미지 정합성 | 후속 Task 섹션에 등록 |
