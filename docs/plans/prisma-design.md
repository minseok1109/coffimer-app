# Prisma 스키마 설계 및 통합 전략

## 목차
1. [완전한 schema.prisma 파일](#a-완전한-schemaprisma-파일)
2. [PrismaService 설계](#b-prismaservice-설계-nestjs-통합)
3. [Supabase → Prisma 쿼리 변환 가이드](#c-supabase--prisma-쿼리-변환-가이드)
4. [트랜잭션 전략](#d-트랜잭션-전략)
5. [Prisma 미들웨어 설계](#e-prisma-미들웨어-설계)
6. [마이그레이션 워크플로우](#f-마이그레이션-워크플로우)
7. [성능 최적화 전략](#g-성능-최적화-전략)
8. [타입 안전성](#h-타입-안전성)

---

## A. 완전한 schema.prisma 파일

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions", "fullTextSearch", "multiSchema"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pg_trgm]
}

// ============================================================
// Enums
// ============================================================

enum BrewingType {
  hot
  ice

  @@map("brewing_type")
}

enum EventCategory {
  cupping
  popup

  @@map("event_category")
}

// ============================================================
// Core Models
// ============================================================

model User {
  id                      String    @id @default(uuid()) @db.Uuid
  email                   String    @unique
  displayName             String    @map("display_name")
  profileImage            String?   @map("profile_image")
  createdAt               DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt               DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt               DateTime? @map("deleted_at") @db.Timestamptz
  deletionScheduledFor    DateTime? @map("deletion_scheduled_for") @db.Timestamptz
  deletionConfirmedAt     DateTime? @map("deletion_confirmed_at") @db.Timestamptz
  deletionReason          String?   @map("deletion_reason")

  // Relations
  recipes                 Recipe[]
  savedRecipes            SavedRecipe[]
  likes                   Like[]
  recentViews             RecentView[]
  recipeViews             RecipeView[]
  userActivityLogs        UserActivityLog[]
  userSessions            UserSession[]
  accountDeletionRequests AccountDeletionRequest[]
  recipeInteractions      RecipeInteraction[]

  @@index([email])
  @@map("users")
}

model Recipe {
  id               String       @id @default(uuid()) @db.Uuid
  ownerId          String       @map("owner_id") @db.Uuid
  name             String
  description      String?
  isPublic         Boolean      @default(true) @map("is_public")
  brewingType      BrewingType? @map("brewing_type")
  coffee           Decimal      @db.Decimal(10, 2)
  water            Decimal      @db.Decimal(10, 2)
  waterTemperature Decimal      @map("water_temperature") @db.Decimal(5, 2)
  ratio            Decimal?     @db.Decimal(5, 2)
  dripper          String?
  filter           String?
  grinderModel     String?      @map("grinder_model")
  grinderClicks    Decimal?     @map("grinder_clicks") @db.Decimal(5, 2)
  micron           Decimal?     @db.Decimal(7, 2)
  totalTime        Int          @map("total_time")
  youtubeUrl       String?      @map("youtube_url")
  createdAt        DateTime     @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime     @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt        DateTime?    @map("deleted_at") @db.Timestamptz

  // Relations
  owner                User                 @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  recipeSteps          RecipeStep[]
  savedRecipes         SavedRecipe[]
  likes                Like[]
  recentViews          RecentView[]
  recipeViews          RecipeView[]
  userActivityLogs     UserActivityLog[]
  recipeInteractions   RecipeInteraction[]
  recipeAnalytics      RecipeAnalytics?
  recipeDailyStats     RecipeDailyStat[]

  // Indexes
  @@index([ownerId, createdAt(sort: Desc)], name: "idx_recipes_owner_created")
  @@index([createdAt(sort: Desc)], where: "is_public = true", name: "idx_recipes_public_created")
  @@index([name(ops: raw("gin_trgm_ops"))], type: Gin, name: "idx_recipes_name_trgm")
  @@index([description(ops: raw("gin_trgm_ops"))], type: Gin, name: "idx_recipes_description_trgm")
  @@index([brewingType])
  @@index([dripper])
  @@index([filter])
  @@map("recipes")
}

model RecipeStep {
  id          Int      @id @default(autoincrement())
  recipeId    String   @map("recipe_id") @db.Uuid
  stepIndex   Int      @map("step_index")
  time        Int
  duration    Int?
  title       String?
  description String?
  water       Decimal? @db.Decimal(10, 2)
  totalWater  Decimal? @map("total_water") @db.Decimal(10, 2)

  // Relations
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  // Indexes
  @@index([recipeId], name: "idx_recipe_steps_recipe_id")
  @@unique([recipeId, stepIndex])
  @@map("recipe_steps")
}

model SavedRecipe {
  userId    String    @map("user_id") @db.Uuid
  recipeId  String    @map("recipe_id") @db.Uuid
  savedAt   DateTime  @default(now()) @map("saved_at") @db.Timestamptz
  isPinned  Boolean   @default(false) @map("is_pinned")
  pinOrder  Int?      @map("pin_order")
  pinnedAt  DateTime? @map("pinned_at") @db.Timestamptz

  // Relations
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  // Composite Primary Key
  @@id([userId, recipeId])
  @@index([userId, savedAt(sort: Desc)])
  @@index([userId, isPinned, pinOrder])
  @@map("saved_recipes")
}

model Like {
  userId    String   @map("user_id") @db.Uuid
  recipeId  String   @map("recipe_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  // Relations
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  // Composite Primary Key
  @@id([userId, recipeId])
  @@index([recipeId, createdAt(sort: Desc)])
  @@map("likes")
}

model RecentView {
  userId   String   @map("user_id") @db.Uuid
  recipeId String   @map("recipe_id") @db.Uuid
  viewedAt DateTime @default(now()) @map("viewed_at") @db.Timestamptz

  // Relations
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  // Composite Primary Key
  @@id([userId, recipeId])
  @@index([userId, viewedAt(sort: Desc)])
  @@map("recent_views")
}

model Event {
  id              String        @id @default(uuid()) @db.Uuid
  title           String
  roasteryName    String        @map("roastery_name")
  category        EventCategory
  eventDate       DateTime      @map("event_date") @db.Date
  startTime       DateTime?     @map("start_time") @db.Time
  endTime         DateTime?     @map("end_time") @db.Time
  endDate         DateTime?     @map("end_date") @db.Date
  description     String?
  location        String?
  imageUrl        String?       @map("image_url")
  price           Decimal?      @db.Decimal(10, 2)
  maxParticipants Int?          @map("max_participants")
  registrationUrl String?       @map("registration_url")
  isPublished     Boolean       @default(true) @map("is_published")
  createdAt       DateTime      @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime      @updatedAt @map("updated_at") @db.Timestamptz

  // Indexes
  @@index([eventDate, startTime], where: "is_published = true", name: "idx_events_published_date")
  @@index([category])
  @@map("events")
}

model Roastery {
  id             String    @id @default(uuid()) @db.Uuid
  name           String
  description    String
  address        String
  featuredImage  String?   @map("featured_image")
  onlineShopUrl  String?   @map("online_shop_url")
  latitude       Decimal?  @db.Decimal(10, 8)
  longitude      Decimal?  @db.Decimal(11, 8)
  createdAt      DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt      DateTime? @map("deleted_at") @db.Timestamptz

  // Indexes
  @@index([createdAt(sort: Desc)], where: "deleted_at IS NULL", name: "idx_roasteries_active")
  @@map("roasteries")
}

model Grinder {
  id             String   @id @default(uuid()) @db.Uuid
  brand          String
  name           String
  minClicks      Int      @map("min_clicks")
  maxClicks      Int      @map("max_clicks")
  micronRangeMin Int?     @map("micron_range_min")
  micronRangeMax Int?     @map("micron_range_max")
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz

  @@index([brand, name])
  @@map("grinders")
}

// ============================================================
// Analytics Models
// ============================================================

model RecipeAnalytics {
  recipeId             String    @id @map("recipe_id") @db.Uuid
  totalViews           Int       @default(0) @map("total_views")
  totalUniqueViewers   Int       @default(0) @map("total_unique_viewers")
  totalLikes           Int       @default(0) @map("total_likes")
  totalSaves           Int       @default(0) @map("total_saves")
  totalShares          Int       @default(0) @map("total_shares")
  avgViewDuration      Decimal?  @map("avg_view_duration") @db.Decimal(10, 2)
  avgCompletionRate    Decimal?  @map("avg_completion_rate") @db.Decimal(5, 4)
  avgScrollDepth       Decimal?  @map("avg_scroll_depth") @db.Decimal(5, 4)
  trendingScore        Decimal?  @map("trending_score") @db.Decimal(10, 4)
  allTimeScore         Decimal?  @map("all_time_score") @db.Decimal(10, 4)
  peakDailyViews       Int?      @map("peak_daily_views")
  peakDate             DateTime? @map("peak_date") @db.Date
  lastTrendingAt       DateTime? @map("last_trending_at") @db.Timestamptz
  createdAt            DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt            DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@index([trendingScore(sort: Desc)])
  @@index([allTimeScore(sort: Desc)])
  @@map("recipe_analytics")
}

model RecipeDailyStat {
  recipeId            String   @map("recipe_id") @db.Uuid
  date                DateTime @db.Date
  views               Int      @default(0)
  uniqueViewers       Int      @default(0) @map("unique_viewers")
  likesAdded          Int      @default(0) @map("likes_added")
  likesRemoved        Int      @default(0) @map("likes_removed")
  savesAdded          Int      @default(0) @map("saves_added")
  savesRemoved        Int      @default(0) @map("saves_removed")
  shares              Int      @default(0)
  avgViewDuration     Decimal? @map("avg_view_duration") @db.Decimal(10, 2)
  avgCompletionRate   Decimal? @map("avg_completion_rate") @db.Decimal(5, 4)
  avgScrollDepth      Decimal? @map("avg_scroll_depth") @db.Decimal(5, 4)
  bounceRate          Decimal? @map("bounce_rate") @db.Decimal(5, 4)
  engagementScore     Decimal? @map("engagement_score") @db.Decimal(10, 4)
  deviceBreakdown     Json?    @map("device_breakdown")
  referrerBreakdown   Json?    @map("referrer_breakdown")
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt           DateTime @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  // Composite Primary Key
  @@id([recipeId, date])
  @@index([date])
  @@map("recipe_daily_stats")
}

model RecipeView {
  id              Int       @id @default(autoincrement())
  recipeId        String    @map("recipe_id") @db.Uuid
  userId          String?   @map("user_id") @db.Uuid
  sessionId       String    @map("session_id")
  viewStartedAt   DateTime? @map("view_started_at") @db.Timestamptz
  viewEndedAt     DateTime? @map("view_ended_at") @db.Timestamptz
  durationSeconds Int?      @map("duration_seconds")
  completionRate  Decimal?  @map("completion_rate") @db.Decimal(5, 4)
  scrollDepth     Decimal?  @map("scroll_depth") @db.Decimal(5, 4)
  stepsViewed     Int?      @map("steps_viewed")
  totalSteps      Int?      @map("total_steps")
  isBounce        Boolean?  @map("is_bounce")
  deviceType      String?   @map("device_type")
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz

  // Relations
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  user   User?  @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([recipeId, createdAt(sort: Desc)])
  @@index([userId, createdAt(sort: Desc)])
  @@index([sessionId])
  @@map("recipe_views")
}

model RecipeInteraction {
  id              Int      @id @default(autoincrement())
  recipeId        String   @map("recipe_id") @db.Uuid
  userId          String?  @map("user_id") @db.Uuid
  interactionType String   @map("interaction_type")
  interactionData Json?    @map("interaction_data")
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz

  // Relations
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  user   User?  @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([recipeId, interactionType, createdAt(sort: Desc)])
  @@index([userId, createdAt(sort: Desc)])
  @@map("recipe_interactions")
}

model DailyUserStat {
  date              DateTime @id @db.Date
  uniqueUsers       Int      @default(0) @map("unique_users")
  newUsers          Int      @default(0) @map("new_users")
  returningUsers    Int      @default(0) @map("returning_users")
  totalSessions     Int      @default(0) @map("total_sessions")
  totalPageViews    Int      @default(0) @map("total_page_views")
  totalRecipeViews  Int      @default(0) @map("total_recipe_views")
  avgSessionDuration Decimal? @map("avg_session_duration") @db.Decimal(10, 2)
  bounceRate        Decimal? @map("bounce_rate") @db.Decimal(5, 4)
  topPages          Json?    @map("top_pages")
  topRecipes        Json?    @map("top_recipes")
  deviceStats       Json?    @map("device_stats")
  createdAt         DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime @updatedAt @map("updated_at") @db.Timestamptz

  @@map("daily_user_stats")
}

model UserActivityLog {
  id         Int      @id @default(autoincrement())
  userId     String?  @map("user_id") @db.Uuid
  sessionId  String   @map("session_id")
  eventType  String   @map("event_type")
  path       String
  recipeId   String?  @map("recipe_id") @db.Uuid
  eventData  Json?    @map("event_data")
  ipAddress  String?  @map("ip_address") @db.Inet
  userAgent  String?  @map("user_agent")
  referrer   String?
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz

  // Relations
  user   User?   @relation(fields: [userId], references: [id], onDelete: SetNull)
  recipe Recipe? @relation(fields: [recipeId], references: [id], onDelete: SetNull)

  @@index([userId, createdAt(sort: Desc)])
  @@index([sessionId, createdAt(sort: Desc)])
  @@index([eventType, createdAt(sort: Desc)])
  @@map("user_activity_logs")
}

model UserSession {
  id             String    @id @default(uuid()) @db.Uuid
  userId         String?   @map("user_id") @db.Uuid
  startedAt      DateTime  @default(now()) @map("started_at") @db.Timestamptz
  endedAt        DateTime? @map("ended_at") @db.Timestamptz
  lastActivityAt DateTime? @map("last_activity_at") @db.Timestamptz
  pageViews      Int       @default(0) @map("page_views")
  ipAddress      String?   @map("ip_address") @db.Inet
  userAgent      String?   @map("user_agent")
  isActive       Boolean   @default(true) @map("is_active")

  // Relations
  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId, startedAt(sort: Desc)])
  @@index([isActive, lastActivityAt(sort: Desc)])
  @@map("user_sessions")
}

model AccountDeletionRequest {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String?   @map("user_id") @db.Uuid
  userEmail   String    @map("user_email")
  otpCode     String    @map("otp_code")
  otpHash     String    @map("otp_hash")
  expiresAt   DateTime  @map("expires_at") @db.Timestamptz
  verifiedAt  DateTime? @map("verified_at") @db.Timestamptz
  cancelledAt DateTime? @map("cancelled_at") @db.Timestamptz
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz

  // Relations
  user User? @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userEmail])
  @@index([expiresAt])
  @@map("account_deletion_requests")
}

model TempUserStat {
  totalUsers   Int?     @map("total_users")
  activeUsers  Int?     @map("active_users")
  deletedUsers Int?     @map("deleted_users")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@map("temp_user_stats")
}
```

---

## B. PrismaService 설계 (NestJS 통합)

### 1. PrismaService 구현

```typescript
// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'error' | 'warn'>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    const logLevels: Prisma.LogLevel[] =
      configService.get('NODE_ENV') === 'production'
        ? ['error', 'warn']
        : ['query', 'error', 'warn'];

    super({
      log: logLevels.map(level => ({
        emit: 'event',
        level,
      })),
      errorFormat: 'colorless',
    });

    // Soft Delete 미들웨어 등록
    this.applySoftDeleteMiddleware();

    // 쿼리 로깅 미들웨어 등록
    this.applyQueryLoggingMiddleware();

    // 성능 모니터링 미들웨어 등록
    this.applyPerformanceMiddleware();
  }

  async onModuleInit() {
    // Query 로그 이벤트 핸들러
    this.$on('query', (e: Prisma.QueryEvent) => {
      this.logger.debug(`Query: ${e.query}`);
      this.logger.debug(`Params: ${e.params}`);
      this.logger.debug(`Duration: ${e.duration}ms`);
    });

    // Error 로그 이벤트 핸들러
    this.$on('error', (e: any) => {
      this.logger.error(`Prisma Error: ${e.message}`, e.target);
    });

    // Warn 로그 이벤트 핸들러
    this.$on('warn', (e: any) => {
      this.logger.warn(`Prisma Warning: ${e.message}`);
    });

    // 데이터베이스 연결
    await this.$connect();
    this.logger.log('✅ Prisma 데이터베이스 연결 완료');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Prisma 데이터베이스 연결 종료');
  }

  /**
   * Soft Delete 미들웨어
   * - findMany, findFirst, findUnique, count 시 deletedAt IS NULL 자동 필터링
   * - delete 시 실제 삭제 대신 deletedAt 업데이트
   */
  private applySoftDeleteMiddleware() {
    this.$use(async (params, next) => {
      // Soft Delete를 지원하는 모델 목록
      const softDeleteModels = ['User', 'Recipe', 'Roastery'];

      if (!softDeleteModels.includes(params.model || '')) {
        return next(params);
      }

      // READ 작업: deletedAt IS NULL 필터 자동 추가
      if (['findUnique', 'findFirst', 'findMany', 'count'].includes(params.action)) {
        params.args = params.args || {};
        params.args.where = params.args.where || {};

        // deletedAt이 명시적으로 지정되지 않은 경우에만 필터 추가
        if (params.args.where.deletedAt === undefined) {
          params.args.where.deletedAt = null;
        }
      }

      // DELETE 작업: 실제 삭제 대신 soft delete
      if (params.action === 'delete') {
        params.action = 'update';
        params.args.data = { deletedAt: new Date() };
      }

      // DELETE MANY 작업: 실제 삭제 대신 soft delete
      if (params.action === 'deleteMany') {
        params.action = 'updateMany';
        params.args.data = { deletedAt: new Date() };
      }

      return next(params);
    });
  }

  /**
   * 쿼리 로깅 미들웨어
   */
  private applyQueryLoggingMiddleware() {
    if (this.configService.get('ENABLE_QUERY_LOGGING') !== 'true') {
      return;
    }

    this.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();

      this.logger.debug(`Query ${params.model}.${params.action} took ${after - before}ms`);

      return result;
    });
  }

  /**
   * 성능 모니터링 미들웨어
   * 슬로우 쿼리 감지 (100ms 이상)
   */
  private applyPerformanceMiddleware() {
    this.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const duration = Date.now() - before;

      const SLOW_QUERY_THRESHOLD = 100; // ms

      if (duration > SLOW_QUERY_THRESHOLD) {
        this.logger.warn(
          `⚠️ Slow Query Detected: ${params.model}.${params.action} (${duration}ms)`,
          JSON.stringify(params.args, null, 2)
        );
      }

      return result;
    });
  }

  /**
   * 트랜잭션 헬퍼 메서드
   */
  async executeTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.$transaction(fn, {
      maxWait: 5000, // 트랜잭션 대기 최대 시간
      timeout: 10000, // 트랜잭션 실행 최대 시간
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    });
  }

  /**
   * 헬스 체크 메서드
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Soft Delete된 항목 포함 조회 (명시적 사용)
   */
  withDeleted() {
    return this.$extends({
      query: {
        $allModels: {
          async findMany({ args, query }) {
            args.where = { ...args.where, deletedAt: undefined };
            return query(args);
          },
          async findFirst({ args, query }) {
            args.where = { ...args.where, deletedAt: undefined };
            return query(args);
          },
        },
      },
    });
  }

  /**
   * 실제 Hard Delete (주의해서 사용)
   */
  hardDelete() {
    return this.$extends({
      query: {
        $allModels: {
          async delete({ args, query, model }) {
            // 미들웨어를 우회하여 실제 삭제 수행
            const modelName = model.toLowerCase();
            return (this as any)[modelName].deleteMany({
              where: args.where,
            });
          },
        },
      },
    });
  }
}
```

### 2. PrismaModule 설정

```typescript
// src/prisma/prisma.module.ts
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
export class PrismaModule {
  static forRoot() {
    return {
      module: PrismaModule,
      providers: [PrismaService],
      exports: [PrismaService],
    };
  }
}
```

### 3. AppModule 통합

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule.forRoot(),
    // ... other modules
  ],
})
export class AppModule {}
```

