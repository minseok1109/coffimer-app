# PostHog Events Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 기존 18개 이벤트(구현 9개 + 미구현 9개)를 10개의 실제 사용 이벤트로 정리하여 분석 효율을 높인다.

**Architecture:** `useAnalytics` 훅의 인터페이스를 10개 이벤트로 재정의하고, convenience 메서드/screen()/testConnection()을 제거한다. 각 call site를 새 스키마에 맞게 수정하며, `useRecipeTimer`에 `brewing_completed` 로직을 추가하고, 타이머 페이지에 `brewing_abandoned`를 구현한다.

**Tech Stack:** React Native, Expo Router, PostHog (posthog-react-native), TypeScript

---

## Current State Summary

| File | Current Events | Issues |
|------|---------------|--------|
| `hooks/useAnalytics.ts` | 18개 이벤트 인터페이스, 5개 convenience 메서드, screen(), testConnection() | console.log, 미구현 이벤트 노이즈, 불필요한 추상화 |
| `app/(tabs)/index.tsx:20-26` | `testConnection()`, `screen("HomeScreen")` | 디버그 메서드, PostHog autocapture로 대체 가능 |
| `app/recipes/[id].tsx:37-48` | `recipe_viewed`, `screen("RecipeDetail")` | screen() 중복 |
| `app/recipes/[id].tsx:54` | `screen_view("GrindGuide")` | 액션에 screen_view 오용 |
| `app/recipes/[id].tsx:118` | `recipe_started` | brewing_started로 rename 필요 |
| `app/recipes/[id].tsx:131` | `screen_view("YouTube")` | 액션에 screen_view 오용 |
| `app/recipes/[id].tsx:257` | `external_link_clicked` | link_type/url → link_type만, rename |
| `hooks/useRecipeTimer.ts:25-30` | convenience 메서드 사용 | track() 직접 호출로 변경 |
| `hooks/useRecipeTimer.ts:105` | `recipe_started` (타이머 시작 시) | `[id].tsx`와 중복, 여기서 `brewing_started`로 통합 |
| `hooks/useAuth.ts:144` | `posthog.capture('user_login')` | user_logged_in으로 rename |
| `hooks/useAuth.ts:155` | `posthog.capture('user_logout')` | user_logged_out으로 rename |

## Target Event Schema (10 events)

### Category 1: Recipe Journey (4 events)

핵심 퍼널: `recipe_viewed` → `brewing_started` → `brewing_completed` / `brewing_abandoned`

```typescript
recipe_viewed: {
  recipe_id: string;
  recipe_name: string;
  source: 'home' | 'my_recipes' | 'deeplink';
}

brewing_started: {
  recipe_id: string;
  recipe_name: string;
  total_steps: number;
  total_time: number;
}

brewing_completed: {
  recipe_id: string;
  recipe_name: string;
  actual_duration: number;
  total_steps: number;
  pause_count: number;
}

brewing_abandoned: {
  recipe_id: string;
  recipe_name: string;
  last_step_index: number;
  total_steps: number;
  elapsed_time: number;
  completion_pct: number;
}
```

### Category 2: Timer Interaction (3 events)

```typescript
timer_paused: {
  recipe_id: string;
  step_index: number;
  elapsed_time: number;
}

timer_resumed: {
  recipe_id: string;
  step_index: number;
  pause_duration: number;
}

step_completed: {
  recipe_id: string;
  step_index: number;
  step_duration: number;
}
```

### Category 3: Engagement (3 events)

```typescript
user_logged_in: {
  method: 'email' | 'google' | 'apple';
}

user_logged_out: {}

external_link_tapped: {
  link_type: 'youtube' | 'grinder_guide';
  recipe_id?: string;
}
```

---

## Task 1: Rewrite `useAnalytics.ts` — Interface & Core Methods

**Files:**
- Modify: `hooks/useAnalytics.ts` (전체 파일 교체)

**Step 1: Replace AnalyticsEvents interface with 10-event schema**

`hooks/useAnalytics.ts`의 `AnalyticsEvents` 인터페이스(lines 3-53)를 아래로 교체:

