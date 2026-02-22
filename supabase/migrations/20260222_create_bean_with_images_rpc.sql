-- ============================================================
-- create_bean_with_images RPC
-- ============================================================

CREATE OR REPLACE FUNCTION create_bean_with_images(
  p_bean_id UUID,
  p_bean JSONB,
  p_images JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_bean beans;
  v_image_count INTEGER;
  v_primary_count INTEGER;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = 'P0001';
  END IF;

  IF jsonb_typeof(p_images) <> 'array' THEN
    RAISE EXCEPTION 'p_images must be an array'
      USING ERRCODE = 'P0001';
  END IF;

  v_image_count := jsonb_array_length(p_images);

  IF v_image_count < 1 OR v_image_count > 5 THEN
    RAISE EXCEPTION 'Image count must be between 1 and 5'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO v_primary_count
  FROM jsonb_array_elements(p_images) elem
  WHERE COALESCE((elem->>'is_primary')::BOOLEAN, false);

  IF v_primary_count <> 1 THEN
    RAISE EXCEPTION 'Exactly one primary image is required'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO beans (
    id,
    user_id,
    name,
    roastery_name,
    roast_date,
    roast_level,
    bean_type,
    weight_g,
    remaining_g,
    price,
    cup_notes,
    degassing_days,
    variety,
    process_method,
    notes
  )
  VALUES (
    p_bean_id,
    v_user_id,
    COALESCE(NULLIF(TRIM(p_bean->>'name'), ''), ''),
    NULLIF(TRIM(p_bean->>'roastery_name'), ''),
    CASE
      WHEN NULLIF(TRIM(p_bean->>'roast_date'), '') IS NULL THEN NULL
      ELSE (p_bean->>'roast_date')::DATE
    END,
    CASE
      WHEN NULLIF(TRIM(p_bean->>'roast_level'), '') IS NULL THEN NULL
      ELSE (p_bean->>'roast_level')::TEXT
    END,
    COALESCE(NULLIF(TRIM(p_bean->>'bean_type'), ''), 'blend')::TEXT,
    (p_bean->>'weight_g')::INTEGER,
    COALESCE((p_bean->>'remaining_g')::INTEGER, (p_bean->>'weight_g')::INTEGER),
    CASE
      WHEN p_bean ? 'price' AND NULLIF(TRIM(p_bean->>'price'), '') IS NOT NULL
      THEN (p_bean->>'price')::INTEGER
      ELSE NULL
    END,
    COALESCE(
      (
        SELECT ARRAY_AGG(value)
        FROM jsonb_array_elements_text(COALESCE(p_bean->'cup_notes', '[]'::JSONB)) AS value
      ),
      '{}'::TEXT[]
    ),
    CASE
      WHEN p_bean ? 'degassing_days' AND NULLIF(TRIM(p_bean->>'degassing_days'), '') IS NOT NULL
      THEN (p_bean->>'degassing_days')::INTEGER
      ELSE NULL
    END,
    NULLIF(TRIM(p_bean->>'variety'), ''),
    NULLIF(TRIM(p_bean->>'process_method'), ''),
    NULLIF(TRIM(p_bean->>'notes'), '')
  )
  RETURNING * INTO v_bean;

  INSERT INTO bean_images (
    bean_id,
    user_id,
    image_url,
    storage_path,
    sort_order,
    is_primary
  )
  SELECT
    v_bean.id,
    v_user_id,
    elem->>'image_url',
    elem->>'storage_path',
    (elem->>'sort_order')::SMALLINT,
    COALESCE((elem->>'is_primary')::BOOLEAN, false)
  FROM jsonb_array_elements(p_images) elem;

  RETURN jsonb_build_object(
    'bean', to_jsonb(v_bean),
    'images', (
      SELECT COALESCE(jsonb_agg(to_jsonb(img) ORDER BY img.sort_order), '[]'::JSONB)
      FROM bean_images img
      WHERE img.bean_id = v_bean.id
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION create_bean_with_images(UUID, JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_bean_with_images(UUID, JSONB, JSONB) TO authenticated;