---

## C. Supabase → Prisma 쿼리 변환 가이드

### 1. 기본 CRUD 작업

| Supabase 쿼리 | Prisma 쿼리 |
|--------------|------------|
| `.select('*')` | `findMany()` |
| `.select('id, name')` | `findMany({ select: { id: true, name: true } })` |
| `.select().eq('id', id).single()` | `findUnique({ where: { id } })` |
| `.insert(data)` | `create({ data })` |
| `.update(data).eq('id', id)` | `update({ where: { id }, data })` |
| `.delete().eq('id', id)` | `delete({ where: { id } })` |

### 2. Nested Select (관계 조회)

**Supabase:**
```typescript
supabase
  .from('recipes')
  .select(`
    *,
    recipe_steps (*),
    users!recipes_owner_id_fkey (id, display_name, profile_image)
  `)
```

**Prisma:**
```typescript
prisma.recipe.findMany({
  include: {
    recipeSteps: true,
    owner: {
      select: {
        id: true,
        displayName: true,
        profileImage: true,
      },
    },
  },
})
```

### 3. ILIKE 검색 (대소문자 무시)

**Supabase:**
```typescript
supabase
  .from('recipes')
  .select('*')
  .or(`name.ilike.%${term}%,description.ilike.%${term}%`)
```

