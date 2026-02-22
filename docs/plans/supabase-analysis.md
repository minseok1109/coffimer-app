# Supabase 마이그레이션 분석 및 리스크 평가

## A. Supabase 기능별 마이그레이션 난이도 매트릭스

| 기능 | 난이도 | 리스크 | 대체 전략 |
|------|--------|--------|-----------|
| **인증 시스템** | 상 | 높음 | NestJS JWT + Passport, bcrypt 해싱, 기존 사용자 마이그레이션 필요 |
| **데이터베이스 CRUD** | 하 | 낮음 | TypeORM/Prisma로 직접 대체, SQL 쿼리 그대로 사용 가능 |
| **Nested Select** | 하 | 낮음 | TypeORM relations 또는 Prisma include로 동일 구현 |
| **RPC Functions** | 중 | 중간 | NestJS Service 메서드 또는 raw SQL로 변환 |
| **Edge Functions** | 중 | 중간 | NestJS Controller endpoints로 변환 |
| **ILIKE 검색 + Trigram** | 하 | 낮음 | PostgreSQL 직접 연결, 인덱스 유지 |
| **AsyncStorage 세션** | 중 | 중간 | React Query + SecureStore 기반 JWT 토큰 관리 |
| **PKCE Flow** | 상 | 높음 | 표준 OAuth2 PKCE 구현 또는 단순 JWT 방식 |
| **Realtime** | - | - | 현재 미사용, 마이그레이션 불필요 |
| **Storage** | - | - | 현재 미사용, 마이그레이션 불필요 |
| **Triggers** | - | - | 현재 미사용, 마이그레이션 불필요 |

## B. 인증 마이그레이션 상세 계획

### 1. Supabase Auth → NestJS JWT 인증 전환

#### 현재 구조
```typescript
// Supabase Auth with PKCE flow
supabase.auth.signInWithPassword({ email, password })
supabase.auth.signUp({ email, password, options: { data: { full_name } } })
supabase.auth.signOut()
supabase.auth.getSession()
supabase.auth.onAuthStateChange()
```

#### NestJS 대체 구조
```typescript
// NestJS JWT + Passport
POST /auth/register       { email, password, displayName }
POST /auth/login          { email, password }
POST /auth/logout         Authorization: Bearer <token>
GET  /auth/me             Authorization: Bearer <token>
POST /auth/refresh-token  { refreshToken }
```

### 2. PKCE Flow 대체 방안

#### Option 1: Standard JWT Flow (권장)
- Access Token (15분 유효) + Refresh Token (7일 유효)
- SecureStore에 Refresh Token 저장
- AsyncStorage에 Access Token 저장 (빠른 접근)
- Auto-login: Refresh Token으로 자동 갱신

#### Option 2: OAuth2 PKCE 유지
- `@nestjs/passport-oauth2-pkce` 패키지 사용
- React Native 앱에서 PKCE challenge/verifier 생성
- 복잡도 높음, 모바일 앱에는 과도한 구현

**선택**: Option 1 (Standard JWT Flow)
- 모바일 앱 특성상 PKCE 없이 Refresh Token 방식으로 충분히 안전
- SecureStore 사용으로 Refresh Token 보안 확보

### 3. 기존 사용자 비밀번호 마이그레이션

#### 문제점
- Supabase는 bcrypt 해시를 사용하지만 **직접 추출 불가**
- `auth.users` 테이블은 Service Role Key로도 비밀번호 해시 미노출

#### 해결책: **Progressive Migration (점진적 마이그레이션)**

##### Step 1: 마이그레이션 준비
```sql
-- users 테이블에 마이그레이션 플래그 추가
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN migrated_to_nestjs BOOLEAN DEFAULT false;
```

##### Step 2: 하이브리드 로그인 엔드포인트
```typescript
// NestJS 로그인 로직
async login(email: string, password: string) {
  const user = await this.userRepository.findOne({ where: { email } });

  if (!user.migrated_to_nestjs) {
    // Supabase로 검증 시도
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (!error && data.user) {
      // 검증 성공 → 비밀번호를 NestJS DB에 저장
      const hashedPassword = await bcrypt.hash(password, 12);
      await this.userRepository.update(user.id, {
        password_hash: hashedPassword,
        migrated_to_nestjs: true,
      });

      // JWT 토큰 발급
      return this.generateJwtTokens(user);
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  // 이미 마이그레이션된 사용자 → bcrypt 검증
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) throw new UnauthorizedException('Invalid credentials');

  return this.generateJwtTokens(user);
}
```

