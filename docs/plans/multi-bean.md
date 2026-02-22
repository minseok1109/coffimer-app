# Bean Multi-Image Analysis 구현 계획서 (재작성본, Pre-Prod 기준)

## 요약
단일 이미지 기반 원두 분석/저장 구조를 멀티 이미지(최대 5장) 구조로 전환한다.  
이번 1차 범위는 **등록(Add) + 조회(List/Detail)** 까지이며, **이미지 수정(Edit 이미지 CRUD)** 는 2차로 분리한다.  
저장 실패 정책은 **전체 롤백(all-or-nothing)** 으로 고정한다.

## 확정 결정 사항
- 저장 정책: 한 장이라도 업로드/DB 반영 실패 시 전체 취소 + 업로드 성공분 즉시 삭제
- 배포 전제: 아직 프로덕션 전, 기존 `beans.image_url` 데이터 보존 불필요
- 1차 범위: 등록 + 조회
- 1차 정렬 UX: 선택 순서 고정(드래그 정렬 미포함), 대표 이미지 지정만 지원
- 최대 이미지 수: 5장
- AI 분석: 선택된 이미지 전체를 한 번에 Edge Function으로 전송해 종합 추론

## 범위
### In Scope (1차)
- 멀티 이미지 캡처/선택/대표 지정
- 멀티 이미지 AI 분석
- 멀티 이미지 업로드 및 `bean_images` 저장
- List/Detail에서 대표 이미지 및 갤러리 조회
- DB 제약/RLS/검증 쿼리/테스트

### Out of Scope (2차)
- 기존 Bean 수정 화면에서 이미지 추가/삭제/재정렬
- soft delete 이후 storage 오브젝트 지연 정리 배치 작업
- 이미지 순서 드래그 정렬 UX

---

## 공개 인터페이스/타입 변경 (중요)
### 1) Edge Function 계약
- 요청:
```ts
type AnalyzeBeanImagesRequest = {
  images: Array<{
    base64: string;
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  }>;
};
```
- 응답: 기존 `AIExtractionResult` 유지 (호환), 단 입력은 배열로 변경

### 2) 앱 타입
- `/Users/ms.bang/Documents/project/personal/coffimer-app/types/bean.ts`
  - `Bean.image_url` 제거
  - `Bean.images: BeanImage[]` 추가
```ts
type BeanImage = {
  id: string;
  bean_id: string;
  user_id: string;
  image_url: string;
  storage_path: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};
```
- `/Users/ms.bang/Documents/project/personal/coffimer-app/lib/validation/beanSchema.ts`
  - `ImageData` 단일 객체 -> 배열 지원 타입 추가
```ts
type EncodedImageData = { base64: string; mimeType: string };
```

### 3) API 함수
- `/Users/ms.bang/Documents/project/personal/coffimer-app/lib/api/beanAnalysis.ts`
  - `analyzeBeanImage(base64, mimeType)` -> `analyzeBeanImages(images)`
- `/Users/ms.bang/Documents/project/personal/coffimer-app/lib/storage/beanImage.ts`
  - `uploadBeanImage` -> `uploadBeanImages` + `deleteBeanImagesByPaths`
- `/Users/ms.bang/Documents/project/personal/coffimer-app/lib/api/beans.ts`
  - 단순 `insert` 대신 RPC `create_bean_with_images` 호출

---

## 데이터 모델/DB 설계 (결정 완료)
### 신규 테이블
```sql
CREATE TABLE bean_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bean_id UUID NOT NULL REFERENCES beans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  sort_order SMALLINT NOT NULL CHECK (sort_order BETWEEN 0 AND 4),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_bean_images_primary
  ON bean_images (bean_id) WHERE is_primary = true;

CREATE UNIQUE INDEX uq_bean_images_sort
  ON bean_images (bean_id, sort_order);

CREATE INDEX idx_bean_images_user_bean
  ON bean_images (user_id, bean_id);
```

### 제약 트리거
- 원두당 이미지 5장 초과 차단 트리거 추가
- `updated_at` 자동 갱신 트리거 추가

### RLS
- `SELECT/UPDATE/DELETE` 모두 아래 조건 강제:
  - `auth.uid() = user_id`
  - 대상 `bean_id`가 본인 소유이고 `beans.deleted_at IS NULL`
- `INSERT`도 동일 조건 + 소유권 검증

### beans 컬럼 정리 (Pre-Prod)
- `beans.image_url`는 마이그레이션에서 제거
- 백필/dual-read/dual-write는 수행하지 않음 (사용자 결정 반영)

---

## 서버 트랜잭션 설계
### RPC: `create_bean_with_images`
입력:
- `p_bean_id uuid`
- `p_bean jsonb` (bean 필드)
- `p_images jsonb` (image_url, storage_path, sort_order, is_primary)

동작 (단일 트랜잭션):
1. `auth.uid()` 검증
2. 이미지 개수 1~5 검증
3. 대표 이미지 정확히 1개 검증
4. `sort_order` 연속성(0..n-1) 검증
5. `beans` insert
6. `bean_images` bulk insert
7. 생성된 bean + images 반환

실패 시 전체 rollback.

---

## 클라이언트 저장 흐름 (All-or-Nothing)
1. 사용자가 최대 5장 선택
2. `useBeanAnalysis`가 각 이미지를 인코딩 후 `analyzeBeanImages(images)` 1회 호출
3. 제출 시 클라이언트에서 `beanId` 선생성(UUID)
4. `uploadBeanImages`로 병렬 업로드
5. 업로드 하나라도 실패:
   - 성공분 `deleteBeanImagesByPaths` 즉시 실행
   - 저장 중단 + 오류 표시
