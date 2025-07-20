# PostHog 이벤트 문서

이 문서는 Coffimer 앱에서 PostHog를 사용하여 추적하는 모든 분석 이벤트의 포괄적인 목록을 제공합니다.

## 개요

PostHog는 사용자 행동과 앱 사용 패턴을 추적하기 위해 통합되었습니다. 모든 이벤트는 타입 안전한 이벤트 정의를 가진 `useAnalytics` 훅을 통해 추적됩니다.

## 설정

- **Provider**: `app/_layout.tsx`의 `PostHogProvider`
- **Hook**: `hooks/useAnalytics.ts`
- **Environment**: `.env.local`에 저장된 API 키

## 이벤트 카테고리

### 1. 앱 생명주기 이벤트

#### `app_opened`
- **트리거**: 앱 시작 또는 활성화
- **위치**: `app/(tabs)/index.tsx` (testConnection 메서드)
- **속성**:
  - `session_id`: string - 고유 세션 식별자

```typescript
track("app_opened", { session_id: Date.now().toString() });
```

### 2. 레시피 이벤트

#### `recipe_viewed`
- **트리거**: 사용자가 레시피 상세 정보 조회
- **위치**: `app/recipes/[id].tsx`
- **속성**:
  - `recipe_id`: string - 고유 레시피 식별자
  - `recipe_name`: string - 레시피 이름

```typescript
track("recipe_viewed", { recipe_id: "123", recipe_name: "V60 Pour Over" });
```

#### `recipe_started`
- **트리거**: 사용자가 "레시피 시작하기" 버튼 클릭 또는 타이머 시작
- **위치**: `app/recipes/[id].tsx`, `hooks/useRecipeTimer.ts`
- **속성**:
  - `recipe_id`: string - 레시피 식별자
  - `recipe_name`: string - 레시피 이름
  - `total_time`: number - 총 레시피 시간(초)

```typescript
track("recipe_started", { 
  recipe_id: "123", 
  recipe_name: "V60 Pour Over", 
  total_time: 300 
});
```

#### `recipe_completed`
- **트리거**: 사용자가 전체 레시피 완료
- **위치**: `hooks/useAnalytics.ts` (편의 메서드)
- **속성**:
  - `recipe_id`: string - 레시피 식별자
  - `recipe_name`: string - 레시피 이름
  - `total_time`: number - 소요된 총 시간
  - `completion_rate`: number - 완료 퍼센트 (0-1)

#### `recipe_abandoned`
- **트리거**: 사용자가 레시피 완료 전에 종료
- **위치**: 아직 구현되지 않음
- **속성**:
  - `recipe_id`: string - 레시피 식별자
  - `recipe_name`: string - 레시피 이름
  - `elapsed_time`: number - 포기 전까지 소요 시간
  - `completion_percentage`: number - 달성한 진행도 (0-1)

### 3. 타이머 이벤트

#### `timer_started`
- **트리거**: 타이머 시작 (처음에만)
- **위치**: `hooks/useRecipeTimer.ts`
- **속성**:
  - `recipe_id`: string - 레시피 식별자
  - `step_index`: number - 현재 단계 (0부터 시작)

#### `timer_paused`
- **트리거**: 사용자가 타이머 일시정지
- **위치**: `hooks/useRecipeTimer.ts`
- **속성**:
  - `recipe_id`: string - 레시피 식별자
  - `elapsed_time`: number - 일시정지 시점의 경과 시간
  - `step_index`: number - 일시정지 시점의 현재 단계

#### `timer_resumed`
- **트리거**: 사용자가 일시정지 후 타이머 재개
- **위치**: `hooks/useRecipeTimer.ts`
- **속성**:
  - `recipe_id`: string - 레시피 식별자
  - `elapsed_time`: number - 재개 시점의 경과 시간
  - `step_index`: number - 재개 시점의 현재 단계

#### `timer_reset`
- **트리거**: 사용자가 타이머 리셋
- **위치**: 아직 구현되지 않음
- **속성**:
  - `recipe_id`: string - 레시피 식별자
  - `elapsed_time`: number - 리셋 전 경과 시간
  - `step_index`: number - 리셋 시점의 단계

#### `step_completed`
- **트리거**: 사용자가 레시피 단계 완료
- **위치**: `hooks/useRecipeTimer.ts`
- **속성**:
  - `recipe_id`: string - 레시피 식별자
  - `step_index`: number - 완료된 단계 인덱스
  - `step_duration`: number - 완료된 단계의 소요 시간

### 4. 네비게이션 이벤트

