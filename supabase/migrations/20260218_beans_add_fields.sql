-- ============================================================
-- beans 테이블: variety, process_method, notes 컬럼 추가
-- degassing_days는 20260216_create_beans.sql에서 이미 존재
-- ============================================================

ALTER TABLE beans
  ADD COLUMN IF NOT EXISTS variety TEXT,
  ADD COLUMN IF NOT EXISTS process_method TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;
