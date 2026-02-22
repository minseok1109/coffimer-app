# TDD 미리보기: Bean Multi-Image Analysis

## 전체 TDD 사이클 개요

계획서의 6단계 실행 순서를 기준으로, **테스트 가능한 클라이언트 코드** 중심으로 TDD 사이클을 구성한다.

> 이 프로젝트는 이미 Jest + jest-expo 기반 테스트 환경이 갖춰져 있고, `__tests__/validation/authSchema.test.ts` 같은 Zod 스키마 검증 테스트 패턴이 확립되어 있다. TDD를 적용할 인프라는 준비 완료 상태.

```
Phase 1: 타입 + Validation (순수 로직, 테스트 최적)
Phase 2: Storage 유틸리티 (All-or-Nothing 롤백 로직)
Phase 3: API 함수 (analyzeBeanImages, createBeanWithImages)
Phase 4: Hooks (useBeanAnalysis, useImageCapture)
Phase 5: UI 컴포넌트 (BeanForm, BeanCard, BeanDetail)
```

---

## Phase 1: 타입 + Validation 스키마

### RED - 테스트 먼저 작성

```typescript
// __tests__/validation/beanImageSchema.test.ts

import { encodedImageSchema, beanImagesInputSchema } from '@/lib/validation/beanSchema';

describe('Bean Image Validation', () => {
  describe('encodedImageSchema', () => {
    it('유효한 이미지 데이터를 수락한다', () => {
      const result = encodedImageSchema.safeParse({
        base64: 'iVBORw0KGgo...',
        mimeType: 'image/jpeg',
      });
      expect(result.success).toBe(true);
    });

    it('빈 base64를 거부한다', () => {
      const result = encodedImageSchema.safeParse({
        base64: '',
        mimeType: 'image/jpeg',
      });
      expect(result.success).toBe(false);
    });

    it('지원하지 않는 mimeType을 거부한다', () => {
      const result = encodedImageSchema.safeParse({
        base64: 'data...',
        mimeType: 'image/gif',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('beanImagesInputSchema', () => {
    it('1~5장 이미지 배열을 수락한다', () => {
      const images = Array.from({ length: 3 }, () => ({
        base64: 'data...',
        mimeType: 'image/jpeg',
      }));
      const result = beanImagesInputSchema.safeParse(images);
      expect(result.success).toBe(true);
    });

    it('빈 배열을 거부한다', () => {
      const result = beanImagesInputSchema.safeParse([]);
      expect(result.success).toBe(false);
    });

    it('6장 이상을 거부한다', () => {
      const images = Array.from({ length: 6 }, () => ({
        base64: 'data...',
        mimeType: 'image/jpeg',
      }));
      const result = beanImagesInputSchema.safeParse(images);
      expect(result.success).toBe(false);
    });
  });
});
```

### Verify RED - 실패 확인

```bash
$ pnpm test __tests__/validation/beanImageSchema.test.ts

FAIL  __tests__/validation/beanImageSchema.test.ts
  ● Cannot find module '@/lib/validation/beanSchema'
    → encodedImageSchema, beanImagesInputSchema가 아직 없으므로 실패
```

### GREEN - 최소 구현

```typescript
// lib/validation/beanSchema.ts에 추가

export const encodedImageSchema = z.object({
  base64: z.string().min(1, '이미지 데이터가 필요합니다'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});

export type EncodedImageData = z.infer<typeof encodedImageSchema>;

export const beanImagesInputSchema = z
  .array(encodedImageSchema)
  .min(1, '최소 1장의 이미지가 필요합니다')
  .max(5, '최대 5장까지 가능합니다');
```

### Verify GREEN

```bash
$ pnpm test __tests__/validation/beanImageSchema.test.ts

PASS  ✓ 6 tests passed
```

---

## Phase 2: Storage 유틸리티 (핵심 - All-or-Nothing 로직)

