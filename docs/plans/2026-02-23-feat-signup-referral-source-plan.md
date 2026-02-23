---
title: "feat: 회원가입 유입 경로 수집"
type: feat
status: completed
date: 2026-02-23
brainstorm: docs/brainstorms/2026-02-23-referral-source-brainstorm.md
---

# feat: 회원가입 유입 경로 수집

## Overview

회원가입 폼에 "어디서 알고 오셨나요?" 유입 경로 선택 항목을 추가한다. 기존 앱의 바텀 시트 패턴을 재사용하여 일관된 UX를 유지하면서, 마케팅 채널별 유입 효과를 파악할 수 있게 한다.

## Problem Statement / Motivation

현재 사용자가 어떤 경로로 앱을 알게 되었는지 파악할 방법이 없다. 유입 경로 데이터를 수집하면 효과적인 마케팅 채널을 식별하고 리소스를 집중할 수 있다.

## Proposed Solution

회원가입 폼의 비밀번호 확인 필드와 가입 버튼 사이에 유입 경로 선택 필드를 추가한다. 필드를 터치하면 바텀 시트가 열리고, 5개 사전 정의 옵션 + 직접 입력(기존 DripperBottomSheet의 상단 텍스트 입력 패턴)을 제공한다.

## Technical Considerations

### 핵심 설계 결정

| 항목 | 결정 | 근거 |
|------|------|------|
| 필수 여부 | 선택 입력 | 가입 이탈율 최소화 |
| UI 패턴 | 바텀 시트 (DripperBottomSheet 패턴 재사용) | 앱 내 일관성 |
| "기타" 구현 | 바텀 시트 상단 텍스트 입력 (기존 패턴) | DripperBottomSheet에 이미 존재하는 패턴, "기타" 별도 옵션 불필요 |
| 저장값 형식 | 영문 스네이크 케이스 키 | 라벨 변경에 독립적인 안정적 분석 키 |
| DB 저장 | users 테이블 `referral_source` nullable text 컬럼 | 단순한 구조 |
| 빈 값 처리 | `null` (빈 문자열 → null 변환) | 일관된 쿼리 결과 |
| 선택 해제 | 바텀 시트에서 이미 선택된 항목 재탭 시 해제 | 선택 입력이므로 해제 가능해야 함 |
| 커스텀 입력 최대 길이 | 100자 | 데이터 남용 방지 |

### Referral Source 옵션 상수

```typescript
// constants/referralOptions.ts
export interface ReferralOption {
  label: string;
  value: string;
  icon: string;
}

export const REFERRAL_OPTIONS: ReferralOption[] = [
  { label: 'YouTube', value: 'youtube', icon: 'logo-youtube' },
  { label: 'Instagram', value: 'instagram', icon: 'logo-instagram' },
  { label: '친구/지인 추천', value: 'friend_recommendation', icon: 'people-outline' },
  { label: '앱스토어 검색', value: 'appstore_search', icon: 'search-outline' },
  { label: '홈바리스타클럽', value: 'home_barista_club', icon: 'cafe-outline' },
];
```

### 아키텍처 영향

- `GestureHandlerRootView` 래퍼 필요 — 루트 `_layout.tsx`에서 이미 제공되는지 확인 필요. 없으면 회원가입 화면에 추가.
- 바텀 시트는 `ScrollView` 외부, 화면 루트 레벨에서 렌더링 (기존 create-recipe 패턴)

### 데이터 플로우

```
signUp.tsx (form)
  → referralSource (react-hook-form state)
  → onSubmit handler
  → signUpWithEmail(email, password, nickname, referralSource)
  → useAuth.ts
    → supabase.auth.signUp(email, password)
    → supabase.from('users').insert({ ..., referral_source })
  → users 테이블
```

## Acceptance Criteria

### 기능 요구사항

- [x] 회원가입 폼에 "어디서 알고 오셨나요? (선택)" 필드 표시
- [x] 필드 터치 시 바텀 시트 열림 (5개 사전 옵션 + 상단 직접 입력)
- [x] 사전 옵션 선택 시 바텀 시트 닫히고 선택값 표시
- [x] 상단 텍스트 입력으로 직접 입력 가능 (최대 100자)
- [x] 이미 선택된 옵션 재탭 시 선택 해제 가능
- [x] 유입 경로 없이도 회원가입 가능 (선택 입력)
- [x] 선택된 유입 경로가 `users` 테이블 `referral_source` 컬럼에 저장
- [x] 가입 실패 시 유입 경로 선택 상태 유지

### 비기능 요구사항

- [x] 키보드가 열려있을 때 바텀 시트 오픈 시 키보드 먼저 닫힘
- [x] iOS/Android 모두에서 바텀 시트 정상 동작
- [x] 빈 문자열은 `null`로 변환하여 DB 저장

## Implementation Phases

### Phase 1: DB 스키마 및 타입 변경

**변경 파일:**
- Supabase `users` 테이블 — `referral_source` nullable text 컬럼 추가
- `types/database.ts` — users Row/Insert/Update 타입에 `referral_source` 필드 추가

```sql
ALTER TABLE users ADD COLUMN referral_source text;
```

```typescript
// types/database.ts - users.Row에 추가
referral_source: string | null;

// users.Insert에 추가
referral_source?: string | null;

// users.Update에 추가
referral_source?: string | null;
```

