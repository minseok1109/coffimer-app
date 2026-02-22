# PostgreSQL 데이터베이스 설계 및 마이그레이션 전략

## A. 스키마 재설계 및 정규화 검토

### 현재 스키마 정규화 수준 평가

현재 스키마는 **3NF(Third Normal Form)** 수준을 대체로 만족하고 있습니다:

**강점:**
- 명확한 PK/FK 관계
- 적절한 테이블 분리 (users, recipes, recipe_steps, saved_recipes)
- 중복 데이터 최소화
- 다대다 관계를 위한 중간 테이블 (saved_recipes)

**개선 필요 영역:**

1. **recipe_steps.total_water 중복**
   - `total_water`는 이전 step들의 `water` 합계로 계산 가능
   - 업데이트 이상(update anomaly) 위험
   - 권장: 제거하고 애플리케이션/뷰에서 계산

2. **grinders 테이블 미활용**
   - `recipes.grinder_model`이 text 타입으로 중복 입력 가능
   - 권장: `grinder_id` FK로 변경하여 정규화

3. **roastery_name vs roasteries 테이블**
   - `events.roastery_name`이 text로 중복
   - 권장: `roastery_id` FK 추가 + nullable roastery_name 유지 (미등록 로스터리 대응)

### 타입 최적화

```sql
-- 현재 → 권장
text → varchar(255)          -- 제한된 길이 필드 (name, email)
text → varchar(1000)         -- 중간 길이 (description)
text → text                  -- 실제 무제한 필드만 유지

numeric → decimal(10, 2)     -- 금액, 무게 (coffee, water, price)
numeric → decimal(5, 2)      -- 비율 (ratio는 text로 유지 - "1:16" 형식)
numeric → decimal(10, 6)     -- 좌표 (latitude, longitude)

integer → smallint           -- 제한된 범위 (grinder_clicks: 0-100)
integer → integer            -- step_index, max_participants
```

**최적화 후 스키마 예시:**

```sql
-- users 테이블
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) UNIQUE NOT NULL,
  display_name varchar(100),
  profile_image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  deletion_scheduled_for timestamptz,
  deletion_confirmed_at timestamptz,
  deletion_reason varchar(500)
);

-- recipes 테이블
CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  description text,
  is_public boolean NOT NULL DEFAULT false,
  brewing_type brewing_type_enum NOT NULL,
  coffee decimal(10, 2) NOT NULL,
  water decimal(10, 2) NOT NULL,
  water_temperature decimal(5, 2),
  ratio varchar(20), -- "1:16" 형식
  dripper varchar(100),
  filter varchar(100),
  grinder_id uuid REFERENCES grinders(id) ON DELETE SET NULL,
  grinder_clicks smallint,
  micron smallint,
  total_time integer NOT NULL,
  youtube_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- recipe_steps 테이블
CREATE TABLE recipe_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_index smallint NOT NULL,
  time integer NOT NULL,
  duration integer NOT NULL,
  title varchar(255) NOT NULL,
  description text,
  water decimal(10, 2),
  -- total_water 제거 (계산 필드로 전환)
  UNIQUE(recipe_id, step_index)
);

-- events 테이블
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(255) NOT NULL,
  roastery_id uuid REFERENCES roasteries(id) ON DELETE SET NULL,
  roastery_name varchar(255), -- 미등록 로스터리 fallback
  category event_category_enum NOT NULL,
  event_date date NOT NULL,
  start_time time NOT NULL,
  end_time time,
  description text,
  location varchar(500),
  image_url text,
  price decimal(10, 2),
  max_participants integer,
  registration_url text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- roasteries 테이블
CREATE TABLE roasteries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  description text,
  address varchar(500),
  featured_image text,
  online_shop_url text,
  latitude decimal(10, 6),
  longitude decimal(10, 6),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
```

### UUID vs CUID2 vs Auto-increment 전략

| 전략 | 장점 | 단점 | 권장 사용처 |
|------|------|------|-------------|
| **UUID v4** | - 분산 시스템 안전<br>- 예측 불가<br>- 병렬 생성 가능 | - 16 bytes (큰 크기)<br>- 인덱스 성능 저하<br>- 읽기 어려움 | **현재 사용 중, 유지 권장**<br>- 외부 노출 ID<br>- 분산 환경 대비 |
| **CUID2** | - 정렬 가능<br>- UUID보다 짧음<br>- 충돌 확률 낮음 | - PostgreSQL 네이티브 미지원<br>- 애플리케이션 생성 필요 | - TypeScript 생성 후 삽입<br>- URL 친화적 ID 필요 시 |
| **SERIAL/BIGSERIAL** | - 작은 크기 (4/8 bytes)<br>- 빠른 인덱스<br>- 순차 정렬 | - 예측 가능 (보안 위험)<br>- 분산 시스템 어려움 | - 내부 전용 ID<br>- 성능 최우선 |

**권장:**
- **유지**: 현재 UUID 전략 (이미 production 데이터 존재)
- **개선**: UUID v7 고려 (타임스탬프 기반, 정렬 가능, PostgreSQL 17+)
- **하이브리드**: PK는 BIGSERIAL (성능), 외부 노출용 UUID 컬럼 추가

```sql
-- 하이브리드 예시 (신규 테이블에만 적용 고려)
CREATE TABLE recipes_v2 (
  id bigserial PRIMARY KEY,
  public_id uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  -- ... 나머지 필드
);

-- 애플리케이션에서는 public_id만 노출
-- 내부 JOIN/FK는 bigserial id 사용
```

**현재 프로젝트 권장:** UUID 유지 (마이그레이션 비용 대비 이점 낮음)

---

## B. ERD (Entity Relationship Diagram)