> 이 부분이 TDD의 진가가 드러나는 곳이다. 현재 `uploadBeanImage`는 단일 파일 업로드 + 실패 시 `null` 반환이지만, 새로운 `uploadBeanImages`는 **부분 실패 시 성공분 롤백**이라는 복잡한 정책이 필요하다. 테스트를 먼저 작성하면 이 롤백 동작을 정확히 명세할 수 있다.

### RED - 실패/롤백 시나리오 테스트

```typescript
// __tests__/storage/beanImage.test.ts

import { uploadBeanImages, deleteBeanImagesByPaths } from '@/lib/storage/beanImage';

// Supabase는 mock
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    storage: {
      from: jest.fn(),
    },
  },
}));

describe('uploadBeanImages', () => {
  it('모든 이미지 업로드 성공 시 URL과 path 배열을 반환한다', async () => {
    // mock setup: 3장 모두 성공
    const result = await uploadBeanImages(
      [
        { base64: 'img1', mimeType: 'image/jpeg' },
        { base64: 'img2', mimeType: 'image/jpeg' },
        { base64: 'img3', mimeType: 'image/jpeg' },
      ],
      'user-123',
    );

    expect(result.success).toBe(true);
    expect(result.uploaded).toHaveLength(3);
    for (const item of result.uploaded) {
      expect(item).toHaveProperty('publicUrl');
      expect(item).toHaveProperty('storagePath');
    }
  });

  it('일부 업로드 실패 시 성공분을 삭제하고 에러를 반환한다', async () => {
    // mock setup: 2번째 이미지에서 실패
    const result = await uploadBeanImages(
      [
        { base64: 'img1', mimeType: 'image/jpeg' },
        { base64: 'FAIL', mimeType: 'image/jpeg' },
        { base64: 'img3', mimeType: 'image/jpeg' },
      ],
      'user-123',
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    // 핵심: 성공한 파일의 삭제가 호출되었는지 검증
    expect(deleteBeanImagesByPaths).toHaveBeenCalled();
  });
});

describe('deleteBeanImagesByPaths', () => {
  it('주어진 경로의 파일들을 삭제한다', async () => {
    await deleteBeanImagesByPaths(['user-123/abc.jpg', 'user-123/def.jpg']);
    // supabase.storage.from('bean-images').remove() 호출 검증
  });
});
```

### Verify RED

```bash
$ pnpm test __tests__/storage/beanImage.test.ts

FAIL
  ● uploadBeanImages is not a function
  ● deleteBeanImagesByPaths is not a function
```

### GREEN - 최소 구현

```typescript
// lib/storage/beanImage.ts 수정

type UploadResult =
  | { success: true; uploaded: Array<{ publicUrl: string; storagePath: string }> }
  | { success: false; error: string };

export async function uploadBeanImages(
  images: Array<{ base64: string; mimeType: string }>,
  userId: string,
): Promise<UploadResult> {
  const uploaded: Array<{ publicUrl: string; storagePath: string }> = [];

  for (const image of images) {
    const ext = MIME_TO_EXT[image.mimeType] ?? 'jpg';
    const storagePath = `${userId}/${randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from('bean-images')
      .upload(storagePath, decode(image.base64), {
        contentType: image.mimeType,
        upsert: false,
      });

    if (error) {
      // 롤백: 이미 업로드된 파일 삭제
      if (uploaded.length > 0) {
        await deleteBeanImagesByPaths(uploaded.map((u) => u.storagePath));
      }
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from('bean-images')
      .getPublicUrl(storagePath);

    uploaded.push({ publicUrl: urlData.publicUrl, storagePath });
  }

  return { success: true, uploaded };
}

export async function deleteBeanImagesByPaths(paths: string[]): Promise<void> {
  await supabase.storage.from('bean-images').remove(paths);
}
```

### Verify GREEN → REFACTOR

테스트 통과 후 기존 `uploadBeanImage` (단일) 함수를 정리할지 결정한다.

---

## Phase 3: API 함수

### RED - analyzeBeanImages 테스트

```typescript
// __tests__/api/beanAnalysis.test.ts

