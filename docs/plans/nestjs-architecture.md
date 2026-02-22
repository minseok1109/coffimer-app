# NestJS 백엔드 아키텍처 설계

## 목차
- [A. 프로젝트 구조](#a-프로젝트-구조)
- [B. API 엔드포인트 명세](#b-api-엔드포인트-명세)
- [C. 인증/인가 시스템](#c-인증인가-시스템)
- [D. 공통 인프라](#d-공통-인프라)
- [E. DTO 설계](#e-dto-설계)
- [F. 환경 설정](#f-환경-설정)
- [G. 배포 전략](#g-배포-전략)
- [H. Swagger/OpenAPI](#h-swaggeropenapi)

---

## A. 프로젝트 구조

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── jwt-refresh.strategy.ts
│   │   │   ├── guards/
│   │   │   │   └── jwt-auth.guard.ts
│   │   │   ├── decorators/
│   │   │   │   └── current-user.decorator.ts
│   │   │   └── dto/
│   │   │       ├── sign-in.dto.ts
│   │   │       ├── sign-up.dto.ts
│   │   │       ├── refresh-token.dto.ts
│   │   │       └── auth-response.dto.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       ├── update-user.dto.ts
│   │   │       ├── user-response.dto.ts
│   │   │       └── search-users.dto.ts
│   │   │
│   │   ├── recipes/
│   │   │   ├── recipes.module.ts
│   │   │   ├── recipes.controller.ts
│   │   │   ├── recipes.service.ts
│   │   │   ├── recipes.repository.ts
│   │   │   ├── recipe-steps/
│   │   │   │   ├── recipe-steps.service.ts
│   │   │   │   └── recipe-steps.repository.ts
│   │   │   └── dto/
│   │   │       ├── create-recipe.dto.ts
│   │   │       ├── update-recipe.dto.ts
│   │   │       ├── recipe-response.dto.ts
│   │   │       ├── recipe-step.dto.ts
│   │   │       ├── search-recipes.dto.ts
│   │   │       └── filter-recipes.dto.ts
│   │   │
│   │   ├── favorites/
│   │   │   ├── favorites.module.ts
│   │   │   ├── favorites.controller.ts
│   │   │   ├── favorites.service.ts
│   │   │   ├── favorites.repository.ts
│   │   │   └── dto/
│   │   │       ├── add-favorite.dto.ts
│   │   │       ├── toggle-favorite.dto.ts
│   │   │       └── favorite-response.dto.ts
│   │   │
│   │   ├── events/
│   │   │   ├── events.module.ts
│   │   │   ├── events.controller.ts
│   │   │   ├── events.service.ts
│   │   │   ├── events.repository.ts
│   │   │   └── dto/
│   │   │       ├── create-event.dto.ts
│   │   │       ├── update-event.dto.ts
│   │   │       ├── event-response.dto.ts
│   │   │       └── query-events.dto.ts
│   │   │
│   │   ├── roasteries/
│   │   │   ├── roasteries.module.ts
│   │   │   ├── roasteries.controller.ts
│   │   │   ├── roasteries.service.ts
│   │   │   ├── roasteries.repository.ts
│   │   │   └── dto/
│   │   │       ├── create-roastery.dto.ts
│   │   │       ├── update-roastery.dto.ts
│   │   │       └── roastery-response.dto.ts
│   │   │
│   │   ├── grinders/
│   │   │   ├── grinders.module.ts
│   │   │   ├── grinders.controller.ts
│   │   │   ├── grinders.service.ts
│   │   │   ├── grinders.repository.ts
│   │   │   └── dto/
│   │   │       ├── create-grinder.dto.ts
│   │   │       ├── update-grinder.dto.ts
│   │   │       └── grinder-response.dto.ts
│   │   │
│   │   └── analytics/
│   │       ├── analytics.module.ts
│   │       ├── analytics.controller.ts
│   │       ├── analytics.service.ts
│   │       ├── analytics.repository.ts
│   │       └── dto/
│   │           ├── track-view.dto.ts
│   │           ├── recipe-stats.dto.ts
│   │           └── user-stats.dto.ts
│   │
│   ├── common/
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── owner.guard.ts
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── interceptors/
│   │   │   ├── transform.interceptor.ts
│   │   │   ├── logging.interceptor.ts
│   │   │   └── timeout.interceptor.ts
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   ├── prisma-exception.filter.ts
│   │   │   └── all-exceptions.filter.ts
│   │   ├── pipes/
│   │   │   ├── validation.pipe.ts
│   │   │   └── parse-uuid.pipe.ts
│   │   ├── dto/
│   │   │   ├── pagination.dto.ts
│   │   │   └── api-response.dto.ts
│   │   ├── interfaces/
│   │   │   ├── api-response.interface.ts
│   │   │   └── user-payload.interface.ts
│   │   └── utils/
│   │       ├── response.util.ts
│   │       └── pagination.util.ts
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   ├── prisma.service.ts
│   │   └── schema.prisma
│   │
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── validation.schema.ts
│   │
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── main.ts
│
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── .env
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── nest-cli.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── Dockerfile
└── docker-compose.yml
```

### 주요 모듈 설명

#### 1. **Auth 모듈**
- JWT 기반 인증 (access token + refresh token)
- Passport 통합 (jwt.strategy.ts)
- 회원가입/로그인/로그아웃/토큰 갱신
- 계정 삭제 기능

#### 2. **Users 모듈**
- 사용자 프로필 CRUD
- 사용자 검색 (ILIKE)
- 프로필 이미지 업데이트
- Soft delete 지원

#### 3. **Recipes 모듈**
- 레시피 CRUD (트랜잭션 처리)
- Recipe Steps 중첩 관리
- 검색 및 필터링 (드리퍼, 필터, 추출 타입)
- 소유권 확인 (Owner Guard)
- 공개/비공개 레시피 구분

#### 4. **Favorites 모듈**
- 즐겨찾기 추가/제거
- 토글 기능 (원자적 연산)
- 즐겨찾기 목록 조회 (nested select)
- 핀 기능 (is_pinned, pin_order)

#### 5. **Events 모듈**
- 이벤트 CRUD
- 월별/날짜별 조회
- 공개 이벤트 필터링 (is_published)

#### 6. **Roasteries 모듈**
- 로스터리 CRUD
- Soft delete 필터링
- Featured 로스터리 조회

#### 7. **Grinders 모듈**
- 그라인더 CRUD
- 브랜드별 조회

#### 8. **Analytics 모듈**
- 레시피 조회수/좋아요/저장 통계
- 사용자 활동 로그
- 일별/주별 통계

---

## B. API 엔드포인트 명세

### 1. Auth Module

#### POST /auth/signup
회원가입

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "displayName": "홍길동"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "홍길동",
      "profileImage": null
    },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

**Auth:** None

---

#### POST /auth/signin
로그인

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "홍길동",
      "profileImage": "https://..."
    },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

**Auth:** None

---

#### POST /auth/refresh
토큰 갱신

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-access-token",
    "refreshToken": "new-jwt-refresh-token"
  }
}
```

**Auth:** None

---

#### POST /auth/signout
로그아웃

**Request Headers:**
```
Authorization: Bearer {access-token}
```

**Response:**
```json
{
  "success": true,
  "message": "로그아웃 성공"
}
```

**Auth:** Required (JWT)

---

#### DELETE /auth/account
계정 삭제

**Request Headers:**
```
Authorization: Bearer {access-token}
```

**Response:**
```json
{
  "success": true,
  "message": "계정이 삭제되었습니다"
}
```

**Auth:** Required (JWT)

---

### 2. Users Module

#### GET /users/me
현재 사용자 프로필 조회

**Request Headers:**
```
Authorization: Bearer {access-token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "홍길동",
    "profileImage": "https://...",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Auth:** Required (JWT)

---

#### GET /users/:userId
특정 사용자 프로필 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "displayName": "홍길동",
    "profileImage": "https://..."
  }
}
```

**Auth:** None

---

#### PATCH /users/me
현재 사용자 프로필 업데이트

**Request Headers:**
```
Authorization: Bearer {access-token}
```

**Request Body:**
```json
{
  "displayName": "새이름",
  "profileImage": "https://new-image.com/avatar.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "새이름",
    "profileImage": "https://new-image.com/avatar.jpg",
    "updatedAt": "2024-01-02T00:00:00Z"
  }
}
```

**Auth:** Required (JWT)

---

#### GET /users/search?query=홍길
사용자 검색

**Query Params:**
- `query`: 검색어
- `limit`: 결과 개수 (기본값: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "displayName": "홍길동",
      "email": "user@example.com",
      "profileImage": "https://..."
    }
  ]
}
```

**Auth:** None

---

### 3. Recipes Module

#### POST /recipes
레시피 생성

**Request Headers:**
```
Authorization: Bearer {access-token}
```

**Request Body:**
```json
{
  "recipe": {
    "name": "하리오 V60 레시피",
    "description": "밝은 산미를 강조한 레시피",
    "isPublic": true,
    "brewingType": "hot",
    "coffee": 15,
    "water": 250,
    "waterTemperature": 93,
    "ratio": 16.67,
    "totalTime": 180,
    "dripper": "하리오 V60",
    "filter": "하리오 전용 필터",
    "grinderModel": "커맨단테",
    "grinderClicks": 22,
    "micron": 800,
    "youtubeUrl": "https://youtube.com/watch?v=..."
  },
  "steps": [
    {
      "stepIndex": 0,
      "time": 0,
      "duration": 30,
      "title": "블루밍",
      "description": "커피 전체를 적셔주세요",
      "water": 45,
      "totalWater": 45
    },
    {
      "stepIndex": 1,
      "time": 30,
      "duration": 30,
      "title": "1차 주입",
      "description": "중앙에서 원을 그리며",
      "water": 50,
      "totalWater": 95
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "recipe-uuid",
    "name": "하리오 V60 레시피",
    "ownerId": "user-uuid",
    "owner": {
      "id": "user-uuid",
      "displayName": "홍길동",
      "profileImage": "https://..."
    },
    "description": "밝은 산미를 강조한 레시피",
    "isPublic": true,
    "brewingType": "hot",
    "coffee": 15,
    "water": 250,
    "waterTemperature": 93,
    "ratio": 16.67,
    "totalTime": 180,
    "dripper": "하리오 V60",
    "filter": "하리오 전용 필터",
    "grinderModel": "커맨단테",
    "grinderClicks": 22,
    "micron": 800,
    "youtubeUrl": "https://youtube.com/watch?v=...",
    "recipeSteps": [
      {
        "id": 1,
        "recipeId": "recipe-uuid",
        "stepIndex": 0,
        "time": 0,
        "duration": 30,
        "title": "블루밍",
        "description": "커피 전체를 적셔주세요",
        "water": 45,
        "totalWater": 45
      },
      {
        "id": 2,
        "recipeId": "recipe-uuid",
        "stepIndex": 1,
        "time": 30,
        "duration": 30,
        "title": "1차 주입",
        "description": "중앙에서 원을 그리며",
        "water": 50,
        "totalWater": 95
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Auth:** Required (JWT)

---

#### GET /recipes
공개 레시피 목록 조회

**Query Params:**
- `limit`: 페이지당 개수 (기본값: 20)
- `offset`: 오프셋 (기본값: 0)
- `includeSteps`: 스텝 포함 여부 (기본값: true)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "recipe-uuid",
      "name": "하리오 V60 레시피",
      "ownerId": "user-uuid",
      "owner": {
        "id": "user-uuid",
        "displayName": "홍길동",
        "profileImage": "https://..."
      },
      "description": "밝은 산미를 강조한 레시피",
      "isPublic": true,
      "brewingType": "hot",
      "coffee": 15,
      "water": 250,
      "waterTemperature": 93,
      "ratio": 16.67,
      "totalTime": 180,
      "dripper": "하리오 V60",
      "recipeSteps": [...],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 100,
    "limit": 20,
    "offset": 0
  }
}
```

**Auth:** None

---

#### GET /recipes/:recipeId
특정 레시피 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "recipe-uuid",
    "name": "하리오 V60 레시피",
    "ownerId": "user-uuid",
    "owner": {
      "id": "user-uuid",
      "displayName": "홍길동",
      "profileImage": "https://..."
    },
    "recipeSteps": [...],
    ...
  }
}
```

**Auth:** None (공개 레시피), Required (비공개 레시피 소유자)

---

#### GET /recipes/search?q=V60
레시피 검색

**Query Params:**
- `q`: 검색어 (name, description 필드 ILIKE 검색)
- `limit`: 결과 개수 (기본값: 20)
- `offset`: 오프셋 (기본값: 0)
- `includeSteps`: 스텝 포함 여부 (기본값: true)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "recipe-uuid",
      "name": "하리오 V60 레시피",
      ...
    }
  ],
  "meta": {
    "total": 15,
    "limit": 20,
    "offset": 0
  }
}
```

**Auth:** None

---

#### GET /recipes/filter
레시피 필터링

**Query Params:**
- `brewingType`: 추출 타입 (hot, ice, all)
- `dripper[]`: 드리퍼 배열 (v60, origami, solo, hario, other)
- `filter[]`: 필터 배열 (cafec_abaca, kalita_wave, v60_paper, origami_cone, none)
- `includeSteps`: 스텝 포함 여부 (기본값: true)

**Example:**
```
GET /recipes/filter?brewingType=hot&dripper[]=v60&dripper[]=origami&filter[]=cafec_abaca
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "recipe-uuid",
      "name": "하리오 V60 레시피",
      "brewingType": "hot",
      "dripper": "하리오 V60",
      "filter": "카펙 아바카 필터",
      ...
    }
  ],
  "meta": {
    "total": 8
  }
}
```

**Auth:** None

---

#### GET /recipes/filter-options
필터 옵션 조회 (단일 RPC)

**Response:**
```json
{
  "success": true,
  "data": {
    "drippers": [
      { "value": "v60", "count": 15 },
      { "value": "origami", "count": 8 },
      { "value": "solo", "count": 5 }
    ],
    "filters": [
      { "value": "cafec_abaca", "count": 12 },
      { "value": "kalita_wave", "count": 6 }
    ],
    "brewingTypes": [
      { "value": "hot", "count": 20 },
      { "value": "ice", "count": 5 }
    ]
  }
}
```

**Auth:** None

---

#### GET /recipes/user/:userId
특정 사용자의 레시피 목록 조회

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "recipe-uuid",
      "name": "나만의 레시피",
      "isPublic": false,
      "ownerId": "user-uuid",
      ...
    }
  ]
}
```

**Auth:** Required (JWT) - 본인의 레시피만 조회 가능

---

#### PATCH /recipes/:recipeId
레시피 업데이트

**Request Headers:**
```
Authorization: Bearer {access-token}
```

**Request Body:**
```json
{
  "recipe": {
    "name": "수정된 레시피 이름",
    "description": "수정된 설명",
    "isPublic": false
  },
  "steps": [
    {
      "stepIndex": 0,
      "time": 0,
      "duration": 35,
      "title": "수정된 블루밍",
      "water": 50
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "recipe-uuid",
    "name": "수정된 레시피 이름",
    "description": "수정된 설명",
    "isPublic": false,
    "recipeSteps": [...],
    "updatedAt": "2024-01-02T00:00:00Z"
  }
}
```

**Auth:** Required (JWT) + Owner Guard

---

#### DELETE /recipes/:recipeId
레시피 삭제

**Request Headers:**
```
Authorization: Bearer {access-token}
```

**Response:**
```json
{
  "success": true,
  "message": "레시피가 삭제되었습니다"
}
```

**Auth:** Required (JWT) + Owner Guard

---

### 4. Favorites Module

#### POST /favorites
즐겨찾기 추가

**Request Headers:**
```
Authorization: Bearer {access-token}
```

**Request Body:**
```json
{
  "recipeId": "recipe-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-uuid",
    "recipeId": "recipe-uuid",
    "savedAt": "2024-01-01T00:00:00Z",
    "isPinned": false,
    "pinOrder": null
  }
}
```

**Auth:** Required (JWT)

---

#### DELETE /favorites/:recipeId
즐겨찾기 제거

**Request Headers:**
```
Authorization: Bearer {access-token}
```

**Response:**
```json
{
  "success": true,
  "message": "즐겨찾기가 제거되었습니다"
}
```

**Auth:** Required (JWT)

---

#### POST /favorites/toggle
즐겨찾기 토글 (원자적 연산)

**Request Headers:**
```
Authorization: Bearer {access-token}
```

**Request Body:**
```json
{
  "recipeId": "recipe-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isFavorited": true
  }
}
```

**Auth:** Required (JWT)

---

#### GET /favorites/check/:recipeId
즐겨찾기 상태 확인

**Request Headers:**
```
Authorization: Bearer {access-token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isFavorited": true
  }
}
```

**Auth:** Required (JWT)

---

#### GET /favorites
즐겨찾기 레시피 목록 조회

**Request Headers:**
```
Authorization: Bearer {access-token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "recipeId": "recipe-uuid",
      "savedAt": "2024-01-01T00:00:00Z",
      "recipe": {
        "id": "recipe-uuid",
        "name": "하리오 V60 레시피",
        "owner": {
          "id": "owner-uuid",
          "displayName": "홍길동",
          "profileImage": "https://..."
        },
        "recipeSteps": [...],
        ...
      }
    }
  ]
}
```

**Auth:** Required (JWT)

---

#### GET /favorites/ids
즐겨찾기 레시피 ID 목록 조회

**Request Headers:**
```
Authorization: Bearer {access-token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    "recipe-uuid-1",
    "recipe-uuid-2",
    "recipe-uuid-3"
  ]
}
```

**Auth:** Required (JWT)

---

#### GET /favorites/count
즐겨찾기 개수 조회

**Request Headers:**
```
Authorization: Bearer {access-token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

**Auth:** Required (JWT)

---

### 5. Events Module

#### GET /events/month/:year/:month
월별 이벤트 조회

**Example:**
```
GET /events/month/2024/3
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "event-uuid",
      "title": "스페셜티 커피 워크샵",
      "roasteryName": "블루보틀",
      "eventDate": "2024-03-15",
      "startTime": "14:00:00",
      "endTime": "16:00:00",
      "category": "cupping"
    }
  ]
}
```

**Auth:** None

---

#### GET /events/date/:date
특정 날짜의 이벤트 조회

**Example:**
```
GET /events/date/2024-03-15
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "event-uuid",
      "title": "스페셜티 커피 워크샵",
      "roasteryName": "블루보틀",
      "eventDate": "2024-03-15",
      "startTime": "14:00:00",
      "endTime": "16:00:00",
      "category": "cupping"
    }
  ]
}
```

**Auth:** None

---

#### GET /events/:eventId
특정 이벤트 상세 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "event-uuid",
    "title": "스페셜티 커피 워크샵",
    "roasteryName": "블루보틀",
    "category": "cupping",
    "eventDate": "2024-03-15",
    "startTime": "14:00:00",
    "endTime": "16:00:00",
    "description": "에티오피아 예가체프 커핑 세션",
    "location": "서울시 강남구",
    "imageUrl": "https://...",
    "price": 30000,
    "maxParticipants": 10,
    "registrationUrl": "https://...",
    "isPublished": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Auth:** None

---

#### POST /events
이벤트 생성 (관리자 전용)

**Request Headers:**
```
Authorization: Bearer {access-token}
```

**Request Body:**
```json
{
  "title": "스페셜티 커피 워크샵",
  "roasteryName": "블루보틀",
  "category": "cupping",
  "eventDate": "2024-03-15",
  "startTime": "14:00:00",
  "endTime": "16:00:00",
  "description": "에티오피아 예가체프 커핑 세션",
  "location": "서울시 강남구",
  "imageUrl": "https://...",
  "price": 30000,
  "maxParticipants": 10,
  "registrationUrl": "https://...",
  "isPublished": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "event-uuid",
    "title": "스페셜티 커피 워크샵",
    ...
  }
}
```

**Auth:** Required (JWT) + Admin Role

---

#### PATCH /events/:eventId
이벤트 업데이트 (관리자 전용)

**Request Headers:**
```
Authorization: Bearer {access-token}
```

**Request Body:**
```json
{
  "title": "수정된 제목",
  "price": 25000,
  "isPublished": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "event-uuid",
    "title": "수정된 제목",
    "price": 25000,
    "isPublished": false,
    "updatedAt": "2024-01-02T00:00:00Z"
  }
}
```

**Auth:** Required (JWT) + Admin Role

---

#### DELETE /events/:eventId
이벤트 삭제 (관리자 전용)

**Request Headers:**
```
Authorization: Bearer {access-token}
```

**Response:**
```json
{
  "success": true,
  "message": "이벤트가 삭제되었습니다"
}
```

**Auth:** Required (JWT) + Admin Role

---

### 6. Roasteries Module

#### GET /roasteries
로스터리 목록 조회 (soft delete 필터)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "roastery-uuid",
      "name": "블루보틀",
      "description": "샌프란시스코 기반 스페셜티 커피",
      "featuredImage": "https://...",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Auth:** None

---

#### GET /roasteries/featured
Featured 로스터리 조회 (최신 1개)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "roastery-uuid",
    "name": "블루보틀",
    "description": "샌프란시스코 기반 스페셜티 커피",
    "featuredImage": "https://...",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Auth:** None

---

#### GET /roasteries/:roasteryId
특정 로스터리 상세 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "roastery-uuid",
    "name": "블루보틀",
    "description": "샌프란시스코 기반 스페셜티 커피",
    "address": "서울시 강남구",
    "featuredImage": "https://...",
    "onlineShopUrl": "https://bluebottle.com",
    "latitude": 37.123456,
    "longitude": 127.123456,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Auth:** None

---

#### POST /roasteries
로스터리 생성 (관리자 전용)

**Request Headers:**
```
Authorization: Bearer {access-token}
```

**Request Body:**
```json
{
  "name": "블루보틀",
  "description": "샌프란시스코 기반 스페셜티 커피",
  "address": "서울시 강남구",
  "featuredImage": "https://...",
  "onlineShopUrl": "https://bluebottle.com",
  "latitude": 37.123456,
  "longitude": 127.123456
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "roastery-uuid",
    "name": "블루보틀",
    ...
  }
}
```

**Auth:** Required (JWT) + Admin Role

---

#### PATCH /roasteries/:roasteryId
로스터리 업데이트 (관리자 전용)

**Request Headers:**
```
Authorization: Bearer {access-token}
```

**Request Body:**
```json
{
  "description": "수정된 설명",
  "onlineShopUrl": "https://new-url.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "roastery-uuid",
    "description": "수정된 설명",
    "onlineShopUrl": "https://new-url.com",
    "updatedAt": "2024-01-02T00:00:00Z"
  }
}
```

**Auth:** Required (JWT) + Admin Role

---

#### DELETE /roasteries/:roasteryId
로스터리 삭제 (Soft Delete)

**Request Headers:**
```
Authorization: Bearer {access-token}
```

**Response:**
```json
{
  "success": true,
  "message": "로스터리가 삭제되었습니다"
}
```

**Auth:** Required (JWT) + Admin Role

---

### 7. Grinders Module

#### GET /grinders
그라인더 목록 조회

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "grinder-uuid",
      "brand": "Commandante",
      "name": "C40 MK4",
      "minClicks": 10,
      "maxClicks": 30,
      "micronRangeMin": 200,
      "micronRangeMax": 1200,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Auth:** None

---

#### GET /grinders/:grinderId
특정 그라인더 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "grinder-uuid",
    "brand": "Commandante",
    "name": "C40 MK4",
    "minClicks": 10,
    "maxClicks": 30,
    "micronRangeMin": 200,
    "micronRangeMax": 1200,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Auth:** None

---

#### POST /grinders
그라인더 생성 (관리자 전용)

**Request Headers:**
```
Authorization: Bearer {access-token}
```

**Request Body:**
```json
{
  "brand": "Commandante",
  "name": "C40 MK4",
  "minClicks": 10,
  "maxClicks": 30,
  "micronRangeMin": 200,
  "micronRangeMax": 1200
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "grinder-uuid",
    "brand": "Commandante",
    "name": "C40 MK4",
    ...
  }
}
```

**Auth:** Required (JWT) + Admin Role

---

### 8. Analytics Module

#### POST /analytics/track-view
레시피 조회 추적

**Request Headers:**
```
Authorization: Bearer {access-token} (Optional)
```

**Request Body:**
```json
{
  "recipeId": "recipe-uuid",
  "sessionId": "session-uuid",
  "deviceType": "mobile",
  "scrollDepth": 85.5,
  "completionRate": 90.0,
  "durationSeconds": 120,
  "stepsViewed": 8,
  "totalSteps": 10
}
```

**Response:**
```json
{
  "success": true,
  "message": "조회 이벤트가 기록되었습니다"
}
```

**Auth:** Optional (JWT)

---

#### GET /analytics/recipes/:recipeId/stats
특정 레시피 통계 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "recipeId": "recipe-uuid",
    "totalViews": 1500,
    "totalUniqueViewers": 850,
    "totalLikes": 120,
    "totalSaves": 80,
    "totalShares": 45,
    "avgViewDuration": 150.5,
    "avgCompletionRate": 75.3,
    "avgScrollDepth": 82.1,
    "trendingScore": 85.2,
    "allTimeScore": 92.0,
    "peakDate": "2024-03-10",
    "peakDailyViews": 200,
    "lastTrendingAt": "2024-03-15T00:00:00Z"
  }
}
```

