# TDD Workflow 적용 미리보기: Bean Multi-Image Analysis

## 전체 TDD 사이클 요약

계획서의 **6단계 실행 순서**를 TDD로 매핑하면 다음과 같습니다:

```
단계 1: DB 마이그레이션 + RPC + 타입          → 타입 테스트 + SQL 검증 쿼리
단계 2: Edge Function 멀티 이미지 계약        → Edge Function 유닛 테스트
단계 3: 클라이언트 API/스토리지/훅 전환       → 핵심 비즈니스 로직 테스트 ⭐
단계 4: Add 화면 멀티 이미지 저장 플로우      → 통합 플로우 테스트
단계 5: List/Detail 갤러리 반영              → UI 렌더 테스트
단계 6: 테스트/검증/QA                       → 회귀 + type-check
```

---

## 단계 1: DB/타입 — RED → GREEN → REFACTOR

### RED: 먼저 작성할 테스트 파일

**`__tests__/types/beanImage.test.ts`** — 타입 계약 검증

```typescript
import type { Bean, BeanImage } from '@/types/bean';

describe('BeanImage 타입 계약', () => {
  it('BeanImage는 필수 필드를 모두 포함한다', () => {
    const image: BeanImage = {
      id: 'uuid-1',
      bean_id: 'bean-uuid',
      user_id: 'user-uuid',
      image_url: 'https://example.com/img.jpg',
      storage_path: 'user-uuid/file.jpg',
      sort_order: 0,
      is_primary: true,
      created_at: '2026-02-22T00:00:00Z',
      updated_at: '2026-02-22T00:00:00Z',
    };

    expect(image.sort_order).toBeGreaterThanOrEqual(0);
    expect(image.sort_order).toBeLessThanOrEqual(4);
    expect(image.is_primary).toBe(true);
  });

  it('Bean에서 image_url이 제거되고 images 배열이 존재한다', () => {
    const bean: Bean = {
      id: 'uuid',
      name: 'Test Bean',
      // ... 기타 필드
      images: [],  // ← 새 필드
      // image_url 없음 ← 제거됨
    } as Bean;

    expect(bean).toHaveProperty('images');
    expect(bean).not.toHaveProperty('image_url');
  });
});
```

이 시점에서 `pnpm test`를 실행하면 → **BeanImage 타입이 없으므로 컴파일 에러 (RED)**

### GREEN: 타입 구현

```typescript
// types/bean.ts에 추가
export interface BeanImage {
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

// Bean 인터페이스 변경
export interface Bean {
  // ... 기존 필드
  images: BeanImage[];  // 추가
  // image_url 제거
}
```

테스트 다시 실행 → **GREEN**

### 병행: DB 마이그레이션 SQL은 계획서의 검증 쿼리를 수동 확인으로 처리

```sql
-- supabase/migrations/<timestamp>_bean_images.sql
-- 계획서의 CREATE TABLE, 인덱스, 트리거, RLS 그대로 적용
-- 수동 검증: is_primary 중복, sort_order 중복, 6장 초과 차단 등
```

---

## 단계 2: Edge Function — RED → GREEN → REFACTOR

### RED: 먼저 작성할 테스트

**`__tests__/api/beanAnalysis.test.ts`**

```typescript
import { analyzeBeanImages } from '@/lib/api/beanAnalysis';

// Supabase 모킹
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

import { supabase } from '@/lib/supabaseClient';
const mockInvoke = supabase.functions.invoke as jest.Mock;

describe('analyzeBeanImages (멀티 이미지)', () => {
  const singleImage = [{ base64: 'dGVzdA==', mimeType: 'image/jpeg' as const }];
  const threeImages = Array.from({ length: 3 }, () => ({
    base64: 'dGVzdA==',
    mimeType: 'image/jpeg' as const,
  }));

  it('이미지 배열을 Edge Function에 1회 전송한다', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { success: true, data: { name: 'Test Bean', confidence: {} } },
      error: null,
    });

    await analyzeBeanImages(threeImages);

    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(mockInvoke).toHaveBeenCalledWith('extract-bean-info', {
      body: { images: threeImages },
    });
  });

  it('1장/3장/5장 정상 입력을 처리한다', async () => {
    for (const count of [1, 3, 5]) {
      mockInvoke.mockResolvedValueOnce({
        data: { success: true, data: { name: `Bean ${count}`, confidence: {} } },
        error: null,
      });
      const images = Array.from({ length: count }, () => singleImage[0]);
      const result = await analyzeBeanImages(images);
      expect(result.name).toBe(`Bean ${count}`);
    }
  });

  it('빈 배열 입력 시 에러를 던진다', async () => {
    await expect(analyzeBeanImages([])).rejects.toThrow();
  });

  it('Edge Function 에러 시 에러를 전파한다', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: new Error('Function error'),
    });

    await expect(analyzeBeanImages(singleImage)).rejects.toThrow('Function error');
  });

  it('success=false 응답 시 에러를 던진다', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { success: false, error: 'LLM timeout' },
      error: null,
    });

    await expect(analyzeBeanImages(singleImage)).rejects.toThrow('LLM timeout');
  });
});
```

