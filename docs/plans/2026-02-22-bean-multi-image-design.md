# Bean Multi-Image Upload Design

> 하나의 원두에 여러 장의 사진을 첨부하여 AI 분석 정확도를 높이고, 저장된 이미지를 갤러리로 열람할 수 있는 기능

## 핵심 결정 사항

| 항목 | 결정 |
|------|------|
| 목적 | AI 분석 정확도 향상 (한 장에 다 담을 수 없는 정보를 여러 장으로) |
| 저장 | 분석에 사용한 모든 이미지를 DB에 저장 |
| 최대 이미지 수 | 5장 |
| 선택 UX | 한 번에 여러 장 선택 (갤러리 다중 선택, 촬영 연속) |
| AI 분석 방식 | 여러 장을 한 번에 Edge Function에 전송, 종합 분석 |
| 대표 이미지 | 사용자가 직접 선택 |

---

## 1. DB Schema

### bean_images 테이블

```sql
CREATE TABLE bean_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bean_id UUID NOT NULL REFERENCES beans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 한 원두에 대표 이미지는 최대 1개
CREATE UNIQUE INDEX idx_bean_images_primary
  ON bean_images (bean_id) WHERE is_primary = true;

-- 원두별 이미지 조회 (정렬 포함)
CREATE INDEX idx_bean_images_bean_id
  ON bean_images (bean_id, sort_order);

-- RLS 성능을 위한 user_id 인덱스
CREATE INDEX idx_bean_images_user_id
  ON bean_images (user_id);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER set_bean_images_updated_at
  BEFORE UPDATE ON bean_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### RLS 정책

```sql
ALTER TABLE bean_images ENABLE ROW LEVEL SECURITY;

-- 본인 이미지만 조회
CREATE POLICY "Users can view own bean images"
  ON bean_images FOR SELECT
  USING (auth.uid() = user_id);

-- 본인 원두에만 이미지 추가 (소유권 + soft delete 검증)
CREATE POLICY "Users can insert own bean images"
  ON bean_images FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM beans
      WHERE beans.id = bean_id
      AND beans.user_id = auth.uid()
      AND beans.deleted_at IS NULL
    )
  );

-- 본인 이미지만 수정/삭제
CREATE POLICY "Users can update own bean images"
  ON bean_images FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bean images"
  ON bean_images FOR DELETE
  USING (auth.uid() = user_id);
```

### 설계 근거

- 별도 테이블: `TEXT[]`/JSONB보다 개별 이미지 CRUD가 쉽고 메타데이터 확장이 자연스러움
- `sort_order`로 순서 관리, `is_primary`로 대표 이미지 지정
- Soft delete는 `bean_images`에 두지 않음 — `beans.ON DELETE CASCADE` + soft delete 시 조인으로 필터
- 최대 5장 제한은 앱 레벨에서 처리
- INSERT 정책에서 `beans` 소유권 검증으로 다른 사용자 원두에 이미지 끼워넣기 방지

---

## 2. Edge Function & 이미지 업로드 흐름

### AI 분석 (Edge Function 변경)

```typescript
// 현재: { image: string, mimeType: string }
// 변경: { images: Array<{ base64: string, mimeType: string }> }
```

AI 프롬프트에 "여러 이미지를 종합적으로 분석하여 하나의 결과를 반환하라" 지시를 추가. 앞면에서 원두 이름, 뒷면에서 컵노트와 프로세스 정보를 각각 추출.

### 이미지 업로드 흐름

```
1. (+) 버튼 → /beans/add
2. Capture Phase에서 촬영 or 갤러리 (여러 장 선택 가능, 최대 5장)
   - 갤러리: expo-image-picker의 allowsMultipleSelection 옵션
   - 촬영: 1장 촬영 후 "더 추가?" → 반복 (최대 5장)
3. 선택한 이미지들 미리보기 표시 (추가/삭제/순서변경 가능)
4. "분석하기" → 모든 이미지를 Edge Function에 전송
5. AI 분석 결과로 폼 자동 완성
6. 제출 시:
   - 각 이미지를 Supabase Storage에 병렬 업로드 (Promise.allSettled)
   - Bean 레코드 생성
   - bean_images 레코드들 일괄 생성 (사용자 지정 대표 이미지)