**Auth:** None (공개 통계)

---

#### GET /analytics/users/me/stats
현재 사용자 통계 조회

**Request Headers:**
```
Authorization: Bearer {access-token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRecipes": 10,
    "totalPublicRecipes": 7,
    "totalViews": 5000,
    "totalLikes": 500,
    "totalSaves": 300,
    "avgEngagementScore": 78.5
  }
}
```

**Auth:** Required (JWT)

---

## C. 인증/인가 시스템

### 1. JWT 전략

#### Access Token
- **유효 기간:** 15분
- **페이로드:**
```typescript
{
  sub: 'user-uuid',
  email: 'user@example.com',
  iat: 1234567890,
  exp: 1234568790
}
```

#### Refresh Token
- **유효 기간:** 7일
- **페이로드:**
```typescript
{
  sub: 'user-uuid',
  tokenVersion: 1,  // 토큰 무효화를 위한 버전
  iat: 1234567890,
  exp: 1235172690
}
```

---

### 2. Passport 통합

#### JWT Strategy (jwt.strategy.ts)
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.usersService.findById(payload.sub);

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    };
  }
}
```

#### JWT Refresh Strategy (jwt-refresh.strategy.ts)
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string; tokenVersion: number }) {
    const refreshToken = req.body['refreshToken'];

    const isValid = await this.authService.validateRefreshToken(
      payload.sub,
      refreshToken,
      payload.tokenVersion,
    );

    if (!isValid) {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다');
    }

    return { id: payload.sub };
  }
}
```

