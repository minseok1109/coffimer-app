# 원두 관리 기능 설계

> MVP 범위: 사진 촬영 → Gemini 추출 → 수동 보완 → 원두 목록/상세 관리

## 1. 데이터 모델

```sql
create table beans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  name text not null,                    -- 원두 이름
  roastery_name text,                    -- 로스터리명
  roast_date date,                       -- 로스팅 날짜
  roast_level text,                      -- 배전도 (light / medium-light / medium / dark)
  bean_type text,                        -- blend / single_origin
  weight_g numeric not null,             -- 총 무게 (g)
  remaining_g numeric not null,          -- 잔여량 (g) — MVP에선 weight_g와 동일
  price integer,                         -- 가격 (원)
  cup_notes text[],                      -- 컵노트 배열 ["초콜릿", "견과류"]
  image_url text,                        -- 촬영한 원두 봉투 사진
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz                 -- soft delete
);

create index idx_beans_user on beans(user_id, deleted_at);
```

### 설계 포인트

- `remaining_g`를 미리 두되, MVP에서는 `weight_g`와 같은 값으로 초기화만 함
- `cup_notes`는 배열 타입으로 저장해서 필터/검색에 유리하게
- `roast_level`은 텍스트로 유연하게 (Gemini 추출값 대응)

## 2. Supabase Edge Function — Gemini 이미지 분석

```
앱 (사진 촬영) → Supabase Edge Function → Gemini 3.0 Flash → 구조화된 JSON 응답
```

### Edge Function: `extract-bean-info`

```typescript
// supabase/functions/extract-bean-info/index.ts

// 요청: multipart/form-data (이미지 파일)
// 응답: 추출된 원두 정보 JSON

interface ExtractedBeanInfo {
  name: string | null
  roastery_name: string | null
  roast_date: string | null        // ISO date or null
  roast_level: string | null       // "light" | "medium-light" | "medium" | "dark"
  bean_type: string | null         // "blend" | "single_origin" | null
  weight_g: number | null
  price: number | null
  cup_notes: string[] | null
  confidence: Record<string, number>  // 필드별 추출 신뢰도 (0~1)
}
```

### Gemini 프롬프트

```
이 이미지는 커피 원두 봉투 또는 카드입니다.
다음 정보를 JSON으로 추출하세요:

- name: 원두 이름
- roastery_name: 로스터리/브랜드명
- roast_date: 로스팅 날짜 (YYYY-MM-DD)
- roast_level: 배전도 ("light", "medium-light", "medium", "dark" 중 하나)
- bean_type: "blend" 또는 "single_origin"
- weight_g: 무게 (숫자, 그램 단위)
- price: 가격 (숫자, 원 단위)
- cup_notes: 컵노트 배열 (예: ["초콜릿", "견과류"])

각 필드의 confidence를 0~1로 함께 반환하세요.
확인할 수 없는 필드는 null로, confidence는 0으로 설정하세요.
```

### 핵심 설계

- Gemini에게 구조화된 JSON 출력을 요청
- 각 필드별 `confidence` 점수 반환 → 신뢰도 낮은 필드는 수동 입력 강조
- 이미지는 Edge Function에서 base64 변환 후 Gemini API로 전달
- API 키는 Supabase 환경변수로 관리 (`GEMINI_API_KEY`)

### 에러 처리

- Gemini 응답 실패 시 → 빈 폼 반환 (전체 수동 입력 모드)
- 이미지가 원두 봉투가 아닌 경우 → 모든 필드 `null` + 안내 메시지

## 3. 화면 구성 & 네비게이션

```
app/(tabs)/beans.tsx      — 내 원두 목록 (6번째 탭)
app/beans/[id].tsx        — 원두 상세
app/beans/add.tsx         — 원두 등록 (촬영 + 폼)
```

### 3-1. 내 원두 목록 (beans.tsx)

