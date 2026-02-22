# 원두 재고 관리 — 로직 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** UI 껍데기만 있는 원두 관리 기능에 Supabase 백엔드(DB, API, Hooks)를 연결하여 실제로 동작하게 만든다.

**Architecture:** Supabase beans 테이블 → `lib/api/beans.ts` (static class API) → `hooks/useBeans.ts` (React Query hooks) → 기존 UI 컴포넌트 연결. 기존 RecipeAPI / useRecipes 패턴을 그대로 따른다.

**Tech Stack:** Supabase (PostgreSQL + RLS), React Query (`@tanstack/react-query`), Zod, `expo-image-picker`, Supabase Storage

---

## 전체 구조

```
supabase/migrations/20260216_create_beans.sql   ← Task 1
types/database.ts                                ← Task 2 (beans 타입 추가)
types/bean.ts                                    ← Task 3 (CreateBeanInput 추가)
lib/api/beans.ts                                 ← Task 4
hooks/useBeans.ts                                ← Task 5
app/(tabs)/beans.tsx                             ← Task 6 (mock → hook 교체)
app/beans/add.tsx                                ← Task 7 (API 연결)
app/beans/[id].tsx                               ← Task 8 (API 연결)
components/beans/BeanForm.tsx                    ← Task 9 (이미지 촬영 연결)
```

---

### Task 1: Supabase 마이그레이션 — beans 테이블 생성

**Files:**
- Create: `supabase/migrations/20260216_create_beans.sql`

**Step 1: 마이그레이션 SQL 작성**

> Best Practices 점검 완료 (2026-02-16). 아래 SQL은 Supabase Postgres Best Practices를 반영한 수정본입니다.
>
> | # | 심각도 | 반영 내용 |
> |---|--------|-----------|
> | 1 | CRITICAL | RLS `auth.uid()` → `(select auth.uid())` per-row 호출 방지 |
> | 2 | HIGH | FK CASCADE용 non-partial 인덱스 `idx_beans_user_id` 추가 |
> | 3 | HIGH | RLS 정책에 `TO authenticated` 역할 명시 |
> | 4 | MEDIUM | `NUMERIC` → `INTEGER` (무게 컬럼, 정수 그램 단위) |
> | 5 | MEDIUM | `remaining_g <= weight_g` 무결성 제약 추가 |
> | 6 | INFO | UUID v4 PK — 기존 코드베이스 일관성 유지 (향후 UUIDv7 고려) |
> | 7 | MEDIUM | `degassing_days INTEGER` 컬럼 추가 — 기존 `types/bean.ts` 인터페이스와 일치 |
> | 8 | HIGH | `database.ts` union 타입 사용 → `as unknown as Bean` 이중 캐스팅 제거 |
> | 9 | MEDIUM | mutation `onSuccess`에서 `invalidateQueries` await 통일 (fire-and-forget) |
> | 10 | LOW (선택) | FlatList `ItemSeparatorComponent` 인라인 함수 → 외부 컴포넌트 추출 |
> | 11 | LOW (선택) | 정렬/필터 로직 `useMemo` 래핑 — MVP에서는 목록이 작으므로 성능 영향 미미 |