---

### 3. Guards

#### JwtAuthGuard (jwt-auth.guard.ts)
```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
```

#### RolesGuard (roles.guard.ts)
```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

#### OwnerGuard (owner.guard.ts)
```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RecipesService } from '../../modules/recipes/recipes.service';

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private readonly recipesService: RecipesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const recipeId = request.params.recipeId || request.params.id;

    const recipe = await this.recipesService.findById(recipeId);

    if (recipe.ownerId !== user.id) {
      throw new ForbiddenException('레시피를 수정할 권한이 없습니다');
    }

    return true;
  }
}
```

---

### 4. Decorators

#### @CurrentUser() Decorator (current-user.decorator.ts)
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
```

**사용 예시:**
```typescript
@Get('me')
async getProfile(@CurrentUser() user: UserPayload) {
  return this.usersService.findById(user.id);
}

@Get('me/email')
async getEmail(@CurrentUser('email') email: string) {
  return { email };
}
```

#### @Public() Decorator (public.decorator.ts)
```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**사용 예시:**
```typescript
@Public()
@Get('recipes')
async getPublicRecipes() {
  return this.recipesService.findAllPublic();
}
```

#### @Roles() Decorator (roles.decorator.ts)
```typescript
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

**사용 예시:**
```typescript
@Roles('admin')
@Post('events')
async createEvent(@Body() createEventDto: CreateEventDto) {
  return this.eventsService.create(createEventDto);
}
```