```mermaid
erDiagram
    users ||--o{ recipes : "owns"
    users ||--o{ saved_recipes : "saves"
    users ||--o{ recipe_views : "views"
    users ||--o{ likes : "likes"
    users ||--o{ recent_views : "has"
    users ||--o{ user_sessions : "has"
    users ||--o{ user_activity_logs : "has"
    users ||--o{ daily_user_stats : "has"
    users ||--o{ account_deletion_requests : "requests"

    recipes ||--o{ recipe_steps : "contains"
    recipes ||--o{ saved_recipes : "saved_by"
    recipes ||--o{ recipe_views : "viewed"
    recipes ||--o{ recipe_analytics : "has_analytics"
    recipes ||--o{ recipe_daily_stats : "has_stats"
    recipes ||--o{ recipe_interactions : "has_interactions"
    recipes ||--o{ likes : "liked_by"
    recipes }o--o| grinders : "uses"

    roasteries ||--o{ events : "hosts"

    users {
        uuid id PK
        varchar email UK
        varchar display_name
        text profile_image
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    recipes {
        uuid id PK
        uuid owner_id FK
        varchar name
        text description
        boolean is_public
        enum brewing_type
        decimal coffee
        decimal water
        decimal water_temperature
        varchar ratio
        varchar dripper
        varchar filter
        uuid grinder_id FK
        smallint grinder_clicks
        smallint micron
        integer total_time
        text youtube_url
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    recipe_steps {
        uuid id PK
        uuid recipe_id FK
        smallint step_index
        integer time
        integer duration
        varchar title
        text description
        decimal water
    }

    saved_recipes {
        uuid user_id PK_FK
        uuid recipe_id PK_FK
        timestamptz saved_at
        boolean is_pinned
        integer pin_order
        timestamptz pinned_at
    }

    events {
        uuid id PK
        varchar title
        uuid roastery_id FK
        varchar roastery_name
        enum category
        date event_date
        time start_time
        time end_time
        text description
        varchar location
        text image_url
        decimal price
        integer max_participants
        text registration_url
        boolean is_published
        timestamptz created_at
        timestamptz updated_at
    }

    roasteries {
        uuid id PK
        varchar name
        text description
        varchar address
        text featured_image
        text online_shop_url
        decimal latitude
        decimal longitude
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    grinders {
        uuid id PK
        varchar brand
        varchar name
        smallint min_clicks
        smallint max_clicks
        smallint micron_range_min
        smallint micron_range_max
        timestamptz created_at
    }

    recipe_views {
        uuid id PK
        uuid recipe_id FK
        uuid user_id FK
        timestamptz viewed_at
        varchar platform
        varchar session_id
    }

    recipe_analytics {
        uuid recipe_id PK_FK
        integer total_views
        integer unique_viewers
        integer total_likes
        integer total_saves
        decimal avg_completion_rate
        timestamptz last_viewed_at
        timestamptz updated_at
    }

    recipe_daily_stats {
        uuid recipe_id PK_FK
        date stat_date PK
        integer views
        integer unique_viewers
        integer likes
        integer saves
    }

    recipe_interactions {
        uuid id PK
        uuid recipe_id FK
        uuid user_id FK
        enum interaction_type
        jsonb metadata
        timestamptz created_at
    }

    likes {
        uuid user_id PK_FK
        uuid recipe_id PK_FK
        timestamptz liked_at
    }

    recent_views {
        uuid user_id PK_FK
        uuid recipe_id PK_FK
        timestamptz last_viewed_at
    }

    user_activity_logs {
        uuid id PK
        uuid user_id FK
        enum action_type
        jsonb metadata
        timestamptz created_at
    }

    user_sessions {
        uuid session_id PK
        uuid user_id FK
        varchar platform
        timestamptz started_at
        timestamptz ended_at
    }

    daily_user_stats {
        uuid user_id PK_FK
        date stat_date PK
        integer recipes_viewed
        integer recipes_created
        integer recipes_saved
        integer active_minutes
    }

    account_deletion_requests {
        uuid id PK
        uuid user_id FK
        varchar reason
        timestamptz requested_at
        timestamptz scheduled_for
        timestamptz confirmed_at
        enum status
    }
```

**카디널리티 설명:**
- `||--o{`: 일대다 (One-to-Many)
- `}o--o|`: 다대일 (Many-to-One), nullable FK
- `||--||`: 일대일 (One-to-One)
- `}o--o{`: 다대다 (Many-to-Many, 중간 테이블 필요)

---

## C. 인덱스 전략 최적화

### 기존 인덱스 평가

| 인덱스 | 평가 | 권장 조치 |
|--------|------|----------|
| `idx_recipes_public_created` | ✅ 우수 - Partial Index 활용 | 유지 |
| `idx_recipes_owner_created` | ✅ 우수 - 복합 인덱스 | 유지 |
| `idx_recipe_steps_recipe_id` | ✅ 필수 - FK 성능 | 유지 |
| `idx_events_published_date` | ✅ 우수 - 복합 + Partial | 유지 |
| `idx_roasteries_active` | ✅ 우수 - Partial Index | 유지 |
| `idx_recipes_name_trgm` | ⚠️ 검토 필요 - Full-Text 대안 고려 | 아래 참고 |
| `idx_recipes_description_trgm` | ⚠️ 검토 필요 - Full-Text 대안 고려 | 아래 참고 |

### 추가 필요 인덱스

```sql
-- 1. saved_recipes 조회 최적화
CREATE INDEX idx_saved_recipes_user_pinned
ON saved_recipes(user_id, is_pinned, pin_order)
WHERE is_pinned = true;

CREATE INDEX idx_saved_recipes_user_saved
ON saved_recipes(user_id, saved_at DESC);

-- 2. likes 조회 최적화 (좋아요한 레시피 목록)
CREATE INDEX idx_likes_user_liked
ON likes(user_id, liked_at DESC);

-- 3. events 지역 검색 (향후 지도 기능)
CREATE INDEX idx_events_location
ON events USING gist(ll_to_earth(latitude, longitude))
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 4. recipes 필터링 조합 (자주 사용되는 쿼리 패턴)
CREATE INDEX idx_recipes_public_type_created
ON recipes(brewing_type, created_at DESC)
WHERE is_public = true AND deleted_at IS NULL;

CREATE INDEX idx_recipes_public_dripper
ON recipes(dripper, created_at DESC)
WHERE is_public = true AND deleted_at IS NULL AND dripper IS NOT NULL;

-- 5. recipe_analytics 정렬 조회
CREATE INDEX idx_recipe_analytics_views
ON recipe_analytics(total_views DESC);

CREATE INDEX idx_recipe_analytics_likes
ON recipe_analytics(total_likes DESC);

-- 6. soft delete 필터링
CREATE INDEX idx_recipes_active
ON recipes(created_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX idx_roasteries_name_active
ON roasteries(name)
WHERE deleted_at IS NULL;

-- 7. user sessions 조회
CREATE INDEX idx_user_sessions_user_started
ON user_sessions(user_id, started_at DESC);

-- 8. recipe_daily_stats 시계열 조회
CREATE INDEX idx_recipe_daily_stats_date
ON recipe_daily_stats(stat_date DESC);

CREATE INDEX idx_recipe_daily_stats_recipe_date
ON recipe_daily_stats(recipe_id, stat_date DESC);
```

### Covering Index 기회 분석

Covering Index는 인덱스만으로 쿼리를 완성할 수 있어 테이블 접근을 제거합니다.

```sql
-- 예시: 레시피 목록 조회 (name, created_at만 필요)
CREATE INDEX idx_recipes_public_created_covering
ON recipes(created_at DESC, id, name, owner_id, brewing_type, total_time)
WHERE is_public = true AND deleted_at IS NULL;

-- 쿼리 예시
SELECT id, name, owner_id, brewing_type, total_time, created_at
FROM recipes
WHERE is_public = true AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;
-- → Index Only Scan 가능

-- 예시: 저장된 레시피 목록
CREATE INDEX idx_saved_recipes_user_covering
ON saved_recipes(user_id, saved_at DESC, recipe_id, is_pinned)
INCLUDE (pin_order);

-- PostgreSQL 11+ INCLUDE 구문 활용
CREATE INDEX idx_recipes_public_created_include
ON recipes(created_at DESC)
INCLUDE (id, name, brewing_type, total_time)
WHERE is_public = true AND deleted_at IS NULL;
```

