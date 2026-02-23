# 원두 개봉일(opened_date) 필드 추가 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** BeanForm에 개봉일(opened_date) 날짜 필드를 추가하여, 사용자 입력부터 DB 저장/조회까지 전체 수직 레이어를 관통하는 기능을 구현한다.

**Architecture:** `roast_date`의 기존 패턴(YYYY-MM-DD string, BottomSheet Calendar, dayjs 포매팅)을 그대로 따른다. `RoastDateSelector` 컴포넌트에 `title` prop을 추가하여 재사용하고, DB에는 nullable DATE 컬럼을 추가한다. AI 분석은 사진에서 개봉일을 추출할 수 없으므로 대상에서 제외한다.

**Tech Stack:** Supabase (PostgreSQL migration), Zod, react-hook-form, react-native-calendars, dayjs

---

## 영향 범위 요약

| 레이어 | 파일 | 변경 내용 |
|--------|------|----------|
| DB | `supabase/migrations/` (새 파일) | `opened_date DATE` 컬럼 추가 |
| DB 타입 | `types/database.ts` | beans 테이블 Row/Insert/Update에 `opened_date` 추가 |
| 도메인 타입 | `types/bean.ts` | Bean, CreateBeanInput 인터페이스에 `opened_date` 추가 |
| 유효성 검증 | `lib/validation/beanSchema.ts` | Zod 스키마에 `opened_date` 필드 추가 |
| 정규화 | `lib/beans/normalizeBeanInput.ts` | normalizeInput, beanToFormData, normalizeEditInput에 `opened_date` 추가 |
| 폼 훅 | `hooks/useBeanForm.ts` | DEFAULT_FORM_VALUES에 `opened_date: ''` 추가 |
| UI 컴포넌트 | `components/beans/RoastDateSelector.tsx` | `title` prop 추가 (범용화) |
| 생성 폼 | `components/beans/BeanFormPhase.tsx` | 개봉일 날짜 선택 UI 추가 |
| 수정 폼 | `components/beans/BeanEditForm.tsx` | 개봉일 날짜 선택 UI 추가 |
| 상세 화면 | `components/beans/BeanDetail.tsx` | infoItems에 개봉일 표시 |
| API 쿼리 | `lib/api/beans.ts` | BEAN_SELECT에 `opened_date` 추가 |
| 테스트 | `__tests__/` 관련 파일 | 테스트 데이터에 `opened_date` 반영 |

> **AI 분석 제외:** 개봉일은 원두 포장 사진에서 추출할 수 없는 사용자 행동 정보이므로, `useBeanAnalysis.ts`, `AIExtractionResult`, `BeanFieldConfidence`, Edge Function은 수정하지 않는다.

---

### Task 1: DB 마이그레이션 - opened_date 컬럼 추가

**Files:**
- Create: `supabase/migrations/20260222_beans_add_opened_date.sql`

**Step 1: 마이그레이션 SQL 작성**

```sql
ALTER TABLE beans ADD COLUMN opened_date DATE;
```

**Step 2: Supabase에 마이그레이션 적용 확인**

Run: `supabase db push` 또는 Supabase Dashboard에서 적용
Expected: 컬럼 추가 성공

**Step 3: 커밋**

```bash
git add supabase/migrations/20260222_beans_add_opened_date.sql
git commit -m "feat(원두): opened_date 컬럼 마이그레이션 추가"
```

---

### Task 2: 타입 시스템 업데이트 (database.ts, bean.ts)

**Files:**
- Modify: `types/database.ts` - beans 테이블 Row/Insert/Update 섹션
- Modify: `types/bean.ts` - Bean, CreateBeanInput 인터페이스

**Step 1: `types/database.ts` 수정**

beans > Row에 추가:
```typescript
opened_date: string | null;
```

beans > Insert에 추가:
```typescript
opened_date?: string | null;
```

beans > Update에 추가:
```typescript
opened_date?: string | null;
```

