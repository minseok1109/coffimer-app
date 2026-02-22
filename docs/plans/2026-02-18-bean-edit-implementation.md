# Bean Edit Feature Implementation Plan (Revised)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `app/beans/[id].tsx` 상세 화면의 수정 버튼에서 원두 정보를 수정할 수 있는 기능을 구현한다.

**Architecture:** 기존 레시피 수정 패턴(`app/recipes/edit/[id].tsx` + `EditForm.tsx`)을 따르되, Bean 도메인에 맞춘 전용 편집 플로우를 구축한다. `useBeanForm` 훅에 `defaultValues` 및 `submitErrorMessage`를 추가하고, `BeanEditForm`을 신규 생성한다. 이미지는 읽기 전용으로 유지하며, `remaining_g`는 수정 모드에서만 노출한다.

**Tech Stack:** React Native, Expo Router, react-hook-form + Zod, TanStack Query, NativeWind/StyleSheet

**Design doc:** `docs/plans/2026-02-18-bean-edit-design.md`

---

## 리스크 반영 요약

이번 개정안은 아래 5가지 리스크를 사전에 차단한다.

1. 편집 시 `image_url`이 null로 덮여 이미지가 삭제되는 문제 방지
2. `remaining_g <= weight_g` 교차 검증을 프론트에서 선제 처리
3. `isDirty` 기반 취소 확인의 신뢰성 보강 (`setValue(..., { shouldDirty: true })`)
4. mutation 에러 Alert 중복 노출 방지 (에러 처리 경로 단일화)
5. 현재 레포 baseline에 맞는 검증 단계(scoped lint + 자동 테스트)로 현실화

---

## 공개 API/인터페이스 변경 사항

1. `BeanFormData`
- `remaining_g?: number` 필드 추가

2. `useBeanForm` 옵션/반환
- `defaultValues?: Partial<BeanFormData>` 추가
- `submitErrorMessage?: string` 추가 (기본값 제공)
- 반환값에 `isDirty` 추가

3. `normalizeEditInput(data): UpdateBeanInput`
- `normalizeInput` 재사용 금지
- allowlist 방식으로 편집 허용 필드만 payload 구성
- `image_url` 미포함 보장

---

## Task 1: beanFormSchema에 remaining_g 및 교차 검증 추가

**Files:**
- Modify: `lib/validation/beanSchema.ts`

**Step 1: remaining_g 필드 + superRefine 추가**

`remaining_g`를 optional number로 추가하고, DB 제약인 `chk_remaining_lte_weight`(remaining_g <= weight_g)과 동일 규칙을 프론트에서 선검증한다.

```typescript
// lib/validation/beanSchema.ts
import { z } from 'zod';

export const beanFormSchema = z
  .object({
    name: z.string().min(1, '원두 이름을 입력해주세요'),
    roastery_name: z.string().optional(),
    roast_date: z.string().optional(),
    roast_level: z
      .enum(['light', 'medium_light', 'medium', 'medium_dark', 'dark'])
      .nullable()
      .optional(),
    bean_type: z.enum(['blend', 'single_origin']),
    weight_g: z.number().min(1, '무게를 입력해주세요'),
    price: z.number().nullable().optional(),
    cup_notes: z.array(z.string()),
    degassing_days: z.number().int().min(0).max(365).nullable().optional(),
    variety: z.string().optional(),
    process_method: z.string().nullable().optional(),
    notes: z.string().optional(),
    remaining_g: z.number().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      typeof data.remaining_g === 'number' &&
      typeof data.weight_g === 'number' &&
      data.remaining_g > data.weight_g
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['remaining_g'],
        message: '잔여량은 전체 무게를 초과할 수 없습니다',
      });
    }
  });
```

**Step 2: type-check 실행**

Run: `pnpm run type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add lib/validation/beanSchema.ts
git commit -m "feat: beanFormSchema에 remaining_g 및 교차 검증 추가"
```

---

## Task 2: useBeanForm 훅 확장 (defaultValues, isDirty, submitErrorMessage)

**Files:**
- Modify: `hooks/useBeanForm.ts`

**Step 1: 옵션 및 내부 dirty 처리 보강**

`useBeanForm`에 `defaultValues`, `submitErrorMessage`를 추가한다. `isDirty`를 반환하고, 내부 `setValue` 헬퍼는 `shouldDirty: true`를 명시해 취소 확인 신뢰도를 높인다.