##### Step 3: 마이그레이션 모니터링
```sql
-- 마이그레이션 진행률 확인
SELECT
  COUNT(*) FILTER (WHERE migrated_to_nestjs = true) as migrated,
  COUNT(*) FILTER (WHERE migrated_to_nestjs = false) as pending,
  ROUND(100.0 * COUNT(*) FILTER (WHERE migrated_to_nestjs = true) / COUNT(*), 2) as progress_pct
FROM users;
```

##### Step 4: 마이그레이션 완료 후 Supabase Auth 제거
- 90% 이상 마이그레이션 완료 시
- 미마이그레이션 사용자에게 비밀번호 재설정 안내
- Supabase Auth 의존성 제거

### 4. Session/Token 관리 전략

#### React Native Client
```typescript
// lib/authClient.ts
class AuthClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async login(email: string, password: string) {
    const { accessToken, refreshToken } = await api.post('/auth/login', { email, password });

    // Access Token → AsyncStorage (빠른 접근)
    await AsyncStorage.setItem('accessToken', accessToken);

    // Refresh Token → SecureStore (보안)
    await secureStorage.setItem('refreshToken', refreshToken);

    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  async refreshAccessToken() {
    const refreshToken = await secureStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    const { accessToken } = await api.post('/auth/refresh-token', { refreshToken });
    await AsyncStorage.setItem('accessToken', accessToken);
    this.accessToken = accessToken;
  }

  async getValidAccessToken(): Promise<string> {
    // JWT 만료 체크
    const decoded = jwtDecode(this.accessToken);
    if (decoded.exp * 1000 < Date.now()) {
      await this.refreshAccessToken();
    }
    return this.accessToken;
  }
}
```

#### Axios Interceptor
```typescript
// lib/api.ts
api.interceptors.request.use(async (config) => {
  const token = await authClient.getValidAccessToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await authClient.refreshAccessToken();
        return api.request(error.config); // 재시도
      } catch (refreshError) {
        // Refresh 실패 → 로그아웃
        await authClient.logout();
        router.push('/login');
      }
    }
    return Promise.reject(error);
  }
);
```

### 5. SecureStore 통합 유지

#### 현재 구조
```typescript
// lib/secureStorage.ts (기존 코드 유지)
export const secureStorage = {
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async getItem(key: string) {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
};
```

#### 사용 예시
```typescript
// Refresh Token 저장 (기존 방식과 동일)
await secureStorage.setItem('refreshToken', token);

// Auto-login 플래그 (기존 방식 유지)
await secureStorage.setAutoLoginEnabled(true);
```

## C. Edge Function 대체 방안

### 현재: delete-account Edge Function

```typescript
// supabase/functions/delete-account/index.ts
Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader.replace('Bearer ', '');

  // JWT 검증
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  // Service Role Key로 사용자 삭제
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) throw deleteError;

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
```

### NestJS 대체

```typescript
// src/auth/auth.controller.ts
@Controller('auth')
export class AuthController {
  @Delete('account')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Req() req: Request) {
    const userId = req.user.id; // JWT에서 추출

    // 트랜잭션으로 모든 사용자 데이터 삭제
    await this.authService.deleteAccount(userId);

    return { success: true };
  }
}

// src/auth/auth.service.ts
async deleteAccount(userId: string) {
  await this.dataSource.transaction(async (manager) => {
    // Cascade 삭제 (FK 관계)
    await manager.delete(User, { id: userId });

    // auth.users는 Supabase에서 마이그레이션 완료 후 제거
  });
}
```

**마이그레이션 단계**
1. NestJS endpoint 먼저 배포
2. React Native 앱에서 호출 URL만 변경
3. Edge Function 비활성화 (삭제 안 함, 롤백 대비)
4. 1주일 모니터링 후 Edge Function 삭제

## D. RPC Function 대체 방안

### 1. get_recipe_filter_options() → NestJS Service

#### 현재 RPC
```sql
CREATE FUNCTION get_recipe_filter_options() RETURNS JSON AS $$
  SELECT json_build_object(
    'drippers', (SELECT COALESCE(json_agg(DISTINCT dripper), '[]'::json) FROM recipes WHERE is_public = true),
    'filters', (SELECT COALESCE(json_agg(DISTINCT filter), '[]'::json) FROM recipes WHERE is_public = true),
    'brewing_types', (SELECT COALESCE(json_agg(DISTINCT brewing_type), '[]'::json) FROM recipes WHERE is_public = true)
  );
$$ LANGUAGE sql STABLE;
```

