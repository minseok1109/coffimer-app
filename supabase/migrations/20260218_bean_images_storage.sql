-- bean-images 버킷 생성 (Public, 5MB 제한)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('bean-images', 'bean-images', true, 5242880);

-- SELECT: 누구나 조회 가능 (Public 버킷이라도 명시적 정책 권장)
CREATE POLICY "Anyone can view bean images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bean-images');

-- INSERT: 인증된 사용자가 본인 폴더에만 업로드
CREATE POLICY "Users can upload own bean images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'bean-images'
    AND (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- DELETE: 본인 파일만 삭제
CREATE POLICY "Users can delete own bean images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'bean-images'
    AND (select auth.uid())::text = (storage.foldername(name))[1]
  );