```typescript
// hooks/useBeanForm.ts
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import type { AIExtractionResult } from '@/types/bean';
import { beanFormSchema } from '@/lib/validation/beanSchema';
import type { BeanFormData, ImageData } from '@/lib/validation/beanSchema';

const DEFAULT_FORM_VALUES: BeanFormData = {
  name: '',
  roastery_name: '',
  roast_date: '',
  roast_level: null,
  bean_type: 'blend',
  weight_g: 0,
  price: null,
  cup_notes: [],
  degassing_days: null,
  variety: '',
  process_method: null,
  notes: '',
};

interface UseBeanFormOptions {
  onSubmit: (data: BeanFormData, imageData: ImageData | null) => Promise<void>;
  imageData: ImageData | null;
  defaultValues?: Partial<BeanFormData>;
  submitErrorMessage?: string;
}

export function useBeanForm({
  onSubmit,
  imageData,
  defaultValues,
  submitErrorMessage = '원두 저장 중 오류가 발생했습니다.',
}: UseBeanFormOptions) {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<BeanFormData>({
    resolver: zodResolver(beanFormSchema),
    defaultValues: { ...DEFAULT_FORM_VALUES, ...defaultValues },
  });

  const cupNotes = watch('cup_notes');

  const addCupNote = (note: string) => {
    const trimmed = note.trim();
    if (trimmed && !cupNotes.includes(trimmed)) {
      setValue('cup_notes', [...cupNotes, trimmed], { shouldDirty: true });
    }
  };

  const removeCupNote = (note: string) => {
    setValue(
      'cup_notes',
      cupNotes.filter((n) => n !== note),
      { shouldDirty: true },
    );
  };

  const handleFormSubmit = async (data: BeanFormData) => {
    try {
      await onSubmit(data, imageData);
    } catch {
      Alert.alert('저장 실패', submitErrorMessage);
    }
  };

  return {
    control,
    handleSubmit,
    setValue,
    errors,
    isDirty,
    cupNotes,
    addCupNote,
    removeCupNote,
    handleFormSubmit,
  };
}
```

**Step 2: 기존 BeanForm.tsx 호환성 확인**

기존 `useBeanForm({ onSubmit, imageData })` 호출은 기본값 경로를 타므로 동작 유지.

**Step 3: type-check 실행**

Run: `pnpm run type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add hooks/useBeanForm.ts
git commit -m "feat: useBeanForm에 defaultValues/isDirty/submitErrorMessage 지원 추가"
```

---

## Task 3: Bean 변환 유틸리티 및 allowlist 기반 normalizeEditInput 구현

**Files:**
- Modify: `lib/beans/normalizeBeanInput.ts`

**Step 1: beanToFormData 변환 함수 추가**

`Bean` 엔티티를 `BeanFormData` 형태로 변환한다. nullable 필드를 폼 친화값으로 변환하며 `remaining_g`를 포함한다.

```typescript
// lib/beans/normalizeBeanInput.ts
import type { Bean, UpdateBeanInput } from '@/types/bean';
import type { BeanFormData } from '@/lib/validation/beanSchema';

export const beanToFormData = (bean: Bean): BeanFormData => ({
  name: bean.name,
  roastery_name: bean.roastery_name ?? '',
  roast_date: bean.roast_date ?? '',
  roast_level: bean.roast_level,
  bean_type: bean.bean_type,
  weight_g: bean.weight_g,
  price: bean.price,
  cup_notes: bean.cup_notes ?? [],
  degassing_days: bean.degassing_days,
  variety: bean.variety ?? '',
  process_method: bean.process_method,
  notes: bean.notes ?? '',
  remaining_g: bean.remaining_g,
});
```

**Step 2: normalizeEditInput을 allowlist 방식으로 전면 구현**

중요: `normalizeInput` 재사용 금지. 편집 payload에는 폼 노출 필드만 명시적으로 포함한다.