```typescript
export interface AnalyticsEvents {
  // Recipe Journey
  recipe_viewed: {
    recipe_id: string;
    recipe_name: string;
    source: 'home' | 'my_recipes' | 'deeplink';
  };
  brewing_started: {
    recipe_id: string;
    recipe_name: string;
    total_steps: number;
    total_time: number;
  };
  brewing_completed: {
    recipe_id: string;
    recipe_name: string;
    actual_duration: number;
    total_steps: number;
    pause_count: number;
  };
  brewing_abandoned: {
    recipe_id: string;
    recipe_name: string;
    last_step_index: number;
    total_steps: number;
    elapsed_time: number;
    completion_pct: number;
  };

  // Timer Interaction
  timer_paused: {
    recipe_id: string;
    step_index: number;
    elapsed_time: number;
  };
  timer_resumed: {
    recipe_id: string;
    step_index: number;
    pause_duration: number;
  };
  step_completed: {
    recipe_id: string;
    step_index: number;
    step_duration: number;
  };

  // Engagement
  user_logged_in: {
    method: 'email' | 'google' | 'apple';
  };
  user_logged_out: Record<string, never>;
  external_link_tapped: {
    link_type: 'youtube' | 'grinder_guide';
    recipe_id?: string;
  };
}
```

**Step 2: Simplify hook — keep only `track()` and `identify()`**

`useAnalytics` 훅(lines 55-193)을 아래로 교체. 삭제 대상:
- `screen()` 메서드 (lines 90-105)
- `testConnection()` 메서드 (lines 171-179)
- convenience 메서드 5개 (lines 108-168): `trackRecipeStart`, `trackRecipeComplete`, `trackTimerPause`, `trackTimerResume`, `trackStepComplete`
- 모든 `console.log` / `console.warn` (lines 65, 67, 70, 81, 83, 86, 96, 98, 100, 103, 173, 177)

```typescript
export const useAnalytics = () => {
  const posthog = usePostHog();

  const track = <K extends keyof AnalyticsEvents>(
    event: K,
    properties: AnalyticsEvents[K]
  ) => {
    if (posthog) {
      posthog.capture(event, properties);
    }
  };

  const identify = (
    userId: string,
    properties?: Record<string, string | number | boolean | null>
  ) => {
    if (posthog) {
      posthog.identify(userId, properties);
    }
  };

  return { track, identify };
};
```

**Step 3: Verify — Run type-check**

Run: `pnpm run type-check`
Expected: 컴파일 오류 발생 (call site들이 아직 구 이벤트명을 사용하므로). 이 단계에서는 오류가 예상됨.

**Step 4: Commit**

```bash
git add hooks/useAnalytics.ts
git commit -m "refactor(analytics): redefine AnalyticsEvents to 10 events, remove convenience methods"
```

---

## Task 2: Clean up `app/(tabs)/index.tsx`

**Files:**
- Modify: `app/(tabs)/index.tsx:3,20-26`

**Step 1: Remove analytics import and usage**

1. `import { useAnalytics } from "@/hooks/useAnalytics";` (line 3) → 삭제
2. `const { testConnection, screen } = useAnalytics();` (line 20) → 삭제
3. `useEffect` 블록 전체 삭제 (lines 22-26):
```typescript
// DELETE THIS BLOCK:
React.useEffect(() => {
  testConnection();
  screen("HomeScreen");
}, [testConnection, screen]);
```

> 이유: `testConnection()`은 디버그 메서드, `screen()`은 PostHog autocapture가 대체

**Step 2: Verify — Run type-check**

Run: `pnpm run type-check`
Expected: 이 파일의 오류 해결됨.

**Step 3: Commit**

```bash
git add app/\(tabs\)/index.tsx
git commit -m "refactor(analytics): remove testConnection and screen calls from home"
```

---

## Task 3: Update `app/recipes/[id].tsx`

**Files:**
- Modify: `app/recipes/[id].tsx:3,32,37-48,50-55,116-125,127-142,254-261`

**Step 1: Update analytics destructuring**

Line 32: `const { track, screen } = useAnalytics();` → `const { track } = useAnalytics();`

**Step 2: Update useEffect — remove screen(), add source to recipe_viewed**

Lines 37-48을 아래로 교체:

```typescript
useEffect(() => {
  if (recipe) {
    track("recipe_viewed", {
      recipe_id: recipe.id,
      recipe_name: recipe.name,
      source: 'home',
    });
  }
}, [recipe, track]);
```

> `screen("RecipeDetail")` 삭제 — PostHog autocapture로 대체

**Step 3: Remove screen_view from openBottomSheet**

