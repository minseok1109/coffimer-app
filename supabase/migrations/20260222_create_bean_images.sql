-- ============================================================
-- Bean multi-image support
-- ============================================================

CREATE TABLE IF NOT EXISTS bean_images (
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

-- 한 원두당 대표 이미지는 최대 1개
CREATE UNIQUE INDEX IF NOT EXISTS uq_bean_images_primary
  ON bean_images (bean_id) WHERE is_primary = true;

-- 한 원두당 정렬 순서는 유일해야 함
CREATE UNIQUE INDEX IF NOT EXISTS uq_bean_images_sort
  ON bean_images (bean_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_bean_images_user_bean
  ON bean_images (user_id, bean_id);

CREATE OR REPLACE FUNCTION update_bean_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bean_images_updated_at ON bean_images;
CREATE TRIGGER bean_images_updated_at
  BEFORE UPDATE ON bean_images
  FOR EACH ROW
  EXECUTE FUNCTION update_bean_images_updated_at();

-- 원두당 최대 5장 제한
CREATE OR REPLACE FUNCTION enforce_bean_images_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO v_count
    FROM bean_images
    WHERE bean_id = NEW.bean_id;

    IF v_count >= 5 THEN
      RAISE EXCEPTION 'A bean can have at most 5 images';
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.bean_id <> OLD.bean_id THEN
    SELECT COUNT(*) INTO v_count
    FROM bean_images
    WHERE bean_id = NEW.bean_id;

    IF v_count >= 5 THEN
      RAISE EXCEPTION 'A bean can have at most 5 images';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bean_images_limit_check ON bean_images;
CREATE TRIGGER bean_images_limit_check
  BEFORE INSERT OR UPDATE ON bean_images
  FOR EACH ROW
  EXECUTE FUNCTION enforce_bean_images_limit();

ALTER TABLE bean_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bean images" ON bean_images;
CREATE POLICY "Users can view own bean images"
  ON bean_images FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM beans
      WHERE beans.id = bean_id
        AND beans.user_id = (select auth.uid())
        AND beans.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can insert own bean images" ON bean_images;
CREATE POLICY "Users can insert own bean images"
  ON bean_images FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM beans
      WHERE beans.id = bean_id
        AND beans.user_id = (select auth.uid())
        AND beans.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can update own bean images" ON bean_images;
CREATE POLICY "Users can update own bean images"
  ON bean_images FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM beans
      WHERE beans.id = bean_id
        AND beans.user_id = (select auth.uid())
        AND beans.deleted_at IS NULL
    )
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM beans
      WHERE beans.id = bean_id
        AND beans.user_id = (select auth.uid())
        AND beans.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can delete own bean images" ON bean_images;
CREATE POLICY "Users can delete own bean images"
  ON bean_images FOR DELETE
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM beans
      WHERE beans.id = bean_id
        AND beans.user_id = (select auth.uid())
        AND beans.deleted_at IS NULL
    )
  );

-- Pre-prod 결정: legacy 단일 이미지 컬럼 제거
ALTER TABLE beans DROP COLUMN IF EXISTS image_url;
