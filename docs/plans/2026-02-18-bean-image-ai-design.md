# 원두 이미지 업로드 & AI 분석 — 설계 문서

> **Date:** 2026-02-18
> **Status:** Approved
> **Depends on:** `2026-02-16-bean-management-logic.md` (완료됨)

## Goal

원두 봉투 사진을 촬영/갤러리에서 선택하면 Gemini 3.0 Flash가 원두 정보를 자동 추출하고, 확정된 이미지를 Supabase Storage에 저장한다.

## 핵심 결정 사항

| # | 결정 | 선택 | 이유 |
|---|------|------|------|
| 1 | 실행 흐름 | AI 즉시 실행, 업로드는 제출 시 | 사용자 취소 시 고아 이미지 방지 |
| 2 | AI 모델 | Gemini 3.0 Flash | 비전 분석 대비 비용 효율적, 무료 티어 |
| 3 | 이미지 전달 방식 | base64 인코딩 (JSON body) | 구현 단순, expo-file-system 활용 |
| 4 | Storage 버킷 | Public (`bean-images`) | 원두 사진은 비민감 데이터, signed URL 불필요 |
| 5 | Confidence 처리 | 모든 필드 채우고 badge 표시 | 사용자가 확인/수정하도록 유도 |

---

## 전체 아키텍처

```
[촬영/갤러리 선택]
        │
        ▼
  로컬 이미지 URI 획득
  + base64 변환 (expo-file-system)
        │
        ▼
  Edge Function 호출           ← analyzing phase
  (extract-bean-info)
  base64 → Gemini 3.0 Flash
        │
        ▼
  AIExtractionResult 반환
        │
        ▼
  [form phase]
  - AI 결과로 폼 pre-fill
  - ConfidenceBadge 표시
  - 로컬 URI로 이미지 미리보기
        │
        ▼
  [등록하기 버튼 클릭]
        │
        ├─ 1) Storage 업로드 (로컬 URI → bean-images/{user_id}/{uuid}.jpg)
        ├─ 2) image_url 획득
        └─ 3) createBean({ ...formData, image_url })
```

### 에러 처리 전략

- **AI 분석 실패** → 빈 폼으로 진행 (사용자 직접 입력, 기존 경험 유지)
- **Storage 업로드 실패** → image_url 없이 원두만 등록 (이미지는 선택 사항)
- **두 단계 모두 성공** → 최적의 경험 (이미지 저장 + 폼 자동 채움)

---

## 1. Supabase Storage 설정

### 버킷: `bean-images` (Public)

```
bean-images/
  └── {user_id}/
       ├── a1b2c3d4.jpg
       └── e5f6g7h8.jpg
```

**마이그레이션 SQL:**

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('bean-images', 'bean-images', true);

-- INSERT: 인증된 사용자가 본인 폴더에만 업로드
CREATE POLICY "Users can upload own bean images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'bean-images'
    AND (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- SELECT: Public 버킷이므로 별도 정책 불필요 (누구나 URL로 접근 가능)

-- DELETE: 본인 파일만 삭제
CREATE POLICY "Users can delete own bean images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'bean-images'
    AND (select auth.uid())::text = (storage.foldername(name))[1]
  );
```

파일 크기 제한: 5MB (대시보드에서 설정)

### 새 파일: `lib/storage/beanImage.ts`

```typescript
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabaseClient';