**Prisma:**
```typescript
prisma.recipe.findMany({
  where: {
    OR: [
      { name: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ],
  },
})
```

**Trigram 검색 (더 빠름):**
```typescript
// Raw query 사용
prisma.$queryRaw<Recipe[]>`
  SELECT * FROM recipes
  WHERE name % ${term} OR description % ${term}
  ORDER BY similarity(name, ${term}) + similarity(description, ${term}) DESC
  LIMIT 20
`
```

### 4. Pagination (Range)

**Supabase:**
```typescript
supabase
  .from('recipes')
  .select('*')
  .range(offset, offset + limit - 1)
```

**Prisma:**
```typescript
prisma.recipe.findMany({
  skip: offset,
  take: limit,
})
```

### 5. HEAD 쿼리 (존재 여부 확인)

**Supabase:**
```typescript
const { count } = await supabase
  .from('saved_recipes')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('recipe_id', recipeId);

return count > 0;
```

**Prisma:**
```typescript
const count = await prisma.savedRecipe.count({
  where: {
    userId,
    recipeId,
  },
});

return count > 0;
```

**또는 더 효율적으로:**
```typescript
const exists = await prisma.savedRecipe.findFirst({
  where: { userId, recipeId },
  select: { userId: true },
});

return exists !== null;
```