```sql
-- ============================================================
-- Coffimer App: beans 테이블 생성
-- ============================================================

CREATE TABLE beans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  roastery_name TEXT,
  roast_date DATE,
  roast_level TEXT CHECK (
    roast_level IN ('light', 'medium_light', 'medium', 'medium_dark', 'dark')
  ),
  bean_type TEXT NOT NULL DEFAULT 'blend' CHECK (
    bean_type IN ('blend', 'single_origin')
  ),
  weight_g INTEGER NOT NULL CHECK (weight_g > 0),
  remaining_g INTEGER NOT NULL CHECK (remaining_g >= 0),
  price INTEGER,
  cup_notes TEXT[] DEFAULT '{}',
  image_url TEXT,
  degassing_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_remaining_lte_weight CHECK (remaining_g <= weight_g)
);

-- FK CASCADE용 인덱스 (전체 행 — ON DELETE CASCADE 시 필수)
CREATE INDEX idx_beans_user_id ON beans(user_id);

-- 활성 원두 목록 조회용 partial 인덱스
CREATE INDEX idx_beans_user_active ON beans(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- RLS 활성화
ALTER TABLE beans ENABLE ROW LEVEL SECURITY;

-- RLS 정책 ((select auth.uid())로 감싸 per-row 호출 방지 → 100x+ 성능 향상)
CREATE POLICY "Users can view own beans"
  ON beans FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own beans"
  ON beans FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own beans"
  ON beans FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own beans"
  ON beans FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_beans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER beans_updated_at
  BEFORE UPDATE ON beans
  FOR EACH ROW
  EXECUTE FUNCTION update_beans_updated_at();
```

**Step 2: Supabase 대시보드 또는 CLI로 마이그레이션 적용**

Run: Supabase 대시보드 SQL Editor에서 실행하거나 `supabase db push`
Expected: beans 테이블 생성 완료, RLS 정책 활성화

---

### Task 2: types/database.ts — beans 테이블 타입 추가

**Files:**
- Modify: `types/database.ts` (Tables 섹션에 beans 추가)

마이그레이션 적용 후 `supabase gen types typescript` 명령으로 자동 생성하는 것이 이상적이지만, 수동으로 추가해도 됩니다.

**Step 1: Tables 섹션에 beans 타입 추가**

`types/database.ts`의 `public > Tables` 안에 다음을 추가:

```typescript
beans: {
  Row: {
    id: string;
    user_id: string;
    name: string;
    roastery_name: string | null;
    roast_date: string | null;
    roast_level: 'light' | 'medium_light' | 'medium' | 'medium_dark' | 'dark' | null;
    bean_type: 'blend' | 'single_origin';
    weight_g: number;
    remaining_g: number;
    price: number | null;
    cup_notes: string[];
    image_url: string | null;
    degassing_days: number | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
  Insert: {
    id?: string;
    user_id: string;
    name: string;
    roastery_name?: string | null;
    roast_date?: string | null;
    roast_level?: 'light' | 'medium_light' | 'medium' | 'medium_dark' | 'dark' | null;
    bean_type?: 'blend' | 'single_origin';
    weight_g: number;
    remaining_g: number;
    price?: number | null;
    cup_notes?: string[];
    image_url?: string | null;
    degassing_days?: number | null;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
  };
  Update: {
    id?: string;
    user_id?: string;
    name?: string;
    roastery_name?: string | null;
    roast_date?: string | null;
    roast_level?: 'light' | 'medium_light' | 'medium' | 'medium_dark' | 'dark' | null;
    bean_type?: 'blend' | 'single_origin';
    weight_g?: number;
    remaining_g?: number;
    price?: number | null;
    cup_notes?: string[];
    image_url?: string | null;
    degassing_days?: number | null;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: 'beans_user_id_fkey';
      columns: ['user_id'];
      isOneToOne: false;
      referencedRelation: 'users';
      referencedColumns: ['id'];
    },
  ];
};
```

**Step 2: type-check 실행**

Run: `pnpm run type-check`
Expected: PASS (no errors)

---

### Task 3: types/bean.ts — CreateBeanInput / UpdateBeanInput 추가

**Files:**
- Modify: `types/bean.ts`

**Step 1: 입력 타입 추가**

기존 `types/bean.ts` 하단에 추가:

```typescript
export interface CreateBeanInput {
  name: string;
  roastery_name?: string | null;
  roast_date?: string | null;
  roast_level?: RoastLevel | null;
  bean_type: BeanType;
  weight_g: number;
  price?: number | null;
  cup_notes?: string[];
  image_url?: string | null;
  degassing_days?: number | null;
}

export type UpdateBeanInput = Partial<CreateBeanInput> & {
  remaining_g?: number;
};
```