---

### 5. Token Refresh 로직

#### AuthService - refreshTokens 메서드
```typescript
async refreshTokens(refreshToken: string) {
  try {
    const payload = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    const user = await this.usersService.findById(payload.sub);

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    // 새로운 토큰 쌍 발급
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        profileImage: user.profileImage,
      },
      ...tokens,
    };
  } catch (error) {
    throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다');
  }
}

private async generateTokens(userId: string, email: string) {
  const [accessToken, refreshToken] = await Promise.all([
    this.jwtService.signAsync(
      { sub: userId, email },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      },
    ),
    this.jwtService.signAsync(
      { sub: userId, tokenVersion: 1 },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    ),
  ]);

  return { accessToken, refreshToken };
}
```

---

### 6. 전역 Guard 설정

#### app.module.ts
```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,  // 전역 JWT Guard 적용
    },
  ],
})
export class AppModule {}
```

이제 모든 엔드포인트는 기본적으로 JWT 인증이 필요하며, `@Public()` 데코레이터로 공개 엔드포인트를 명시합니다.

---

## D. 공통 인프라

### 1. Global Exception Filter

#### HttpExceptionFilter (http-exception.filter.ts)
```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error:
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || 'Internal server error',
    };

    response.status(status).json(errorResponse);
  }
}
```