**주의사항:**
- Covering Index는 크기가 커지므로 자주 사용되는 쿼리에만 적용
- `INCLUDE` 절은 PostgreSQL 11+ 지원
- 실제 쿼리 패턴 분석 후 추가 (pg_stat_statements)

### pg_trgm vs Full-Text Search 비교

| 기능 | pg_trgm (Trigram) | Full-Text Search (tsvector) |
|------|-------------------|----------------------------|
| **검색 방식** | 3글자 단위 유사도 | 형태소 분석 + 랭킹 |
| **언어 지원** | 언어 무관 | 언어별 dictionary 필요 |
| **한글 지원** | ✅ 우수 (자모 분리 없이 작동) | ⚠️ 제한적 (기본 설정 부족) |
| **LIKE 패턴** | ✅ 지원 (`%검색어%`) | ❌ 미지원 |
| **퍼지 매칭** | ✅ 유사도 검색 가능 | ❌ 정확한 토큰 매칭 |
| **성능** | 중간 (GIN 인덱스) | 빠름 (전용 인덱스) |
| **인덱스 크기** | 큼 | 중간 |
| **랭킹** | 유사도 기반 | TF-IDF 기반 |

**현재 프로젝트 권장: pg_trgm 유지**

이유:
1. **한글 주요 언어**: Full-Text Search는 한글 dictionary 부족
2. **부분 검색 필요**: 레시피 이름 중간 일치 검색 (`%스트롱%`)
3. **간단한 구현**: 추가 설정 불필요
4. **유사도 검색**: 오타 허용 검색 가능 (`similarity()`)

```sql
-- 현재 pg_trgm 사용 예시
SELECT *
FROM recipes
WHERE name % '스트롱'  -- 유사도 검색
ORDER BY similarity(name, '스트롱') DESC
LIMIT 10;

-- ILIKE 패턴 검색 (GIN 인덱스 활용)
SELECT *
FROM recipes
WHERE name ILIKE '%스트롱%'
ORDER BY created_at DESC;

-- Full-Text Search 예시 (참고용, 권장 안 함)
-- ALTER TABLE recipes ADD COLUMN name_ts tsvector
-- GENERATED ALWAYS AS (to_tsvector('korean', name)) STORED;
-- CREATE INDEX idx_recipes_name_fts ON recipes USING gin(name_ts);
-- SELECT * FROM recipes WHERE name_ts @@ to_tsquery('korean', '스트롱');
```

**최적화 권장:**

```sql
-- 1. pg_trgm 인덱스 유지
CREATE INDEX idx_recipes_name_trgm ON recipes USING gin(name gin_trgm_ops);
CREATE INDEX idx_recipes_description_trgm ON recipes USING gin(description gin_trgm_ops);

-- 2. 검색 성능 튜닝
SET pg_trgm.similarity_threshold = 0.3;  -- 기본값 조정

-- 3. 복합 검색 (이름 + 설명)
CREATE INDEX idx_recipes_search_trgm
ON recipes USING gin((name || ' ' || COALESCE(description, '')) gin_trgm_ops)
WHERE is_public = true AND deleted_at IS NULL;

-- 검색 쿼리
SELECT *, similarity(name || ' ' || COALESCE(description, ''), '스트롱 브루잉') as score
FROM recipes
WHERE (name || ' ' || COALESCE(description, '')) % '스트롱 브루잉'
  AND is_public = true
  AND deleted_at IS NULL
ORDER BY score DESC
LIMIT 20;
```

---

## D. Enum 관리 전략

### 접근 방식 비교

| 방식 | 장점 | 단점 | 권장 사용처 |
|------|------|------|-------------|
| **PostgreSQL ENUM** | - 타입 안전성<br>- 작은 저장 공간<br>- 네이티브 검증 | - 값 추가 시 마이그레이션 필요<br>- 값 삭제/변경 어려움<br>- 순서 변경 불가 | **변경 드문 필드**<br>- brewing_type<br>- event_category |
| **CHECK Constraint** | - 유연한 수정<br>- 간단한 구문 | - 타입 안전성 낮음 (여전히 text)<br>- 제약조건 수정 필요 | **가끔 변경되는 필드**<br>- user_role |
| **참조 테이블** | - 가장 유연함<br>- 메타데이터 추가 가능<br>- 다국어 지원 | - JOIN 오버헤드<br>- 복잡도 증가 | **자주 변경되는 필드**<br>- dripper (사용자 추가 가능)<br>- filter |

### 현재 프로젝트 권장

```sql
-- 1. PostgreSQL ENUM (불변 필드)
CREATE TYPE brewing_type_enum AS ENUM ('hot', 'ice');
CREATE TYPE event_category_enum AS ENUM ('cupping', 'popup');

-- 장점: 타입 안전, 작은 크기
-- 단점: 값 추가 시 ALTER TYPE 필요

-- 값 추가 방법 (PostgreSQL 9.1+)
ALTER TYPE brewing_type_enum ADD VALUE 'cold_brew' AFTER 'ice';

-- 2. 참조 테이블 (가변 필드)
CREATE TABLE dripper_types (
  id serial PRIMARY KEY,
  name varchar(100) UNIQUE NOT NULL,
  display_name_ko varchar(100),
  display_name_en varchar(100),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE filter_types (
  id serial PRIMARY KEY,
  name varchar(100) UNIQUE NOT NULL,
  display_name_ko varchar(100),
  display_name_en varchar(100),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- recipes 테이블 수정
ALTER TABLE recipes
  DROP COLUMN dripper,
  DROP COLUMN filter,
  ADD COLUMN dripper_id integer REFERENCES dripper_types(id),
  ADD COLUMN filter_id integer REFERENCES filter_types(id);

-- 초기 데이터 마이그레이션
INSERT INTO dripper_types (name, display_name_ko) VALUES
  ('v60', 'V60'),
  ('kalita', '칼리타'),
  ('origami', '오리가미'),
  ('chemex', '케맥스');

INSERT INTO filter_types (name, display_name_ko) VALUES
  ('white_paper', '백색 페이퍼'),
  ('brown_paper', '갈색 페이퍼'),
  ('metal', '메탈 필터'),
  ('cloth', '융 필터');

-- 3. CHECK Constraint (중간 수준)
-- brewing_type을 ENUM 대신 CHECK로 구현 시
ALTER TABLE recipes
  DROP COLUMN brewing_type,
  ADD COLUMN brewing_type varchar(20) NOT NULL DEFAULT 'hot'
  CHECK (brewing_type IN ('hot', 'ice', 'cold_brew'));

-- 값 추가 시
ALTER TABLE recipes
  DROP CONSTRAINT recipes_brewing_type_check,
  ADD CONSTRAINT recipes_brewing_type_check
  CHECK (brewing_type IN ('hot', 'ice', 'cold_brew', 'espresso'));
```

### 하이브리드 전략 (권장)