Lines 50-55에서 `track("screen_view", ...)` 호출 삭제:

```typescript
const openBottomSheet = () => {
  setShowGrindGuide(true);
  Animated.parallel([
    // ... (기존 애니메이션 코드 유지)
  ]).start();
};
```

> GrindGuide 바텀시트 열기는 별도 이벤트 불필요. 필요 시 추후 추가.

**Step 4: Remove recipe_started from handleStartRecipe**

Lines 116-125를 아래로 교체:

```typescript
const handleStartRecipe = () => {
  router.push(`/recipes/timer/${recipe.id}`);
};
```

> `recipe_started`는 삭제. `brewing_started`는 실제 타이머가 시작될 때(useRecipeTimer)에서만 발생해야 함. 하나의 액션 = 하나의 이벤트 원칙.

**Step 5: Update handleYouTubePress — screen_view → external_link_tapped**

Lines 127-142를 아래로 교체:

```typescript
const handleYouTubePress = async () => {
  if (!recipe.youtube_url) return;

  track("external_link_tapped", {
    link_type: "youtube",
    recipe_id: recipe.id,
  });
  try {
    const supported = await Linking.canOpenURL(recipe.youtube_url);
    if (supported) {
      await Linking.openURL(recipe.youtube_url);
    } else {
      Alert.alert("오류", "YouTube 앱을 열 수 없습니다.");
    }
  } catch {
    Alert.alert("오류", "YouTube 영상을 열 수 없습니다.");
  }
};
```

**Step 6: Update grinder guide link — external_link_clicked → external_link_tapped**

Lines 254-261의 `track("external_link_clicked", { link_type: "grinder_guide", url: "..." })` 를 아래로 교체:

```typescript
track("external_link_tapped", {
  link_type: "grinder_guide",
  recipe_id: recipe.id,
});
```

> `url` 필드 삭제 — 새 스키마에 없음. `recipe_id` 추가.

**Step 7: Verify — Run type-check**

Run: `pnpm run type-check`

**Step 8: Commit**

```bash
git add app/recipes/\[id\].tsx
git commit -m "refactor(analytics): update recipe detail events to new schema"
```

---

## Task 4: Update `hooks/useRecipeTimer.ts` — Core Timer Analytics

이 Task가 가장 복잡함. 변경 사항:
1. convenience 메서드 → `track()` 직접 호출
2. `recipe_started` → `brewing_started` (속성 변경)
3. `timer_resumed`에 `pause_duration` 추가 (새 state 필요)
4. `brewing_completed` 구현 (마지막 step 완료 시)
5. `timer_paused` 속성 순서 변경

**Files:**
- Modify: `hooks/useRecipeTimer.ts`

**Step 1: Update analytics import and add new state**

Lines 5, 25-30을 수정. 기존 convenience 메서드 대신 `track`만 사용. 새로운 state 추가:

```typescript
// Line 5: import 유지
import { useAnalytics } from './useAnalytics';

// Lines 25-30을 교체:
const { track } = useAnalytics();
const [hasStartedRecipe, setHasStartedRecipe] = useState(false);
const [pauseCount, setPauseCount] = useState(0);
const [lastPauseTime, setLastPauseTime] = useState<number | null>(null);
```

> `pauseCount`: `brewing_completed.pause_count` 용
> `lastPauseTime`: `timer_resumed.pause_duration` 계산용

**Step 2: Update recipe reset effect**

Lines 34-39에 새 state 초기화 추가:

```typescript
useEffect(() => {
  setCurrentTime(INITIAL_TIME);
  setCurrentStep(INITIAL_STEP);
  setIsRunning(false);
  setHasStartedRecipe(false);
  setPauseCount(0);
  setLastPauseTime(null);
}, [recipe.id]);
```

**Step 3: Add brewing_completed to step completion logic**

Lines 65-83의 단계 변경 감지 로직에 `brewing_completed` 추가:

```typescript
if (newCurrentStep !== currentStep && recipe.recipe_steps) {
  const completedStepIndex =
    newCurrentStep > 0 ? newCurrentStep - 1 : 0;
  const completedStep = recipe.recipe_steps[completedStepIndex];

  if (completedStep && newCurrentStep > currentStep) {
    sendNotification(
      `${completedStep.title} 완료`,
      `다음 단계를 진행하세요: ${completedStep.description}`
    );

    track('step_completed', {
      recipe_id: recipe.id,
      step_index: completedStepIndex,
      step_duration: completedStep.time || 0,
    });
  }

  setCurrentStep(newCurrentStep);
}

// 마지막 단계의 시간을 초과하면 brewing_completed
const lastStep = recipe.recipe_steps?.at(-1);
if (lastStep && newTime > lastStep.time && isRunning) {
  track('brewing_completed', {
    recipe_id: recipe.id,
    recipe_name: recipe.name,
    actual_duration: newTime,
    total_steps: recipe.recipe_steps?.length ?? 0,
    pause_count: pauseCount,
  });
  setIsRunning(false);
}
```

> **주의**: `brewing_completed`가 한 번만 발생하도록 `isRunning` 체크 + `setIsRunning(false)` 필요. 단, `setCurrentTime` 내부 콜백에서 `setIsRunning`을 직접 호출하면 React state 배치 이슈가 있을 수 있으므로, 별도 effect로 분리하는 것을 고려.

**대안 접근 (권장)**: `isCompleted` state를 추가하여 완료 감지를 분리:

```typescript
const [isCompleted, setIsCompleted] = useState(false);
```

타이머 effect 안에서 마지막 step 시간 초과 시:
```typescript
if (lastStep && newTime > lastStep.time && !isCompleted) {
  setIsCompleted(true);
}
```

별도 effect로 brewing_completed 트래킹:
```typescript
useEffect(() => {
  if (isCompleted && recipe.recipe_steps) {
    track('brewing_completed', {
      recipe_id: recipe.id,
      recipe_name: recipe.name,
      actual_duration: currentTime,
      total_steps: recipe.recipe_steps.length,
      pause_count: pauseCount,
    });
    setIsRunning(false);
  }
}, [isCompleted]);
```

**Step 4: Update toggleTimer — brewing_started, timer_paused, timer_resumed**

Lines 92-120을 교체:

```typescript
const toggleTimer = useCallback(() => {
  if (isRunning) {
    // Pause
    track('timer_paused', {
      recipe_id: recipe.id,
      step_index: currentStep,
      elapsed_time: currentTime,
    });
    setPauseCount((prev) => prev + 1);
    setLastPauseTime(Date.now());
  } else {
    initializeAudio();

    if (hasStartedRecipe) {
      // Resume
      const pauseDuration = lastPauseTime
        ? Math.round((Date.now() - lastPauseTime) / 1000)
        : 0;
      track('timer_resumed', {
        recipe_id: recipe.id,
        step_index: currentStep,
        pause_duration: pauseDuration,
      });
      setLastPauseTime(null);
    } else {
      // First start
      track('brewing_started', {
        recipe_id: recipe.id,
        recipe_name: recipe.name,
        total_steps: recipe.recipe_steps?.length ?? 0,
        total_time: recipe.total_time || 0,
      });
      setHasStartedRecipe(true);
    }
  }
  setIsRunning((prev) => !prev);
}, [
  isRunning,
  initializeAudio,
  hasStartedRecipe,
  recipe,
  currentTime,
  currentStep,
  lastPauseTime,
  track,
]);
```

**Step 5: Export new values for brewing_abandoned**

타이머 페이지에서 `brewing_abandoned` 이벤트를 보내려면 timer hook에서 필요한 데이터를 반환해야 함.

Return 타입에 추가:

```typescript
interface UseRecipeTimerReturn {
  currentTime: number;
  isRunning: boolean;
  currentStep: number;
  hasStartedRecipe: boolean;  // NEW
  pauseCount: number;          // NEW
  toggleTimer: () => void;
  resetTimer: () => void;
  goToPreviousStep: () => void;
  goToNextStep: () => void;
}
```

Return 객체 업데이트:

```typescript
return {
  currentTime,
  isRunning,
  currentStep,
  hasStartedRecipe,
  pauseCount,
  toggleTimer,
  resetTimer,
  goToPreviousStep,
  goToNextStep,
};
```

**Step 6: Verify — Run type-check**

Run: `pnpm run type-check`

**Step 7: Commit**

```bash
git add hooks/useRecipeTimer.ts
git commit -m "refactor(analytics): update timer analytics to new event schema"
```

---

## Task 5: Implement `brewing_abandoned` in Timer Page

**Files:**
- Modify: `app/recipes/timer/[id].tsx`