export async function uploadBeanImage(
  imageUri: string,
  userId: string,
): Promise<string | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileName = `${userId}/${crypto.randomUUID()}.jpg`;

    const { error } = await supabase.storage
      .from('bean-images')
      .upload(fileName, decode(base64), {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('bean-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch {
    return null; // 업로드 실패 시 null (이미지는 선택 사항)
  }
}
```

**의존성:** `base64-arraybuffer` 패키지 필요 (`pnpm add base64-arraybuffer`)

---

## 2. Edge Function: `extract-bean-info`

### 파일: `supabase/functions/extract-bean-info/index.ts`

**요청:**

```typescript
POST /functions/v1/extract-bean-info
Authorization: Bearer <user-jwt>
Content-Type: application/json

{
  "image_base64": "iVBORw0KGgo...",
  "mime_type": "image/jpeg"
}
```

**응답 (성공):**

```typescript
{
  "success": true,
  "data": {
    "name": "에티오피아 예가체프",
    "roastery_name": "프릳츠커피",
    "roast_level": "medium_light",
    "bean_type": "single_origin",
    "weight_g": 200,
    "price": 25000,
    "cup_notes": ["베리", "꽃향", "시트러스"],
    "confidence": {
      "name": 0.95,
      "roastery_name": 0.88,
      "roast_level": 0.72,
      "bean_type": 0.90,
      "weight_g": 0.85,
      "price": 0.60,
      "cup_notes": 0.75
    }
  }
}
```

**응답 (에러):**

```typescript
{
  "success": false,
  "error": "Failed to analyze image",
  "details": "..."
}
```

### 내부 로직

```
1. CORS preflight 처리
2. POST 메서드 확인
3. JWT 검증 (auth.getUser)
4. request body에서 image_base64, mime_type 추출
5. Gemini 3.0 Flash generateContent API 호출
   - contents: [{ inlineData: { data: image_base64, mimeType } }, { text: prompt }]
   - generationConfig: { responseMimeType: "application/json" }
6. 응답 JSON 파싱 → AIExtractionResult 형태로 매핑
7. 응답 반환
```

### Gemini 프롬프트 (핵심)

```
이 이미지는 커피 원두 봉투 사진입니다. 다음 정보를 추출하세요:
- name: 원두 이름
- roastery_name: 로스터리(카페) 이름
- roast_level: light, medium_light, medium, medium_dark, dark 중 하나
- bean_type: blend 또는 single_origin
- weight_g: 무게 (그램 단위 정수)
- price: 가격 (원 단위 정수)
- cup_notes: 컵노트 배열 (한국어)

각 필드에 대해 0.0~1.0 사이의 confidence 값도 함께 반환하세요.
정보를 확인할 수 없는 필드는 null로, confidence는 0.0으로 설정하세요.

JSON 형식으로만 응답하세요.
```

### API 키 관리

```bash
supabase secrets set GEMINI_API_KEY=<your-key>
```

Edge Function에서: `Deno.env.get('GEMINI_API_KEY')`

---

## 3. 클라이언트 통합

### 새 파일: `lib/api/beanAnalysis.ts`

```typescript
import type { AIExtractionResult } from '@/types/bean';
import { supabase } from '@/lib/supabaseClient';

export async function analyzeBeanImage(
  imageBase64: string,
  mimeType: string,
): Promise<AIExtractionResult> {
  const { data, error } = await supabase.functions.invoke('extract-bean-info', {
    body: { image_base64: imageBase64, mime_type: mimeType },
  });

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error ?? 'Analysis failed');

  return data.data as AIExtractionResult;
}
```

### BeanForm.tsx 변경

**1. confidence를 useState로 승격**

```typescript
// Before
const confidence: BeanFieldConfidence = { name: null, roastery_name: null, ... };

// After
const [confidence, setConfidence] = useState<BeanFieldConfidence>({
  name: null, roastery_name: null, roast_level: null,
  bean_type: null, weight_g: null, price: null, cup_notes: null,
});
```

**2. handleCapture / handleGallery → analyzing phase 연결**

```typescript
const handleCapture = async () => {
  // ... (기존 권한 체크 + 이미지 선택 동일)
  if (!result.canceled && result.assets.at(0)) {
    const uri = result.assets[0].uri;
    setImageUri(uri);
    setPhase('analyzing');
    await processImage(uri);
  }
};

const processImage = async (uri: string) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const result = await analyzeBeanImage(base64, 'image/jpeg');

    // 폼 필드 자동 채움
    if (result.name) setValue('name', result.name);
    if (result.roastery_name) setValue('roastery_name', result.roastery_name);
    if (result.roast_level) setValue('roast_level', result.roast_level);
    if (result.bean_type) setValue('bean_type', result.bean_type);
    if (result.weight_g) setValue('weight_g', result.weight_g);
    if (result.price) setValue('price', result.price);
    if (result.cup_notes?.length) setValue('cup_notes', result.cup_notes);

    setConfidence(result.confidence);
  } catch {
    Alert.alert('분석 실패', 'AI 분석에 실패했습니다. 직접 입력해주세요.');
  }
  setPhase('form');
};
```

### add.tsx 변경

```typescript
const handleSubmit = async (data: BeanFormData) => {
  let imageUrl: string | null = null;
  if (imageUri) {
    imageUrl = await uploadBeanImage(imageUri, user.id);
  }
  await createBeanMutation.mutateAsync(
    normalizeInput({ ...data, image_url: imageUrl }),
  );
};
```

---

## 파일 변경 요약

| 파일 | 작업 | 설명 |
|------|------|------|
| `supabase/migrations/20260218_bean_images_storage.sql` | Create | Storage 버킷 + RLS |
| `supabase/functions/extract-bean-info/index.ts` | Create | Gemini AI Edge Function |
| `lib/storage/beanImage.ts` | Create | Storage 업로드 유틸 |
| `lib/api/beanAnalysis.ts` | Create | Edge Function 호출 API |
| `components/beans/BeanForm.tsx` | Modify | analyzing phase 연결, confidence state 승격 |
| `app/beans/add.tsx` | Modify | 제출 시 이미지 업로드 추가 |

**새 의존성:**
- `base64-arraybuffer` (Supabase Storage 업로드용)
- `expo-file-system` (이미 Expo SDK에 포함)

---

## 향후 확장 (이 설계 범위 밖)

- 이미지 리사이징/압축 (클라이언트 또는 Edge Function에서)
- 기존 원두의 이미지 변경 기능 (수정 화면)
- 이미지 삭제 시 Storage 파일도 함께 삭제