```sql
-- 불변 필드: PostgreSQL ENUM
CREATE TYPE brewing_type_enum AS ENUM ('hot', 'ice');
CREATE TYPE event_category_enum AS ENUM ('cupping', 'popup', 'workshop', 'tasting');

-- 가변 필드: 참조 테이블
CREATE TABLE dripper_types (...);
CREATE TABLE filter_types (...);
CREATE TABLE grinder_brands (...);

-- recipes 테이블 (최종)
CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  description text,
  is_public boolean NOT NULL DEFAULT false,

  -- ENUM (불변)
  brewing_type brewing_type_enum NOT NULL,

  -- 참조 테이블 (가변)
  dripper_id integer REFERENCES dripper_types(id),
  filter_id integer REFERENCES filter_types(id),
  grinder_id uuid REFERENCES grinders(id),

  -- 나머지 필드
  coffee decimal(10, 2) NOT NULL,
  water decimal(10, 2) NOT NULL,
  -- ...
);
```

### Prisma 스키마 예시

```prisma
enum BrewingType {
  hot
  ice
}

enum EventCategory {
  cupping
  popup
  workshop
  tasting
}

model DripperType {
  id            Int      @id @default(autoincrement())
  name          String   @unique @db.VarChar(100)
  displayNameKo String?  @map("display_name_ko") @db.VarChar(100)
  displayNameEn String?  @map("display_name_en") @db.VarChar(100)
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")

  recipes       Recipe[]

  @@map("dripper_types")
}

model Recipe {
  id          String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  brewingType BrewingType @map("brewing_type")
  dripperId   Int?        @map("dripper_id")
  dripper     DripperType? @relation(fields: [dripperId], references: [id])
  // ...

  @@map("recipes")
}
```

---

## E. Soft Delete 패턴 최적화

### 현재 패턴 평가

**현재 구현:**
```sql
deleted_at timestamptz  -- NULL = active, NOT NULL = deleted
```

**장점:**
- 간단한 구현
- 삭제 시점 추적 가능
- 복구 용이

**단점:**
- 모든 쿼리에 `WHERE deleted_at IS NULL` 필요
- 실수로 누락 시 삭제된 데이터 노출
- 인덱스 효율성 저하 (NULL 값 포함)

### Partial Index 활용

```sql
-- 기존 인덱스 (비효율)
CREATE INDEX idx_recipes_created ON recipes(created_at DESC);
-- → deleted_at이 NULL이 아닌 행도 인덱스에 포함됨

-- Partial Index (권장)
CREATE INDEX idx_recipes_active_created
ON recipes(created_at DESC)
WHERE deleted_at IS NULL;  -- 활성 데이터만 인덱싱

-- 크기 비교
SELECT pg_size_pretty(pg_relation_size('idx_recipes_created'));        -- 예: 2.5 MB
SELECT pg_size_pretty(pg_relation_size('idx_recipes_active_created')); -- 예: 2.3 MB (삭제율에 따라)
```

**모든 Soft Delete 테이블에 적용:**

```sql
-- recipes
CREATE INDEX idx_recipes_active_created ON recipes(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_recipes_active_owner ON recipes(owner_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_recipes_active_public ON recipes(is_public, created_at DESC) WHERE deleted_at IS NULL AND is_public = true;

-- roasteries
CREATE INDEX idx_roasteries_active_name ON roasteries(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_roasteries_active_created ON roasteries(created_at DESC) WHERE deleted_at IS NULL;

-- users (삭제 예정 사용자 제외)
CREATE INDEX idx_users_active_email ON users(email) WHERE deleted_at IS NULL;
```

### Query 시 자동 필터링 전략

#### 1. PostgreSQL View (읽기 전용)

```sql
CREATE VIEW recipes_active AS
SELECT *
FROM recipes
WHERE deleted_at IS NULL;

-- 사용
SELECT * FROM recipes_active WHERE is_public = true;
```

**장점:** 간단, 필터 자동 적용
**단점:** INSERT/UPDATE/DELETE 복잡, Prisma ORM과 통합 어려움

#### 2. Prisma Middleware (권장)

```typescript
// prisma/middleware.ts
import { Prisma } from '@prisma/client';

export function softDeleteMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    // 1. Soft delete 대상 모델 정의
    const softDeleteModels = ['Recipe', 'Roastery', 'User'];

    if (!softDeleteModels.includes(params.model ?? '')) {
      return next(params);
    }

    // 2. DELETE → UPDATE로 변환
    if (params.action === 'delete') {
      params.action = 'update';
      params.args.data = { deletedAt: new Date() };
    }

    if (params.action === 'deleteMany') {
      params.action = 'updateMany';
      params.args.data = { deletedAt: new Date() };
    }

    // 3. 조회 시 자동 필터 추가
    if (params.action === 'findUnique' || params.action === 'findFirst') {
      params.args.where = {
        ...params.args.where,
        deletedAt: null,
      };
    }

    if (params.action === 'findMany') {
      if (params.args.where) {
        if (params.args.where.deletedAt === undefined) {
          params.args.where.deletedAt = null;
        }
      } else {
        params.args.where = { deletedAt: null };
      }
    }

    if (params.action === 'count') {
      params.args.where = {
        ...params.args.where,
        deletedAt: null,
      };
    }

    // 4. UPDATE 시 deletedAt 보호
    if (params.action === 'update' || params.action === 'updateMany') {
      params.args.where = {
        ...params.args.where,
        deletedAt: null,
      };
    }

    return next(params);
  };
}

// app/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { softDeleteMiddleware } from './middleware';

const prisma = new PrismaClient();
prisma.$use(softDeleteMiddleware());

export default prisma;
```

**사용 예시:**

```typescript
// 자동으로 deletedAt IS NULL 필터 추가됨
const recipes = await prisma.recipe.findMany({
  where: { isPublic: true },
});

// Soft delete 실행 (실제로는 UPDATE)
await prisma.recipe.delete({
  where: { id: recipeId },
});

// 삭제된 데이터 포함 조회 (명시적)
const allRecipes = await prisma.recipe.findMany({
  where: {
    isPublic: true,
    deletedAt: undefined, // middleware 필터 우회
  },
});

// 완전 삭제 (필요 시)
await prisma.$executeRaw`
  DELETE FROM recipes WHERE id = ${recipeId}
`;
```

#### 3. PostgreSQL Row Level Security (RLS)

```sql
-- RLS 활성화
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- 기본 정책: 삭제되지 않은 행만 조회
CREATE POLICY recipes_select_active ON recipes
  FOR SELECT
  USING (deleted_at IS NULL);

-- 소유자는 자신의 삭제된 레시피도 조회 가능
CREATE POLICY recipes_select_owner ON recipes
  FOR SELECT
  USING (owner_id = current_user_id() OR deleted_at IS NULL);

-- INSERT/UPDATE 정책
CREATE POLICY recipes_insert ON recipes FOR INSERT WITH CHECK (true);
CREATE POLICY recipes_update_active ON recipes FOR UPDATE USING (deleted_at IS NULL);
```

**주의:** RLS는 Supabase에서 유용하지만, Prisma + 일반 PostgreSQL에서는 복잡도 증가

### Hard Delete 전략