### Phase 2: 상수 및 스키마 정의

**새 파일:**
- `constants/referralOptions.ts` — 유입 경로 옵션 상수 배열 + `getReferralLabel` 헬퍼

**변경 파일:**
- `lib/validation/authSchema.ts` — `signUpSchema`에 `referralSource` optional 필드 추가

```typescript
// lib/validation/authSchema.ts
referralSource: z
  .string()
  .max(100, '최대 100자까지 입력할 수 있습니다')
  .nullish()
  .transform((val) => val || null),
```

`SignUpFormData` 타입은 `z.infer`로 자동 반영. `getDefaultSignUpForm`에 `referralSource: null` 추가.

### Phase 3: 바텀 시트 컴포넌트

**새 파일:**
- `components/auth/ReferralSourceBottomSheet.tsx`

기존 `DripperBottomSheet` 패턴을 따름:
- `forwardRef<BottomSheetRef, ReferralSourceBottomSheetProps>`
- `useImperativeHandle`로 expand/close 노출
- `snapPoints: ['60%']` (6개 옵션 + 입력란이므로 80%보다 작게)
- 상단: 직접 입력 텍스트 필드 (maxLength: 100)
- 하단: 5개 사전 옵션 리스트 (체크마크로 선택 상태 표시)
- 이미 선택된 옵션 재탭 시 `onSelect(null)` 호출하여 해제
- `enablePanDownToClose={true}`

**변경 파일:**
- `components/auth/index.ts` — `ReferralSourceBottomSheet` 배럴 export 추가

### Phase 4: Auth Hook 수정

**변경 파일:**
- `hooks/useAuth.ts` — `signUpWithEmail` 시그니처에 `referralSource` 파라미터 추가

```typescript
const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string,
  referralSource?: string | null,
) => {
  // ... 기존 auth.signUp 로직 ...

  // users 테이블 insert에 referral_source 추가
  await supabase.from('users').insert({
    id: data.user.id,
    email: data.user.email!,
    display_name: displayName || data.user.email?.split('@')[0] || 'User',
    profile_image: null,
    referral_source: referralSource ?? null,
  });
};
```

### Phase 5: 회원가입 폼 통합

**변경 파일:**
- `app/auth/signUp.tsx`

주요 변경:
1. `GestureHandlerRootView` 래퍼 확인/추가
2. 비밀번호 확인 필드와 가입 버튼 사이에 유입 경로 선택 필드 추가
3. 필드 UI: 기존 `inputContainer` 스타일 + `megaphone-outline` 아이콘 + 선택된 값 텍스트 또는 placeholder
4. 터치 시 `ReferralSourceBottomSheet.expand()` 호출 (키보드 먼저 dismiss)
5. `onSubmit`에서 `signUpWithEmail(email, password, nickname, referralSource)` 호출
6. 바텀 시트를 `ScrollView` 외부에 렌더링

```tsx
{/* 유입 경로 선택 필드 */}
<TouchableOpacity
  onPress={() => {
    Keyboard.dismiss();
    referralSheetRef.current?.expand();
  }}
  style={styles.inputContainer}
>
  <Ionicons name="megaphone-outline" size={20} color="#666" />
  <Text style={referralSource ? styles.selectedText : styles.placeholderText}>
    {referralSource
      ? getReferralLabel(REFERRAL_OPTIONS, referralSource)
      : '어디서 알고 오셨나요? (선택)'}
  </Text>
</TouchableOpacity>
```

### Phase 6: 테스트 업데이트

**변경 파일:**
- `__tests__/auth/signUp.test.tsx` — `mockSignUpWithEmail` 호출 assertion에 referralSource 파라미터 반영

## Dependencies & Risks

| 리스크 | 영향 | 대응 |
|--------|------|------|
| `GestureHandlerRootView` 미존재 | 바텀 시트 Android 크래시 | 루트 레이아웃 확인 후 필요시 추가 |
| 기존 테스트 깨짐 | CI 실패 | `signUpWithEmail` 시그니처 변경에 맞춰 테스트 업데이트 |
| 키보드 + 바텀 시트 충돌 | 레이아웃 점프 (특히 Android) | `Keyboard.dismiss()` 선호출 + 바텀 시트 `keyboardBehavior="interactive"` |

## Success Metrics

- 회원가입 시 유입 경로 응답률 50% 이상
- 가입 전환율 기존 대비 5% 이상 하락 없음

## References & Research

### Internal References

- 바텀 시트 패턴: `components/create-recipe/DripperBottomSheet.tsx`
- Auth 스키마: `lib/validation/authSchema.ts:35-51`
- Auth Hook: `hooks/useAuth.ts:199-229`
- 회원가입 폼: `app/auth/signUp.tsx`
- DB 타입: `types/database.ts:735-761`
- 상수 패턴: `constants/filterConstants.ts`
- 배럴 export: `components/auth/index.ts`
- 기존 계획 참조: `docs/plans/2026-02-18-bean-edit-implementation.md` (폼 패턴)

### Brainstorm

- `docs/brainstorms/2026-02-23-referral-source-brainstorm.md`

### 참고: 기존 버그 발견

- `app/auth/signUp.tsx:49`에서 `signUpWithEmail(data.email, data.password)` 호출 시 nickname을 전달하지 않고 있음 (displayName 파라미터 누락). 이번 작업에서 함께 수정.