#### NestJS 대체 (Option 1: Repository 방식)
```typescript
// src/recipes/recipes.service.ts
async getFilterOptions(): Promise<RecipeFilterOptions> {
  const drippers = await this.recipeRepository
    .createQueryBuilder('recipe')
    .select('DISTINCT recipe.dripper', 'dripper')
    .where('recipe.isPublic = :isPublic', { isPublic: true })
    .andWhere('recipe.dripper IS NOT NULL')
    .getRawMany();

  const filters = await this.recipeRepository
    .createQueryBuilder('recipe')
    .select('DISTINCT recipe.filter', 'filter')
    .where('recipe.isPublic = :isPublic', { isPublic: true })
    .getRawMany();

  const brewingTypes = await this.recipeRepository
    .createQueryBuilder('recipe')
    .select('DISTINCT recipe.brewingType', 'brewingType')
    .where('recipe.isPublic = :isPublic', { isPublic: true })
    .andWhere('recipe.brewingType IS NOT NULL')
    .getRawMany();

  return {
    drippers: drippers.map(d => d.dripper).filter(Boolean),
    filters: filters.map(f => f.filter).filter(Boolean),
    brewingTypes: brewingTypes.map(b => b.brewingType).filter(Boolean),
  };
}
```

#### NestJS 대체 (Option 2: Raw SQL, 권장)
```typescript
// src/recipes/recipes.service.ts
async getFilterOptions(): Promise<RecipeFilterOptions> {
  const result = await this.dataSource.query(`
    SELECT json_build_object(
      'drippers', (
        SELECT COALESCE(json_agg(DISTINCT dripper), '[]'::json)
        FROM recipes WHERE is_public = true AND dripper IS NOT NULL
      ),
      'filters', (
        SELECT COALESCE(json_agg(DISTINCT filter), '[]'::json)
        FROM recipes WHERE is_public = true
      ),
      'brewingTypes', (
        SELECT COALESCE(json_agg(DISTINCT brewing_type), '[]'::json)
        FROM recipes WHERE is_public = true AND brewing_type IS NOT NULL
      )
    ) as options
  `);

  return result[0].options;
}
```

**선택**: Option 2 (Raw SQL)
- RPC와 동일한 성능 (단일 쿼리)
- 마이그레이션 간소화 (SQL 그대로 사용)

### 2. toggle_favorite() → NestJS Service

#### 현재 RPC
```sql
CREATE FUNCTION toggle_favorite(p_user_id UUID, p_recipe_id UUID) RETURNS BOOLEAN AS $$
DECLARE v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM saved_recipes WHERE user_id = p_user_id AND recipe_id = p_recipe_id) INTO v_exists;

  IF v_exists THEN
    DELETE FROM saved_recipes WHERE user_id = p_user_id AND recipe_id = p_recipe_id;
    RETURN false;
  ELSE
    INSERT INTO saved_recipes (user_id, recipe_id) VALUES (p_user_id, p_recipe_id);
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

#### NestJS 대체
```typescript
// src/favorites/favorites.service.ts
async toggleFavorite(userId: string, recipeId: string): Promise<boolean> {
  return await this.dataSource.transaction(async (manager) => {
    const existing = await manager.findOne(SavedRecipe, {
      where: { userId, recipeId },
    });

    if (existing) {
      await manager.delete(SavedRecipe, { userId, recipeId });
      return false; // 제거됨
    } else {
      await manager.insert(SavedRecipe, { userId, recipeId });
      return true; // 추가됨
    }
  });
}
```

**특징**
- 원자성 보장 (트랜잭션)
- Race condition 방지 (트랜잭션 격리 수준)
- RPC와 동일한 동작

## E. 클라이언트 코드 변경 영향도 분석

### 변경 필요 파일 목록

| 파일 경로 | 변경 범위 | 비고 |
|----------|----------|------|
| `lib/supabaseClient.ts` | **전체 교체** | `lib/apiClient.ts`로 대체 (Axios) |
| `hooks/useAuth.ts` | **중간 수정** | Supabase Auth → API 호출로 변경 |
| `lib/api/recipes.ts` | **중간 수정** | `supabase.from()` → `api.get/post/put/delete()` |
| `lib/api/favorites.ts` | **중간 수정** | `supabase.rpc()` → `api.post('/favorites/toggle')` |
| `lib/api/events.ts` | **중간 수정** | 동일 (Supabase 쿼리 → API 호출) |
| `lib/api/roasteries.ts` | **중간 수정** | 동일 |
| `services/recipeService.ts` | **중간 수정** | 검색/필터 로직 API 호출로 변경 |
| `types/database.ts` | **부분 유지** | Supabase 타입 제거, API 응답 타입으로 교체 |

### React Query 훅 구조 유지 가능 여부

#### 현재 구조
```typescript
// hooks/useRecipes.ts
export function useRecipes() {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('recipes').select('*');
      if (error) throw error;
      return data;
    },
  });
}
```

#### 마이그레이션 후 구조
```typescript
// hooks/useRecipes.ts
export function useRecipes() {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data } = await api.get<Recipe[]>('/recipes');
      return data;
    },
  });
}
```

**결론: React Query 훅 구조 100% 유지 가능**
- `queryKey`: 변경 없음
- `queryFn`: 내부 구현만 변경 (Supabase → Axios)
- 컴포넌트 코드: **0% 변경** (API 계층만 수정)

### 상세 변경 예시

#### Before (Supabase)
```typescript
// lib/api/recipes.ts
import { supabase } from '../supabaseClient';