**Step 2: `types/bean.ts` 수정**

Bean 인터페이스에 `roast_date` 아래 추가:
```typescript
opened_date: string | null;
```

CreateBeanInput 인터페이스에 `roast_date` 아래 추가:
```typescript
opened_date?: string | null;
```

**Step 3: 타입 체크**

Run: `pnpm run type-check`
Expected: 타입 에러 발생 (아직 다른 파일에서 opened_date를 처리하지 않았으므로 에러가 발생할 수 있음 — 이 단계에서는 일단 확인만)

**Step 4: 커밋**

```bash
git add types/database.ts types/bean.ts
git commit -m "feat(원두): opened_date 타입 정의 추가"
```

---

### Task 3: 유효성 검증 스키마 + 폼 기본값 + 정규화

**Files:**
- Modify: `lib/validation/beanSchema.ts`
- Modify: `hooks/useBeanForm.ts`
- Modify: `lib/beans/normalizeBeanInput.ts`

**Step 1: Zod 스키마에 opened_date 추가**

`lib/validation/beanSchema.ts`의 `.object({` 내부, `roast_date` 바로 아래에 추가:
```typescript
opened_date: z.string().optional(),
```

**Step 2: useBeanForm DEFAULT_FORM_VALUES에 추가**

`hooks/useBeanForm.ts`의 DEFAULT_FORM_VALUES에 `roast_date: ''` 아래 추가:
```typescript
opened_date: '',
```

**Step 3: normalizeInput에 opened_date 추가**

`lib/beans/normalizeBeanInput.ts`의 `normalizeInput` 함수 return 객체에 추가:
```typescript
opened_date: normalizeText(data.opened_date),
```

**Step 4: beanToFormData에 opened_date 추가**

```typescript
opened_date: bean.opened_date ?? '',
```

**Step 5: normalizeTextForEdit의 key 타입에 opened_date 추가**

`normalizeTextForEdit` 함수의 key 타입 Pick에 `'opened_date'` 추가:
```typescript
key: keyof Pick<
  UpdateBeanInput,
  'name' | 'roastery_name' | 'roast_date' | 'opened_date' | 'variety' | 'process_method' | 'notes'
>,
```

**Step 6: normalizeEditInput에 opened_date 처리 추가**

`normalizeEditInput` 함수 내부, `roastDate` 처리 코드 바로 아래에 추가:
```typescript
const openedDate = normalizeTextForEdit(data, 'opened_date');
if (openedDate !== undefined) input.opened_date = openedDate;
```

**Step 7: 타입 체크**

Run: `pnpm run type-check`
Expected: PASS (또는 UI 컴포넌트 관련 에러만 남음)

**Step 8: 커밋**

```bash
git add lib/validation/beanSchema.ts hooks/useBeanForm.ts lib/beans/normalizeBeanInput.ts
git commit -m "feat(원두): opened_date 유효성 검증, 기본값, 정규화 추가"
```

---

### Task 4: RoastDateSelector 범용화 (title prop 추가)

**Files:**
- Modify: `components/beans/RoastDateSelector.tsx`

**Step 1: Props 인터페이스에 title 추가**

```typescript
interface RoastDateSelectorProps {
  selectedDate: string | null;
  onSelect: (date: string) => void;
  title?: string;
}
```

**Step 2: 컴포넌트에서 title 사용**

props destructuring에 `title = '로스팅 날짜 선택'` 기본값 추가:
```typescript
>(({ selectedDate, onSelect, title = '로스팅 날짜 선택' }, ref) => {
```

하드코딩된 `'로스팅 날짜 선택'` 텍스트를 `{title}`로 교체:
```tsx
<Text style={styles.title}>{title}</Text>
```

**Step 3: 타입 체크**

Run: `pnpm run type-check`
Expected: PASS (기존 사용처는 title 없이 호출하므로 기본값이 적용됨)

**Step 4: 커밋**