`brewing_abandoned`는 사용자가 타이머 진행 중 뒤로 가기 할 때 발생해야 함.

**Step 1: Add analytics import and brewing_abandoned logic**

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';
```

타이머 데이터에서 `hasStartedRecipe` 구조분해 추가:

```typescript
const {
  currentTime,
  isRunning,
  currentStep,
  hasStartedRecipe,
  toggleTimer,
  resetTimer,
  goToPreviousStep,
  goToNextStep,
} = useRecipeTimer(recipe!);
```

뒤로 가기 핸들러 생성:

```typescript
const { track } = useAnalytics();

const handleBack = () => {
  if (hasStartedRecipe && recipe?.recipe_steps) {
    const totalSteps = recipe.recipe_steps.length;
    const lastStep = recipe.recipe_steps.at(-1);
    const totalTime = lastStep?.time ?? 0;

    track('brewing_abandoned', {
      recipe_id: recipe.id,
      recipe_name: recipe.name,
      last_step_index: currentStep,
      total_steps: totalSteps,
      elapsed_time: currentTime,
      completion_pct: totalTime > 0
        ? Math.round((currentTime / totalTime) * 100)
        : 0,
    });
  }
  router.back();
};
```

**Step 2: Update TimerHeader onBack callback**

`<TimerHeader onBack={() => router.back()} .../>` 를 `<TimerHeader onBack={handleBack} .../>` 로 변경.

두 곳 모두 변경:
- Line 41 (recipe가 없을 때): `onBack={() => router.back()}` → 이건 recipe가 없으므로 그대로 유지
- Line 49 (정상 렌더링): `onBack={() => router.back()}` → `onBack={handleBack}`

**Step 3: Verify — Run type-check**

Run: `pnpm run type-check`

**Step 4: Commit**

```bash
git add app/recipes/timer/\[id\].tsx
git commit -m "feat(analytics): implement brewing_abandoned on timer back navigation"
```

---

## Task 6: Update `hooks/useAuth.ts` — Rename Events & Remove Logs

**Files:**
- Modify: `hooks/useAuth.ts:36-37,57-62,65,99,128,144-152,155,162,165,168`

**Step 1: Rename user_login → user_logged_in and clean up properties**

Line 144를:
```typescript
posthog.capture('user_login', {
  method: 'email',
  user_id: session.user.id,
  identified,
});
```

아래로 교체:
```typescript
posthog.capture('user_logged_in', {
  method: 'email' as const,
});
```

> `user_id`와 `identified`는 새 스키마에 없으므로 삭제. PostHog identify가 이미 user_id를 연결함.

**Step 2: Rename user_logout → user_logged_out**

Line 155를:
```typescript
posthog.capture('user_logout', {});
```

아래로 교체:
```typescript
posthog.capture('user_logged_out', {});
```

**Step 3: Remove all console.log statements**

삭제 대상 lines:
- Line 36-37: `console.log('🎯 PostHog 중복 식별 방지:', ...)`
- Lines 57-62: `console.log('🎯 PostHog 사용자 식별 완료:', ...)`
- Line 65: `console.error('🎯 PostHog 식별 오류:', ...)`
- Line 99: `console.log('🔐 세션 복원:', ...)`
- Line 128: `console.log('🔐 Auth 상태 변경:', ...)`
- Lines 150-152: `console.log('🎯 PostHog 로그인 이벤트 추적:', ...)`
- Line 162: `console.log('🎯 PostHog 로그아웃 및 상태 초기화')`
- Line 165: `console.warn('🎯 PostHog 인스턴스를 사용할 수 없습니다')`
- Line 168: `console.error('🎯 PostHog 연동 오류:', ...)`
- Line 224: `console.error('Error creating user profile:', ...)`
- Line 241-242: `console.error('Supabase 로그아웃 오류:', ...)`
- Line 247: `console.log('Supabase 스토리지 정리 완료')`
- Line 250: `console.error('Supabase 스토리지 정리 중 오류:', ...)`
- Line 275-276: `console.error('로그아웃 오류:', ...)`
- Line 279: `console.log('완전 로그아웃 완료')`
- Line 282: `console.error('로그아웃 중 오류 발생:', ...)`
- Line 113: `console.error('인증 초기화 오류:', ...)`
- Line 320: `console.log('계정 탈퇴 완료')`
- Line 323: `console.error('계정 탈퇴 중 오류:', ...)`

> **주의**: `catch` 블록의 `console.error`는 프로덕션에서도 에러 추적에 유용할 수 있으나, 코딩 스타일 규칙에 따라 모두 제거. 필요 시 Sentry 등 에러 모니터링으로 대체 가능.

**Step 4: Verify — Run type-check**

Run: `pnpm run type-check`

**Step 5: Commit**

```bash
git add hooks/useAuth.ts
git commit -m "refactor(analytics): rename auth events to new schema, remove console logs"
```

---

## Task 7: Update `POSTHOG_EVENTS_KO.md` Documentation

**Files:**
- Modify: `POSTHOG_EVENTS_KO.md`

**Step 1: Rewrite documentation to match new 10-event schema**

전체 문서를 새 이벤트 스키마에 맞게 재작성. 주요 변경:
- 18개 → 10개 이벤트로 축소
- 삭제된 이벤트/패턴 목록 포함
- 각 이벤트의 구현 위치 명시
- 디버깅 섹션에서 testConnection 관련 내용 제거
- 구현 예제를 `track()` 직접 호출로 업데이트

**Step 2: Commit**

```bash
git add POSTHOG_EVENTS_KO.md
git commit -m "docs(analytics): update PostHog events documentation for new schema"
```

---

## Task 8: Final Verification

**Step 1: Full type-check**

Run: `pnpm run type-check`
Expected: 모든 TypeScript 오류 0개

**Step 2: Lint check**

Run: `pnpm run lint`
Expected: 새로운 lint 오류 없음

**Step 3: Verify no remaining old event references**

검색 대상 (모두 0 결과여야 함):
- `recipe_started` → 0 hits (brewing_started로 대체됨)
- `recipe_completed` → 0 hits (brewing_completed로 대체됨)
- `recipe_abandoned` → 0 hits (brewing_abandoned로 대체됨)
- `timer_started` → 0 hits (삭제됨)
- `timer_reset` → 0 hits (삭제됨)
- `screen_view` → 0 hits (삭제됨)
- `app_opened` → 0 hits (삭제됨)
- `external_link_clicked` → 0 hits (external_link_tapped로 대체됨)
- `user_login` → 0 hits (user_logged_in으로 대체됨, 단 `user_login`이 다른 컨텍스트에서 사용될 수 있으므로 확인)
- `testConnection` → 0 hits
- `trackRecipeStart` → 0 hits
- `trackRecipeComplete` → 0 hits
- `trackTimerPause` → 0 hits
- `trackTimerResume` → 0 hits
- `trackStepComplete` → 0 hits

**Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "chore(analytics): final cleanup after PostHog events redesign"
```