export class RecipeAPI {
  static async createRecipe(input: CreateRecipeInput, userId: string) {
    const { data: recipe, error } = await supabase
      .from('recipes')
      .insert({ ...input.recipe, owner_id: userId })
      .select()
      .single();

    if (error) throw error;
    return recipe;
  }
}
```

#### After (NestJS API)
```typescript
// lib/api/recipes.ts
import { api } from '../apiClient';

export class RecipeAPI {
  static async createRecipe(input: CreateRecipeInput, userId: string) {
    const { data } = await api.post<Recipe>('/recipes', {
      ...input.recipe,
      ownerId: userId,
    });

    return data;
  }
}
```

**변경 포인트**
1. `supabase.from()` → `api.post/get/put/delete()`
2. `{ data, error }` 구조분해 → `try-catch` 에러 처리
3. 스네이크 케이스 (`owner_id`) → 카멜 케이스 (`ownerId`)

## F. 마이그레이션 리스크 Top 5

### 1. 🔴 인증 시스템 마이그레이션 중 사용자 로그아웃 (Critical)

#### 리스크
- 마이그레이션 중 기존 세션 무효화
- 모든 사용자 강제 로그아웃 발생
- 사용자 경험 저하 및 이탈 가능성

#### 완화 전략
1. **하이브리드 로그인 기간** 운영 (2주)
   - Supabase Auth와 NestJS JWT 병행 지원
   - 기존 세션 유지 + 새 로그인부터 NestJS 사용

2. **Progressive Migration** 적용
   - 사용자별 점진적 마이그레이션
   - 마이그레이션 플래그로 진행률 추적

3. **긴급 롤백 계획**
   - Supabase Auth 즉시 재활성화 가능
   - 마이그레이션 DB 백업 (트랜잭션 로그)

### 2. 🟠 비밀번호 해시 마이그레이션 불가 (High)

#### 리스크
- Supabase는 bcrypt 해시 직접 추출 불가
- 사용자가 재로그인하기 전까지 마이그레이션 불가
- 비활성 사용자 영구 마이그레이션 불가

#### 완화 전략
1. **Progressive Migration 강제 적용**
   - 로그인 시점에만 마이그레이션 가능
   - 비활성 사용자는 "비밀번호 재설정" 안내

2. **마이그레이션 완료 기준 완화**
   - 90% 마이그레이션 시 완료로 간주
   - 나머지 10%는 비밀번호 재설정 유도

3. **이메일 캠페인**
   - "중요: 시스템 업데이트로 인한 재로그인 요청"
   - 마이그레이션 기간 명시 (예: 2주)

### 3. 🟠 RPC/Edge Function 동시 마이그레이션 복잡도 (High)

#### 리스크
- 여러 기능 동시 변경 시 디버깅 어려움
- 일부 기능 누락 가능성
- 롤백 복잡도 증가

#### 완화 전략
1. **단계별 마이그레이션**
   ```
   Phase 1: 데이터베이스 CRUD만 먼저 (Auth 제외)
   Phase 2: RPC Functions 마이그레이션
   Phase 3: Edge Functions 마이그레이션
   Phase 4: 인증 시스템 마이그레이션 (마지막)
   ```

2. **Feature Flag 도입**
   ```typescript
   const USE_NESTJS_API = process.env.EXPO_PUBLIC_USE_NESTJS === 'true';

   const apiClient = USE_NESTJS_API ? nestjsApi : supabaseApi;
   ```

3. **병렬 운영 기간**
   - Supabase + NestJS 동시 운영 (1주)
   - Feature Flag로 점진적 트래픽 이동 (10% → 50% → 100%)

### 4. 🟡 Nested Select 쿼리 성능 차이 (Medium)

#### 리스크
- Supabase는 PostgREST 최적화
- TypeORM relations는 N+1 쿼리 가능성
- 응답 속도 저하

#### 완화 전략
1. **Eager Loading 강제**
   ```typescript
   @Entity()
   class Recipe {
     @OneToMany(() => RecipeStep, step => step.recipe, { eager: true })
     steps: RecipeStep[];
   }
   ```

2. **쿼리 성능 모니터링**
   - NestJS에 쿼리 로깅 추가
   - Slow query 탐지 (>100ms)

3. **필요 시 Raw SQL 사용**
   ```typescript
   const recipes = await this.dataSource.query(`
     SELECT r.*,
            json_agg(rs ORDER BY rs.step_index) as steps
     FROM recipes r
     LEFT JOIN recipe_steps rs ON rs.recipe_id = r.id
     WHERE r.is_public = true
     GROUP BY r.id
   `);
   ```

### 5. 🟡 AsyncStorage 세션 데이터 불일치 (Medium)

#### 리스크
- Supabase 토큰과 NestJS 토큰 충돌
- AsyncStorage 키 충돌
- 세션 상태 불일치

#### 완화 전략
1. **키 네임스페이스 분리**
   ```typescript
   // Supabase
   'supabase.auth.token'

   // NestJS
   'nestjs.auth.accessToken'
   'nestjs.auth.refreshToken'
   ```

2. **마이그레이션 시 스토리지 정리**
   ```typescript
   async function migrateToNestJSAuth() {
     // 기존 Supabase 토큰 제거
     await AsyncStorage.removeItem('supabase.auth.token');

     // NestJS 토큰 저장
     await AsyncStorage.setItem('nestjs.auth.accessToken', accessToken);
   }
   ```

3. **앱 버전 업데이트 시 스토리지 초기화**
   ```typescript
   const APP_VERSION = '2.0.0'; // NestJS 마이그레이션 버전
   const storedVersion = await AsyncStorage.getItem('app.version');

   if (storedVersion !== APP_VERSION) {
     await AsyncStorage.clear();
     await AsyncStorage.setItem('app.version', APP_VERSION);
   }
   ```

---

## 마이그레이션 권장 순서

```
1주차: 준비
  - NestJS API 서버 구축 (Auth 제외)
  - 데이터베이스 복제 (Supabase → PostgreSQL)
  - TypeORM 엔티티 생성

