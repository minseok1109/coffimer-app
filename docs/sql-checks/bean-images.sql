-- Bean images schema verification checks

-- 1) should fail: duplicate primary image for same bean
-- INSERT INTO bean_images (bean_id, user_id, image_url, storage_path, sort_order, is_primary)
-- VALUES ('<bean-id>', '<user-id>', 'url-1', 'path-1', 0, true);
-- INSERT INTO bean_images (bean_id, user_id, image_url, storage_path, sort_order, is_primary)
-- VALUES ('<bean-id>', '<user-id>', 'url-2', 'path-2', 1, true);

-- 2) should fail: duplicate sort_order for same bean
-- INSERT INTO bean_images (bean_id, user_id, image_url, storage_path, sort_order, is_primary)
-- VALUES ('<bean-id>', '<user-id>', 'url-1', 'path-1', 0, true);
-- INSERT INTO bean_images (bean_id, user_id, image_url, storage_path, sort_order, is_primary)
-- VALUES ('<bean-id>', '<user-id>', 'url-2', 'path-2', 0, false);

-- 3) should fail: more than 5 images per bean
-- repeat insert 6 rows with same bean_id

-- 4) RLS check: another authenticated user must not be able to read/modify
-- run SELECT/UPDATE/DELETE as non-owner and verify permission denied or zero rows.