#### PrismaExceptionFilter (prisma-exception.filter.ts)
```typescript
import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = '이미 존재하는 데이터입니다';
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = '데이터를 찾을 수 없습니다';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = '외래 키 제약 조건 위반';
        break;
      default:
        message = exception.message;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      error: exception.code,
    });
  }
}
```

#### AllExceptionsFilter (all-exceptions.filter.ts)
```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

---

### 2. Response Interceptor

#### TransformInterceptor (transform.interceptor.ts)
```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: any;
  message?: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // 데이터가 이미 표준 형식인 경우
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // 표준 형식으로 변환
        return {
          success: true,
          data,
        };
      }),
    );
  }
}
```

---

### 3. Validation Pipe

#### Global Validation Pipe (main.ts)
```typescript
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,  // DTO에 정의되지 않은 속성 제거
      forbidNonWhitelisted: true,  // DTO에 없는 속성이 있으면 에러
      transform: true,  // 타입 자동 변환
      transformOptions: {
        enableImplicitConversion: true,  // 암시적 타입 변환 활성화
      },
    }),
  );

  await app.listen(3000);
}
bootstrap();
```

---

### 4. Logging (Winston)

#### LoggingInterceptor (logging.interceptor.ts)
```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body, user } = req;
    const now = Date.now();

    this.logger.log(
      `[Request] ${method} ${url} - User: ${user?.id || 'anonymous'}`,
    );

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        this.logger.log(
          `[Response] ${method} ${url} - ${responseTime}ms`,
        );
      }),
    );
  }
}
```

#### Winston Logger Configuration (config/logger.config.ts)
```typescript
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const winstonConfig = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context }) => {
          return `${timestamp} [${context}] ${level}: ${message}`;
        }),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
});
```

---

### 5. Rate Limiting

#### ThrottlerModule 설정 (app.module.ts)
```typescript
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,  // 1분
        limit: 100,  // 최대 100회 요청
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

#### 특정 엔드포인트 Rate Limit 커스터마이징
```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  @Throttle({ default: { limit: 5, ttl: 60000 } })  // 1분에 5회
  @Post('signin')
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }
}
```

---

### 6. CORS 설정

#### main.ts
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:8081',  // Expo 개발 서버
      'exp://192.168.1.100:8081',  // Expo Go
      'https://your-production-app.com',  // 프로덕션 도메인
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(3000);
}
bootstrap();
```

---

### 7. Global Pipes, Filters, Interceptors 설정 (main.ts)

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Filters
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new PrismaExceptionFilter(),
  );

  // Global Interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // CORS
  app.enableCors({
    origin: ['http://localhost:8081', 'https://your-app.com'],
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
```

---

## E. DTO 설계

### 1. Auth Module DTOs

#### SignUpDto (sign-up.dto.ts)
```typescript
import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요' })
  email: string;

  @ApiProperty({
    description: '비밀번호 (최소 8자)',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  password: string;

  @ApiPropertyOptional({
    description: '사용자 닉네임',
    example: '홍길동',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: '닉네임은 최대 50자까지 가능합니다' })
  displayName?: string;
}
```

#### SignInDto (sign-in.dto.ts)
```typescript
import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요' })
  email: string;

  @ApiProperty({
    description: '비밀번호',
    example: 'SecurePass123!',
  })
  @IsString()
  password: string;
}
```

#### RefreshTokenDto (refresh-token.dto.ts)
```typescript
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: '리프레시 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refreshToken: string;
}
```