---

## Decision Points for User

### Task 4, Step 3: `brewing_completed` 감지 방식

마지막 step의 시간을 초과했을 때 완료로 판단합니다. 두 가지 접근이 있습니다:

**A) 타이머 interval 내부에서 직접 처리** — 단순하지만 setInterval 콜백에서 여러 state를 업데이트해야 함
**B) `isCompleted` state + 별도 effect** — 관심사 분리가 깔끔하지만 effect 하나 추가

→ 구현 시 결정 필요

### Task 6: `console.error` in catch blocks

에러 로깅을 완전히 제거할지, 혹은 중요한 catch 블록(예: auth 초기화 실패)에서만 유지할지 결정 필요.

---

## Summary

| Task | File | Changes |
|------|------|---------|
| 1 | `hooks/useAnalytics.ts` | Interface 10개, convenience/screen/testConnection 삭제, console.log 삭제 |
| 2 | `app/(tabs)/index.tsx` | testConnection(), screen() 호출 삭제 |
| 3 | `app/recipes/[id].tsx` | screen() 삭제, recipe_started 삭제, screen_view→external_link_tapped |
| 4 | `hooks/useRecipeTimer.ts` | track() 직접 호출, brewing_started/completed, pause_duration 추가 |
| 5 | `app/recipes/timer/[id].tsx` | brewing_abandoned 구현 (뒤로 가기 시) |
| 6 | `hooks/useAuth.ts` | user_login→user_logged_in, user_logout→user_logged_out, console 삭제 |
| 7 | `POSTHOG_EVENTS_KO.md` | 새 스키마 문서 업데이트 |
| 8 | (전체) | type-check, lint, old event grep 검증 |
