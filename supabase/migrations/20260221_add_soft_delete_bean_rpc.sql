-- ============================================================
-- soft_delete_bean: RLS 우회 soft delete RPC 함수
-- SECURITY DEFINER로 실행되므로 함수 내부에서 소유권 검증
-- ============================================================

CREATE OR REPLACE FUNCTION soft_delete_bean(bean_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 호출자의 auth.uid() 확인
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = 'P0001';
  END IF;

  -- 소유권 확인 + soft delete (단일 쿼리)
  UPDATE beans
  SET deleted_at = now()
  WHERE id = bean_id
    AND user_id = v_user_id
    AND deleted_at IS NULL;

  -- 영향받은 행이 없으면 에러
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bean not found or not owned by user'
      USING ERRCODE = 'P0002';
  END IF;
END;
$$;

-- authenticated 역할에만 실행 권한 부여
REVOKE ALL ON FUNCTION soft_delete_bean(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION soft_delete_bean(UUID) TO authenticated;