```sql
-- 정기 삭제 작업 (30일 경과 데이터)
CREATE OR REPLACE FUNCTION cleanup_soft_deleted()
RETURNS void AS $$
BEGIN
  -- recipes
  DELETE FROM recipes
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';

  -- roasteries
  DELETE FROM roasteries
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';

  -- users (90일 유예)
  DELETE FROM users
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '90 days';

  RAISE NOTICE 'Soft deleted records cleaned up';
END;
$$ LANGUAGE plpgsql;

-- Cron 작업 (pg_cron 확장 필요)
-- SELECT cron.schedule('cleanup-soft-deleted', '0 2 * * 0', 'SELECT cleanup_soft_deleted()');
```

---

## F. 뷰 마이그레이션

### 1. v_today_popular_recipes

**현재 뷰 (추정):**
```sql
CREATE VIEW v_today_popular_recipes AS
SELECT r.*, COUNT(rv.id) as today_views
FROM recipes r
LEFT JOIN recipe_views rv ON r.id = rv.recipe_id
  AND rv.viewed_at >= CURRENT_DATE
WHERE r.is_public = true AND r.deleted_at IS NULL
GROUP BY r.id
ORDER BY today_views DESC
LIMIT 50;
```

**마이그레이션 옵션:**

**Option A: Materialized View (권장)**
```sql
CREATE MATERIALIZED VIEW mv_today_popular_recipes AS
SELECT
  r.id,
  r.name,
  r.description,
  r.brewing_type,
  r.total_time,
  r.owner_id,
  r.created_at,
  COUNT(DISTINCT rv.user_id) as unique_viewers,
  COUNT(rv.id) as total_views,
  ra.total_likes,
  ra.total_saves
FROM recipes r
LEFT JOIN recipe_views rv ON r.id = rv.recipe_id
  AND rv.viewed_at >= CURRENT_DATE
LEFT JOIN recipe_analytics ra ON r.id = ra.recipe_id
WHERE r.is_public = true AND r.deleted_at IS NULL
GROUP BY r.id, ra.total_likes, ra.total_saves
ORDER BY total_views DESC, total_likes DESC
LIMIT 50;

-- 인덱스 추가
CREATE UNIQUE INDEX ON mv_today_popular_recipes(id);

-- 1시간마다 갱신
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_today_popular_recipes;
```

**Option B: 애플리케이션 레벨 (Prisma)**
```typescript
// lib/queries/popularRecipes.ts
export async function getTodayPopularRecipes(limit = 50) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.recipe.findMany({
    where: {
      isPublic: true,
      deletedAt: null,
    },
    include: {
      _count: {
        select: {
          recipeViews: {
            where: {
              viewedAt: { gte: today },
            },
          },
        },
      },
      recipeAnalytics: {
        select: {
          totalLikes: true,
          totalSaves: true,
        },
      },
    },
    orderBy: [
      { recipeViews: { _count: 'desc' } },
      { recipeAnalytics: { totalLikes: 'desc' } },
    ],
    take: limit,
  });
}

// 캐싱 추가 (Redis)
import { redis } from '@/lib/redis';

export async function getTodayPopularRecipesCached() {
  const cacheKey = 'popular:today';
  const cached = await redis.get(cacheKey);

  if (cached) return JSON.parse(cached);

  const recipes = await getTodayPopularRecipes();
  await redis.setex(cacheKey, 3600, JSON.stringify(recipes)); // 1시간 캐시

  return recipes;
}
```

### 2. v_weekly_trending_recipes

```sql
-- Materialized View
CREATE MATERIALIZED VIEW mv_weekly_trending_recipes AS
SELECT
  r.id,
  r.name,
  r.description,
  r.brewing_type,
  r.total_time,
  r.owner_id,
  r.created_at,
  COUNT(DISTINCT rv.user_id) as unique_viewers,
  COUNT(rv.id) as total_views,
  COUNT(l.user_id) as likes_this_week,
  COUNT(sr.user_id) as saves_this_week,
  (COUNT(rv.id) * 1.0 + COUNT(l.user_id) * 3.0 + COUNT(sr.user_id) * 5.0) as trending_score
FROM recipes r
LEFT JOIN recipe_views rv ON r.id = rv.recipe_id
  AND rv.viewed_at >= CURRENT_DATE - INTERVAL '7 days'
LEFT JOIN likes l ON r.id = l.recipe_id
  AND l.liked_at >= CURRENT_DATE - INTERVAL '7 days'
LEFT JOIN saved_recipes sr ON r.id = sr.recipe_id
  AND sr.saved_at >= CURRENT_DATE - INTERVAL '7 days'
WHERE r.is_public = true AND r.deleted_at IS NULL
GROUP BY r.id
ORDER BY trending_score DESC
LIMIT 50;

CREATE UNIQUE INDEX ON mv_weekly_trending_recipes(id);
```

### 3. v_user_behavior_patterns

```sql
-- 애플리케이션 레벨 구현 권장 (복잡한 집계)
-- lib/analytics/userBehavior.ts
export async function getUserBehaviorPatterns(userId: string) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [viewedRecipes, likedRecipes, savedRecipes, createdRecipes] = await Promise.all([
    prisma.recipeView.count({
      where: { userId, viewedAt: { gte: sevenDaysAgo } },
    }),
    prisma.like.count({
      where: { userId, likedAt: { gte: sevenDaysAgo } },
    }),
    prisma.savedRecipe.count({
      where: { userId, savedAt: { gte: sevenDaysAgo } },
    }),
    prisma.recipe.count({
      where: { ownerId: userId, createdAt: { gte: sevenDaysAgo } },
    }),
  ]);

  return {
    userId,
    weeklyActivity: {
      views: viewedRecipes,
      likes: likedRecipes,
      saves: savedRecipes,
      created: createdRecipes,
    },
    engagementScore: viewedRecipes + likedRecipes * 2 + savedRecipes * 3 + createdRecipes * 5,
  };
}
```

### 4. pinned_recipes_view

```sql
-- 단순 뷰 → 유지 가능
CREATE VIEW pinned_recipes_view AS
SELECT
  sr.user_id,
  sr.recipe_id,
  sr.pin_order,
  sr.pinned_at,
  r.name,
  r.brewing_type,
  r.total_time,
  r.owner_id
FROM saved_recipes sr
JOIN recipes r ON sr.recipe_id = r.id
WHERE sr.is_pinned = true
  AND r.deleted_at IS NULL
ORDER BY sr.user_id, sr.pin_order;

-- 또는 Prisma 쿼리
export async function getPinnedRecipes(userId: string) {
  return prisma.savedRecipe.findMany({
    where: {
      userId,
      isPinned: true,
      recipe: { deletedAt: null },
    },
    include: {
      recipe: {
        select: {
          id: true,
          name: true,
          brewingType: true,
          totalTime: true,
          ownerId: true,
        },
      },
    },
    orderBy: { pinOrder: 'asc' },
  });
}
```

### 권장 전략 요약

| 뷰 | 권장 접근 | 이유 |
|----|----------|------|
| v_today_popular_recipes | Materialized View + 1시간 갱신 | 빈번한 조회, 실시간 불필요 |
| v_weekly_trending_recipes | Materialized View + 일 1회 갱신 | 복잡한 집계, 주간 트렌드 |
| v_user_behavior_patterns | 애플리케이션 + 캐싱 | 사용자별 개인화, 동적 계산 |
| pinned_recipes_view | 일반 View 또는 Prisma | 간단한 조인, 실시간 필요 |

