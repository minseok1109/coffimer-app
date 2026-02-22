# Bean Delete Silent Failure Fix

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `BeanAPI.deleteBean`이 0개 행 업데이트 시 에러 없이 성공으로 처리되는 버그를 수정한다.

**Architecture:** Supabase UPDATE 쿼리에 `.select('id')`를 추가하여 실제로 업데이트된 행을 반환받고, 빈 배열이면 명시적 에러를 throw한다. 이를 통해 잘못된 ID, 권한 없는 삭제, 이미 삭제된 원두에 대해 사용자에게 명확한 피드백을 제공한다.

**Tech Stack:** Jest (jest-expo), `@/lib/api/beans.ts`, `@/lib/supabaseClient.ts` mock

---

## 배경: 왜 이게 버그인가?

현재 `BeanAPI.deleteBean`의 쿼리:

```typescript
const { error } = await supabase
  .from('beans')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', beanId)
  .eq('user_id', userId);

if (error) throw error;
// ← 0개 행이 업데이트돼도 여기까지 옴
```

Supabase PostgreSQL의 UPDATE는 조건에 맞는 행이 없어도 에러를 던지지 않는다. 결과적으로:
- 존재하지 않는 `beanId` → 사일런트 성공
- 타인 소유 원두 → 사일런트 성공
- 이미 삭제된 원두 → 사일런트 성공

이 경우 `onSuccess`가 호출되어 `queryClient.removeQueries` + `router.back()`이 실행된다.

---

## Task 1: 실패 케이스 테스트 작성

**Files:**
- Create: `lib/api/__tests__/beans.deleteBean.test.ts`

### Step 1: 테스트 파일 생성

```typescript
// lib/api/__tests__/beans.deleteBean.test.ts
import { BeanAPI } from '@/lib/api/beans';

const mockSelect = jest.fn();
const mockChain = {
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  select: mockSelect,
};

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => mockChain),
  },
}));

describe('BeanAPI.deleteBean', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1개 행 업데이트: 정상 resolve', async () => {
    mockSelect.mockResolvedValue({ data: [{ id: 'bean-1' }], error: null });
    await expect(BeanAPI.deleteBean('bean-1', 'user-1')).resolves.toBeUndefined();
  });

  it('0개 행 업데이트: 에러를 throw', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    await expect(BeanAPI.deleteBean('unknown-id', 'user-1')).rejects.toThrow(
      '원두를 찾을 수 없거나 삭제 권한이 없습니다.',
    );
  });

  it('data가 null: 에러를 throw', async () => {
    mockSelect.mockResolvedValue({ data: null, error: null });
    await expect(BeanAPI.deleteBean('bean-1', 'user-1')).rejects.toThrow(
      '원두를 찾을 수 없거나 삭제 권한이 없습니다.',
    );
  });

  it('Supabase DB 에러: 해당 에러를 그대로 throw', async () => {
    const dbError = { message: 'Database connection error', code: '08006' };
    mockSelect.mockResolvedValue({ data: null, error: dbError });
    await expect(BeanAPI.deleteBean('bean-1', 'user-1')).rejects.toMatchObject({
      message: 'Database connection error',
    });
  });
});
```

### Step 2: 테스트 실행 (FAIL 확인)

```bash
pnpm test lib/api/__tests__/beans.deleteBean.test.ts --verbose
```

**Expected:** `0개 행 업데이트` 케이스가 FAIL (현재 구현이 에러를 throw하지 않으므로)

### Step 3: 커밋 (Red)

```bash
git add lib/api/__tests__/beans.deleteBean.test.ts
git commit -m "test: BeanAPI.deleteBean 0-row silent failure 케이스 테스트 추가"
```

---

## Task 2: `BeanAPI.deleteBean` 수정

**Files:**
- Modify: `lib/api/beans.ts:64-72`

### Step 1: 구현 수정

`lib/api/beans.ts`의 `deleteBean` 메서드를 아래로 교체:

```typescript
static async deleteBean(beanId: string, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('beans')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', beanId)
    .eq('user_id', userId)
    .select('id');

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('원두를 찾을 수 없거나 삭제 권한이 없습니다.');
  }
}
```

**변경 포인트:**
- `const { error }` → `const { data, error }` (반환값 수신)
- `.select('id')` 추가 (업데이트된 행 반환)
- `data`가 빈 배열이거나 null이면 명시적 에러 throw

### Step 2: 테스트 실행 (PASS 확인)

```bash
pnpm test lib/api/__tests__/beans.deleteBean.test.ts --verbose
```

**Expected:** 4개 테스트 모두 PASS

### Step 3: 타입 체크

```bash
pnpm run type-check
```

**Expected:** 에러 없음

### Step 4: 커밋 (Green)

```bash
git add lib/api/beans.ts
git commit -m "fix: BeanAPI.deleteBean 0개 행 업데이트 시 에러 throw 추가"
```

---

## Task 3: `useDeleteBeanMutation` 에러 메시지 개선

**Files:**
- Modify: `app/beans/[id].tsx:27-29`

현재 `onError` 핸들러는 모든 에러에 동일한 메시지를 표시한다. Task 2에서 추가한 에러 메시지를 사용자에게 노출하도록 개선한다.

### Step 1: 에러 핸들러 수정

`app/beans/[id].tsx`의 `deleteMutation` 선언부를 수정:

```typescript
const deleteMutation = useDeleteBeanMutation({
  onSuccess: () => router.back(),
  onError: (error) =>
    Alert.alert('삭제 실패', error.message ?? '원두 삭제 중 오류가 발생했습니다.'),
});
```

**변경 포인트:**
- `onError: () =>` → `onError: (error) =>`
- 고정 메시지 → `error.message` 우선 표시

### Step 2: 타입 체크

```bash
pnpm run type-check
```

**Expected:** 에러 없음

### Step 3: 전체 테스트 실행

```bash
pnpm test --verbose
```

**Expected:** 기존 테스트 포함 모두 PASS

### Step 4: 커밋

```bash
git add app/beans/[id].tsx
git commit -m "fix: 원두 삭제 실패 시 에러 메시지 명확화"
```

---

## 최종 확인

1. `pnpm test --coverage` — 전체 테스트 통과 확인
2. `pnpm run type-check` — 타입 에러 없음 확인
3. 변경된 파일: `lib/api/beans.ts`, `app/beans/[id].tsx`, `lib/api/__tests__/beans.deleteBean.test.ts`

---

## 참고: Supabase UPDATE + SELECT 패턴

```
.update({...}).select('id')
```

PostgreSQL의 `UPDATE ... RETURNING id`와 동일하다. 조건에 맞는 행이 없으면 빈 배열을 반환하므로, 이를 통해 실제 변경 여부를 확인할 수 있다. 성능 영향은 미미하다 (id 컬럼 하나만 반환).
