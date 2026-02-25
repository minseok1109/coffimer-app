# Bean Tab PostHog Analytics Design

**Goal:** 내 원두 탭의 사용률과 등록 퍼널을 PostHog 이벤트로 추적한다.

**Scope:** 7개 이벤트 (등록 퍼널 4개 + 상세/수정/삭제 3개)

---

## Event Schema

### Registration Funnel (4 events)

```
bean_add_started → bean_image_captured → bean_ai_analyzed → bean_added
```

| Event | Properties | Trigger |
|-------|-----------|---------|
| `bean_add_started` | (empty) | "+" 버튼 탭 |
| `bean_image_captured` | `image_count`, `source` (camera/gallery) | 이미지 선택/촬영 완료 |
| `bean_ai_analyzed` | `success`, `image_count`, `error_type?`, `duration_ms` | AI 분석 완료 |
| `bean_added` | `bean_id`, `has_images`, `used_ai_analysis`, `field_count` | 원두 등록 성공 |

### Detail/Edit/Delete (3 events)

| Event | Properties | Trigger |
|-------|-----------|---------|
| `bean_viewed` | `bean_id` | 원두 카드 탭 |
| `bean_edited` | `bean_id`, `changed_fields[]` | 수정 저장 성공 |
| `bean_deleted` | `bean_id` | 삭제 확인 탭 |

## Implementation Locations

| File | Events |
|------|--------|
| `app/(tabs)/beans.tsx` | `bean_add_started` |
| `components/beans/BeanCard.tsx` | `bean_viewed` |
| `components/beans/BeanForm.tsx` | `bean_image_captured`, `bean_ai_analyzed` |
| `app/beans/add.tsx` | `bean_added` |
| `app/beans/[id].tsx` | `bean_deleted` |
| `components/beans/BeanEditForm.tsx` | `bean_edited` |

## PostHog Dashboard Analysis

- **Funnel**: `bean_add_started` → `bean_added` (전환율, 이탈 단계)
- **AI 분석**: `bean_ai_analyzed`의 `success` 기준 성공률, 평균 `duration_ms`
- **활용도**: `bean_viewed` / `bean_added` 비율
- **수정 패턴**: `bean_edited.changed_fields` 분포