import { analyzeBeanImages } from '@/lib/api/beanAnalysis';

jest.mock('@/lib/supabaseClient');

describe('analyzeBeanImages', () => {
  it('이미지 배열을 Edge Function에 전송하고 AIExtractionResult를 반환한다', async () => {
    // mock: supabase.functions.invoke 성공
    const result = await analyzeBeanImages([
      { base64: 'img1', mimeType: 'image/jpeg' },
      { base64: 'img2', mimeType: 'image/png' },
    ]);

    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('confidence');
  });

  it('Edge Function 오류 시 적절한 에러를 throw한다', async () => {
    // mock: invoke가 error 반환
    await expect(
      analyzeBeanImages([{ base64: 'bad', mimeType: 'image/jpeg' }]),
    ).rejects.toThrow();
  });
});
```

### RED - createBeanWithImages (RPC 호출) 테스트

```typescript
// __tests__/api/beans.test.ts

import { BeanAPI } from '@/lib/api/beans';

describe('BeanAPI.createBeanWithImages', () => {
  it('RPC를 통해 bean과 images를 원자적으로 생성한다', async () => {
    const bean = await BeanAPI.createBeanWithImages(
      'bean-uuid',
      {
        name: '에티오피아 예가체프',
        bean_type: 'single_origin',
        weight_g: 200,
        cup_notes: ['꽃향', '시트러스'],
      },
      [
        {
          image_url: 'https://...',
          storage_path: 'user/abc.jpg',
          sort_order: 0,
          is_primary: true,
        },
      ],
      'user-123',
    );

    expect(bean).toHaveProperty('id');
    expect(bean).toHaveProperty('images');
  });

  it('RPC 실패 시 에러를 throw한다', async () => {
    // mock: supabase.rpc 실패
    await expect(
      BeanAPI.createBeanWithImages('id', { /* ... */ }, [], 'user'),
    ).rejects.toThrow();
  });
});
```

---

## Phase 4: Hooks (useBeanAnalysis)

> React Hook 테스트는 `@testing-library/react-native`의 `renderHook`을 사용한다. 이미 devDependencies에 `@testing-library/react-native`가 있어 바로 사용 가능하다. Hook은 비즈니스 로직의 핵심이므로 TDD 효과가 극대화되는 영역이다.

### RED - useBeanAnalysis 배열 분석 테스트

```typescript
// __tests__/hooks/useBeanAnalysis.test.ts

import { renderHook, act } from '@testing-library/react-native';
import { useBeanAnalysis } from '@/hooks/useBeanAnalysis';

jest.mock('@/lib/api/beanAnalysis');