```typescript
// lib/beans/normalizeBeanInput.ts
import type { UpdateBeanInput } from '@/types/bean';

const normalizeTextForEdit = (
  data: Record<string, unknown>,
  key: keyof Pick<
    UpdateBeanInput,
    'name' | 'roastery_name' | 'roast_date' | 'variety' | 'process_method' | 'notes'
  >,
): string | null | undefined => {
  if (!(key in data)) return undefined;
  const value = data[key];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const normalizeEditInput = (data: Record<string, unknown>): UpdateBeanInput => {
  const input: UpdateBeanInput = {};

  const name = normalizeTextForEdit(data, 'name');
  if (name !== undefined) input.name = name ?? '';

  const roasteryName = normalizeTextForEdit(data, 'roastery_name');
  if (roasteryName !== undefined) input.roastery_name = roasteryName;

  const roastDate = normalizeTextForEdit(data, 'roast_date');
  if (roastDate !== undefined) input.roast_date = roastDate;

  const variety = normalizeTextForEdit(data, 'variety');
  if (variety !== undefined) input.variety = variety;

  const processMethod = normalizeTextForEdit(data, 'process_method');
  if (processMethod !== undefined) input.process_method = processMethod;

  const notes = normalizeTextForEdit(data, 'notes');
  if (notes !== undefined) input.notes = notes;

  if ('roast_level' in data) {
    input.roast_level = data.roast_level as UpdateBeanInput['roast_level'];
  }

  if ('bean_type' in data) {
    input.bean_type = data.bean_type as UpdateBeanInput['bean_type'];
  }

  if ('weight_g' in data && typeof data.weight_g === 'number' && Number.isFinite(data.weight_g)) {
    input.weight_g = data.weight_g;
  }

  if ('price' in data) {
    if (typeof data.price === 'number' && Number.isFinite(data.price)) {
      input.price = data.price;
    } else {
      input.price = null;
    }
  }

  if ('degassing_days' in data) {
    if (typeof data.degassing_days === 'number' && Number.isFinite(data.degassing_days)) {
      input.degassing_days = data.degassing_days;
    } else {
      input.degassing_days = null;
    }
  }

  if ('cup_notes' in data && Array.isArray(data.cup_notes)) {
    input.cup_notes = data.cup_notes.filter((note): note is string => typeof note === 'string');
  }

  if (
    'remaining_g' in data &&
    typeof data.remaining_g === 'number' &&
    Number.isFinite(data.remaining_g)
  ) {
    input.remaining_g = data.remaining_g;
  }

  return input;
};
```

비포함 보장 대상: `image_url`, `user_id`, `created_at`, `updated_at`, `deleted_at`.

**Step 3: 이미지 보존 회귀 방지 테스트 항목 추가**

- `normalizeEditInput` 결과에 `image_url` 키가 없어야 함
- 기존 이미지가 편집 저장으로 삭제되지 않아야 함

**Step 4: type-check 실행**

Run: `pnpm run type-check`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/beans/normalizeBeanInput.ts
git commit -m "feat: beanToFormData 및 allowlist 기반 normalizeEditInput 구현"
```

---

## Task 4: BeanEditForm 컴포넌트 생성 (수정 전용)

**Files:**
- Create: `components/beans/BeanEditForm.tsx`
- Modify: `components/beans/index.ts`

**설계 결정:**
- `BeanFormPhase` UI 패턴 재사용, 수정 전용으로 단순화
- 이미지 상단 읽기 전용 표시 (변경 버튼 없음)
- `remaining_g` 노출 (수정 전용)
- 취소/저장 버튼 제공
- 에러 처리 경로 단일화 (중복 Alert 금지)

**Step 1: BeanEditForm 컴포넌트 작성**

```typescript
// components/beans/BeanEditForm.tsx
import { Alert } from 'react-native';
import type { Bean, UpdateBeanInput } from '@/types/bean';
import { useBeanForm } from '@/hooks/useBeanForm';
import { beanToFormData, normalizeEditInput } from '@/lib/beans/normalizeBeanInput';