> **설계 포인트:** `CreateBeanInput`에는 `remaining_g`가 없다. 생성 시 `weight_g`와 동일 값으로 API에서 자동 설정한다.

**Step 2: type-check 실행**

Run: `pnpm run type-check`
Expected: PASS

---

### Task 4: lib/api/beans.ts — Supabase CRUD 함수

**Files:**
- Create: `lib/api/beans.ts`

**패턴 참고:** `lib/api/recipes.ts` (static class), `lib/api/favorites.ts` (static class)

**Step 1: BeanAPI 클래스 작성**

```typescript
import type { Bean, CreateBeanInput, UpdateBeanInput } from '@/types/bean';
import { supabase } from '../supabaseClient';

export class BeanAPI {
  static async getUserBeans(userId: string): Promise<Bean[]> {
    const { data, error } = await supabase
      .from('beans')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Bean[];
  }

  static async getBeanById(beanId: string): Promise<Bean | null> {
    const { data, error } = await supabase
      .from('beans')
      .select('*')
      .eq('id', beanId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as Bean | null;
  }

  static async createBean(
    input: CreateBeanInput,
    userId: string,
  ): Promise<Bean> {
    const { data, error } = await supabase
      .from('beans')
      .insert({
        ...input,
        user_id: userId,
        remaining_g: input.weight_g, // 초기값 = 총 무게
      })
      .select()
      .single();

    if (error) throw error;
    return data as Bean;
  }

  static async updateBean(
    beanId: string,
    input: UpdateBeanInput,
    userId: string,
  ): Promise<Bean> {
    // 소유자 확인은 RLS가 처리하지만, 명시적 체크도 수행
    const { data, error } = await supabase
      .from('beans')
      .update(input)
      .eq('id', beanId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as Bean;
  }

  static async deleteBean(beanId: string, userId: string): Promise<void> {
    // soft delete
    const { error } = await supabase
      .from('beans')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', beanId)
      .eq('user_id', userId);

    if (error) throw error;
  }
}
```

> **설계 포인트:**
> - `deleteBean`은 soft delete (deleted_at 설정). 하드 삭제 대신 히스토리를 보존한다.
> - `createBean`에서 `remaining_g = weight_g`를 자동 설정한다 (설계 문서 Phase 1 정책).
> - RLS가 1차 보안이고, `eq('user_id', userId)`는 2중 체크이다.
> - DB에 `chk_remaining_lte_weight` 제약이 있으므로 `remaining_g > weight_g` 업데이트는 DB가 거부한다.
> - `getUserBeans`에서 `.is('deleted_at', null)` 필터는 RLS SELECT 정책과 이중 보호이다.
> - `getBeanById`는 `.maybeSingle()`을 사용한다. `.single()`은 결과가 0건일 때 PGRST116 예외를 던지므로, `Bean | null` 반환 계약에 맞지 않는다.
> - `database.ts`에서 `roast_level`, `bean_type`을 union literal 타입으로 선언했으므로 `as unknown as Bean` 이중 캐스팅 없이 `as Bean` 단일 캐스팅으로 충분하다. (BeanRow ⊃ Bean 구조적 호환)

**Step 2: type-check 실행**

Run: `pnpm run type-check`
Expected: PASS

---

### Task 5: hooks/useBeans.ts — React Query hooks

**Files:**
- Create: `hooks/useBeans.ts`

**패턴 참고:** `hooks/useRecipes.ts` (query keys + useQuery), `hooks/useCreateRecipeMutation.ts` (useMutation)

**Step 1: Query keys + 조회 hooks 작성**

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BeanAPI } from '@/lib/api/beans';
import { useAuth } from '@/hooks/useAuth';
import type { Bean, CreateBeanInput, UpdateBeanInput } from '@/types/bean';

export const beanKeys = {
  all: ['beans'] as const,
  lists: () => [...beanKeys.all, 'list'] as const,
  userBeans: (userId: string) => [...beanKeys.lists(), userId] as const,
  details: () => [...beanKeys.all, 'detail'] as const,
  detail: (id: string) => [...beanKeys.details(), id] as const,
};