describe('useBeanAnalysis (멀티 이미지)', () => {
  it('배열 이미지를 한 번의 API 호출로 분석한다', async () => {
    const { result } = renderHook(() => useBeanAnalysis());

    await act(async () => {
      await result.current.analyzeImages([
        { base64: 'img1', mimeType: 'image/jpeg' },
        { base64: 'img2', mimeType: 'image/jpeg' },
      ]);
    });

    // analyzeBeanImages가 1회만 호출되었는지 확인
    expect(analyzeBeanImages).toHaveBeenCalledTimes(1);
    expect(result.current.extractionResult).toBeDefined();
  });

  it('인코딩된 이미지 데이터를 배열로 보관한다', async () => {
    const { result } = renderHook(() => useBeanAnalysis());

    await act(async () => {
      await result.current.analyzeImages([
        { base64: 'img1', mimeType: 'image/jpeg' },
        { base64: 'img2', mimeType: 'image/png' },
      ]);
    });

    expect(result.current.encodedImages).toHaveLength(2);
  });

  it('분석 실패 시 에러 상태를 설정한다', async () => {
    // mock: analyzeBeanImages가 throw
    const { result } = renderHook(() => useBeanAnalysis());

    await act(async () => {
      await result.current.analyzeImages([
        { base64: 'bad', mimeType: 'image/jpeg' },
      ]);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.extractionResult).toBeNull();
  });
});
```

---

## Phase 5: 타입 변경 (BeanImage)

### RED - Bean 타입에 images 필드 존재 확인

```typescript
// __tests__/types/bean.test.ts

import type { Bean, BeanImage } from '@/types/bean';

describe('Bean 타입', () => {
  it('images 필드가 BeanImage[] 타입이다', () => {
    const bean: Bean = {
      id: '1',
      name: 'test',
      images: [
        {
          id: 'img-1',
          bean_id: '1',
          user_id: 'u1',
          image_url: 'https://...',
          storage_path: 'u1/abc.jpg',
          sort_order: 0,
          is_primary: true,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
      ],
      // ... 나머지 필드
    } as Bean;

    expect(bean.images).toHaveLength(1);
    expect(bean.images[0].is_primary).toBe(true);
  });

  it('image_url 필드가 더 이상 존재하지 않는다', () => {
    const bean = {} as Bean;
    // TypeScript 컴파일 타임에 image_url 접근이 에러 → type-check로 검증
    expect('image_url' in bean).toBe(false);
  });
});
```

---

## TDD 사이클 순서 요약

| 단계 | RED (테스트) | GREEN (구현) |
|------|-------------|-------------|
| 1. 타입 | BeanImage 타입 테스트, EncodedImageData 검증 | `types/bean.ts` 수정, `beanSchema.ts` 추가 |
| 2. Storage | uploadBeanImages 성공, 부분실패 → 롤백 검증 | `beanImage.ts` 리팩터, `deleteBeanImagesByPaths` |
| 3. API | analyzeBeanImages 성공, createBeanWithImages | `beanAnalysis.ts` 수정, `beans.ts` RPC 추가 |
| 4. Hooks | useBeanAnalysis 배열, useImageCapture 다중 | `useBeanAnalysis.ts` 수정, `useImageCapture.ts` 수정 |
| 5. UI | BeanForm 다중 이미지, BeanCard 대표 이미지, BeanDetail 갤러리 | `BeanForm.tsx` 수정, `BeanCard.tsx` 수정, `BeanDetail.tsx` 수정 |
| 6. 통합 | add.tsx 플로우 E2E | 전체 연결 + 회귀 검증 |

---

## 테스트 파일 구조 (생성 예정)

```
__tests__/
├── validation/
│   ├── authSchema.test.ts          ← 기존
│   └── beanImageSchema.test.ts     ← NEW
├── storage/
│   └── beanImage.test.ts           ← NEW
├── api/
│   ├── beanAnalysis.test.ts        ← NEW
│   └── beans.test.ts               ← NEW
├── hooks/
│   ├── useBeanAnalysis.test.ts     ← NEW
│   └── useImageCapture.test.ts     ← NEW
└── types/
    └── bean.test.ts                ← NEW
```

---

## 핵심 포인트

1. **가장 가치 있는 TDD 대상**: `uploadBeanImages`의 all-or-nothing 롤백 로직. 수동 테스트로는 "2번째 파일만 실패"하는 시나리오를 재현하기 어렵지만, 테스트에서는 mock으로 정확히 재현 가능하다.

2. **타입 테스트의 이중 검증**: `pnpm run type-check`로 컴파일 타임 검증 + Jest로 런타임 검증을 병행한다. `Bean.image_url` 제거는 type-check만으로도 전체 코드베이스에서 사용처를 잡아낸다.

3. **DB/Edge Function은 TDD 범위 밖**: SQL 마이그레이션과 Edge Function은 Supabase CLI 테스트나 수동 시나리오로 검증한다. 클라이언트 TDD는 이들을 mock 경계로 취급한다.

---

## 각 Phase 진행 방식

각 Phase마다 아래 사이클을 반복한다:

1. **RED** - 테스트 작성 → `pnpm test` 실패 확인
2. **GREEN** - 최소 코드 작성 → `pnpm test` 통과 확인
3. **REFACTOR** - 정리 → `pnpm test` + `pnpm run type-check` 통과 확인
