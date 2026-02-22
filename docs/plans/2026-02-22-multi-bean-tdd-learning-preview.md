# TDD 미리보기: Bean Multi-Image Analysis (Learning Mode)

## 전체 TDD 사이클 개요

```
Phase 1: SCAFFOLD  — 타입/인터페이스 정의
Phase 2: RED       — 실패하는 테스트 작성
Phase 3: GREEN     — 최소 구현으로 통과
Phase 4: REFACTOR  — 개선 (테스트 유지)
Phase 5: COVERAGE  — 80%+ 확인
```

계획서의 6단계를 TDD 관점으로 재구성하면 **4개의 TDD 사이클**로 나뉩니다:

| TDD 사이클 | 대상 | 테스트 파일 |
|---|---|---|
| Cycle 1 | 타입 + Validation | `__tests__/validation/beanImageSchema.test.ts` |
| Cycle 2 | Storage 레이어 | `__tests__/storage/beanImage.test.ts` |
| Cycle 3 | API 레이어 | `__tests__/api/beanAnalysis.test.ts`, `__tests__/api/beans.test.ts` |
| Cycle 4 | Hooks | `__tests__/hooks/useBeanAnalysis.test.ts` |

> DB 마이그레이션, Edge Function, UI 컴포넌트는 TDD 범위에서 제외합니다 (SQL은 Supabase 테스트, UI는 수동/E2E).

---

## Cycle 1: 타입 + Validation (SCAFFOLD → RED → GREEN)

### SCAFFOLD — 인터페이스 정의

```typescript
// types/bean.ts — 변경 예정 부분
interface BeanImage {
  id: string;
  bean_id: string;
  user_id: string;
  image_url: string;
  storage_path: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

// Bean 인터페이스에서:
// - image_url: string | null  ← 제거
// + images: BeanImage[]       ← 추가

// lib/validation/beanSchema.ts — 추가 예정
type EncodedImageData = { base64: string; mimeType: string };
```

### RED — 실패 테스트 먼저 작성

```typescript
// __tests__/validation/beanImageSchema.test.ts

import { beanFormSchema } from '@/lib/validation/beanSchema';

describe('beanFormSchema (멀티 이미지 전환 후)', () => {
  it('image_url 필드 없이도 유효성 검사를 통과한다', () => {
    const result = beanFormSchema.safeParse({
      name: '에티오피아 예가체프',
      bean_type: 'single_origin',
      weight_g: 200,
      cup_notes: ['꽃향', '시트러스'],
    });

    expect(result.success).toBe(true);
    // image_url이 스키마에서 완전히 제거되었는지 확인
    if (result.success) {
      expect(result.data).not.toHaveProperty('image_url');
    }
  });
});
```

> **Insight**: 여기서 **테스트가 먼저** 작성됩니다. 현재 `beanFormSchema`에는 `image_url` 관련 필드가 없지만, `CreateBeanInput`에는 `image_url?: string | null`이 있습니다. TDD에서는 이 테스트가 "이미 통과할 수도 있는" 상태인지 확인하고, 통과하지 않으면 구현을 진행합니다.

### GREEN — 타입 수정으로 통과시키기

`types/bean.ts`에서 `Bean.image_url` 제거, `Bean.images` 추가, `CreateBeanInput`에서 `image_url` 제거 → 테스트 통과 + `pnpm run type-check` 통과 확인.

---

## Cycle 2: Storage 레이어 (핵심 비즈니스 로직)

### RED — 실패 테스트