// 사용자의 원두 목록 조회
export const useUserBeans = () => {
  const { user } = useAuth();
  return useQuery<Bean[], Error>({
    queryKey: beanKeys.userBeans(user?.id ?? ''),
    queryFn: () => BeanAPI.getUserBeans(user!.id),
    enabled: !!user?.id,
  });
};

// 원두 상세 조회
export const useBeanDetail = (beanId: string) => {
  return useQuery<Bean | null, Error>({
    queryKey: beanKeys.detail(beanId),
    queryFn: () => BeanAPI.getBeanById(beanId),
    enabled: !!beanId,
  });
};
```

**Step 2: Mutation hooks 작성**

```typescript
// 원두 생성
export const useCreateBeanMutation = (options?: {
  onSuccess?: (bean: Bean) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateBeanInput): Promise<Bean> => {
      if (!user) throw new Error('사용자 인증이 필요합니다.');
      return BeanAPI.createBean(input, user.id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: beanKeys.userBeans(user?.id ?? ''),
      });
      queryClient.setQueryData(beanKeys.detail(data.id), data);
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
};

// 원두 수정
export const useUpdateBeanMutation = (options?: {
  onSuccess?: (bean: Bean) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      beanId,
      input,
    }: {
      beanId: string;
      input: UpdateBeanInput;
    }): Promise<Bean> => {
      if (!user) throw new Error('사용자 인증이 필요합니다.');
      return BeanAPI.updateBean(beanId, input, user.id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: beanKeys.userBeans(user?.id ?? ''),
      });
      queryClient.setQueryData(beanKeys.detail(data.id), data);
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
};

