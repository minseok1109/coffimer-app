-- ============================================================
-- beans 테이블: opened_date 컬럼 및 날짜 무결성 제약 추가
-- ============================================================

ALTER TABLE beans
  ADD COLUMN IF NOT EXISTS opened_date DATE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_opened_date_gte_roast_date'
      AND conrelid = 'beans'::regclass
  ) THEN
    ALTER TABLE beans
      ADD CONSTRAINT chk_opened_date_gte_roast_date
      CHECK (
        opened_date IS NULL
        OR roast_date IS NULL
        OR opened_date >= roast_date
      );
  END IF;
END;
$$;