### 6. RPC toggle_favorite (원자적 토글)

**Supabase RPC:**
```sql
CREATE OR REPLACE FUNCTION toggle_favorite(p_user_id UUID, p_recipe_id UUID)
RETURNS BOOLEAN AS $$
-- ... (위 migration 파일 참조)
$$;
```

**Prisma 트랜잭션:**
```typescript
async toggleFavorite(userId: string, recipeId: string): Promise<boolean> {
  return this.prisma.executeTransaction(async (tx) => {
    const existing = await tx.savedRecipe.findUnique({
      where: {
        userId_recipeId: { userId, recipeId },
      },
    });

    if (existing) {
      await tx.savedRecipe.delete({
        where: {
          userId_recipeId: { userId, recipeId },
        },
      });
      return false;
    }

    await tx.savedRecipe.create({
      data: { userId, recipeId },
    });
    return true;
  });
}
```

### 7. RPC get_recipe_filter_options (JSON 집계)

**Supabase RPC:**
```sql
CREATE OR REPLACE FUNCTION get_recipe_filter_options()
RETURNS JSON AS $$
  SELECT json_build_object(
    'drippers', (SELECT COALESCE(json_agg(DISTINCT dripper), '[]'::json) ...),
    'filters', ...,
    'brewing_types', ...
  );
$$;
```