이 시점 → **`analyzeBeanImages` 함수가 없으므로 RED**

### GREEN: 구현

```typescript
// lib/api/beanAnalysis.ts — 기존 함수 대체
import type { AIExtractionResult } from '@/types/bean';
import type { EncodedImageData } from '@/lib/validation/beanSchema';
import { supabase } from '@/lib/supabaseClient';

export async function analyzeBeanImages(
  images: EncodedImageData[],
): Promise<AIExtractionResult> {
  if (images.length === 0) throw new Error('최소 1장의 이미지가 필요합니다');

  const { data, error } = await supabase.functions.invoke('extract-bean-info', {
    body: { images },
  });

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error ?? 'Analysis failed');

  return data.data as AIExtractionResult;
}
```

테스트 실행 → **GREEN**

---

## 단계 3: 스토리지/업로드 — 핵심 비즈니스 로직 ⭐

> 이 단계가 TDD에서 **가장 가치가 높은 부분**입니다. All-or-Nothing 롤백 로직은 여러 실패 시나리오가 존재하고, 한 번 놓치면 프로덕션에서 orphaned 파일이 쌓이게 됩니다. 테스트가 이 복잡한 분기를 먼저 정의하므로, 구현 시 빠트릴 수 없습니다.

### RED: 먼저 작성할 테스트

**`__tests__/storage/beanImage.test.ts`**

```typescript
import {
  uploadBeanImages,
  deleteBeanImagesByPaths,
} from '@/lib/storage/beanImage';

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn(),
      })),
    },
  },
}));

import { supabase } from '@/lib/supabaseClient';

describe('uploadBeanImages (All-or-Nothing)', () => {
  const mockImages = [
    { base64: 'img1==', mimeType: 'image/jpeg' },
    { base64: 'img2==', mimeType: 'image/png' },
    { base64: 'img3==', mimeType: 'image/jpeg' },
  ];

  it('전체 업로드 성공 시 URL과 path 배열을 반환한다', async () => {
    // ... mock 설정
    const results = await uploadBeanImages(mockImages, 'user-id', 'bean-id');

    expect(results).toHaveLength(3);
    results.forEach((r) => {
      expect(r).toHaveProperty('publicUrl');
      expect(r).toHaveProperty('storagePath');
    });
  });

  it('일부 업로드 실패 시 성공분을 삭제하고 에러를 던진다', async () => {
    // 2번째 업로드만 실패하도록 mock 설정
    // ...

    await expect(
      uploadBeanImages(mockImages, 'user-id', 'bean-id'),
    ).rejects.toThrow();

    // 성공한 1번째 파일의 삭제가 호출되었는지 확인
    expect(deleteBeanImagesByPaths).toHaveBeenCalledWith(['user-id/uuid-1.jpg']);
  });
});

describe('deleteBeanImagesByPaths', () => {
  it('주어진 path 배열에 대해 storage.remove를 호출한다', async () => {
    // ...
    await deleteBeanImagesByPaths(['path/1.jpg', 'path/2.png']);
    expect(mockRemove).toHaveBeenCalledWith(['path/1.jpg', 'path/2.png']);
  });

  it('빈 배열 입력 시 아무것도 하지 않는다', async () => {
    await deleteBeanImagesByPaths([]);
    expect(mockRemove).not.toHaveBeenCalled();
  });
});
```

**`__tests__/api/beans.test.ts`** — RPC 호출 검증