```

### 주요 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `hooks/useImageCapture.ts` | 다중 이미지 선택/촬영 지원 |
| `hooks/useBeanAnalysis.ts` | 여러 이미지 base64 관리, Edge Function에 배열 전송 |
| `lib/storage/beanImage.ts` | 병렬 업로드 함수 추가 (`uploadBeanImages`) |
| `lib/api/beans.ts` | bean 생성 후 `bean_images` 레코드 일괄 insert |
| `supabase/functions/extract-bean-info` | 다중 이미지 수신 및 종합 분석 |

### 업로드 에러 처리

- `Promise.allSettled`로 병렬 업로드, 성공한 이미지만 `bean_images`에 저장
- 실패 시 "N장 중 M장 업로드 성공" 알림
- 최소 1장은 성공해야 bean 생성 진행 (전부 실패 시 에러)

---

## 3. UI 컴포넌트

### 3-1. Capture Phase — 다중 이미지 선택

**초기 상태 (0장):** 기존 UI 유지, 갤러리에서 다중 선택 허용

**이미지 선택 후 (1~5장):** dashed 영역이 썸네일 그리드로 변환

```
┌──────────────────────────────────────┐
│  선택한 사진 (2/5)                    │
│                                      │
│  ┌────────┐  ┌────────┐  ┌──────┐  │
│  │  img1  │  │  img2  │  │  +   │  │
│  │  ⭐ ✕  │  │     ✕  │  │ 추가  │  │
│  └────────┘  └────────┘  └──────┘  │
│                                      │
│  ⭐ = 대표 이미지 (탭하여 변경)        │
│                                      │
│  ┌─────────────────────────────┐    │
│  │         분석하기 →           │    │
│  └─────────────────────────────┘    │
│                                      │
│       사진 없이 직접 입력             │
└──────────────────────────────────────┘
```

### 3-2. 썸네일 그리드 상세

단일 썸네일 (104x104):
- `expo-image` + `contentFit="cover"` + `cachePolicy="memory-disk"`
- `borderRadius: 12`
- ✕ 버튼: `position: absolute`, top-right, 24x24 + hitSlop 10, `rgba(0,0,0,0.5)` 배경
- ⭐ 대표 표시: 좌하단 pill, gold `#FBBF24`
- 탭 → 대표 이미지 변경
- ✕ → 이미지 제거 (마지막 1장이면 초기 상태로 복귀)
- `+` 카드: dashed border, `#D1D5DB`, `#FAFAFA` 배경, 5장 도달 시 숨김

### 3-3. Analyzing Phase — 다중 이미지 프리뷰

- `FlatList` + `pagingEnabled` + `horizontal`로 스와이프 (외부 라이브러리 불필요)
- 페이지 인디케이터: `#8B4513` (active) / `#D1D5DB` (inactive), 8px dot
- 메시지: "AI가 N장의 사진을 종합 분석 중입니다..."

### 3-4. Bean Detail — 이미지 갤러리

- 기존 `heroContainer` (256px)를 스와이프 갤러리로 교체
- 대표 이미지(`is_primary`)가 첫 번째 표시
- 나머지 `sort_order` 순서
- 우하단 `1/3` 카운터 pill (기존 `roastPill`과 동일 스타일)
- 이미지 탭 → 풀스크린 뷰어 (Modal)

### 3-5. 풀스크린 이미지 뷰어

- `Modal` + `transparent` 배경 (black 0.95)
- 핀치 줌: `react-native-gesture-handler` (이미 설치됨)
- 닫기 버튼: 44x44 touch target
- 좌우 스와이프 이미지 전환

### 3-6. Bean Edit — 이미지 관리

- Capture Phase의 썸네일 그리드 재사용
- 기존 이미지: `image_url`로 표시
- 새 이미지: 로컬 URI → 제출 시 업로드
- 삭제: `deletedImageIds` 배열에 추가
- 대표 변경 가능

### 3-7. 컴포넌트 목록

