# Bean Detail 신규 필드 표시 구현 계획 문서 수정안 (v2)

## 요약
기존 계획의 핵심(신규 필드 저장/표시)은 유지하되, `vercel-react-native-skills` 기준으로 아래 4가지를 문서에 추가 반영한다.
1. `degassing_days=0` 안전 동작을 명시해 런타임 분기/표시를 결정 완료
2. `BeanDetail` 이미지 렌더링을 `expo-image`로 전환
3. 상세 `ScrollView`의 safe-area/inset 처리 원칙 명시
4. 수동 QA 외 최소 자동 테스트 범위 추가

---

## 문서 수정 대상
- `/Users/ms.bang/Documents/project/personal/coffimer-app/docs/plans/2026-02-18-bean-detail-new-fields.md`

---

## 섹션별 수정 명세

### 1) 목표/범위 섹션 보강
기존 목표 문장 뒤에 다음을 추가한다.
- “`degassing_days=0` 케이스에서 크래시 없이 일관된 UI를 제공한다.”
- “`BeanDetail` 이미지 렌더링을 `expo-image` 기반으로 통일한다.”
- “상세 스크롤 레이아웃의 safe-area/inset 처리를 네이티브 방식으로 정리한다.”

`범위 > 포함`에 아래 항목 추가:
- `degassing_days=0` 전용 렌더링 분기 및 계산 안정화
- `BeanDetail`의 `react-native` `Image` → `expo-image` 전환
- `ScrollView` inset/safe-area 설정 보정
- 최소 자동 테스트(Jest) 추가

`범위 > 제외`에 아래 항목 추가:
- 리스트 성능 최적화(FlashList 전환 등)
- 네비게이터 구조 변경(native stack/tabs 전환)

---

### 2) Task 1 (저장 경로 보장) 보강
기존 내용 유지 + 아래를 추가한다.
- `normalizeText`를 `roastery_name`, `roast_date`, `variety`, `process_method`, `notes`에 일관 적용
- `degassing_days`는 `number` 타입일 때만 유지, 그 외 `null` 처리
- `normalizeInput` 결과 타입은 `CreateBeanInput`로 고정
- `types/database.ts` 동기화 항목을 “권장”이 아닌 “동일 PR 내 반영”으로 승격  
  (`beans.Row/Insert/Update`에 `variety`, `process_method`, `notes` 포함)

---

### 3) Task 2 (기본 정보 표시) 보강
기존 `variety/process_method` 행 추가 요구 유지 + 조건식을 명시적으로 변경:
- `value.length > 0 ? <Row/> : null` 형태 사용
- `0`/빈문자열 누수 방지를 위해 `&&` 단축 렌더링을 지양(문서에 규칙 근거 명시)

---

### 4) Task 3 (디게싱 섹션) 완전 재정의
기존 문구를 아래 기준으로 교체한다.

#### 4-1. 게이트 변수
- `hasDegassingSetting = bean.degassing_days !== null`
- `hasTimelineData = Boolean(degassingInfo && degassingDetail)`
- `showDegassingSection = hasDegassingSetting || hasTimelineData`

#### 4-2. `degassing_days=0` 동작(확정)
- 설정값 행(`디게싱 기간 설정: 0일`)은 표시
- 타임라인(`DegassingTimeline`, phase, message)은 표시하지 않음
- 안내 문구: “디게싱 0일 설정으로 즉시 음용 가능 상태입니다.”
- 이 케이스에서 계산식이 `0` 분모를 만들지 않도록 방어 조건을 문서에 명시

#### 4-3. `roast_date` 없음 케이스
- `degassing_days`만 있을 때 설정값 행 + 안내 문구 표시
- 타임라인 관련 블록은 렌더하지 않음

#### 4-4. 보조 수정 항목(명시)
- `utils/degassingUtils.ts`에 0일/분모 0 방지 로직 추가
- 필요 시 `DegassingTimeline` 컴포넌트에 `optimalEnd <= 0` 가드 추가(방어적 코딩)