```typescript
import { BeanAPI } from '@/lib/api/beans';

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
    })),
  },
}));

describe('BeanAPI.createBeanWithImages', () => {
  it('create_bean_with_images RPC를 올바른 파라미터로 호출한다', async () => {
    const mockRpc = supabase.rpc as jest.Mock;
    mockRpc.mockResolvedValueOnce({
      data: { id: 'bean-id', images: [/* ... */] },
      error: null,
    });

    await BeanAPI.createBeanWithImages(
      'bean-uuid',
      { name: 'Test', bean_type: 'single_origin', weight_g: 200 },
      [
        { image_url: 'url1', storage_path: 'path1', sort_order: 0, is_primary: true },
        { image_url: 'url2', storage_path: 'path2', sort_order: 1, is_primary: false },
      ],
      'user-id',
    );

    expect(mockRpc).toHaveBeenCalledWith('create_bean_with_images', {
      p_bean_id: 'bean-uuid',
      p_bean: expect.objectContaining({ name: 'Test' }),
      p_images: expect.arrayContaining([
        expect.objectContaining({ sort_order: 0, is_primary: true }),
      ]),
    });
  });

  it('RPC 실패 시 에러를 전파한다', async () => {
    const mockRpc = supabase.rpc as jest.Mock;
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: new Error('RPC failed'),
    });

    await expect(
      BeanAPI.createBeanWithImages('id', {/* ... */} as any, [], 'uid'),
    ).rejects.toThrow('RPC failed');
  });
});
```

---

## 단계 4: Add 화면 통합 플로우 — RED → GREEN → REFACTOR

### RED: 먼저 작성할 테스트

**`__tests__/hooks/useBeanAnalysis.test.ts`**

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useBeanAnalysis } from '@/hooks/useBeanAnalysis';
import { analyzeBeanImages } from '@/lib/api/beanAnalysis';

jest.mock('@/lib/api/beanAnalysis');

describe('useBeanAnalysis (멀티 이미지)', () => {
  it('배열 이미지를 인코딩 후 단일 API 호출로 분석한다', async () => {
    (analyzeBeanImages as jest.Mock).mockResolvedValueOnce({
      name: 'Extracted Bean',
      confidence: { name: 0.9 },
    });

    const { result } = renderHook(() => useBeanAnalysis());

    await act(async () => {
      await result.current.analyzeImages([
        { base64: 'img1', mimeType: 'image/jpeg' },
        { base64: 'img2', mimeType: 'image/jpeg' },
      ]);
    });

    expect(analyzeBeanImages).toHaveBeenCalledTimes(1);
    expect(result.current.extractedData?.name).toBe('Extracted Bean');
    expect(result.current.isAnalyzing).toBe(false);
  });

  it('분석 중 isAnalyzing이 true가 된다', async () => {
    // 타이밍 테스트
  });

  it('분석 실패 시 error 상태를 설정한다', async () => {
    (analyzeBeanImages as jest.Mock).mockRejectedValueOnce(
      new Error('Timeout'),
    );

    const { result } = renderHook(() => useBeanAnalysis());

    await act(async () => {
      await result.current.analyzeImages([
        { base64: 'img1', mimeType: 'image/jpeg' },
      ]);
    });

    expect(result.current.error).toBe('Timeout');
    expect(result.current.isAnalyzing).toBe(false);
  });
});
```

---

## 단계 5: List/Detail 갤러리 — RED → GREEN → REFACTOR

### RED: 먼저 작성할 테스트

**`__tests__/components/beans/BeanCard.test.tsx`**

```typescript
import { render, screen } from '@testing-library/react-native';
import { BeanCard } from '@/components/beans/BeanCard';