interface BeanEditFormProps {
  bean: Bean;
  onSubmit: (data: UpdateBeanInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BeanEditForm({ bean, onSubmit, onCancel, isLoading = false }: BeanEditFormProps) {
  const {
    control,
    handleSubmit,
    setValue,
    errors,
    isDirty,
    cupNotes,
    beanType,
    roastLevel,
    addCupNote,
    removeCupNote,
    handleFormSubmit,
  } = useBeanForm({
    imageData: null,
    defaultValues: beanToFormData(bean),
    submitErrorMessage: '원두 수정 중 오류가 발생했습니다.',
    onSubmit: async (data) => {
      const normalized = normalizeEditInput(data);
      await onSubmit(normalized);
    },
  });

  const handleCancel = () => {
    if (!isDirty) {
      onCancel();
      return;
    }

    Alert.alert('변경사항이 있습니다', '수정 중인 내용을 버리고 나가시겠습니까?', [
      { text: '계속 편집', style: 'cancel' },
      { text: '나가기', style: 'destructive', onPress: onCancel },
    ]);
  };

  // setValue 기반 상호작용(원두 종류/가공방식/칩 선택)은 shouldDirty: true를 사용해 dirty를 반영
  // 저장 버튼: handleSubmit(handleFormSubmit)
}
```

**내부 로직 요구사항:**
1. `useBeanForm({ defaultValues: beanToFormData(bean), imageData: null, ... })` 사용
2. 저장 시 `normalizeEditInput(data)` 결과만 `onSubmit`에 전달
3. 취소 시 `isDirty` 기반 확인 Alert
4. `setValue` 기반 UI 상호작용은 dirty 반영 (`shouldDirty: true`)
5. 에러 처리 단일 경로 유지

**Step 2: barrel export 추가**

```typescript
// components/beans/index.ts
export { BeanEditForm } from './BeanEditForm';
```

**Step 3: type-check 실행**

Run: `pnpm run type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add components/beans/BeanEditForm.tsx components/beans/index.ts
git commit -m "feat: BeanEditForm 편집 전용 컴포넌트 생성"
```

---

## Task 5: app/beans/edit/[id].tsx 수정 페이지 생성

**Files:**
- Create: `app/beans/edit/[id].tsx`

**Step 1: 수정 페이지 작성 (에러 처리 단일화)**

`useUpdateBeanMutation`의 `onError` Alert는 제거한다. 에러 Alert는 폼 제출 경로(`useBeanForm`의 `submitErrorMessage`)에서만 표출한다.

```typescript
// app/beans/edit/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BeanEditForm } from '@/components/beans';
import { useBeanDetail, useUpdateBeanMutation } from '@/hooks/useBeans';
import type { UpdateBeanInput } from '@/types/bean';

export default function BeanEditPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: bean, isLoading } = useBeanDetail(id ?? '');

  const updateMutation = useUpdateBeanMutation({
    onSuccess: () => router.replace(`/beans/${id}`),
  });

  // loading / not found 가드 상태 처리

