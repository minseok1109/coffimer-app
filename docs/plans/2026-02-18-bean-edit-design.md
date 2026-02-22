# Bean Edit Feature Design

## Overview

`app/beans/[id].tsx` 상세 화면의 수정 버튼(handleEdit)에서 원두 수정 기능을 구현한다.

## Design Decisions

| 항목 | 결정 | 근거 |
|------|------|------|
| 이미지 | 읽기 전용 | 수정 시 AI 재분석 불필요. 단순성 우선 |
| 폼 컴포넌트 | `BeanEditForm` 신규 생성 | 기존 `BeanForm`의 3단계 flow(촬영→분석→폼)와 관심사 분리 |
| 네비게이션 | `router.replace()` | 수정 화면을 스택에서 제거하고 상세로 교체. 레시피 수정 패턴과 동일 |
| 폼 초기값 | `defaultValues` 파라미터 | `setValue` + `useEffect` 대신 선언적 초기화. useEffect 최소화 원칙 |

## File Structure

```
app/beans/edit/[id].tsx          ← 수정 페이지 (신규)
components/beans/BeanEditForm.tsx ← 수정 폼 컴포넌트 (신규)
```

## BeanEditForm Props

```typescript
interface BeanEditFormProps {
  bean: Bean;
  onSubmit: (data: UpdateBeanInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}
```

## Form Fields

| 필드 | 수정 가능 | 비고 |
|------|:---------:|------|
| 이미지 | X | 상단 읽기 전용 표시 |
| name | O | 필수 |
| roastery_name | O | |
| roast_date | O | RoastDateSelector 재사용 |
| roast_level | O | RoastLevelSelector 재사용 |
| bean_type | O | blend / single_origin |
| weight_g | O | 필수 |
| remaining_g | O | 수정 전용 필드 (생성 시 없음) |
| price | O | |
| cup_notes | O | CupNoteTag 재사용 |
| variety | O | |
| process_method | O | |
| notes | O | |

## Data Flow

```
[수정 페이지] → useBeanDetail(id)로 기존 데이터 로드
     ↓
[bean 데이터 준비됨] → beanToFormData(bean)으로 폼 형태 변환
     ↓
[BeanEditForm] → useBeanForm({ defaultValues }) 에 초기값 전달
     ↓
[저장] → normalizeInput() → useUpdateBeanMutation({ beanId, input })
     ↓
[성공] → 캐시 무효화 (자동) → router.replace(`/beans/${id}`)
[실패] → Alert.alert('수정 실패', ...)
```

## useBeanForm Hook Change

```typescript
// Before
useBeanForm()

// After
useBeanForm(defaultValues?: Partial<BeanFormData>)
```

기본값 없으면 빈 초기값 (생성 모드), 있으면 전달된 값 (수정 모드).

## Implementation Steps

### Step 1: useBeanForm 훅에 defaultValues 파라미터 추가
- `useBeanForm(defaultValues?)` 시그니처 변경
- `useForm({ defaultValues: defaultValues ?? 기존빈값 })`
- 기존 생성 flow 영향 없음 확인

### Step 2: BeanEditForm 컴포넌트 생성
- BeanFormPhase의 폼 필드 UI 참고하여 편집 전용 컴포넌트 작성
- 상단에 이미지 읽기 전용 표시
- remaining_g 필드 추가
- RoastDateSelector, RoastLevelSelector, CupNoteTag 재사용
- barrel export에 추가

### Step 3: app/beans/edit/[id].tsx 수정 페이지 생성
- useBeanDetail(id)로 데이터 로드
- beanToFormData() 변환 함수 작성
- useUpdateBeanMutation + normalizeInput으로 저장
- 성공 시 router.replace(`/beans/${id}`)
- 로딩/에러 상태 처리

### Step 4: app/beans/[id].tsx의 handleEdit 연결
- router.push(`/beans/edit/${id}`) 한 줄 추가
