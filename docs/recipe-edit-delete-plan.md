# Coffimer 레시피 수정/삭제 기능 구현 계획

## 🔍 현재 상황 분석

### ✅ 이미 완료된 부분
- Supabase 연동 완료 (`useRecipe`, `RecipeService`, `RecipeAPI`)
- 사용자 인증 시스템 구현됨
- TypeScript 타입 정의 완벽
- RLS 보안 정책 설정 완료
- 동적 데이터 연동 완료
- react-hook-form, zod 등 필수 라이브러리 설치 완료

### ❌ 구현 필요한 부분
- 레시피 수정 UI 없음
- 레시피 삭제 UI 없음  
- 소유자 권한 확인 UI 없음

## 🚀 구현 계획 (3단계)

### Phase 1: 레시피 수정 기능 (1주)
1. **수정 페이지 생성**
   - `app/recipes/edit/[id].tsx` - 레시피 수정 페이지
   - `components/recipe/EditForm.tsx` - react-hook-form 기반 수정 폼
   - `components/recipe/StepEditor.tsx` - useFieldArray로 단계 편집
   - `lib/validation/recipeSchema.ts` - Zod 스키마 정의

2. **폼 기능 구현**
   - react-hook-form으로 기존 데이터 로드 (`reset()`)
   - `useFieldArray`로 단계 추가/삭제/순서 변경
   - 실시간 유효성 검사 (`mode: 'onChange'`)
   - `watch()`로 실시간 미리보기

3. **권한 검증 UI**
   - 소유자 확인 후 수정 버튼 표시
   - 비소유자 접근 시 에러 페이지
   - 수정 권한 안내 메시지

### Phase 2: 레시피 삭제 기능 (1주)
1. **삭제 UI 구현**
   - 레시피 상세페이지에 삭제 버튼 추가
   - `components/recipe/DeleteConfirmModal.tsx` - 확인 모달
   - 위험 액션 스타일링 (빨간색 등)

2. **삭제 로직 구현** 
   - 2단계 확인 프로세스
   - 연관 데이터 정리 안내
   - 삭제 후 목록 페이지로 리다이렉트
   - 삭제 실패 시 에러 처리

### Phase 3: UX 최적화 (1주)
1. **상태 관리 최적화**
   - `useMutation` (React Query) 변이 훅 구현
   - 낙관적 업데이트 적용
   - 캐시 무효화 및 재페칭

2. **사용자 경험 개선**
   - 로딩 스피너 및 디스에이블 상태
   - 성공/실패 토스트 알림
   - react-hook-form `formState.isDirty`로 이탈 경고
   - 키보드 단축키 지원

## 🎯 우선 구현 순서
1. **1주차**: react-hook-form 기반 수정 페이지 + 폼 + 권한 체크
2. **2주차**: 레시피 삭제 기능 + 확인 모달
3. **3주차**: UX 개선 + 상태 관리 최적화

## 🔧 새로 생성할 주요 파일
- `/app/recipes/edit/[id].tsx` - 수정 페이지
- `/components/recipe/EditForm.tsx` - react-hook-form 수정 폼
- `/components/recipe/StepEditor.tsx` - useFieldArray 단계 편집기
- `/components/recipe/DeleteConfirmModal.tsx` - 삭제 확인 모달
- `/hooks/useRecipeMutations.ts` - 수정/삭제 훅
- `/lib/validation/recipeSchema.ts` - Zod 스키마
- `/components/ui/ConfirmModal.tsx` - 재사용 가능한 확인 모달

## 🎨 UI/UX 방향성
- Material Design 원칙 따라 일관된 스타일
- 모바일 우선 반응형 디자인
- react-hook-form 기반 성능 최적화된 폼
- 명확한 시각적 피드백
- 접근성(a11y) 고려한 구현

## 📋 체크리스트

### Phase 1 체크리스트
- [ ] 레시피 수정 페이지 라우팅 설정
- [ ] react-hook-form 기반 폼 컴포넌트 구현
- [ ] Zod 스키마 정의 및 유효성 검사
- [ ] useFieldArray로 단계 편집 기능
- [ ] 소유자 권한 확인 로직
- [ ] 수정 권한 UI 표시

### Phase 2 체크리스트
- [ ] 삭제 버튼 UI 추가
- [ ] 삭제 확인 모달 컴포넌트
- [ ] 2단계 확인 프로세스
- [ ] 삭제 후 리다이렉트 처리
- [ ] 에러 처리 및 사용자 피드백

### Phase 3 체크리스트
- [ ] useMutation 훅 구현
- [ ] 낙관적 업데이트 적용
- [ ] 로딩 상태 및 에러 처리
- [ ] 토스트 알림 시스템
- [ ] 폼 변경 감지 및 이탈 경고
- [ ] 키보드 단축키 지원

## 🔗 관련 문서
- [Supabase RLS 정책](https://supabase.com/docs/guides/auth/row-level-security)
- [React Hook Form 가이드](https://react-hook-form.com/get-started)
- [Zod 스키마 검증](https://zod.dev/)
- [React Query Mutations](https://tanstack.com/query/latest/docs/react/guides/mutations)