```typescript
// __tests__/storage/beanImage.test.ts

import { uploadBeanImages, deleteBeanImagesByPaths } from '@/lib/storage/beanImage';

// Supabase 모킹
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    storage: {
      from: jest.fn(),
    },
  },
}));

describe('uploadBeanImages', () => {
  it('3장 이미지를 병렬 업로드하고 결과를 반환한다', async () => {
    // Arrange
    const images = [
      { base64: 'base64data1', mimeType: 'image/jpeg' },
      { base64: 'base64data2', mimeType: 'image/jpeg' },
      { base64: 'base64data3', mimeType: 'image/png' },
    ];
    const userId = 'user-123';
    const beanId = 'bean-456';

    // 모든 업로드 성공 모킹
    mockUploadSuccess();

    // Act
    const result = await uploadBeanImages(images, userId, beanId);

    // Assert
    expect(result).toHaveLength(3);
    for (const item of result) {
      expect(item).toHaveProperty('publicUrl');
      expect(item).toHaveProperty('storagePath');
    }
  });

  it('일부 업로드 실패 시 에러를 throw한다', async () => {
    const images = [
      { base64: 'data1', mimeType: 'image/jpeg' },
      { base64: 'data2', mimeType: 'image/jpeg' },
    ];

    // 두 번째 업로드 실패 모킹
    mockUploadFailureOnSecond();

    await expect(
      uploadBeanImages(images, 'user-123', 'bean-456')
    ).rejects.toThrow();
  });
});

describe('deleteBeanImagesByPaths', () => {
  it('주어진 경로의 이미지를 모두 삭제한다', async () => {
    const paths = ['user-123/img1.jpg', 'user-123/img2.jpg'];

    mockDeleteSuccess();

    await expect(
      deleteBeanImagesByPaths(paths)
    ).resolves.not.toThrow();
  });

  it('빈 배열이면 삭제를 시도하지 않는다', async () => {
    const removeSpy = mockDeleteSuccess();

    await deleteBeanImagesByPaths([]);

    expect(removeSpy).not.toHaveBeenCalled();
  });
});
```

> **Insight**: 현재 `uploadBeanImage`는 단일 이미지 업로드 후 실패 시 `null`을 반환하는 **silent failure** 패턴입니다. 멀티 이미지 버전에서는 계획서의 **all-or-nothing** 정책에 따라 에러를 throw하도록 변경해야 합니다. 이것이 바로 TDD가 설계 결정을 강제하는 좋은 예입니다 — 테스트에서 `rejects.toThrow()`를 먼저 작성함으로써 에러 정책이 확정됩니다.

### GREEN — 최소 구현

```typescript
// lib/storage/beanImage.ts — 변경 예정

export async function uploadBeanImages(
  images: EncodedImageData[],
  userId: string,
  beanId: string,
): Promise<Array<{ publicUrl: string; storagePath: string }>> {
  const results: Array<{ publicUrl: string; storagePath: string }> = [];

  try {
    // 병렬 업로드
    const uploads = await Promise.all(
      images.map(async (img, index) => {
        const ext = MIME_TO_EXT[img.mimeType] ?? 'jpg';
        const storagePath = `${userId}/${beanId}_${index}_${randomUUID()}.${ext}`;

        const { error } = await supabase.storage
          .from('bean-images')
          .upload(storagePath, decode(img.base64), {
            contentType: img.mimeType,
            upsert: false,
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('bean-images')
          .getPublicUrl(storagePath);

        return { publicUrl: urlData.publicUrl, storagePath };
      })
    );

    return uploads;
  } catch (error) {
    // 성공분 롤백
    if (results.length > 0) {
      await deleteBeanImagesByPaths(results.map(r => r.storagePath));
    }
    throw error;
  }
}

export async function deleteBeanImagesByPaths(paths: string[]): Promise<void> {
  if (paths.length === 0) return;

  const { error } = await supabase.storage
    .from('bean-images')
    .remove(paths);

  if (error) throw error;
}
```

### REFACTOR 후 테스트 재확인

```bash
pnpm test __tests__/storage/beanImage.test.ts
# PASS ✅
```

---

## Cycle 3: API 레이어

### RED — beanAnalysis 테스트

```typescript
// __tests__/api/beanAnalysis.test.ts

import { analyzeBeanImages } from '@/lib/api/beanAnalysis';

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

describe('analyzeBeanImages', () => {
  it('여러 이미지를 배열로 묶어 1회 호출한다', async () => {
    const images = [
      { base64: 'data1', mimeType: 'image/jpeg' as const },
      { base64: 'data2', mimeType: 'image/jpeg' as const },
    ];

    mockEdgeFunctionSuccess();

    const result = await analyzeBeanImages(images);

    // Edge Function이 1번만 호출되는지 확인
    expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
    // 배열 형태로 전송했는지 확인
    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'extract-bean-info',
      { body: { images } }
    );
    expect(result).toHaveProperty('confidence');
  });

  it('빈 배열 전송 시 에러를 throw한다', async () => {
    await expect(analyzeBeanImages([])).rejects.toThrow();
  });

  it('6장 이상 전송 시 에러를 throw한다', async () => {
    const images = Array.from({ length: 6 }, () => ({
      base64: 'data',
      mimeType: 'image/jpeg' as const,
    }));

    await expect(analyzeBeanImages(images)).rejects.toThrow();
  });
});
```