- 잔여량 기준 정렬 (보유 중 → 소진됨)
- 카드에 썸네일(촬영 사진), 원두명, 로스터리, 배전도, 잔여량 표시
- 소진된 원두는 "소진됨" 뱃지 표시, 목록에 유지 (히스토리 겸용)
- 헤더에 [+] 등록 버튼

### 3-2. 원두 등록 플로우 (beans/add.tsx)

```
[사진 촬영/갤러리] → [Gemini 분석 중...] → [결과 + 수동 입력 폼] → [등록하기]
```

- `expo-image-picker`로 촬영/갤러리 선택
- 분석 중 로딩 상태 표시
- 폼에 추출값 프리필 → 사용자 검증/수정 → 저장

### 3-3. 원두 상세 (beans/[id].tsx)

- 촬영 사진 크게 표시
- 전체 원두 정보 + 잔여량
- 수정/삭제 액션

## 4. 컴포넌트 & 파일 구조

```
components/beans/
  BeanCard.tsx            — 목록용 카드 (썸네일, 이름, 잔여량, 뱃지)
  BeanForm.tsx            — 등록/수정 폼 (필드별 신뢰도 표시)
  BeanDetail.tsx          — 상세 정보 표시
  CupNoteTag.tsx          — 컵노트 태그 칩
  ConfidenceBadge.tsx     — 신뢰도 낮은 필드 하이라이트 표시
  index.ts                — barrel export

hooks/
  useBeans.ts             — 원두 CRUD + React Query
  useBeanExtract.ts       — Gemini 추출 API 호출 + 로딩 상태

lib/api/
  beans.ts                — Supabase 원두 CRUD 함수

types/
  bean.ts                 — Bean, CreateBeanInput, ExtractedBeanInfo 타입

supabase/functions/
  extract-bean-info/
    index.ts              — Edge Function
```

### 기존 코드베이스 패턴 준수

- `lib/api/beans.ts` — `recipes.ts`, `events.ts`와 동일한 패턴
- `useBeans.ts` — `useRecipes.ts`와 같은 React Query 훅 구조
- `components/beans/` — barrel export 패턴
- `types/bean.ts` — `types/recipe.ts`와 같은 인터페이스 정의 방식

### 이미지 업로드

- `expo-image-picker`로 촬영/갤러리 선택
- Supabase Storage에 이미지 업로드 → `image_url` 저장
- Edge Function에는 이미지 파일 직접 전달

## 5. 폼 UX — 신뢰도 기반 표시

### 규칙

- `confidence >= 0.7` → 프리필 + 녹색 체크 (수정 가능)
- `confidence < 0.7` → 프리필 + "확인필요" 노란 뱃지
- `null` → 빈 필드 + "직접 입력" 안내
- 모든 필드는 사용자가 자유롭게 수정 가능
- `name`과 `weight_g`만 필수, 나머지는 선택

## 6. MVP 구현 단계

```
Phase 1 — 기반 작업
  ├── Supabase 마이그레이션 (beans 테이블 생성)
  ├── types/bean.ts 타입 정의
  └── lib/api/beans.ts CRUD 함수

Phase 2 — Edge Function
  ├── extract-bean-info Edge Function 작성
  ├── Gemini 3.0 Flash 프롬프트 + JSON 파싱
  └── Supabase Storage 이미지 업로드 설정

Phase 3 — 화면 구현
  ├── components/beans/ 컴포넌트 작성
  ├── hooks/useBeans.ts, useBeanExtract.ts
  ├── app/(tabs)/beans.tsx 목록 화면
  ├── app/beans/add.tsx 등록 화면 (촬영 + 폼)
  └── app/beans/[id].tsx 상세 화면

Phase 4 — 탭 연동
  └── app/(tabs)/_layout.tsx에 6번째 탭 추가
```

## 7. 향후 확장 (MVP 이후)

- 드립 기록 + 수동 차감 (`remaining_g` 업데이트)
- 타이머 완료 후 원두 선택 연동
- 원두별 사용 히스토리
- 소진 알림