#### AuthResponseDto (auth-response.dto.ts)
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthResponseDto {
  @ApiProperty({
    description: '사용자 정보',
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    description: 'JWT 액세스 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT 리프레시 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}
```

---

### 2. Users Module DTOs

#### CreateUserDto (create-user.dto.ts)
```typescript
import { IsEmail, IsString, MaxLength, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: '사용자 ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '사용자 닉네임',
    example: '홍길동',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  displayName: string;

  @ApiPropertyOptional({
    description: '프로필 이미지 URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsUrl()
  profileImage?: string;
}
```

#### UpdateUserDto (update-user.dto.ts)
```typescript
import { IsString, MaxLength, IsOptional, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: '사용자 닉네임',
    example: '새이름',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @ApiPropertyOptional({
    description: '프로필 이미지 URL',
    example: 'https://example.com/new-avatar.jpg',
  })
  @IsOptional()
  @IsUrl()
  profileImage?: string;
}
```

#### UserResponseDto (user-response.dto.ts)
```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: '사용자 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: '사용자 닉네임',
    example: '홍길동',
  })
  displayName: string;

  @ApiPropertyOptional({
    description: '프로필 이미지 URL',
    example: 'https://example.com/avatar.jpg',
  })
  profileImage?: string;

  @ApiProperty({
    description: '생성일시',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일시',
    example: '2024-01-01T00:00:00Z',
  })
  updatedAt: Date;
}
```

#### SearchUsersDto (search-users.dto.ts)
```typescript
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchUsersDto {
  @ApiPropertyOptional({
    description: '검색어 (이름 또는 이메일)',
    example: '홍길',
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: '결과 개수 제한',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
```

---

### 3. Recipes Module DTOs

#### RecipeStepDto (recipe-step.dto.ts)
```typescript
import { IsInt, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecipeStepDto {
  @ApiProperty({
    description: '스텝 인덱스',
    example: 0,
  })
  @IsInt()
  @Min(0)
  stepIndex: number;

  @ApiProperty({
    description: '시작 시간 (초)',
    example: 0,
  })
  @IsInt()
  @Min(0)
  time: number;

  @ApiPropertyOptional({
    description: '지속 시간 (초)',
    example: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({
    description: '스텝 제목',
    example: '블루밍',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: '스텝 설명',
    example: '커피 전체를 적셔주세요',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '물 양 (ml)',
    example: 45,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  water?: number;

  @ApiPropertyOptional({
    description: '누적 물 양 (ml)',
    example: 45,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalWater?: number;
}
```

#### CreateRecipeDto (create-recipe.dto.ts)
```typescript
import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsUrl,
  Min,
  Max,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecipeStepDto } from './recipe-step.dto';

export enum BrewingType {
  HOT = 'hot',
  ICE = 'ice',
}

export class RecipeDataDto {
  @ApiProperty({
    description: '레시피 이름',
    example: '하리오 V60 레시피',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: '레시피 설명',
    example: '밝은 산미를 강조한 레시피',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '공개 여부',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: '추출 타입',
    enum: BrewingType,
    example: BrewingType.HOT,
  })
  @IsOptional()
  @IsEnum(BrewingType)
  brewingType?: BrewingType;

  @ApiProperty({
    description: '커피 양 (g)',
    example: 15,
  })
  @IsInt()
  @Min(1)
  coffee: number;

  @ApiProperty({
    description: '물 양 (ml)',
    example: 250,
  })
  @IsInt()
  @Min(1)
  water: number;

  @ApiProperty({
    description: '물 온도 (°C)',
    example: 93,
  })
  @IsInt()
  @Min(50)
  @Max(100)
  waterTemperature: number;

  @ApiPropertyOptional({
    description: '커피:물 비율',
    example: 16.67,
  })
  @IsOptional()
  @IsInt()
  ratio?: number;

  @ApiProperty({
    description: '총 추출 시간 (초)',
    example: 180,
  })
  @IsInt()
  @Min(1)
  totalTime: number;

  @ApiPropertyOptional({
    description: '드리퍼',
    example: '하리오 V60',
  })
  @IsOptional()
  @IsString()
  dripper?: string;

  @ApiPropertyOptional({
    description: '필터',
    example: '하리오 전용 필터',
  })
  @IsOptional()
  @IsString()
  filter?: string;

  @ApiPropertyOptional({
    description: '그라인더 모델',
    example: '커맨단테',
  })
  @IsOptional()
  @IsString()
  grinderModel?: string;

  @ApiPropertyOptional({
    description: '그라인더 클릭 수',
    example: 22,
  })
  @IsOptional()
  @IsInt()
  grinderClicks?: number;

  @ApiPropertyOptional({
    description: '분쇄도 (마이크론)',
    example: 800,
  })
  @IsOptional()
  @IsInt()
  micron?: number;

  @ApiPropertyOptional({
    description: 'YouTube URL',
    example: 'https://youtube.com/watch?v=...',
  })
  @IsOptional()
  @IsUrl()
  youtubeUrl?: string;
}

export class CreateRecipeDto {
  @ApiProperty({
    description: '레시피 정보',
    type: RecipeDataDto,
  })
  @ValidateNested()
  @Type(() => RecipeDataDto)
  recipe: RecipeDataDto;

  @ApiProperty({
    description: '레시피 단계 목록',
    type: [RecipeStepDto],
  })
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개 이상의 단계가 필요합니다' })
  @ValidateNested({ each: true })
  @Type(() => RecipeStepDto)
  steps: RecipeStepDto[];
}
```

#### UpdateRecipeDto (update-recipe.dto.ts)
```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateRecipeDto } from './create-recipe.dto';

export class UpdateRecipeDto extends PartialType(CreateRecipeDto) {}
```

#### RecipeResponseDto (recipe-response.dto.ts)
```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class RecipeStepResponseDto {
  @ApiProperty({ description: '스텝 ID' })
  id: number;

  @ApiProperty({ description: '레시피 ID' })
  recipeId: string;

  @ApiProperty({ description: '스텝 인덱스' })
  stepIndex: number;

  @ApiProperty({ description: '시작 시간 (초)' })
  time: number;

  @ApiPropertyOptional({ description: '지속 시간 (초)' })
  duration?: number;

  @ApiPropertyOptional({ description: '스텝 제목' })
  title?: string;

  @ApiPropertyOptional({ description: '스텝 설명' })
  description?: string;

  @ApiPropertyOptional({ description: '물 양 (ml)' })
  water?: number;

  @ApiPropertyOptional({ description: '누적 물 양 (ml)' })
  totalWater?: number;
}

export class RecipeResponseDto {
  @ApiProperty({ description: '레시피 ID' })
  id: string;

  @ApiProperty({ description: '레시피 이름' })
  name: string;

  @ApiProperty({ description: '소유자 ID' })
  ownerId: string;

  @ApiPropertyOptional({
    description: '소유자 정보',
    type: UserResponseDto,
  })
  owner?: UserResponseDto;

  @ApiPropertyOptional({ description: '레시피 설명' })
  description?: string;

  @ApiProperty({ description: '공개 여부' })
  isPublic: boolean;

  @ApiPropertyOptional({ description: '추출 타입', enum: ['hot', 'ice'] })
  brewingType?: string;

  @ApiProperty({ description: '커피 양 (g)' })
  coffee: number;

  @ApiProperty({ description: '물 양 (ml)' })
  water: number;

  @ApiProperty({ description: '물 온도 (°C)' })
  waterTemperature: number;

  @ApiPropertyOptional({ description: '커피:물 비율' })
  ratio?: number;

  @ApiProperty({ description: '총 추출 시간 (초)' })
  totalTime: number;

  @ApiPropertyOptional({ description: '드리퍼' })
  dripper?: string;

  @ApiPropertyOptional({ description: '필터' })
  filter?: string;

  @ApiPropertyOptional({ description: '그라인더 모델' })
  grinderModel?: string;

  @ApiPropertyOptional({ description: '그라인더 클릭 수' })
  grinderClicks?: number;

  @ApiPropertyOptional({ description: '분쇄도 (마이크론)' })
  micron?: number;

  @ApiPropertyOptional({ description: 'YouTube URL' })
  youtubeUrl?: string;

  @ApiPropertyOptional({
    description: '레시피 단계 목록',
    type: [RecipeStepResponseDto],
  })
  recipeSteps?: RecipeStepResponseDto[];

  @ApiProperty({ description: '생성일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시' })
  updatedAt: Date;
}
```

#### SearchRecipesDto (search-recipes.dto.ts)
```typescript
import { IsString, IsOptional, IsInt, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchRecipesDto {
  @ApiPropertyOptional({
    description: '검색어 (레시피 이름 또는 설명)',
    example: 'V60',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: '페이지당 개수',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: '오프셋',
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({
    description: '스텝 포함 여부',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeSteps?: boolean = true;
}
```

#### FilterRecipesDto (filter-recipes.dto.ts)
```typescript
import { IsString, IsOptional, IsArray, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum BrewingTypeFilter {
  ALL = 'all',
  HOT = 'hot',
  ICE = 'ice',
}

export class FilterRecipesDto {
  @ApiPropertyOptional({
    description: '추출 타입',
    enum: BrewingTypeFilter,
    example: BrewingTypeFilter.HOT,
    default: BrewingTypeFilter.ALL,
  })
  @IsOptional()
  @IsEnum(BrewingTypeFilter)
  brewingType?: BrewingTypeFilter = BrewingTypeFilter.ALL;

  @ApiPropertyOptional({
    description: '드리퍼 필터',
    type: [String],
    example: ['v60', 'origami'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dripper?: string[];

  @ApiPropertyOptional({
    description: '필터 필터',
    type: [String],
    example: ['cafec_abaca', 'kalita_wave'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  filter?: string[];

  @ApiPropertyOptional({
    description: '스텝 포함 여부',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeSteps?: boolean = true;
}
```

---

## F. 환경 설정

### 1. ConfigModule 구성 (app.module.ts)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import validationSchema from './config/validation.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      load: [appConfig, databaseConfig, jwtConfig],
      validationSchema,
    }),
  ],
})
export class AppModule {}
```

---

### 2. 환경 변수 목록 (.env.example)

```bash
# Application
NODE_ENV=development
PORT=3000
APP_NAME=Coffimer Backend
APP_VERSION=1.0.0

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGINS=http://localhost:8081,exp://192.168.1.100:8081

# Supabase
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Logging
LOG_LEVEL=debug
LOG_FILE_PATH=./logs

# Redis (Optional - for session management)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# File Upload (Optional)
MAX_FILE_SIZE=5242880
UPLOAD_DESTINATION=./uploads
```

---

### 3. development/staging/production 분리

#### .env.development
```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/coffimer_dev
JWT_SECRET=dev-secret
LOG_LEVEL=debug
CORS_ORIGINS=http://localhost:8081
```

#### .env.staging
```bash
NODE_ENV=staging
PORT=3000
DATABASE_URL=postgresql://postgres:[password]@staging-db.supabase.co:5432/postgres
JWT_SECRET=staging-secret-change-this
LOG_LEVEL=info
CORS_ORIGINS=https://staging-app.coffimer.com
```

#### .env.production
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:[password]@production-db.supabase.co:5432/postgres
JWT_SECRET=production-secret-use-strong-random-key
LOG_LEVEL=warn
CORS_ORIGINS=https://app.coffimer.com
```

---

### 4. Validation Schema (config/validation.schema.ts)

```typescript
import * as Joi from 'joi';

export default Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  CORS_ORIGINS: Joi.string().default('http://localhost:8081'),
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
});
```

---

### 5. Config Files

#### app.config.ts
```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  name: process.env.APP_NAME || 'Coffimer Backend',
  version: process.env.APP_VERSION || '1.0.0',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:8081'],
}));
```

#### database.config.ts
```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));
```

#### jwt.config.ts
```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));
```

---

## G. 배포 전략

### 1. Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client
RUN pnpm prisma generate

# Build the application
RUN pnpm build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application and Prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/main.js"]
```

---

### 2. Docker Compose (docker-compose.yml)

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: coffimer-backend
    restart: unless-stopped
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      - postgres
      - redis
    networks:
      - coffimer-network

  postgres:
    image: postgres:15-alpine
    container_name: coffimer-db
    restart: unless-stopped
    ports:
      - '5432:5432'
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=coffimer
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - coffimer-network

  redis:
    image: redis:7-alpine
    container_name: coffimer-redis
    restart: unless-stopped
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data
    networks:
      - coffimer-network

  nginx:
    image: nginx:alpine
    container_name: coffimer-nginx
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - app
    networks:
      - coffimer-network

volumes:
  postgres-data:
  redis-data:

networks:
  coffimer-network:
    driver: bridge
```

---

### 3. 클라우드 배포 옵션

#### A. Railway

**장점:**
- GitHub 연동 자동 배포
- 무료 티어 제공 (월 $5 크레딧)
- PostgreSQL 내장 지원
- Zero-config 배포

**배포 단계:**
1. Railway 계정 생성
2. New Project → Deploy from GitHub repo
3. 환경 변수 설정 (Settings → Variables)
4. PostgreSQL 추가 (New → Database → PostgreSQL)
5. 자동 배포 시작

**railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm prisma generate && pnpm build"
  },
  "deploy": {
    "startCommand": "pnpm prisma migrate deploy && node dist/main.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

#### B. Render

**장점:**
- 무료 티어 제공
- 자동 SSL 인증서
- PostgreSQL 제공
- 간편한 환경 변수 관리

**배포 단계:**
1. Render 계정 생성
2. New Web Service → Connect GitHub repo
3. Build Command: `pnpm install && pnpm build`
4. Start Command: `pnpm prisma migrate deploy && node dist/main.js`
5. 환경 변수 설정
6. PostgreSQL 데이터베이스 추가

---

#### C. AWS ECS (Fargate)

**장점:**
- 완전 관리형 컨테이너 서비스
- Auto-scaling 지원
- 프로덕션급 안정성

**배포 단계:**
1. ECR에 Docker 이미지 푸시
2. ECS Task Definition 생성
3. ECS Service 생성 (Fargate)
4. Application Load Balancer 설정
5. Auto Scaling 정책 설정
6. CloudWatch 로그 연동

**ECS Task Definition (ecs-task-definition.json):**
```json
{
  "family": "coffimer-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "coffimer-api",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/coffimer-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:coffimer/db-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:coffimer/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/coffimer-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

---

#### D. DigitalOcean App Platform

**장점:**
- 간편한 설정
- 합리적인 가격
- PostgreSQL/Redis 관리형 서비스

**배포 단계:**
1. DigitalOcean 계정 생성
2. Create App → GitHub repo 연결
3. Build Command: `pnpm install && pnpm build`
4. Run Command: `node dist/main.js`
5. Managed Database (PostgreSQL) 추가
6. 환경 변수 설정

---

### 4. CI/CD Pipeline (GitHub Actions)

#### .github/workflows/deploy.yml
```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test

      - name: Run lint
        run: pnpm lint

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Log in to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/coffimer-backend:latest
          cache-from: type=registry,ref=${{ secrets.DOCKER_USERNAME }}/coffimer-backend:buildcache
          cache-to: type=registry,ref=${{ secrets.DOCKER_USERNAME }}/coffimer-backend:buildcache,mode=max

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Railway
        uses: berviantoleo/railway-deploy@v1.0.0
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: coffimer-backend
```

---

## H. Swagger/OpenAPI

### 1. 설정 방법 (main.ts)

```typescript
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Coffimer API')
    .setDescription('Coffimer 커피 브루잉 타이머 백엔드 API 문서')
    .setVersion('1.0')
    .addTag('auth', '인증 관련 API')
    .addTag('users', '사용자 관련 API')
    .addTag('recipes', '레시피 관련 API')
    .addTag('favorites', '즐겨찾기 관련 API')
    .addTag('events', '이벤트 관련 API')
    .addTag('roasteries', '로스터리 관련 API')
    .addTag('grinders', '그라인더 관련 API')
    .addTag('analytics', '분석 관련 API')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .addServer('http://localhost:3000', 'Local Development')
    .addServer('https://api.coffimer.com', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(3000);

  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger docs available at: ${await app.getUrl()}/api-docs`);
}
bootstrap();
```

---

### 2. 주요 데코레이터 사용 예시

#### Controller 레벨
```typescript
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { RecipeResponseDto } from './dto/recipe-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('recipes')
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: '공개 레시피 목록 조회',
    description: '모든 공개 레시피를 조회합니다. 페이지네이션을 지원합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '공개 레시피 목록이 성공적으로 조회되었습니다',
    type: [RecipeResponseDto],
  })
  @ApiResponse({
    status: 500,
    description: '서버 오류',
  })
  async getPublicRecipes() {
    return this.recipesService.findAllPublic();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '레시피 생성',
    description: '새로운 레시피를 생성합니다. 인증이 필요합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '레시피가 성공적으로 생성되었습니다',
    type: RecipeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터',
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않은 사용자',
  })
  async createRecipe(
    @Body() createRecipeDto: CreateRecipeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.recipesService.create(createRecipeDto, userId);
  }

  @Get(':recipeId')
  @Public()
  @ApiOperation({
    summary: '특정 레시피 조회',
    description: '레시피 ID로 특정 레시피의 상세 정보를 조회합니다',
  })
  @ApiParam({
    name: 'recipeId',
    description: '레시피 UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: '레시피가 성공적으로 조회되었습니다',
    type: RecipeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '레시피를 찾을 수 없습니다',
  })
  async getRecipe(@Param('recipeId') recipeId: string) {
    return this.recipesService.findById(recipeId);
  }
}
```

#### DTO 레벨
```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class CreateRecipeDto {
  @ApiProperty({
    description: '레시피 이름',
    example: '하리오 V60 레시피',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: '레시피 설명',
    example: '밝은 산미를 강조한 레시피',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '커피 양 (g)',
    example: 15,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  coffee: number;

  @ApiProperty({
    description: '물 양 (ml)',
    example: 250,
    minimum: 1,
    maximum: 1000,
  })
  @IsInt()
  @Min(1)
  @Max(1000)
  water: number;

  @ApiPropertyOptional({
    description: '공개 여부',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = true;
}
```

---

### 3. Swagger 고급 기능

#### A. Query Parameter 문서화
```typescript
import { ApiQuery } from '@nestjs/swagger';

@Get('search')
@ApiOperation({ summary: '레시피 검색' })
@ApiQuery({
  name: 'q',
  required: false,
  description: '검색어',
  example: 'V60',
})
@ApiQuery({
  name: 'limit',
  required: false,
  type: Number,
  description: '결과 개수',
  example: 20,
})
async searchRecipes(
  @Query('q') query?: string,
  @Query('limit') limit?: number,
) {
  return this.recipesService.search(query, limit);
}
```

#### B. Response 예시
```typescript
@ApiResponse({
  status: 200,
  description: '성공',
  schema: {
    example: {
      success: true,
      data: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: '하리오 V60 레시피',
        coffee: 15,
        water: 250,
      },
    },
  },
})
```

#### C. 에러 응답 문서화
```typescript
@ApiResponse({
  status: 400,
  description: '잘못된 요청',
  schema: {
    example: {
      success: false,
      statusCode: 400,
      message: '유효성 검사 실패',
      errors: [
        {
          field: 'coffee',
          message: 'coffee must be a positive number',
        },
      ],
    },
  },
})
```

---

## 마무리

이 문서는 Coffimer 앱의 NestJS 백엔드 아키텍처 전체를 상세하게 설계했습니다.

### 주요 특징
1. **확장 가능한 모듈 구조** - 각 도메인별 독립적인 모듈
2. **강력한 인증/인가 시스템** - JWT 기반 + Refresh Token
3. **타입 안정성** - TypeScript + class-validator
4. **표준화된 API 응답** - Transform Interceptor
5. **포괄적인 에러 처리** - Custom Exception Filters
6. **프로덕션 준비 완료** - Docker, CI/CD, 배포 전략
7. **자동 API 문서화** - Swagger/OpenAPI

### 다음 단계
1. Prisma Schema 설계 (Task #3)
2. NestJS 프로젝트 초기화 (Task #4)
3. 모듈별 구현 (Task #5)
4. 테스트 작성 (Task #6)
5. 배포 (Task #7)