### RED — beans API (RPC) 테스트

```typescript
// __tests__/api/beans.test.ts

import { BeanAPI } from '@/lib/api/beans';

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

describe('BeanAPI.createBeanWithImages', () => {
  it('RPC create_bean_with_images를 호출하고 bean+images를 반환한다', async () => {
    const beanInput = {
      name: '에티오피아 예가체프',
      bean_type: 'single_origin' as const,
      weight_g: 200,
      cup_notes: ['꽃향'],
    };
    const imageInputs = [
      { image_url: 'https://...', storage_path: 'user/img1.jpg', sort_order: 0, is_primary: true },
      { image_url: 'https://...', storage_path: 'user/img2.jpg', sort_order: 1, is_primary: false },
    ];

    mockRpcSuccess();

    const result = await BeanAPI.createBeanWithImages(
      'bean-uuid', beanInput, imageInputs, 'user-123'
    );

    expect(supabase.rpc).toHaveBeenCalledWith('create_bean_with_images', {
      p_bean_id: 'bean-uuid',
      p_bean: expect.objectContaining({ name: '에티오피아 예가체프' }),
      p_images: expect.arrayContaining([
        expect.objectContaining({ is_primary: true }),
      ]),
    });
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('images');
  });

  it('RPC 실패 시 에러를 throw한다', async () => {
    mockRpcFailure();

    await expect(
      BeanAPI.createBeanWithImages('id', {}, [], 'user')
    ).rejects.toThrow();
  });
});
```

> **Insight**: `BeanAPI`가 현재 static 메서드 클래스 패턴을 사용하고 있어, 새 `createBeanWithImages` 메서드도 같은 패턴으로 추가됩니다. 기존 `createBean`은 현재 직접 `.insert()`를 쓰지만, 새 메서드는 `supabase.rpc()`를 사용합니다. 테스트에서 이 차이를 명확히 드러내는 것이 중요합니다.

---

## Cycle 4: useBeanAnalysis Hook

### RED — 멀티 이미지 분석 훅 테스트

```typescript
// __tests__/hooks/useBeanAnalysis.test.ts

import { renderHook, act } from '@testing-library/react-native';
import { useBeanAnalysis } from '@/hooks/useBeanAnalysis';

jest.mock('expo-image-manipulator');
jest.mock('@/lib/api/beanAnalysis');

describe('useBeanAnalysis (멀티 이미지)', () => {
  it('여러 URI를 인코딩 후 배열로 분석 API를 호출한다', async () => {
    const { result } = renderHook(() => useBeanAnalysis());

    await act(async () => {
      await result.current.analyze(['uri1.jpg', 'uri2.jpg']);
    });

    // analyzeBeanImages가 2장 배열로 1회 호출되는지 확인
    expect(analyzeBeanImages).toHaveBeenCalledTimes(1);
    expect(analyzeBeanImages).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ mimeType: 'image/jpeg' }),
        expect.objectContaining({ mimeType: 'image/jpeg' }),
      ])
    );
  });

  it('분석 중 isAnalyzing이 true가 된다', async () => {
    const { result } = renderHook(() => useBeanAnalysis());

    expect(result.current.isAnalyzing).toBe(false);

    let analyzePromise: Promise<unknown>;
    act(() => {
      analyzePromise = result.current.analyze(['uri1.jpg']);
    });

    expect(result.current.isAnalyzing).toBe(true);

    await act(async () => {
      await analyzePromise;
    });

    expect(result.current.isAnalyzing).toBe(false);
  });

  it('인코딩된 imageData 배열을 보관한다', async () => {
    const { result } = renderHook(() => useBeanAnalysis());

    await act(async () => {
      await result.current.analyze(['uri1.jpg', 'uri2.jpg', 'uri3.jpg']);
    });

    expect(result.current.imageDataList).toHaveLength(3);
    for (const data of result.current.imageDataList) {
      expect(data).toHaveProperty('base64');
      expect(data).toHaveProperty('mimeType');
    }
  });
});
```