**Prisma 쿼리:**
```typescript
async getFilterOptions(): Promise<RecipeFilterOptions> {
  const [drippers, filters, brewingTypes] = await Promise.all([
    this.prisma.recipe.findMany({
      where: { isPublic: true, dripper: { not: null } },
      select: { dripper: true },
      distinct: ['dripper'],
    }),
    this.prisma.recipe.findMany({
      where: { isPublic: true, filter: { not: null } },
      select: { filter: true },
      distinct: ['filter'],
    }),
    this.prisma.recipe.findMany({
      where: { isPublic: true, brewingType: { not: null } },
      select: { brewingType: true },
      distinct: ['brewingType'],
    }),
  ]);

  return {
    drippers: drippers.map(r => r.dripper).filter(Boolean),
    filters: filters.map(r => r.filter).filter(Boolean),
    brewingTypes: brewingTypes.map(r => r.brewingType).filter(Boolean),
  };
}
```

### 8. Date Range 필터

**Supabase:**
```typescript
supabase
  .from('events')
  .select('*')
  .gte('event_date', startDate)
  .lte('event_date', endDate)
```

**Prisma:**
```typescript
prisma.event.findMany({
  where: {
    eventDate: {
      gte: new Date(startDate),
      lte: new Date(endDate),
    },
  },
})
```

### 9. Partial Select (특정 필드만 조회)

**Supabase:**
```typescript
supabase
  .from('users')
  .select('id, email, display_name')
  .eq('id', userId)
  .single()
```

**Prisma:**
```typescript
prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    displayName: true,
  },
})
```

### 10. Count (개수 조회)

**Supabase:**
```typescript
const { count } = await supabase
  .from('saved_recipes')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId);
```

**Prisma:**
```typescript
const count = await prisma.savedRecipe.count({
  where: { userId },
});
```

---

## D. 트랜잭션 전략

### 1. createRecipe: recipe + recipe_steps 트랜잭션

**현재 Supabase 구현 (수동 롤백):**
```typescript
// 1. recipe 생성
const recipe = await supabase.from('recipes').insert(data).select().single();

// 2. steps 생성
const { error } = await supabase.from('recipe_steps').insert(steps);

if (error) {
  // 수동 롤백
  await supabase.from('recipes').delete().eq('id', recipe.id);
  throw error;
}
```

**Prisma 트랜잭션 (자동 롤백):**
```typescript
async createRecipe(input: CreateRecipeInput, userId: string): Promise<RecipeWithSteps> {
  return this.prisma.executeTransaction(async (tx) => {
    // 1. Recipe 생성 (steps 포함)
    const recipe = await tx.recipe.create({
      data: {
        ...input.recipe,
        ownerId: userId,
        recipeSteps: {
          create: input.steps.map((step, index) => ({
            ...step,
            stepIndex: index,
          })),
        },
      },
      include: {
        recipeSteps: {
          orderBy: { stepIndex: 'asc' },
        },
        owner: {
          select: {
            id: true,
            displayName: true,
            profileImage: true,
          },
        },
      },
    });

    return recipe;
  });
}
```

**장점:**
- 단일 쿼리로 recipe + steps 생성
- 자동 롤백 (중간 실패 시)
- 타입 안전성 보장

### 2. toggleFavorite: 원자적 토글

