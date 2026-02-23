# Brainstorm: 회원가입 유입 경로 수집

**Date:** 2026-02-23
**Status:** Decided

## What We're Building

회원가입 폼에 "어디서 알고 오셨나요?" 유입 경로 선택 항목을 추가한다. 사용자가 주로 접하는 매체를 옵션으로 제공하여, 마케팅 채널별 효과를 파악할 수 있게 한다.

## Why This Approach

- 기존 앱의 바텀 시트 패턴(DripperBottomSheet, FilterBottomSheet)을 재사용하여 일관된 UX 제공
- users 테이블에 컬럼 하나를 추가하는 방식으로 단순하게 구현
- 선택 입력으로 가입 허들을 높이지 않으면서도 데이터 수집 가능

## Key Decisions

| 결정 사항 | 선택 | 근거 |
|-----------|------|------|
| 필수 여부 | 선택 입력 | 가입 이탈율 최소화 |
| UI 방식 | 바텀 시트 | 기존 앱 패턴과 일관성 유지 |
| 데이터 저장 | users 테이블 확장 | 현재 규모에 적합한 단순한 구조 |

## Referral Source Options

1. YouTube
2. Instagram
3. 친구/지인 추천
4. 앱스토어 검색
5. 홈바리스타클럽
6. 기타 (직접 입력)

## Implementation Scope

### 변경 대상 파일

- `app/auth/signUp.tsx` — 폼에 유입 경로 필드 추가
- `lib/validation/authSchema.ts` — Zod 스키마에 optional 필드 추가
- `hooks/useAuth.ts` — signUp 시 referral_source 데이터 전송
- `lib/supabase/database.ts` — users 타입에 referral_source 추가
- `components/auth/ReferralSourceBottomSheet.tsx` — 새 바텀 시트 컴포넌트
- `constants/referralOptions.ts` — 유입 경로 옵션 상수 정의
- Supabase `users` 테이블 — `referral_source` 컬럼 추가 (nullable text)

### DB 스키마 변경

```sql
ALTER TABLE users ADD COLUMN referral_source text;
```

## Open Questions

없음 — 모든 주요 결정이 완료됨.