2주차: Phase 1 - 데이터 레이어
  - CRUD API 구현 (recipes, events, roasteries)
  - Nested Select → TypeORM relations
  - Feature Flag 배포 (10% 트래픽)

3주차: Phase 2 - RPC/Edge Functions
  - get_recipe_filter_options → NestJS Service
  - toggle_favorite → NestJS Service
  - delete-account Edge Function → NestJS endpoint
  - Feature Flag 50% 트래픽

4주차: Phase 3 - 인증 마이그레이션
  - Progressive Migration 시작
  - 하이브리드 로그인 지원
  - 이메일 캠페인 시작

5-6주차: 모니터링 및 완료
  - 마이그레이션 진행률 90% 달성
  - Feature Flag 100% (Supabase 비활성화)
  - Supabase 의존성 제거
```

## 결론

**총 예상 리스크 레벨**: 🟠 Medium-High

**성공 확률**: 85%
- 인증 마이그레이션은 Progressive Migration으로 해결 가능
- RPC/Edge Function은 단순 로직으로 NestJS 전환 용이
- 데이터베이스 구조는 PostgreSQL 그대로 사용 가능

**권장 사항**
1. Feature Flag 기반 점진적 마이그레이션 필수
2. 인증 시스템은 마지막에 마이그레이션
3. 하이브리드 운영 기간 2주 확보
4. 긴급 롤백 계획 필수