```bash
git add components/beans/RoastDateSelector.tsx
git commit -m "refactor(원두): RoastDateSelector에 title prop 추가하여 범용화"
```

---

### Task 5: BeanFormPhase - 개봉일 날짜 선택 UI 추가

**Files:**
- Modify: `components/beans/BeanFormPhase.tsx`

**Step 1: useRef 및 useWatch 추가**

기존 `roastDateRef` 선언 아래에 추가:
```typescript
const openedDateRef = useRef<RoastDateSelectorRef>(null);
```

기존 `roastDate` 선언 아래에 추가:
```typescript
const openedDate = useWatch({ control, name: 'opened_date' });
```

**Step 2: 로스팅 정보 섹션에 개봉일 UI 추가**

`로스팅 날짜` + `배전도` row 아래, `디게싱 기간` row 위에 새 row 추가:

```tsx
<View style={styles.row}>
  <View style={styles.halfInput}>
    <Text style={styles.label}>개봉일</Text>
    <Controller
      control={control}
      name="opened_date"
      render={({ field: { value } }) => (
        <TouchableOpacity
          onPress={() => openedDateRef.current?.expand()}
          style={styles.selector}
        >
          <Text
            style={[styles.selectorText, !value && styles.selectorPlaceholder]}
          >
            {value ? dayjs(value).format('YYYY년 M월 D일') : '날짜 선택'}
          </Text>
          <Ionicons color="#8B4513" name="calendar-outline" size={20} />
        </TouchableOpacity>
      )}
    />
  </View>
</View>
```

**Step 3: BottomSheet 영역에 개봉일 DateSelector 추가**

기존 `<RoastDateSelector>` 아래에 추가:
```tsx
<RoastDateSelector
  onSelect={(date: string) => setValue('opened_date', date)}
  ref={openedDateRef}
  selectedDate={openedDate ?? null}
  title="개봉일 선택"
/>
```

**Step 4: 타입 체크**

Run: `pnpm run type-check`
Expected: PASS

**Step 5: 커밋**

```bash
git add components/beans/BeanFormPhase.tsx
git commit -m "feat(원두): BeanFormPhase에 개봉일 날짜 선택 UI 추가"
```

---

### Task 6: BeanEditForm - 개봉일 날짜 선택 UI 추가

**Files:**
- Modify: `components/beans/BeanEditForm.tsx`

**Step 1: useRef 추가**

기존 `roastDateRef` 선언 아래에 추가:
```typescript
const openedDateRef = useRef<RoastDateSelectorRef>(null);
```

**Step 2: useWatch 추가**

기존 `roastDate` 선언 아래에 추가:
```typescript
const openedDate = useWatch({ control, name: 'opened_date' });
```

**Step 3: 로스팅 정보 섹션에 개봉일 UI 추가**

`로스팅 날짜` + `배전도` row 아래, `디게싱 기간` row 위에 새 row 추가 (BeanFormPhase와 동일한 패턴, 단 `shouldDirty: true` 옵션 포함):

```tsx
<View style={styles.row}>
  <View style={styles.halfInput}>
    <Text style={styles.label}>개봉일</Text>
    <Controller
      control={control}
      name="opened_date"
      render={({ field: { value } }) => (
        <TouchableOpacity
          onPress={() => openedDateRef.current?.expand()}
          style={styles.selector}
        >
          <Text
            style={[styles.selectorText, !value && styles.selectorPlaceholder]}
          >
            {value ? dayjs(value).format('YYYY년 M월 D일') : '날짜 선택'}
          </Text>
          <Ionicons color="#8B4513" name="calendar-outline" size={20} />
        </TouchableOpacity>
      )}
    />
  </View>
</View>
```

**Step 4: BottomSheet 영역에 개봉일 DateSelector 추가**

기존 `<RoastDateSelector>` 아래에 추가:
```tsx
<RoastDateSelector
  onSelect={(date: string) => setValue('opened_date', date, { shouldDirty: true })}
  ref={openedDateRef}
  selectedDate={openedDate ?? null}
  title="개봉일 선택"
/>
```