// 원두 삭제 (soft delete)
export const useDeleteBeanMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (beanId: string): Promise<void> => {
      if (!user) throw new Error('사용자 인증이 필요합니다.');
      return BeanAPI.deleteBean(beanId, user.id);
    },
    onSuccess: (_, beanId) => {
      queryClient.removeQueries({ queryKey: beanKeys.detail(beanId) });
      queryClient.invalidateQueries({
        queryKey: beanKeys.userBeans(user?.id ?? ''),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
};
```

**Step 3: type-check 실행**

Run: `pnpm run type-check`
Expected: PASS

---

### Task 6: app/(tabs)/beans.tsx — Mock 데이터를 hook으로 교체

**Files:**
- Modify: `app/(tabs)/beans.tsx`

**Step 1: MOCK_BEANS 제거 및 useUserBeans 연결**

변경 사항:
1. `import { useUserBeans } from '@/hooks/useBeans';` 추가
2. `import { useMemo } from 'react';` 추가 (기존 react import에 병합)
3. `MOCK_BEANS` 상수 및 관련 import 제거
4. `const beans = MOCK_BEANS;` → `const { data: beans = [], isLoading } = useUserBeans();`로 교체
5. `const isLoading = false;` 라인 제거

핵심 변경:

```typescript
// Before
const isLoading = false;
const beans = MOCK_BEANS;

// After
const { data: beans = [], isLoading } = useUserBeans();
```

**Step 2 (선택사항): 정렬/필터 로직 `useMemo` 래핑**

> MVP 단계에서는 목록이 소규모이므로 스킵해도 무방. 목록이 50건 이상으로 늘어날 때 적용 권장.

```typescript
// Before
const filteredBeans = beans.filter((bean) => {
  if (statusFilter === 'active') return bean.remaining_g > 0;
  if (statusFilter === 'exhausted') return bean.remaining_g <= 0;
  return true;
});

const sortedBeans = [...filteredBeans].sort((a, b) => { ... });

// After — 단일 useMemo로 통합
const sortedBeans = useMemo(() => {
  const filtered = beans.filter((bean) => {
    if (statusFilter === 'active') return bean.remaining_g > 0;
    if (statusFilter === 'exhausted') return bean.remaining_g <= 0;
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (sortBy === 'remaining') return b.remaining_g - a.remaining_g;
    if (sortBy === 'roast_date') {
      if (!a.roast_date) return 1;
      if (!b.roast_date) return -1;
      return new Date(b.roast_date).getTime() - new Date(a.roast_date).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}, [beans, sortBy, statusFilter]);
```

**Step 3 (선택사항): FlatList `ItemSeparatorComponent` 인라인 함수 추출**

> 인라인 함수가 재생성되지만 성능에 유의미한 영향은 없음. 코드 정리 차원에서 원하면 적용.

```typescript
// Before (컴포넌트 내부 인라인)
ItemSeparatorComponent={() => <View style={styles.separator} />}

// After (컴포넌트 외부에 선언)
const BeanListSeparator = () => <View style={styles.separator} />;

// 사용
ItemSeparatorComponent={BeanListSeparator}
```

**Step 4: type-check 실행**

Run: `pnpm run type-check`
Expected: PASS

---

### Task 7: app/beans/add.tsx — 등록 API 연결

**Files:**
- Modify: `app/beans/add.tsx`

**Step 1: useCreateBeanMutation 연결**

변경 사항:
1. `import { useCreateBeanMutation } from '@/hooks/useBeans';` 추가
2. `normalizeInput` 헬퍼 추가: BeanForm의 기본값 `''`(빈 문자열)을 DB DATE 컬럼에 맞게 `null`로 변환
3. `handleSubmit`에서 `mutateAsync`를 await하여 BeanForm의 `Promise<void>` 계약과 일치시킨다
4. `handleSubmit` 함수에서 mutation 호출

```typescript
// Before
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (_data: unknown) => {
  setIsSubmitting(true);
  try {
    // TODO: Supabase API 연동
    Alert.alert('등록 완료', ...);
  } catch { ... }
  finally { setIsSubmitting(false); }
};

// After

// 빈 문자열을 null로 정규화하는 헬퍼 (폼 기본값 '' → DB DATE 컬럼 호환)
const normalizeInput = (data: BeanFormData): CreateBeanInput => ({
  ...data,
  roast_date: data.roast_date || null,
  roastery_name: data.roastery_name || null,
});

const createBeanMutation = useCreateBeanMutation({
  onSuccess: () => {
    Alert.alert('등록 완료', '원두가 등록되었습니다.', [
      { text: '확인', onPress: () => router.back() },
    ]);
  },
  onError: () => {
    Alert.alert('등록 실패', '원두 등록 중 오류가 발생했습니다.');
  },
});

const handleSubmit = async (data: BeanFormData) => {
  await createBeanMutation.mutateAsync(normalizeInput(data));
};
```

- `isSubmitting` state 제거 → `createBeanMutation.isPending` 사용
- `BeanForm`의 `isLoading` prop에 `createBeanMutation.isPending` 전달

**Step 2: type-check 실행**

Run: `pnpm run type-check`
Expected: PASS

---

### Task 8: app/beans/[id].tsx — 상세/삭제 API 연결

**Files:**
- Modify: `app/beans/[id].tsx`

**Step 1: useBeanDetail + useDeleteBeanMutation 연결**

변경 사항:
1. `import { useBeanDetail, useDeleteBeanMutation } from '@/hooks/useBeans';` 추가
2. MOCK_BEAN 상수 제거
3. hook으로 교체:

```typescript
// Before
void id;
const bean = MOCK_BEAN;
const isLoading = false;

// After
const { data: bean, isLoading } = useBeanDetail(id ?? '');
```

4. `handleDelete` 함수에서 mutation 사용:

```typescript
const deleteMutation = useDeleteBeanMutation({
  onSuccess: () => router.back(),
  onError: () => Alert.alert('삭제 실패', '원두 삭제 중 오류가 발생했습니다.'),
});

const handleDelete = () => {
  Alert.alert('원두 삭제', '이 원두를 삭제하시겠습니까?', [
    { text: '취소', style: 'cancel' },
    {
      text: '삭제',
      style: 'destructive',
      onPress: () => {
        if (id) deleteMutation.mutate(id);
      },
    },
  ]);
};
```

**Step 2: type-check 실행**

Run: `pnpm run type-check`
Expected: PASS

---

### Task 9: BeanForm.tsx — 이미지 촬영 연결 (expo-image-picker)

**Files:**
- Modify: `components/beans/BeanForm.tsx`

**Step 1: expo-image-picker 설치 확인**

Run: `pnpm list expo-image-picker`
만약 미설치: `npx expo install expo-image-picker` (Expo SDK 호환 버전 자동 선택)

**Step 2: 카메라/갤러리 함수 구현**

`simulateAIExtraction()`을 실제 이미지 선택으로 교체:

```typescript
import * as ImagePicker from 'expo-image-picker';

const handleCapture = async () => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('권한 필요', '카메라 권한을 허용해주세요.');
    return;
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });
  if (!result.canceled && result.assets.at(0)) {
    setImageUri(result.assets[0].uri);
    // MVP에서는 AI 분석 없이 바로 폼으로 이동
    setPhase('form');
  }
};

const handleGallery = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('권한 필요', '갤러리 접근 권한을 허용해주세요.');
    return;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });
  if (!result.canceled && result.assets.at(0)) {
    setImageUri(result.assets[0].uri);
    setPhase('form');
  }
};
```

> **MVP 범위 결정 포인트:** Gemini AI 분석 (Phase 2)은 Edge Function이 필요하므로 이 Task에서는 **이미지 선택 → 바로 폼 이동**으로 구현한다. `simulateAIExtraction` 함수와 `analyzing` phase는 향후 Task에서 실제 API로 교체할 때 사용한다.

**Step 3: imageUri를 useState setter로 변경**

현재 `const [imageUri] = useState<string | null>(null);` → `const [imageUri, setImageUri] = useState<string | null>(null);`로 수정 (setter 활성화)

**Step 4: type-check 실행**

Run: `pnpm run type-check`
Expected: PASS

---

## 권장 커밋 전략

> 개별 Task마다 커밋하지 않는다. 논리적으로 묶이는 단위로 3~4회 커밋한다.

| 커밋 | 포함 Task | 메시지 |
|------|-----------|--------|
| 1 | Task 1~3 | `feat: beans 테이블 마이그레이션 및 타입 정의` |
| 2 | Task 4~5 | `feat: BeanAPI CRUD + useBeans React Query hooks` |
| 3 | Task 6~8 | `feat: 원두 목록/등록/상세 화면 Supabase API 연결` |
| 4 | Task 9 | `feat: BeanForm에 expo-image-picker 카메라/갤러리 연동` |

각 커밋 전에 `pnpm run type-check`를 실행하여 빌드가 통과하는지 확인한다.

---

## 향후 작업 (이 계획 범위 밖)

이 계획이 완료되면 다음 단계로 진행할 수 있다:

1. **Supabase Storage 이미지 업로드** — 촬영한 이미지를 Storage에 업로드하고 `image_url`에 저장
2. **Edge Function: extract-bean-info** — Gemini 3.0 Flash를 사용한 원두 봉투 이미지 분석
3. **잔여량 차감 기능** — 드립 기록 시 `remaining_g` 업데이트
4. **원두 수정 화면** — `app/beans/edit/[id].tsx` 추가

---

## 체크리스트

- [ ] Task 1: beans 테이블 마이그레이션
- [ ] Task 2: database.ts 타입 추가
- [ ] Task 3: CreateBeanInput / UpdateBeanInput 타입
- [ ] Task 4: lib/api/beans.ts CRUD 클래스
- [ ] Task 5: hooks/useBeans.ts React Query hooks
- [ ] Task 6: beans.tsx mock → hook 교체
- [ ] Task 7: add.tsx API 연결
- [ ] Task 8: [id].tsx API 연결
- [ ] Task 9: BeanForm.tsx 이미지 촬영 연결
