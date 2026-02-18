-- ============================================================
-- Coffimer App: Supabase 쿼리 최적화 마이그레이션
-- ============================================================

-- 1. get_recipe_filter_options() — 3개 DISTINCT 쿼리를 단일 RPC로 통합
CREATE OR REPLACE FUNCTION get_recipe_filter_options()
RETURNS JSON LANGUAGE sql STABLE AS $$
  SELECT json_build_object(
    'drippers', (
      SELECT COALESCE(json_agg(DISTINCT dripper), '[]'::json)
      FROM recipes WHERE is_public = true AND dripper IS NOT NULL
    ),
    'filters', (
      SELECT COALESCE(json_agg(DISTINCT filter), '[]'::json)
      FROM recipes WHERE is_public = true
    ),
    'brewing_types', (
      SELECT COALESCE(json_agg(DISTINCT brewing_type), '[]'::json)
      FROM recipes WHERE is_public = true AND brewing_type IS NOT NULL
    )
  );
$$;

-- 2. toggle_favorite() — 원자적 즐겨찾기 토글
CREATE OR REPLACE FUNCTION toggle_favorite(p_user_id UUID, p_recipe_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM saved_recipes
    WHERE user_id = p_user_id AND recipe_id = p_recipe_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM saved_recipes WHERE user_id = p_user_id AND recipe_id = p_recipe_id;
    RETURN false;
  ELSE
    INSERT INTO saved_recipes (user_id, recipe_id) VALUES (p_user_id, p_recipe_id);
    RETURN true;
  END IF;
END;
$$;

-- 3. 인덱스 추가

-- 공개 레시피 목록 (가장 빈번한 쿼리 패턴)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recipes_public_created
  ON recipes (created_at DESC) WHERE is_public = true;

-- 사용자별 레시피 목록
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recipes_owner_created
  ON recipes (owner_id, created_at DESC);

-- recipe_steps FK 인덱스 (Postgres는 FK에 자동 인덱스 생성 안 함)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recipe_steps_recipe_id
  ON recipe_steps (recipe_id);

-- 이벤트 캘린더 쿼리
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_published_date
  ON events (event_date, start_time) WHERE is_published = true;

-- 로스터리 soft-delete 필터
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roasteries_active
  ON roasteries (created_at DESC) WHERE deleted_at IS NULL;

-- ILIKE 검색용 trigram 인덱스
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recipes_name_trgm
  ON recipes USING gin (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recipes_description_trgm
  ON recipes USING gin (description gin_trgm_ops);