describe('BeanCard (대표 이미지)', () => {
  const mockBean = {
    id: '1',
    name: 'Test Bean',
    images: [
      { id: 'img1', is_primary: true, image_url: 'https://example.com/primary.jpg', sort_order: 0 },
      { id: 'img2', is_primary: false, image_url: 'https://example.com/second.jpg', sort_order: 1 },
    ],
  };

  it('대표 이미지(is_primary=true)를 렌더한다', () => {
    render(<BeanCard bean={mockBean as any} />);

    const image = screen.getByTestId('bean-card-image');
    expect(image.props.source.uri).toBe('https://example.com/primary.jpg');
  });

  it('이미지가 없을 때 placeholder를 표시한다', () => {
    const beanNoImages = { ...mockBean, images: [] };
    render(<BeanCard bean={beanNoImages as any} />);

    expect(screen.getByTestId('bean-card-placeholder')).toBeTruthy();
  });
});
```

---

## 단계 6: 회귀 테스트

**`__tests__/regression/beanBackcompat.test.ts`**

```typescript
describe('회귀 테스트', () => {
  it('이미지 없이 수동 등록이 가능하다', async () => {
    // RPC 호출 시 p_images가 빈 배열이어도 성공하는지 확인
  });

  it('type-check가 통과한다', () => {
    // 실제로는 pnpm run type-check로 CI에서 검증
    expect(true).toBe(true); // placeholder
  });
});
```

---

## 전체 TDD 사이클 시각화

```
┌─────────────────────────────────────────────────────────────┐
│                    TDD 사이클 흐름도                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 1: 타입/DB                                           │
│  ┌───────┐  ┌───────┐  ┌───────┐                           │
│  │🔴 RED │→│🟢 GREEN│→│🔵 RFCT│  beanImage.test.ts         │
│  └───────┘  └───────┘  └───────┘  + SQL 마이그레이션        │
│       ↓                                                     │
│  Phase 2: Edge Function                                     │
│  ┌───────┐  ┌───────┐  ┌───────┐                           │
│  │🔴 RED │→│🟢 GREEN│→│🔵 RFCT│  beanAnalysis.test.ts      │
│  └───────┘  └───────┘  └───────┘                            │
│       ↓                                                     │
│  Phase 3: Storage/API ⭐ (핵심 비즈니스 로직)                │
│  ┌───────┐  ┌───────┐  ┌───────┐                           │
│  │🔴 RED │→│🟢 GREEN│→│🔵 RFCT│  beanImage.test.ts         │
│  └───────┘  └───────┘  └───────┘  beans.test.ts             │
│       ↓                                                     │
│  Phase 4: 훅/플로우                                          │
│  ┌───────┐  ┌───────┐  ┌───────┐                           │
│  │🔴 RED │→│🟢 GREEN│→│🔵 RFCT│  useBeanAnalysis.test.ts   │
│  └───────┘  └───────┘  └───────┘                            │
│       ↓                                                     │
│  Phase 5: UI 컴포넌트                                        │
│  ┌───────┐  ┌───────┐  ┌───────┐                           │
│  │🔴 RED │→│🟢 GREEN│→│🔵 RFCT│  BeanCard.test.tsx         │
│  └───────┘  └───────┘  └───────┘  BeanDetail.test.tsx       │
│       ↓                                                     │
│  Phase 6: 회귀 + QA                                         │
│  ┌─────────────┐                                            │
│  │ pnpm test   │  ← 전체 테스트 + type-check                │
│  │ pnpm        │                                            │
│  │ type-check  │                                            │
│  └─────────────┘                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 생성될 테스트 파일 목록 (총 7개)

```
__tests__/
├── types/
│   └── beanImage.test.ts          ← 타입 계약 검증
├── api/
│   ├── beanAnalysis.test.ts       ← Edge Function 호출 검증
│   └── beans.test.ts              ← RPC createBeanWithImages 검증
├── storage/
│   └── beanImage.test.ts          ← 업로드/롤백 All-or-Nothing ⭐
├── hooks/
│   └── useBeanAnalysis.test.ts    ← 멀티 이미지 분석 훅
├── components/
│   └── beans/
│       ├── BeanCard.test.tsx      ← 대표 이미지 렌더
│       └── BeanDetail.test.tsx    ← 갤러리 페이징
└── regression/
    └── beanBackcompat.test.ts     ← 회귀 (수동 등록 등)
```

---

## TDD에서 "사용자 기여"가 의미 있는 지점

TDD 스킬의 관점에서, 다음 세 가지는 **여러 유효한 접근법이 존재**하여 사용자 판단이 필요합니다:

1. **업로드 롤백 전략** (`uploadBeanImages` 내부) — 실패 시 성공분 삭제를 `Promise.allSettled`로 할지, 순차 삭제할지
2. **이미지 인코딩 순서** — 메모리 스파이크 방지를 위한 순차 인코딩의 구체적 구현 (for-of vs. `p-limit` 라이브러리)
3. **RPC 실패 후 UI 에러 메시지** — 사용자에게 보여줄 에러 메시지의 tone과 재시도 안내 방식

---

## 주요 인사이트

**TDD의 핵심 가치**: 이 계획서에는 총 **15개 테스트 시나리오**가 명시되어 있습니다(DB 4, Edge Function 4, 클라이언트 유닛 3, 통합 3, 회귀 3). TDD로 이것을 먼저 작성하면, 계획서의 검증 항목이 곧 실행 가능한 테스트가 되어 "문서 ↔ 코드" 간의 gap이 사라집니다.

**이 프로젝트에서의 특이점**: 기존 `uploadBeanImage`는 실패 시 `null`을 반환하는 silent failure 패턴입니다(`catch { return null }`). 멀티 이미지의 All-or-Nothing 정책과 충돌하므로, TDD가 이 설계 결함을 자연스럽게 드러내고 교정합니다.