---

### 5) Task 4 (메모 섹션) 유지 + 조건식 명시
기존 유지하되 조건식은 아래로 고정:
- `notes.length > 0 ? <Section/> : null`
- `selectable` 유지
- 긴 텍스트 줄바꿈/스크롤 간섭 없음 QA 항목 포함

---

### 6) 신규 Task 5: UI 패턴 정렬 (expo-image + scroll inset)
새 태스크를 추가한다.

#### 6-1. 이미지
- `/Users/ms.bang/Documents/project/personal/coffimer-app/components/beans/BeanDetail.tsx`
- `import { Image } from 'react-native'` 제거
- `import { Image } from 'expo-image'` 사용
- `contentFit="cover"`와 `transition` 지정(값은 구현 시점 결정, 기본 200ms 권장)

#### 6-2. 스크롤/safe-area
- `BeanDetail` 루트 `ScrollView`에 `contentInsetAdjustmentBehavior="automatic"` 적용
- 하단 여백이 동적이면 `contentInset`/`scrollIndicatorInsets` 사용 원칙을 문서에 명시
- 고정 `marginBottom` 값 의존도를 줄이는 방향으로 정리

---

### 7) 검증 섹션 개편
기존 `type-check + 수동 QA`를 아래로 확장한다.

#### 7-1. 정적 검증
- `pnpm run type-check`
- `pnpm run lint` (가능 시)

#### 7-2. 자동 테스트 (신규)
- Jest 기준 최소 2건:
1. `normalizeInput` 테스트: 공백 문자열 → `null`, `degassing_days` 타입 정규화
2. `BeanDetail` 렌더링 테스트:
   - `degassing_days=0` → 설정값 + 즉시음용 문구, 타임라인 미노출
   - `degassing_days=14` + `roast_date` 없음 → 안내 문구 노출
   - `variety/process_method/notes` 공백 → 미노출

테스트 파일 권장 경로:
- `/Users/ms.bang/Documents/project/personal/coffimer-app/components/beans/__tests__/BeanDetail.test.tsx`
- `/Users/ms.bang/Documents/project/personal/coffimer-app/app/beans/__tests__/add.normalizeInput.test.ts`

#### 7-3. 수동 QA
기존 5개 케이스를 유지하되 3번(0일 케이스)을 아래로 교체:
- `degassing_days=0`, `roast_date` 있음: 설정값 `0일` + “즉시 음용 가능” 문구, 타임라인 미표시

---

## 공개 API/타입 영향 (문서에 명시)
- `BeanDetail` 컴포넌트 public props 변경 없음 (`bean: Bean` 유지)
- `CreateBeanInput` 시그니처 변경 없음(기존 optional 필드 활용)
- `Database` 타입 정의(`types/database.ts`)는 스키마와 동기화 필수
- `degassingUtils`는 내부 동작 변경(0일 가드) 있으나 외부 함수 시그니처는 유지

---

## 수용 기준 (Acceptance Criteria)
1. 신규 4개 필드가 등록 시 DB에 저장되고 상세 화면에서 조건부 표시된다.
2. `degassing_days=0`에서 크래시/NaN/비정상 타임라인 없이 결정된 UX로 렌더링된다.
3. `BeanDetail` 이미지는 `expo-image`를 사용한다.
4. 상세 스크롤은 safe-area/inset 규칙을 따른다.
5. 자동 테스트 2건 이상 + 기존 수동 QA 시나리오 통과.

---

## 가정 및 기본값
- `degassing_days=0`는 “즉시 음용” 의미로 취급한다.
- 0일 케이스는 타임라인보다 안내형 UI가 우선이다.
- Jest 환경에서 RN 컴포넌트 렌더 테스트가 가능한 상태를 전제로 한다(기존 `jest-expo` 사용).
- 이번 문서 수정 범위에 디자인 리뉴얼/네비게이션 구조 변경은 포함하지 않는다.