6. 업로드 전부 성공:
   - RPC `create_bean_with_images` 호출
7. RPC 실패:
   - 업로드 성공분 전량 삭제
   - 저장 실패 처리
8. RPC 성공:
   - 캐시 갱신 후 완료

---

## 성능/안정성 기준 (고정값)
### 클라이언트 인코딩
- 리사이즈: max width 1024
- JPEG 품질: 0.6
- 다중 이미지 순차 인코딩(메모리 스파이크 완화)

### Edge Function 검증
- 이미지 개수: 1~5
- 이미지 1장 base64 길이: 최대 1,500,000 chars
- 총 base64 길이: 최대 6,000,000 chars
- API timeout: 40초
- 실패 코드 구분: 400(입력), 413(크기), 504(타임아웃), 502(LLM 응답 불량)

### 재시도
- 클라이언트: 분석 요청 1회 자동 재시도(지수 백오프 500ms)
- 업로드: 파일별 최대 1회 재시도 후 실패 처리

---

## 파일별 구현 계획
### DB/백엔드
- `/Users/ms.bang/Documents/project/personal/coffimer-app/supabase/migrations/<new>_bean_images.sql`
  - `bean_images` 생성, 제약/인덱스/RLS/트리거, `beans.image_url` 제거
- `/Users/ms.bang/Documents/project/personal/coffimer-app/supabase/migrations/<new>_create_bean_with_images_rpc.sql`
  - 트랜잭션 RPC 추가
- `/Users/ms.bang/Documents/project/personal/coffimer-app/supabase/functions/extract-bean-info/index.ts`
  - 배열 payload 수용, 용량 검증, 멀티 이미지 prompt 구성

### 클라이언트 API/타입
- `/Users/ms.bang/Documents/project/personal/coffimer-app/types/bean.ts`
- `/Users/ms.bang/Documents/project/personal/coffimer-app/types/database.ts` (regen)
- `/Users/ms.bang/Documents/project/personal/coffimer-app/lib/api/beanAnalysis.ts`
- `/Users/ms.bang/Documents/project/personal/coffimer-app/lib/api/beans.ts`
- `/Users/ms.bang/Documents/project/personal/coffimer-app/lib/storage/beanImage.ts`
- `/Users/ms.bang/Documents/project/personal/coffimer-app/hooks/useBeans.ts`

### UI/훅
- `/Users/ms.bang/Documents/project/personal/coffimer-app/hooks/useImageCapture.ts`
  - 다중 선택 + 5장 제한
- `/Users/ms.bang/Documents/project/personal/coffimer-app/hooks/useBeanAnalysis.ts`
  - 배열 분석 + 배열 인코딩 데이터 보관
- `/Users/ms.bang/Documents/project/personal/coffimer-app/components/beans/BeanForm.tsx`
  - 단일 `imageUri` -> 다중 `images` 상태
- `/Users/ms.bang/Documents/project/personal/coffimer-app/app/beans/add.tsx`
  - 단일 업로드 -> batch 업로드 + RPC 저장
- `/Users/ms.bang/Documents/project/personal/coffimer-app/components/beans/BeanCard.tsx`
  - 대표 이미지(`is_primary`) 렌더
- `/Users/ms.bang/Documents/project/personal/coffimer-app/components/beans/BeanDetail.tsx`
  - 페이지형 갤러리 + 인디케이터

---

## 테스트 케이스/시나리오
### DB
1. 같은 bean에 `is_primary=true` 2건 삽입 시 실패
2. 같은 bean에 `sort_order` 중복 삽입 시 실패
3. 같은 bean에 6장 삽입 시 실패
4. 타 사용자 bean_id로 insert/update/delete 시 RLS 차단

### Edge Function
1. 1장/3장/5장 정상 입력 성공
2. 이미지 배열 누락/빈 배열/6장 입력 400
3. per-image/total 사이즈 초과 413
4. LLM timeout 504, JSON 파싱 실패 502

### 클라이언트 유닛
1. `uploadBeanImages` 일부 실패 시 성공분 삭제 호출 검증
2. `useBeanAnalysis`가 배열을 1회 API 호출로 전송하는지 검증
3. `normalizeInput`에서 `image_url` 제거 후 정상 동작 검증

### 통합(등록 플로우)
1. 3장 선택 → 분석 → 저장 성공 → list/detail에 3장 반영
2. 3장 중 1장 업로드 실패 → bean 생성 안 됨 + 업로드 롤백
3. RPC 실패 강제 → 업로드 롤백 + 오류 메시지 노출

### 회귀
1. 이미지 없이 수동 등록 가능
2. 기존 detail/list 기본 placeholder 동작 유지
3. type-check 통과

---

## 단계별 실행 순서
1. DB 마이그레이션 + RPC + 타입 재생성
2. Edge Function 멀티 이미지 계약 반영
3. 클라이언트 API/스토리지/훅 전환
4. Add 화면 멀티 이미지 저장 플로우 적용
5. List/Detail 갤러리 반영
6. 테스트/검증/QA 완료

각 단계 완료 조건:
- 단계별 테스트 통과 + 수동 시나리오 1개 이상 통과 시 다음 단계 진행

---

## 명시적 가정/기본값
- 프로덕션 사용자 데이터 이관은 필요 없음
- 기존 `beans.image_url`는 즉시 제거해도 됨
- 1차에서는 Edit 이미지 CRUD를 구현하지 않음
- 이미지 순서 변경 UX(드래그)는 1차에서 제외
- 실패 정책은 정합성 우선의 전체 롤백으로 고정
