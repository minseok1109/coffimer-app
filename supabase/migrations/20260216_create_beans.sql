-- ============================================================
-- Coffimer App: beans 테이블 생성
-- ============================================================

CREATE TABLE beans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  roastery_name TEXT,
  roast_date DATE,
  roast_level TEXT CHECK (
    roast_level IN ('light', 'medium_light', 'medium', 'medium_dark', 'dark')
  ),
  bean_type TEXT NOT NULL DEFAULT 'blend' CHECK (
    bean_type IN ('blend', 'single_origin')
  ),
  weight_g INTEGER NOT NULL CHECK (weight_g > 0),
  remaining_g INTEGER NOT NULL CHECK (remaining_g >= 0),
  price INTEGER,
  cup_notes TEXT[] DEFAULT '{}',
  image_url TEXT,
  degassing_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_remaining_lte_weight CHECK (remaining_g <= weight_g)
);

-- FK CASCADE용 인덱스 (전체 행 — ON DELETE CASCADE 시 필수)
CREATE INDEX idx_beans_user_id ON beans(user_id);

-- 활성 원두 목록 조회용 partial 인덱스
CREATE INDEX idx_beans_user_active ON beans(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- RLS 활성화
ALTER TABLE beans ENABLE ROW LEVEL SECURITY;

-- RLS 정책 ((select auth.uid())로 감싸 per-row 호출 방지 → 100x+ 성능 향상)
CREATE POLICY "Users can view own beans"
  ON beans FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own beans"
  ON beans FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own beans"
  ON beans FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own beans"
  ON beans FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_beans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER beans_updated_at
  BEFORE UPDATE ON beans
  FOR EACH ROW
  EXECUTE FUNCTION update_beans_updated_at();