| 컴포넌트 | 용도 | 재사용 |
|---------|------|--------|
| `ImageThumbnailGrid` | 썸네일 그리드 (추가/삭제/대표 지정) | Capture Phase, Edit Form |
| `ImagePageViewer` | 가로 스와이프 이미지 뷰 | Analyzing Phase, Bean Detail |
| `PageIndicator` | 도트 인디케이터 | ImagePageViewer 내부 |
| `FullScreenImageModal` | 풀스크린 줌 뷰어 | Bean Detail |

### UX 가이드라인 적용

| 규칙 | 적용 |
|------|------|
| Touch Target 최소 44x44 | 모든 버튼 `minHeight: 48`, ✕ 버튼 44x44 hitSlop 포함 |
| Touch Spacing 최소 8px | 썸네일 간 `gap: 12` |
| expo-image 사용 | 썸네일/뷰어에 `expo-image` + `cachePolicy="memory-disk"` |
| 이미지 dimensions 명시 | 썸네일 `width/height` 고정 (레이아웃 시프트 방지) |

---

## 4. 데이터 마이그레이션

### 마이그레이션 SQL

```sql
-- Step 1: bean_images 테이블 생성 (위 스키마)
-- Step 2: 기존 데이터 이전
INSERT INTO bean_images (bean_id, user_id, image_url, sort_order, is_primary)
SELECT id, user_id, image_url, 0, true
FROM beans
WHERE image_url IS NOT NULL
  AND deleted_at IS NULL;

-- Step 3: 검증 후 beans.image_url 컬럼 제거
ALTER TABLE beans DROP COLUMN image_url;
```

Step 2와 3 사이에 앱 업데이트 배포가 필요. 과도기에는 양쪽 모두 읽을 수 있도록 fallback 처리.

---

## 5. 구현 순서

### Phase 1: DB & API 기반 (의존성 없음)

- [ ] bean_images 마이그레이션 SQL 작성 및 적용
- [ ] RLS 정책 적용
- [ ] `lib/api/beanImages.ts` 생성: `getByBeanId`, `createMany`, `updatePrimary`, `deleteImage`
- [ ] `types/bean.ts`에 `BeanImage` 인터페이스 추가, `Bean`에 `images: BeanImage[]`
- [ ] `useBeans.ts` 쿼리를 nested select로 변경: `beans(*, bean_images(*))`

### Phase 2: 이미지 업로드 (Phase 1 완료 후)

- [ ] `uploadBeanImages`: `Promise.allSettled`로 병렬 업로드
- [ ] `useImageCapture`: `allowsMultipleSelection: true`, `selectionLimit: 5`, 촬영 루프
- [ ] `useBeanAnalysis`: `imageDataRef`를 배열로 변경, Edge Function에 배열 전송

### Phase 3: UI 컴포넌트 (Phase 1과 병렬 가능)

- [ ] `ImageThumbnailGrid` 컴포넌트
- [ ] `ImagePageViewer` 컴포넌트
- [ ] `PageIndicator` 컴포넌트
- [ ] `FullScreenImageModal` 컴포넌트

### Phase 4: 통합 (Phase 1, 2, 3 모두 완료 후)

- [ ] `BeanCapturePhase` 교체
- [ ] `BeanAnalyzingPhase` 교체
- [ ] `BeanDetail` hero 교체
- [ ] `BeanEditForm` 이미지 관리
- [ ] `BeanCard` 대표 이미지 연동

### Phase 5: 마무리 (Phase 4 완료 후)

- [ ] Edge Function 다중 이미지 지원
- [ ] `beans.image_url` 컬럼 제거 마이그레이션
- [ ] 기존 데이터 마이그레이션 검증
- [ ] `pnpm run type-check` 통과 확인

> Phase 1과 Phase 3은 병렬 진행 가능

---

## 6. 리스크 & 대응

| 리스크 | 대응 |
|--------|------|
| 마이그레이션 중 데이터 유실 | `image_url` 컬럼은 Phase 5에서 마지막에 제거 |
| 5장 동시 업로드 시 메모리 | 이미지 리사이즈 (max 1280px) + JPEG 0.7 압축 유지 |
| Edge Function 타임아웃 | 5장 x base64 크기 고려, 필요시 이미지 해상도 추가 축소 |
| 기존 사용자 호환 | `images` 배열이 비어있으면 기존 `image_url` fallback (과도기) |