---

## G. 데이터 마이그레이션 전략

### Supabase → Self-hosted PostgreSQL 전환

#### 단계 1: 환경 준비

```bash
# 1. 대상 PostgreSQL 설치 (Docker Compose 예시)
cat > docker-compose.yml <<EOF
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: coffimer
      POSTGRES_USER: coffimer_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=C"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    command:
      - "postgres"
      - "-c"
      - "shared_buffers=256MB"
      - "-c"
      - "max_connections=200"
      - "-c"
      - "effective_cache_size=1GB"

  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    environment:
      DATABASES_HOST: postgres
      DATABASES_PORT: 5432
      DATABASES_USER: coffimer_user
      DATABASES_PASSWORD: ${DB_PASSWORD}
      DATABASES_DBNAME: coffimer
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 25
    ports:
      - "6432:6432"
    depends_on:
      - postgres

volumes:
  postgres_data:
EOF

# 2. 확장 설치 스크립트
cat > init.sql <<EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF
```

#### 단계 2: 스키마 마이그레이션

```bash
# 1. Supabase 스키마 덤프
pg_dump "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" \
  --schema-only \
  --no-owner \
  --no-privileges \
  --exclude-schema=auth \
  --exclude-schema=storage \
  --exclude-schema=realtime \
  --exclude-schema=supabase_functions \
  > schema.sql

# 2. 스키마 정리 (Supabase 전용 제거)
sed -i '' '/auth\./d' schema.sql
sed -i '' '/storage\./d' schema.sql
sed -i '' '/realtime\./d' schema.sql

# 3. 대상 DB에 스키마 적용
psql "postgresql://coffimer_user:[password]@localhost:5432/coffimer" \
  < schema.sql
```

#### 단계 3: 데이터 마이그레이션

**Option A: pg_dump/pg_restore (전체 마이그레이션)**

```bash
# 1. 데이터 덤프 (Custom Format)
pg_dump "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" \
  --format=custom \
  --data-only \
  --no-owner \
  --no-privileges \
  --exclude-schema=auth \
  --exclude-schema=storage \
  --exclude-table=auth.* \
  --exclude-table=storage.* \
  > data.dump

# 2. 데이터 복원
pg_restore --dbname="postgresql://coffimer_user:[password]@localhost:5432/coffimer" \
  --data-only \
  --no-owner \
  --no-privileges \
  --verbose \
  data.dump

# 3. Sequence 재설정 (SERIAL 타입 사용 시)
psql "postgresql://coffimer_user:[password]@localhost:5432/coffimer" <<EOF
SELECT setval('dripper_types_id_seq', (SELECT MAX(id) FROM dripper_types));
SELECT setval('filter_types_id_seq', (SELECT MAX(id) FROM filter_types));
EOF
```

**Option B: 테이블별 마이그레이션 (선택적)**

```bash
#!/bin/bash
# migrate_tables.sh

SOURCE_DB="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
TARGET_DB="postgresql://coffimer_user:[password]@localhost:5432/coffimer"

TABLES=(
  "users"
  "recipes"
  "recipe_steps"
  "saved_recipes"
  "events"
  "roasteries"
  "grinders"
  "recipe_views"
  "recipe_analytics"
  "likes"
)

for table in "${TABLES[@]}"; do
  echo "Migrating $table..."

  # 덤프
  pg_dump "$SOURCE_DB" \
    --table="public.$table" \
    --data-only \
    --no-owner \
    --no-privileges \
    > "${table}.sql"

  # 복원
  psql "$TARGET_DB" < "${table}.sql"

  echo "✓ $table migrated"
done

echo "All tables migrated successfully!"
```

#### 단계 4: 무중단 마이그레이션 (Blue-Green)

```bash
# 1. Read Replica 생성 (Supabase)
# Supabase Dashboard → Database → Replication

# 2. Logical Replication 설정
# 소스 DB (Supabase)
psql "$SOURCE_DB" <<EOF
CREATE PUBLICATION coffimer_pub FOR ALL TABLES;
EOF

# 대상 DB
psql "$TARGET_DB" <<EOF
CREATE SUBSCRIPTION coffimer_sub
CONNECTION 'postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres'
PUBLICATION coffimer_pub;
EOF

# 3. 동기화 확인
psql "$TARGET_DB" -c "SELECT * FROM pg_stat_subscription;"

# 4. 애플리케이션 전환 (DATABASE_URL 변경)
# .env.production
DATABASE_URL="postgresql://coffimer_user:[password]@localhost:6432/coffimer"

# 5. Subscription 제거
psql "$TARGET_DB" -c "DROP SUBSCRIPTION coffimer_sub;"
```

### 데이터 검증 체크리스트

```sql
-- 1. 행 수 비교
SELECT
  'users' as table_name,
  COUNT(*) as source_count
FROM users
UNION ALL
SELECT 'recipes', COUNT(*) FROM recipes
UNION ALL
SELECT 'recipe_steps', COUNT(*) FROM recipe_steps
UNION ALL
SELECT 'saved_recipes', COUNT(*) FROM saved_recipes
UNION ALL
SELECT 'events', COUNT(*) FROM events;

-- 2. 체크섬 비교 (샘플 데이터)
SELECT md5(string_agg(id::text, ',' ORDER BY id)) as checksum
FROM users
LIMIT 1000;

-- 3. 참조 무결성 검증
SELECT
  r.id,
  r.owner_id,
  u.id as user_exists
FROM recipes r
LEFT JOIN users u ON r.owner_id = u.id
WHERE u.id IS NULL;  -- FK 위반 확인

-- 4. NULL 값 검증
SELECT COUNT(*) FROM recipes WHERE name IS NULL;  -- 0이어야 함
SELECT COUNT(*) FROM users WHERE email IS NULL;   -- 0이어야 함

-- 5. 날짜 범위 검증
SELECT
  MIN(created_at) as oldest,
  MAX(created_at) as newest,
  COUNT(*) as total
FROM recipes;

-- 6. Enum 값 검증
SELECT brewing_type, COUNT(*)
FROM recipes
GROUP BY brewing_type;

-- 잘못된 값 확인
SELECT * FROM recipes
WHERE brewing_type NOT IN ('hot', 'ice');
```

---

## H. 백업 및 재해 복구

### 정기 백업 전략

#### 1. 전체 백업 (주간)

```bash
#!/bin/bash
# backup_full.sh

BACKUP_DIR="/var/backups/postgresql"
DB_NAME="coffimer"
DB_USER="coffimer_user"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/full_backup_$TIMESTAMP.dump"

# Full backup (Custom Format)
pg_dump \
  --dbname="$DB_NAME" \
  --username="$DB_USER" \
  --format=custom \
  --file="$BACKUP_FILE" \
  --verbose

# 압축 (선택)
gzip "$BACKUP_FILE"

# 7일 이상 오래된 백업 삭제
find "$BACKUP_DIR" -name "full_backup_*.dump.gz" -mtime +7 -delete

echo "Full backup completed: ${BACKUP_FILE}.gz"
```