**Step 5: 타입 체크**

Run: `pnpm run type-check`
Expected: PASS

**Step 6: 커밋**

```bash
git add components/beans/BeanEditForm.tsx
git commit -m "feat(원두): BeanEditForm에 개봉일 날짜 선택 UI 추가"
```

---

### Task 7: BeanDetail - 개봉일 표시

**Files:**
- Modify: `components/beans/BeanDetail.tsx`

**Step 1: 개봉일 포매팅 변수 추가**

기존 `formattedDate` 변수 아래에 추가:
```typescript
const formattedOpenedDate = bean.opened_date
  ? new Date(bean.opened_date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  : null;
```

**Step 2: infoItems 배열에 개봉일 추가**

`formattedDate` 항목 바로 아래에 추가:
```typescript
formattedOpenedDate ? { label: '개봉일', value: formattedOpenedDate } : undefined,
```

**Step 3: 타입 체크**

Run: `pnpm run type-check`
Expected: PASS

**Step 4: 커밋**

```bash
git add components/beans/BeanDetail.tsx
git commit -m "feat(원두): BeanDetail에 개봉일 표시 추가"
```

---

### Task 8: API 쿼리 - BEAN_SELECT에 opened_date 추가

**Files:**
- Modify: `lib/api/beans.ts`

**Step 1: BEAN_SELECT 문자열에 opened_date 추가**

`roast_date,` 라인 아래에 추가:
```
opened_date,
```

**Step 2: 타입 체크**

Run: `pnpm run type-check`
Expected: PASS

**Step 3: 커밋**

```bash
git add lib/api/beans.ts
git commit -m "feat(원두): BEAN_SELECT 쿼리에 opened_date 추가"
```

---

### Task 9: 기존 테스트 업데이트

**Files:**
- Modify: 기존 bean 관련 테스트 파일들

**Step 1: 테스트 파일 확인**

Run: `find __tests__ -name '*bean*' -o -name '*Bean*' | head -20`

**Step 2: 테스트 데이터에 opened_date 추가**

각 테스트 파일에서 Bean 객체를 생성하는 곳에 `opened_date: null` 또는 적절한 날짜값 추가.

**Step 3: 테스트 실행**

Run: `pnpm test`
Expected: PASS

**Step 4: 커밋**

```bash
git add __tests__/
git commit -m "test(원두): 테스트 데이터에 opened_date 필드 반영"
```

---

### Task 10: 최종 검증

**Step 1: 전체 타입 체크**

Run: `pnpm run type-check`
Expected: PASS

**Step 2: 린트 확인**

Run: `pnpm run lint`
Expected: PASS (또는 기존 경고만)

**Step 3: 전체 테스트**

Run: `pnpm test`
Expected: PASS

---

## 설계 결정 사항

1. **AI 분석 제외:** 개봉일은 사용자가 원두를 개봉한 날짜이므로 포장 사진에서 추출 불가. AI 관련 파일(`useBeanAnalysis.ts`, `extract-bean-info/index.ts`, `BeanFieldConfidence`, `AIExtractionResult`)은 수정하지 않음.

2. **RoastDateSelector 재사용:** 새 컴포넌트를 만들지 않고, 기존 `RoastDateSelector`에 `title` prop만 추가하여 `'개봉일 선택'`으로 사용. YAGNI 원칙.

3. **BeanCard 미수정:** 카드 리스트에서 개봉일을 표시할 필요는 없음 (정보 밀도가 이미 높음). 상세 화면(`BeanDetail`)에서만 표시.

4. **필드 위치:** 로스팅 정보 섹션의 "로스팅 날짜 + 배전도" row 아래, "디게싱 기간" row 위에 배치. 날짜 관련 정보가 모여있어 직관적.

5. **Optional 필드:** 기존 원두에 영향 없도록 DB는 nullable, Zod는 optional, 기본값은 빈 문자열(`''`).