  const handleSubmit = async (input: UpdateBeanInput) => {
    await updateMutation.mutateAsync({ beanId: bean!.id, input });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header onBack={() => router.back()} />
      <BeanEditForm
        bean={bean!}
        isLoading={updateMutation.isPending}
        onCancel={() => router.back()}
        onSubmit={handleSubmit}
      />
    </SafeAreaView>
  );
}
```

**핵심 포인트:**
- `useBeanDetail(id)`로 기존 데이터 로드
- `onSuccess`에서 `router.replace()` 유지
- 에러 Alert는 폼 경로 단일 처리
- 권한은 서버 측 `RLS + user_id` 조건으로 보장됨 (`BeanAPI.updateBean(...).eq('user_id', user.id)`)

**Step 2: type-check 실행**

Run: `pnpm run type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add app/beans/edit/[id].tsx
git commit -m "feat: 원두 수정 페이지 생성 및 에러 처리 단일화"
```

---

## Task 6: app/beans/[id].tsx의 handleEdit 연결

**Files:**
- Modify: `app/beans/[id].tsx`

**Step 1: handleEdit 네비게이션 연결**

```typescript
const handleEdit = () => {
  closeActionSheet();
  router.push(`/beans/edit/${id}`);
};
```

**Step 2: type-check 실행**

Run: `pnpm run type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add app/beans/[id].tsx
git commit -m "feat: 원두 상세에서 수정 페이지 네비게이션 연결"
```

---

## Task 7: 최종 검증 (baseline 친화)

**Step 1: 전체 type-check**

Run: `pnpm run type-check`
Expected: PASS

**Step 2: 변경 파일 scoped lint 실행**

Run:

```bash
pnpm exec eslint 'lib/validation/beanSchema.ts' 'hooks/useBeanForm.ts' 'lib/beans/normalizeBeanInput.ts' 'components/beans/BeanEditForm.tsx' 'components/beans/index.ts' 'app/beans/edit/[id].tsx' 'app/beans/[id].tsx'
```

Expected: PASS (변경 파일 기준)

**Step 3: 전체 lint 참고 실행 (옵션)**

Run: `pnpm run lint`
Expected: baseline 이슈로 실패 가능 (이번 기능 범위 밖)

**Step 4: 수동 동작 테스트 체크리스트**

- [ ] 원두 상세 → 더보기(⋯) → "수정" 탭 → 수정 페이지 이동
- [ ] 수정 페이지에 기존 데이터가 폼에 올바르게 로드됨
- [ ] 이미지가 읽기 전용으로 표시됨
- [ ] `remaining_g` 필드가 노출되고 수정 가능
- [ ] `remaining_g > weight_g` 입력 시 즉시 검증 에러 표시
- [ ] 필드 수정 후 "저장" → 성공 시 상세 페이지로 돌아감
- [ ] 상세 페이지에서 수정된 데이터가 반영됨 (캐시 갱신)
- [ ] 변경 없이 "취소" → 즉시 뒤로가기
- [ ] 변경 후 "취소" → 확인 다이얼로그 표시
- [ ] 존재하지 않는 ID → "원두를 찾을 수 없습니다" 화면

---

## Task 8: 자동 테스트 추가

**Files:**
- Create: `app/beans/__tests__/edit.normalizeInput.test.ts`

**Step 1: 테스트 작성**

테스트 시나리오:

1. `normalizeEditInput` 결과에 `image_url`이 포함되지 않는다.
2. 텍스트 필드 공백 입력 시 `null`로 정규화된다.
3. `remaining_g`는 finite number일 때만 포함된다.
4. `beanFormSchema`는 `remaining_g > weight_g`를 reject한다.
5. `beanToFormData`는 nullable 필드를 폼 친화값으로 변환한다.

**Step 2: 테스트 실행**

Run:

```bash
pnpm test -- app/beans/__tests__/edit.normalizeInput.test.ts
```

Expected: PASS

**Step 3: Commit**

```bash
git add app/beans/__tests__/edit.normalizeInput.test.ts
git commit -m "test: bean edit 정규화 및 스키마 교차 검증 테스트 추가"
```

---

## 파일 변경 요약

| 파일 | 작업 | 설명 |
|------|------|------|
| `lib/validation/beanSchema.ts` | Modify | `remaining_g` + 교차 검증(`superRefine`) |
| `hooks/useBeanForm.ts` | Modify | `defaultValues`, `submitErrorMessage`, `isDirty`, dirty 반영 |
| `lib/beans/normalizeBeanInput.ts` | Modify | `beanToFormData`, allowlist 기반 `normalizeEditInput` |
| `components/beans/BeanEditForm.tsx` | Create | 편집 전용 폼 컴포넌트 |
| `components/beans/index.ts` | Modify | `BeanEditForm` export 추가 |
| `app/beans/edit/[id].tsx` | Create | 수정 페이지 + 에러 처리 단일화 |
| `app/beans/[id].tsx` | Modify | 수정 페이지 네비게이션 연결 |
| `app/beans/__tests__/edit.normalizeInput.test.ts` | Create | 정규화/교차검증 자동 테스트 |

## 의존성 그래프

```text
Task 1 (schema + superRefine) ──┐
                                 ├── Task 2 (useBeanForm 확장) ──┐
Task 3 (normalize 유틸) ─────────┘                              ├── Task 4 (BeanEditForm)
                                                                │
Task 4 (BeanEditForm) ───────────────────────────────────────────┼── Task 5 (edit page) ── Task 6 (handleEdit)
Task 1/3/4 완료 후 병렬 가능 ────────────────────────────────────┘

Task 8 (자동 테스트): Task 1/3/4 이후 병렬 가능
Task 7 (최종 검증): Task 5/6/8 이후 실행
```

---

## 테스트 및 수용 기준

1. 타입체크 통과: `pnpm run type-check`
2. 변경 파일 lint 통과: scoped eslint 명령
3. 자동 테스트 통과: edit 정규화/스키마 검증 테스트
4. 수동 QA 통과:
- 상세→수정 이동
- 기존값 로드
- 이미지 읽기 전용 유지
- `remaining_g` 수정 가능
- `remaining_g > weight_g` 즉시 검증 에러
- 저장 성공 후 상세 반영
- dirty 취소 확인 동작
- 존재하지 않는 ID 가드 화면

## 가정 및 기본값

1. 이번 작업의 수정 대상은 `docs/plans/2026-02-18-bean-edit-implementation.md` 단일 문서다.
2. 전체 lint baseline 이슈는 본 기능 범위 밖이다.
3. 이미지 편집/재업로드는 스코프 밖이며, 편집 시 기존 이미지 유지가 기본 정책이다.