#### 2. 증분 백업 (일간) - WAL Archiving

```bash
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/wal_archive/%f && cp %p /var/lib/postgresql/wal_archive/%f'
max_wal_senders = 3

# WAL 백업 스크립트
#!/bin/bash
# backup_wal.sh

WAL_DIR="/var/lib/postgresql/wal_archive"
BACKUP_DIR="/var/backups/postgresql/wal"
TIMESTAMP=$(date +%Y%m%d)

# WAL 파일 압축 및 이동
tar -czf "$BACKUP_DIR/wal_$TIMESTAMP.tar.gz" -C "$WAL_DIR" .

# 3일 이상 오래된 WAL 백업 삭제
find "$BACKUP_DIR" -name "wal_*.tar.gz" -mtime +3 -delete
```

#### 3. 스키마 전용 백업 (일간)

```bash
#!/bin/bash
# backup_schema.sh

BACKUP_DIR="/var/backups/postgresql/schema"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

pg_dump \
  --dbname="coffimer" \
  --username="coffimer_user" \
  --schema-only \
  --file="$BACKUP_DIR/schema_$TIMESTAMP.sql"

# 30일 이상 오래된 스키마 백업 삭제
find "$BACKUP_DIR" -name "schema_*.sql" -mtime +30 -delete
```

#### 4. 자동화 (Cron)

```bash
# crontab -e

# 매일 새벽 2시: 증분 백업 (WAL)
0 2 * * * /usr/local/bin/backup_wal.sh >> /var/log/postgresql/backup_wal.log 2>&1

# 매일 새벽 3시: 스키마 백업
0 3 * * * /usr/local/bin/backup_schema.sh >> /var/log/postgresql/backup_schema.log 2>&1

# 매주 일요일 새벽 1시: 전체 백업
0 1 * * 0 /usr/local/bin/backup_full.sh >> /var/log/postgresql/backup_full.log 2>&1
```

### Point-in-Time Recovery (PITR)

```bash
# 1. 기본 백업 + WAL 아카이빙 활성화 (위 설정)

# 2. 특정 시점으로 복구
# recovery.conf (PostgreSQL 12 이전) 또는 postgresql.conf + recovery.signal

cat > /var/lib/postgresql/data/recovery.conf <<EOF
restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'
recovery_target_time = '2026-02-16 14:30:00'
recovery_target_action = 'promote'
EOF

# PostgreSQL 13+ 방식
cat >> /var/lib/postgresql/data/postgresql.conf <<EOF
restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'
recovery_target_time = '2026-02-16 14:30:00'
recovery_target_action = 'promote'
EOF

touch /var/lib/postgresql/data/recovery.signal

# 3. PostgreSQL 재시작
systemctl restart postgresql

# 4. 복구 완료 확인
psql -c "SELECT pg_is_in_recovery();"  -- false면 복구 완료
```

### 롤백 계획

#### 1. 마이그레이션 롤백 (Supabase로 복귀)

```bash
# 1. Supabase 연결 정보 복구
# .env.production
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"

# 2. 애플리케이션 재배포
npm run build
pm2 restart coffimer-app

# 3. 데이터 역동기화 (필요 시)
# 새 PostgreSQL → Supabase
pg_dump "postgresql://localhost:5432/coffimer" \
  --data-only \
  --no-owner \
  --no-privileges \
  > rollback_data.sql

psql "$SUPABASE_DB_URL" < rollback_data.sql
```

#### 2. 스키마 롤백 (Prisma Migrations)

```bash
# 이전 마이그레이션으로 되돌리기
npx prisma migrate resolve --rolled-back 20260216_new_schema

# 특정 마이그레이션까지 롤백
npx prisma migrate reset --to 20260215_baseline
```

#### 3. 데이터 롤백 (전체 백업 복원)

```bash
# 1. 현재 DB 삭제
dropdb coffimer

# 2. 새 DB 생성
createdb coffimer

# 3. 백업 복원
pg_restore --dbname="coffimer" \
  --verbose \
  --no-owner \
  --no-privileges \
  /var/backups/postgresql/full_backup_20260215_020000.dump.gz
```

### 재해 복구 시나리오

| 시나리오 | 복구 방법 | RTO | RPO |
|----------|----------|-----|-----|
| **데이터 오염** | 최신 전체 백업 복원 | < 1시간 | 최대 7일 |
| **실수로 DROP TABLE** | PITR (WAL 기반) | < 30분 | < 1일 |
| **디스크 장애** | 전체 백업 + 새 서버 | < 2시간 | 최대 7일 |
| **마이그레이션 실패** | Supabase 롤백 | < 5분 | 0 (무중단) |
| **서버 장애** | Standby 서버 승격 | < 5분 | 0 (스트리밍 복제) |

---

## I. 성능 튜닝 권장사항

### postgresql.conf 핵심 파라미터

```conf
# ===== 메모리 설정 =====
# 시스템 RAM의 25% 권장 (8GB 서버 기준 2GB)
shared_buffers = 2GB

# shared_buffers의 2-4배
effective_cache_size = 6GB

# 복잡한 쿼리/정렬용 (per operation)
work_mem = 16MB

# 전체 유지보수 작업용
maintenance_work_mem = 512MB

# ===== 연결 설정 =====
max_connections = 200          # PgBouncer 사용 시 낮춰도 됨
superuser_reserved_connections = 3

# ===== WAL 설정 =====
wal_level = replica            # 스트리밍 복제용
max_wal_size = 2GB
min_wal_size = 1GB
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# ===== 쿼리 플래너 =====
random_page_cost = 1.1         # SSD 기준 (HDD는 4.0)
effective_io_concurrency = 200 # SSD 기준

# ===== 로깅 =====
log_min_duration_statement = 1000  # 1초 이상 쿼리 로깅
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0

# ===== 통계 =====
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.max = 10000
pg_stat_statements.track = all

# ===== Auto Vacuum =====
autovacuum = on
autovacuum_max_workers = 4
autovacuum_naptime = 10s       # 기본 1분 → 10초 (활발한 DB)
autovacuum_vacuum_scale_factor = 0.1
autovacuum_analyze_scale_factor = 0.05

# ===== 동시성 =====
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
```

### Connection Pooling (PgBouncer)

```ini
# /etc/pgbouncer/pgbouncer.ini

[databases]
coffimer = host=localhost port=5432 dbname=coffimer

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

# Pool mode
pool_mode = transaction        # 권장: transaction (stateless)
# session: Prisma, 연결 상태 유지 필요 시
# statement: 가장 공격적, Prepared Statement 미지원

# Pool size
default_pool_size = 25         # DB 연결 수
max_client_conn = 1000         # 클라이언트 연결 수
reserve_pool_size = 5
reserve_pool_timeout = 3

# Timeouts
server_idle_timeout = 600
server_lifetime = 3600
server_connect_timeout = 15
query_timeout = 60

# Logging
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1
```

**Prisma와 PgBouncer 사용 시 주의:**

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // PgBouncer transaction mode 사용 시
  // Prisma Migrate는 direct connection 필요
  directUrl = env("DIRECT_DATABASE_URL")
}