#### `screen_view`
- **트리거**: 사용자가 다른 화면으로 이동
- **위치**: 여러 위치
- **속성**:
  - `screen_name`: string - 조회한 화면의 이름

**추적되는 화면들**:
- `"HomeScreen"` - 메인 레시피 목록
- `"RecipeDetail"` - 레시피 상세 페이지
- `"GrindGuide"` - 분쇄도 가이드 모달
- `"YouTube"` - 외부 YouTube 링크 열림

### 5. 사용자 이벤트

#### `user_login`
- **트리거**: 사용자 로그인 성공
- **위치**: 아직 구현되지 않음
- **속성**:
  - `method`: string - 로그인 방법 (email, google 등)

#### `user_logout`
- **트리거**: 사용자 로그아웃
- **위치**: 아직 구현되지 않음
- **속성**: 없음

### 6. 참여도 이벤트

#### `notification_received`
- **트리거**: 사용자가 푸시 알림 수신
- **위치**: 아직 구현되지 않음
- **속성**:
  - `type`: string - 알림 유형
  - `recipe_id?`: string - 레시피 관련일 경우 선택적 레시피 ID

#### `notification_tapped`
- **트리거**: 사용자가 알림 탭
- **위치**: 아직 구현되지 않음
- **속성**:
  - `type`: string - 알림 유형
  - `recipe_id?`: string - 레시피 관련일 경우 선택적 레시피 ID

#### `settings_changed`
- **트리거**: 사용자가 앱 설정 변경
- **위치**: 아직 구현되지 않음
- **속성**:
  - `setting_name`: string - 변경된 설정 이름
  - `new_value`: string | number | boolean - 새 값

## 구현 예제

### 기본 이벤트 추적
```typescript
import { useAnalytics } from "@/hooks/useAnalytics";

function MyComponent() {
  const { track } = useAnalytics();
  
  const handleButtonClick = () => {
    track("recipe_started", { 
      recipe_id: "123", 
      recipe_name: "V60", 
      total_time: 300 
    });
  };
}
```

### 화면 추적
```typescript
import { useAnalytics } from "@/hooks/useAnalytics";

function MyScreen() {
  const { screen } = useAnalytics();
  
  useEffect(() => {
    screen("MyScreen", { additional_data: "value" });
  }, [screen]);
}
```

### 사용자 식별
```typescript
import { useAnalytics } from "@/hooks/useAnalytics";

function AuthComponent() {
  const { identify } = useAnalytics();
  
  const handleLogin = (user) => {
    identify(user.id, {
      email: user.email,
      signup_date: user.created_at
    });
  };
}
```

## 데이터 구조

모든 이벤트는 다음 구조를 따릅니다:
- **이벤트 이름**: 케밥-케이스 문자열 (예: "recipe_started")
- **속성**: 이벤트별 데이터가 포함된 타입 객체
- **타임스탬프**: PostHog에서 자동으로 추가
- **사용자 ID**: 사용자 식별 시 자동으로 추적

## 개인정보 및 보안

- 민감한 개인 데이터는 추적되지 않음
- 모든 추적에 오류 처리 포함
- 성능을 위해 이벤트가 대기열에 저장되고 배치로 전송됨
- 사용자가 디바이스 설정을 통해 옵트아웃 가능

## 디버깅

개발 환경에서 디버그 로깅 활성화:
```typescript
const { testConnection } = useAnalytics();

// PostHog 연결 테스트
const isConnected = testConnection();
console.log("PostHog connected:", isConnected);
```

콘솔 로그 표시:
```
[Analytics] PostHog is connected and ready
[Analytics] Event tracked: recipe_started {...}
[Analytics] Screen tracked: HomeScreen {...}
```

## PostHog 대시보드

PostHog 대시보드에서 추적된 이벤트 보기:
1. **Live Events** - 실시간 이벤트 스트림
2. **Events** - 과거 이벤트 데이터
3. **Insights** - 사용자 정의 분석 및 퍼널
4. **Users** - 사용자 행동 분석

## 구성

`.env.local`의 환경 변수:
```bash
EXPO_PUBLIC_POSTHOG_API_KEY=your_api_key_here
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## 향후 개선사항

계획된 이벤트 추가:
- 레시피 평가/피드백 이벤트
- 필터 사용 추적
- 검색 행동 분석
- 오류 및 크래시 보고
- 성능 메트릭
- A/B 테스트 이벤트

---

**최종 업데이트**: 2025년 1월  
**버전**: 1.0  
**PostHog SDK**: posthog-react-native@4.1.3