---

## 전체 TDD 실행 흐름 요약

```
┌─────────────────────────────────────────────────────────┐
│                   TDD 실행 순서                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Step 0: DB 마이그레이션 (SQL, TDD 범위 밖)              │
│          → bean_images 테이블 + RPC 생성                 │
│          → beans.image_url 컬럼 제거                     │
│                                                         │
│  Step 1: 🔴 RED — 타입/Validation 테스트 작성            │
│          → __tests__/validation/beanImageSchema.test.ts  │
│          → pnpm test → FAIL ❌                           │
│                                                         │
│  Step 2: 🟢 GREEN — types/bean.ts 수정                  │
│          → BeanImage 타입 추가, image_url 제거           │
│          → pnpm test → PASS ✅                           │
│          → pnpm run type-check → 여기서 다수 에러 발생   │
│            (image_url 사용처 전부 깨짐 — 이것이 의도)    │
│                                                         │
│  Step 3: 🔴 RED — Storage 레이어 테스트 작성             │
│          → __tests__/storage/beanImage.test.ts           │
│          → uploadBeanImages, deleteBeanImagesByPaths     │
│          → pnpm test → FAIL ❌ (함수가 아직 없음)        │
│                                                         │
│  Step 4: 🟢 GREEN — lib/storage/beanImage.ts 구현       │
│          → 병렬 업로드 + 롤백 로직                       │
│          → pnpm test → PASS ✅                           │
│                                                         │
│  Step 5: 🔴 RED — API 레이어 테스트 작성                 │
│          → __tests__/api/beanAnalysis.test.ts            │
│          → __tests__/api/beans.test.ts                   │
│          → pnpm test → FAIL ❌                           │
│                                                         │
│  Step 6: 🟢 GREEN — API 함수 구현                       │
│          → analyzeBeanImages() 배열 전송                 │
│          → BeanAPI.createBeanWithImages() RPC 호출       │
│          → pnpm test → PASS ✅                           │
│                                                         │
│  Step 7: 🔴 RED — Hook 테스트 작성                       │
│          → __tests__/hooks/useBeanAnalysis.test.ts       │
│          → pnpm test → FAIL ❌                           │
│                                                         │
│  Step 8: 🟢 GREEN — useBeanAnalysis 훅 수정             │
│          → 단일 URI → 배열 URI 지원                      │
│          → imageData → imageDataList 배열                │
│          → pnpm test → PASS ✅                           │
│                                                         │
│  Step 9: 🔧 REFACTOR — 전체 정리                        │
│          → pnpm run type-check → PASS ✅                 │
│          → pnpm test --coverage → 80%+ ✅                │
│                                                         │
│  Step 10: UI 컴포넌트 작업 (TDD 범위 밖, 수동 QA)       │
│          → BeanForm, BeanCard, BeanDetail 수정           │
│          → Edge Function 멀티 이미지 계약 반영           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 사용자 기여 요청 포인트

TDD 진행 시 **의미 있는 설계 결정이 필요한 3곳**에서 사용자 코드 기여를 요청하게 됩니다:

| 위치 | 결정 사항 | 왜 중요한가 |
|---|---|---|
| `uploadBeanImages`의 롤백 로직 | 실패 시 성공분 삭제를 `Promise.allSettled`로 할지, 순차 삭제할지 | 부분 삭제 실패 시 orphan 파일 정책 |
| `analyzeBeanImages`의 입력 검증 | 클라이언트에서 1~5장 검증을 할지, Edge Function에만 맡길지 | 불필요한 네트워크 호출 방지 vs 중복 검증 |
| `useBeanAnalysis.analyze`의 순차 인코딩 | `Promise.all` 병렬 인코딩 vs `for...of` 순차 인코딩 | 메모리 스파이크 방지(계획서: 순차) vs 속도 |

---

## 필요한 테스트 의존성

현재 `jest-expo`와 `jest.config.js`가 이미 설정되어 있습니다. 추가로 필요한 것:

```bash
# Hook 테스트용 (아직 없다면)
pnpm add -D @testing-library/react-native
```