// .env
DATABASE_URL="postgresql://user:pass@localhost:6432/coffimer?pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://user:pass@localhost:5432/coffimer"
```

### Query Plan 분석 가이드

```sql
-- 1. 느린 쿼리 식별 (pg_stat_statements)
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time,
  stddev_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- 100ms 이상
ORDER BY mean_exec_time DESC
LIMIT 20;

-- 2. EXPLAIN ANALYZE 실행
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT r.*, u.display_name
FROM recipes r
JOIN users u ON r.owner_id = u.id
WHERE r.is_public = true AND r.deleted_at IS NULL
ORDER BY r.created_at DESC
LIMIT 20;

-- 3. 인덱스 사용 확인
-- Seq Scan → 인덱스 필요
-- Index Scan → 정상
-- Bitmap Heap Scan → 복합 인덱스 고려

-- 4. 미사용 인덱스 찾기
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;

-- 5. 테이블 통계 업데이트
ANALYZE recipes;
ANALYZE VERBOSE;  -- 전체 DB

-- 6. Bloat 확인 (테이블/인덱스 비대화)
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  n_dead_tup,
  n_live_tup,
  round(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_ratio
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- Bloat 해결
VACUUM FULL recipes;  -- 테이블 잠금, 주의!
REINDEX TABLE recipes; -- 인덱스 재구성
```

### 성능 모니터링 쿼리

```sql
-- 1. 현재 활성 쿼리
SELECT
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  state_change,
  wait_event_type,
  wait_event,
  substring(query, 1, 100) as query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- 2. 블로킹 쿼리
SELECT
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement,
  blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks
  ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
  AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
  AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
  AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
  AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
  AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
  AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
  AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
  AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
  AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- 3. 캐시 히트율 (95% 이상 권장)
SELECT
  sum(blks_hit) * 100.0 / sum(blks_hit + blks_read) as cache_hit_ratio
FROM pg_stat_database;

-- 4. 테이블별 I/O 통계
SELECT
  schemaname,
  tablename,
  heap_blks_read,
  heap_blks_hit,
  idx_blks_read,
  idx_blks_hit,
  round(100.0 * heap_blks_hit / NULLIF(heap_blks_hit + heap_blks_read, 0), 2) as heap_hit_ratio,
  round(100.0 * idx_blks_hit / NULLIF(idx_blks_hit + idx_blks_read, 0), 2) as idx_hit_ratio
FROM pg_statio_user_tables
ORDER BY heap_blks_read + idx_blks_read DESC
LIMIT 20;
```

---

## 추가 권장사항

### 1. 파티셔닝 (향후 대용량 데이터 대비)

```sql
-- recipe_views 테이블 월별 파티셔닝 예시
CREATE TABLE recipe_views_partitioned (
  id uuid DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL,
  user_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL,
  platform varchar(50),
  session_id varchar(255)
) PARTITION BY RANGE (viewed_at);

-- 2026년 2월 파티션
CREATE TABLE recipe_views_202602
PARTITION OF recipe_views_partitioned
FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- 2026년 3월 파티션
CREATE TABLE recipe_views_202603
PARTITION OF recipe_views_partitioned
FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- 자동 파티션 생성 (pg_partman 확장)
```

### 2. Read Replica (읽기 분산)

```bash
# Streaming Replication 설정
# Primary 서버: postgresql.conf
wal_level = replica
max_wal_senders = 5
wal_keep_size = 1GB

# Replica 서버: standby.signal + postgresql.conf
primary_conninfo = 'host=primary.example.com port=5432 user=replicator password=xxx'
hot_standby = on

# 애플리케이션: 읽기/쓰기 분리
DATABASE_URL_PRIMARY="postgresql://localhost:5432/coffimer"
DATABASE_URL_REPLICA="postgresql://replica:5432/coffimer"

# Prisma 예시
const prismaWrite = new PrismaClient({ datasources: { db: { url: PRIMARY_URL } } });
const prismaRead = new PrismaClient({ datasources: { db: { url: REPLICA_URL } } });

// 쓰기
await prismaWrite.recipe.create({ data: {...} });

// 읽기
const recipes = await prismaRead.recipe.findMany();
```

### 3. 보안 강화

```sql
-- 1. SSL 연결 강제
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/etc/ssl/certs/server.crt';
ALTER SYSTEM SET ssl_key_file = '/etc/ssl/private/server.key';

-- 2. 사용자 권한 최소화
REVOKE ALL ON DATABASE coffimer FROM PUBLIC;
GRANT CONNECT ON DATABASE coffimer TO coffimer_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO coffimer_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO coffimer_user;

-- 3. pg_hba.conf 강화
# local   all   all                 peer
# host    all   all   127.0.0.1/32  scram-sha-256
# host    all   all   ::1/128       scram-sha-256
# hostssl all   all   0.0.0.0/0     scram-sha-256

-- 4. 민감 데이터 암호화
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 예: 이메일 암호화 (필요 시)
ALTER TABLE users ADD COLUMN email_encrypted bytea;
UPDATE users SET email_encrypted = pgp_sym_encrypt(email, 'encryption_key');
```

---

## 마이그레이션 체크리스트

### Pre-Migration
- [ ] 현재 Supabase 데이터 전체 백업
- [ ] 스키마 덤프 및 검토
- [ ] 대상 PostgreSQL 서버 준비
- [ ] 확장 설치 (uuid-ossp, pg_trgm, pgcrypto)
- [ ] Prisma 스키마 업데이트
- [ ] 환경 변수 준비 (.env.production)

### Migration
- [ ] 스키마 마이그레이션 실행
- [ ] 데이터 마이그레이션 실행
- [ ] 참조 무결성 검증
- [ ] 인덱스 생성 확인
- [ ] Enum 타입 확인
- [ ] Materialized View 생성

### Post-Migration
- [ ] 데이터 검증 (행 수, 체크섬)
- [ ] 애플리케이션 통합 테스트
- [ ] 성능 테스트 (쿼리 속도)
- [ ] 백업 자동화 설정
- [ ] 모니터링 설정 (pg_stat_statements)
- [ ] PgBouncer 설정 및 테스트
- [ ] 롤백 계획 문서화

### Week 1 After Migration
- [ ] 느린 쿼리 모니터링
- [ ] 인덱스 사용률 분석
- [ ] Auto Vacuum 로그 확인
- [ ] 캐시 히트율 확인 (>95%)
- [ ] 연결 풀 상태 모니터링

---

**최종 권장 사항:**

1. **현재 프로젝트 규모:** Supabase 유지 권장 (운영 부담 낮음, managed service 이점)
2. **마이그레이션 필요 시:** Blue-Green 배포로 무중단 전환
3. **성능 최적화 우선순위:**
   - Partial Index 활용
   - Prisma Middleware로 Soft Delete 자동화
   - pg_trgm 유지 (한글 검색)
   - Materialized View로 복잡한 집계 최적화
4. **확장성 대비:** 파티셔닝, Read Replica 고려 (사용자 10만+ 시)

