-- ============================================================
-- users 테이블: 개인정보 처리 동의 추적 컬럼 추가
-- terms_agreed_at: 약관 동의 시점 (신규 가입자만 기록, 기존 사용자는 NULL)
-- terms_version: 동의한 약관 버전 식별자
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS terms_agreed_at TIMESTAMPTZ;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS terms_version TEXT;

COMMENT ON COLUMN public.users.terms_agreed_at IS
  '약관 및 개인정보 처리방침 동의 시점. 동의 추적 기능 도입 전 가입한 사용자는 NULL.';

COMMENT ON COLUMN public.users.terms_version IS
  '동의한 약관 버전 식별자 (예: "2026-02-23-v1").';