위의 [C-6](#6-rpc-toggle_favorite-원자적-토글) 참조

### 3. deleteAccount: CASCADE 처리

**Prisma 스키마에서 CASCADE 정의:**
```prisma
model User {
  id       String   @id
  recipes  Recipe[] // onDelete: Cascade 자동 적용

  @@map("users")
}

model Recipe {
  ownerId String @map("owner_id")
  owner   User   @relation(fields: [ownerId], references: [id], onDelete: Cascade)
}
```

**삭제 구현:**
```typescript
async deleteAccount(userId: string): Promise<void> {
  // User 삭제 시 recipes, saved_recipes 등이 자동으로 CASCADE 삭제됨
  await this.prisma.user.delete({
    where: { id: userId },
  });
}
```

**Soft Delete 구현 (권장):**
```typescript
async deleteAccount(userId: string): Promise<void> {
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      email: `deleted_${userId}@deleted.com`, // 이메일 중복 방지
      deletionConfirmedAt: new Date(),
    },
  });
}
```

### 4. updateRecipe: 기존 steps 삭제 후 재생성

**현재 Supabase 구현:**
```typescript
// 1. 기존 steps 삭제
await supabase.from('recipe_steps').delete().eq('recipe_id', recipeId);

// 2. 새 steps 생성
await supabase.from('recipe_steps').insert(newSteps);
```

**Prisma 트랜잭션:**
```typescript
async updateRecipe(
  recipeId: string,
  input: Partial<CreateRecipeInput>,
  userId: string
): Promise<RecipeWithSteps> {
  return this.prisma.executeTransaction(async (tx) => {
    // 소유자 확인
    const existing = await tx.recipe.findUnique({
      where: { id: recipeId },
      select: { ownerId: true },
    });

    if (existing.ownerId !== userId) {
      throw new ForbiddenException('레시피를 수정할 권한이 없습니다.');
    }

    // Recipe 업데이트 (steps 포함)
    const updated = await tx.recipe.update({
      where: { id: recipeId },
      data: {
        ...input.recipe,
        recipeSteps: input.steps
          ? {
              deleteMany: {}, // 기존 steps 삭제
              create: input.steps.map((step, index) => ({
                ...step,
                stepIndex: index,
              })),
            }
          : undefined,
      },
      include: {
        recipeSteps: {
          orderBy: { stepIndex: 'asc' },
        },
        owner: {
          select: {
            id: true,
            displayName: true,
            profileImage: true,
          },
        },
      },
    });

    return updated;
  });
}
```

---

## E. Prisma 미들웨어 설계

### 1. Soft Delete 자동 필터링

**위의 [B-1 PrismaService](#1-prismaservice-구현)의 `applySoftDeleteMiddleware()` 참조**

**동작 방식:**
- `findMany`, `findFirst`, `findUnique`, `count`: `deletedAt IS NULL` 자동 추가
- `delete`, `deleteMany`: `UPDATE ... SET deletedAt = NOW()` 로 변환

**명시적 soft delete 조회:**
```typescript
// 삭제된 항목 포함
const allUsers = await prisma.withDeleted().user.findMany();

// 삭제된 항목만 조회
const deletedUsers = await prisma.user.findMany({
  where: { deletedAt: { not: null } },
});
```

### 2. Query 로깅 미들웨어

**위의 [B-1 PrismaService](#1-prismaservice-구현)의 `applyQueryLoggingMiddleware()` 참조**

**환경 변수 설정:**
```env
ENABLE_QUERY_LOGGING=true  # 개발 환경에서만
```

### 3. 성능 모니터링 미들웨어

**위의 [B-1 PrismaService](#1-prismaservice-구현)의 `applyPerformanceMiddleware()` 참조**

**슬로우 쿼리 감지:**
- 100ms 이상 걸린 쿼리 자동 로깅
- 쿼리 파라미터 포함하여 디버깅 용이

---

## F. 마이그레이션 워크플로우

### 1. 초기 설정

```bash
# Prisma 설치
pnpm add -D prisma
pnpm add @prisma/client

# Prisma 초기화
npx prisma init

# .env 설정
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

### 2. 기존 데이터베이스에서 스키마 가져오기 (Introspection)

```bash
# Supabase 데이터베이스에서 스키마 자동 생성
npx prisma db pull

# 생성된 schema.prisma 파일 확인 및 수동 조정
# - @@map 추가
# - Enum 변환
# - Index 최적화
```

### 3. 마이그레이션 생성 및 적용

```bash
# 개발 환경: 마이그레이션 생성 및 적용
npx prisma migrate dev --name init

# 프로덕션 환경: 마이그레이션만 적용 (schema 변경 없음)
npx prisma migrate deploy

# Prisma Client 재생성
npx prisma generate
```

### 4. Seed 데이터 설정

**prisma/seed.ts:**
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Grinder 데이터 시딩
  await prisma.grinder.createMany({
    data: [
      { brand: 'Comandante', name: 'C40 MK4', minClicks: 0, maxClicks: 40, micronRangeMin: 200, micronRangeMax: 1200 },
      { brand: 'Timemore', name: 'C2', minClicks: 0, maxClicks: 36, micronRangeMin: 250, micronRangeMax: 1000 },
      // ... 더 많은 데이터
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed 데이터 삽입 완료');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**package.json:**
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

**실행:**
```bash
npx prisma db seed
```

### 5. 마이그레이션 히스토리 관리

```bash
# 마이그레이션 상태 확인
npx prisma migrate status

# 마이그레이션 롤백 (주의: 프로덕션에서는 사용하지 말 것)
npx prisma migrate reset

# 특정 마이그레이션 건너뛰기 (수동 적용 후)
npx prisma migrate resolve --applied 20260214_initial
```

---

## G. 성능 최적화 전략

### 1. N+1 문제 방지 (select vs include)

**❌ N+1 문제 발생:**
```typescript
const recipes = await prisma.recipe.findMany();

// 각 recipe마다 별도 쿼리 발생 (N+1)
for (const recipe of recipes) {
  const owner = await prisma.user.findUnique({ where: { id: recipe.ownerId } });
  console.log(owner.displayName);
}
```

**✅ include 사용 (1개 쿼리):**
```typescript
const recipes = await prisma.recipe.findMany({
  include: {
    owner: true,
    recipeSteps: true,
  },
});

// 단일 쿼리로 모든 관계 데이터 조회
recipes.forEach(recipe => {
  console.log(recipe.owner.displayName);
});
```

**✅ select 사용 (필요한 필드만 조회):**
```typescript
const recipes = await prisma.recipe.findMany({
  select: {
    id: true,
    name: true,
    owner: {
      select: {
        id: true,
        displayName: true,
      },
    },
  },
});
```

**전략:**
- **include**: 모든 필드 필요한 경우
- **select**: 특정 필드만 필요한 경우 (더 빠름)

### 2. Connection Pool 설정

**.env:**
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&connection_limit=20&pool_timeout=20"
```

**PrismaService 생성자에서 설정:**
```typescript
constructor() {
  super({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: ['query', 'error', 'warn'],
  });
}
```

**권장 설정:**
- **connection_limit**: CPU 코어 수 × 2 + 1
- **pool_timeout**: 20초
- **Serverless 환경**: Prisma Accelerate 사용

### 3. Query Batching ($transaction)

**개별 쿼리 (비효율적):**
```typescript
const user = await prisma.user.findUnique({ where: { id: userId } });
const recipes = await prisma.recipe.findMany({ where: { ownerId: userId } });
const favorites = await prisma.savedRecipe.findMany({ where: { userId } });
```

**배치 쿼리 (효율적):**
```typescript
const [user, recipes, favorites] = await prisma.$transaction([
  prisma.user.findUnique({ where: { id: userId } }),
  prisma.recipe.findMany({ where: { ownerId: userId } }),
  prisma.savedRecipe.findMany({ where: { userId } }),
]);
```

**장점:**
- 단일 데이터베이스 왕복
- 원자적 실행 보장

### 4. Raw Query 필요 케이스 (Trigram 검색)

**Case-insensitive LIKE (느림):**
```typescript
prisma.recipe.findMany({
  where: {
    name: { contains: searchTerm, mode: 'insensitive' },
  },
});
```

**Trigram 검색 (빠름):**
```typescript
const recipes = await prisma.$queryRaw<Recipe[]>`
  SELECT * FROM recipes
  WHERE name % ${searchTerm}
  ORDER BY similarity(name, ${searchTerm}) DESC
  LIMIT 20
`;
```

**Trigram Index 필요:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_recipes_name_trgm ON recipes USING gin (name gin_trgm_ops);
```

### 5. Prisma Accelerate 검토

**Prisma Accelerate란?**
- Prisma의 관리형 연결 풀링 및 캐싱 솔루션
- Serverless 환경 최적화
- 글로벌 엣지 캐싱

**사용 케이스:**
- Vercel/Netlify 등 Serverless 배포
- 높은 동시성 요구
- 글로벌 트래픽 분산

**설정:**
```typescript
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

// 캐싱 쿼리
const users = await prisma.user.findMany({
  cacheStrategy: { ttl: 60 }, // 60초 캐싱
});
```

### 6. Index 전략

**위의 [A. schema.prisma](#a-완전한-schemaprisma-파일) 참조**

**핵심 Index:**
- `idx_recipes_public_created`: 공개 레시피 목록 (WHERE + ORDER BY)
- `idx_recipes_owner_created`: 사용자별 레시피 목록 (FK + ORDER BY)
- `idx_recipe_steps_recipe_id`: recipe_steps FK (JOIN 최적화)
- `idx_events_published_date`: 이벤트 캘린더 (WHERE + ORDER BY)
- `idx_recipes_name_trgm`: Trigram 검색 (GIN index)

---

## H. 타입 안전성

### 1. Generated Types 활용

**Prisma가 자동 생성하는 타입:**
```typescript
import { User, Recipe, Prisma } from '@prisma/client';

// 기본 타입
const user: User = await prisma.user.findUnique({ where: { id } });

// Include 타입
type RecipeWithSteps = Prisma.RecipeGetPayload<{
  include: { recipeSteps: true; owner: true };
}>;

// Select 타입
type RecipeBasic = Prisma.RecipeGetPayload<{
  select: { id: true; name: true; owner: { select: { displayName: true } } };
}>;

// Create Input 타입
const createData: Prisma.RecipeCreateInput = {
  name: 'V60 Recipe',
  coffee: 15,
  water: 250,
  // ... TypeScript가 필수 필드 강제
  owner: {
    connect: { id: userId },
  },
  recipeSteps: {
    create: [
      { stepIndex: 0, time: 0, duration: 30, water: 50 },
    ],
  },
};
```

### 2. 현재 types/database.ts와 비교

**현재 Supabase 타입:**
```typescript
// types/database.ts (Supabase 자동 생성)
type Tables = Database['public']['Tables'];
type Recipe = Tables['recipes']['Row'];
type RecipeInsert = Tables['recipes']['Insert'];
type RecipeUpdate = Tables['recipes']['Update'];
```

**Prisma 타입:**
```typescript
// Prisma 자동 생성
import { Recipe, Prisma } from '@prisma/client';

type RecipeInsert = Prisma.RecipeCreateInput;
type RecipeUpdate = Prisma.RecipeUpdateInput;
```

**장점:**
- Prisma는 **관계형 타입**까지 자동 생성
- `include`, `select`에 따라 동적 타입 추론
- Supabase는 flat 타입만 생성

**예시:**
```typescript
// Supabase: 수동으로 타입 정의 필요
interface RecipeWithSteps extends Recipe {
  recipe_steps: RecipeStep[];
  users: { display_name: string };
}

// Prisma: 자동 타입 추론
const recipe = await prisma.recipe.findUnique({
  where: { id },
  include: { recipeSteps: true, owner: true },
});
// recipe 타입: Recipe & { recipeSteps: RecipeStep[]; owner: User }
```

### 3. DTO와 Prisma 타입 매핑 전략

**DTO 정의 (NestJS):**
```typescript
// src/recipes/dto/create-recipe.dto.ts
import { IsString, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Prisma } from '@prisma/client';

export class CreateRecipeStepDto {
  @IsNumber()
  stepIndex: number;

  @IsNumber()
  time: number;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  @IsOptional()
  water?: number;
}

export class CreateRecipeDto {
  @IsString()
  name: string;

  @IsNumber()
  coffee: number;

  @IsNumber()
  water: number;

  @IsNumber()
  waterTemperature: number;

  @IsOptional()
  @IsString()
  brewingType?: 'hot' | 'ice';

  @ValidateNested({ each: true })
  @Type(() => CreateRecipeStepDto)
  steps: CreateRecipeStepDto[];
}
```

**DTO → Prisma Input 변환:**
```typescript
// src/recipes/recipes.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateRecipeDto } from './dto/create-recipe.dto';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRecipeDto, userId: string) {
    const data: Prisma.RecipeCreateInput = {
      name: dto.name,
      coffee: new Prisma.Decimal(dto.coffee),
      water: new Prisma.Decimal(dto.water),
      waterTemperature: new Prisma.Decimal(dto.waterTemperature),
      brewingType: dto.brewingType,
      owner: {
        connect: { id: userId },
      },
      recipeSteps: {
        create: dto.steps.map(step => ({
          stepIndex: step.stepIndex,
          time: step.time,
          duration: step.duration,
          title: step.title,
          water: step.water ? new Prisma.Decimal(step.water) : null,
        })),
      },
    };

    return this.prisma.recipe.create({
      data,
      include: {
        recipeSteps: { orderBy: { stepIndex: 'asc' } },
        owner: { select: { id: true, displayName: true } },
      },
    });
  }
}
```

### 4. Prisma 타입 활용 패턴

**재사용 가능한 타입 정의:**
```typescript
// src/recipes/types/recipe.types.ts
import { Prisma } from '@prisma/client';

// RecipeWithSteps 타입
export type RecipeWithSteps = Prisma.RecipeGetPayload<{
  include: {
    recipeSteps: true;
    owner: {
      select: {
        id: true;
        displayName: true;
        profileImage: true;
      };
    };
  };
}>;

// RecipeBasic 타입 (목록용)
export type RecipeBasic = Prisma.RecipeGetPayload<{
  select: {
    id: true;
    name: true;
    description: true;
    coffee: true;
    water: true;
    totalTime: true;
    owner: {
      select: {
        displayName: true;
      };
    };
  };
}>;

// RecipeFilterOptions 타입
export interface RecipeFilterOptions {
  drippers: string[];
  filters: string[];
  brewingTypes: ('hot' | 'ice')[];
}
```

**서비스에서 사용:**
```typescript
import { RecipeWithSteps, RecipeBasic } from './types/recipe.types';

@Injectable()
export class RecipesService {
  async findById(id: string): Promise<RecipeWithSteps> {
    return this.prisma.recipe.findUnique({
      where: { id },
      include: {
        recipeSteps: true,
        owner: {
          select: { id: true, displayName: true, profileImage: true },
        },
      },
    });
  }

  async findAll(): Promise<RecipeBasic[]> {
    return this.prisma.recipe.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        coffee: true,
        water: true,
        totalTime: true,
        owner: {
          select: { displayName: true },
        },
      },
    });
  }
}
```

---

## 요약

### Prisma 도입 장점

1. **타입 안전성**: 완전한 TypeScript 타입 추론
2. **트랜잭션**: 자동 롤백 및 원자적 실행
3. **미들웨어**: Soft delete, 로깅, 성능 모니터링 자동화
4. **마이그레이션**: 버전 관리 및 배포 자동화
5. **N+1 방지**: `include`/`select`로 최적화된 쿼리 생성
6. **Raw Query 지원**: 복잡한 쿼리도 타입 안전하게 실행

### 마이그레이션 우선순위

1. **Phase 1**: PrismaService 설정 및 기본 CRUD 변환
2. **Phase 2**: 트랜잭션 로직 변환 (createRecipe, toggleFavorite)
3. **Phase 3**: Soft Delete 미들웨어 적용
4. **Phase 4**: 성능 최적화 (Index, Batching, Trigram 검색)
5. **Phase 5**: Analytics 쿼리 변환 (Raw Query 사용)

### 주의사항

- **Decimal 타입**: Prisma는 `Prisma.Decimal` 사용 (변환 필요)
- **Soft Delete**: 미들웨어 적용 시 기존 쿼리 동작 확인
- **Raw Query**: 타입 캐스팅 필요 (`prisma.$queryRaw<Type>`)
- **Migration**: 프로덕션 배포 전 충분한 테스트

---

**작성일**: 2026-02-16
**버전**: 1.0
**작성자**: Prisma Expert Agent
