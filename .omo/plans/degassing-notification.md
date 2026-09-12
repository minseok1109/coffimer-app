# degassing-notification - Work Plan

## TL;DR (For humans)
<!-- Fill this LAST, after the detailed plan below is written, so it summarizes the REAL plan. -->
<!-- Plain English for a non-engineer: NO file paths, NO todo numbers, NO wave/agent/tool names. -->

**What you'll get:** 원두에 설정한 디게싱 기간이 끝나는 날 아침 9시에 "○○ 디게싱 기간이 끝났습니다. 맛있게 원두를 즐기세요!"라는 스마트폰 알림이 뜹니다. 알림을 누르면 그 원두 상세 화면으로 바로 들어가고, 원두를 수정하면 알림 날짜도 따라 바뀌며 원두를 지우면 알림도 사라집니다.

**Why this approach:** 이 기능은 사실 이미 절반 이상 만들어져 있었습니다 — 아직 합쳐지지 않은 작업 갈래에 알림 코드가 통째로 들어 있었고, 그걸 버리고 새로 짜는 대신 최신 코드 위로 옮겨와 결함만 고칩니다. 그리고 알림은 서버를 거치지 않고 휴대폰 안에서 예약합니다. 지금 사용자 수 규모에서는 서버 방식이 더 안전하지도 않으면서 관리할 것만 서너 배로 늘어나기 때문입니다.

**What it will NOT do:**
- 서버에서 밀어주는 푸시는 만들지 않습니다 (휴대폰 자체 예약 방식만).
- 알림을 켜고 끄거나 시간을 바꾸는 설정 화면은 만들지 않습니다.
- 디게싱 외의 다른 알림(개봉일, 잔여량 등)은 건드리지 않습니다.

**Effort:** Medium
**Risk:** Medium - 날짜 계산 방식이 지금 화면 표시용과 알림용으로 갈라져 있어 하루 어긋날 수 있고, 이걸 하나로 합치는 과정이 기존 화면 표시에 영향을 줍니다.
**Decisions to sanity-check:**
- 알림 시각을 완료일 **오전 9시**로 고정한 점
- 알림 문구를 원두 이름 + 요청하신 문장 그대로 쓴 점
- 앱을 지웠다 다시 깔면 예약이 사라지고, 앱을 다시 연 시점에 복구된다는 점 (그 사이 지나간 알림은 못 받음)
- 알림은 휴대폰 기능이라 이번 변경 후에는 **앱을 새로 빌드해야** 실제로 동작합니다

Your next move: 검토 후 실행을 시작하거나, 추가 고정밀 검토를 요청하세요. Full execution detail follows below.

---

> TL;DR (machine): Medium effort / Medium risk. Rebase `feat/degassing-notification` onto main, unify degassing completion-date math into one local-calendar pure function shared by UI + notifications, replace the notification copy with the requested wording, add 0-day/past/permission guards, fix reconcile for empty bean lists, move delete-cancel after mutation success, and cover it with jest tests. 9 implementation todos + 4 final verifiers.

## Scope

### Must have
- `feat/degassing-notification` 브랜치를 현재 `main` 위로 리베이스해 충돌 없이 머지 가능한 상태로 만든다 (브랜치는 main 대비 4 behind / 7 ahead).
- 디게싱 완료 시각 계산을 **단일 순수 함수**로 통일하고, UI(`utils/degassingUtils.ts` 경유 `BeanDetail`/`BeanCard`)와 알림 모듈(`lib/notifications/degassing.ts`)이 같은 함수를 사용한다. 파싱은 **로컬 캘린더 기준**으로 통일한다.
- 알림 발송 시각: 완료일(`roast_date` + `degassing_days`) **오전 9시 로컬**.
- 알림 문구: 제목 `디게싱 완료`, 본문 `{원두명} 디게싱 기간이 끝났습니다. 맛있게 원두를 즐기세요!`.
- 알림 예약 제외 조건: `roast_date`가 null, `degassing_days`가 null, `degassing_days <= 0`, 계산된 발송 시각이 현재 이하(과거).
- 원두 생성 시 예약 / 수정 시 재예약 / 삭제 시 취소.
- 앱 실행 시 reconcile로 OS 예약목록과 원두목록을 diff해 누락 보충 + 고아 취소. 원두 목록이 **빈 배열일 때도** 고아 정리가 동작해야 한다.
- expo-notifications 설치, `app.json` 플러그인/권한 설정, Android `degassing` 채널, iOS 권한 요청, 포그라운드 알림 핸들러, 알림 탭 시 `/beans/{id}` 딥링크.
- `jest.setup.js`에 `expo-notifications` 모킹을 추가하고, 순수 함수 + 알림 모듈 호출 인자에 대한 단위 테스트를 작성한다.
- `pnpm run type-check` 통과. 변경 파일 대상 `pnpm exec eslint <changed-files>` 통과. 전체 `pnpm run lint`는 사전존재 baseline(1 error / 14 warnings) 외 신규 진단 0건을 A/B로 증명한다. `pnpm test`는 알림 관련 targeted suite 전부 통과 + **사전존재 auth/validation 실패 27건 외 신규 실패 0건**을 변경 전후 A/B로 증명한다.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- **서버사이드 푸시 일절 금지**: Supabase Edge Function, pg_cron, `push_tokens` 테이블, Expo Push API, APNs/FCM 크리덴셜 셋업 — 어느 것도 도입하지 않는다.
- **DB 스키마 변경 금지**: `degassing_notified_at` 등 컬럼 추가/마이그레이션 금지.
- **알림 설정 UI 금지**: on/off 토글, 발송 시각 커스터마이즈 화면, 프로필 내 알림 설정 섹션 — 요청에 없으므로 만들지 않는다.
- **디게싱 외 알림 금지**: 개봉일 경과, 잔여량 소진, 레시피/타이머 관련 신규 알림 추가 금지.
- **`hooks/useNotification.ts` 수정 금지** — 이 파일은 타이머용 오디오 재생 전용(expo-audio)이며 푸시 알림과 무관하다. 확장하거나 알림 로직을 넣지 않는다.
- **UI 스타일/레이아웃 변경 금지**: `app/(tabs)/beans.tsx`, `components/beans/*`의 StyleSheet·className·배치를 알림과 무관하게 손대지 않는다.
- **EAS 빌드 실행·스토어 제출 금지** (네이티브 모듈이라 dev build 재빌드가 필요하다는 사실은 문서화만 한다).
- `.omo/`, `.serena/`, `ios/` 미추적 디렉터리를 커밋하지 않는다 (dirty worktree 리스크).
- **`runtimeVersion`을 `1.0.11`로 둔 채 이 변경을 OTA로 내보내지 않는다.** `expo-updates`가 활성화돼 있고(`app.json` `updates.enabled: true`, `checkAutomatically: ON_LOAD`) `expo-notifications`는 네이티브 모듈이므로, runtimeVersion이 그대로면 네이티브 모듈이 없는 기존 빌드에 새 JS 번들이 배포돼 런타임 크래시가 난다. 브랜치가 이미 `version`/`runtimeVersion`을 `1.0.12`로 올려두었으며 이 값은 반드시 유지·검증한다.
- **알림 탭 분석 이벤트를 추가하지 않는다.** `hooks/useAnalytics.ts:46-47`에 `notification_received`/`notification_tapped` 타입이 정의만 되어 있고 코드 어디서도 호출되지 않는다(`POSTHOG_EVENTS_KO.md:153`에 문서만 존재). 사용자가 요청하지 않았으므로 이번 범위에서는 트래킹을 붙이지 않는다.
- 알림 예약 실패가 원두 저장 mutation을 롤백하거나 사용자에게 에러를 노출하게 만들지 않는다 (알림은 best-effort 부수효과).

## Verification strategy
- Lint baseline debt (Todo 4 독립 검증): 전체 `pnpm run lint`는 이 변경 전부터 **1 error / 14 warnings**로 red다. error는 변경되지 않은 `CustomDayComponent.tsx:15 react/display-name`, 나머지 warnings도 알림 변경 범위 밖 10개 파일이다. 이 플랜은 unrelated lint 부채를 수정하지 않는다. 매 작업은 변경 파일만 `pnpm exec eslint <changed-files>`로 clean해야 하고, 전체 lint는 baseline과 진단 파일·rule·개수가 동일하며 신규 진단 0건임을 증명한다. 최종 보고에서 전체 lint를 green으로 표현하지 말 것.
> Zero human intervention - all verification is agent-executed.
- Test decision: **tests-after** — 구현 후 단위 테스트 추가. 프레임워크: jest 29 + `jest-expo` preset + `@testing-library/react-native` (`jest.config.js` 기존 설정 사용).
- Baseline debt (Todo 3에서 독립 검증): 전체 `pnpm test`는 이 변경 전부터 `__tests__/auth/signUp.test.tsx`, `__tests__/validation/authSchema.test.ts`의 `signUpSchema` 관련 **27개 실패**가 존재한다. 이 플랜은 알림 범위를 벗어난 auth schema를 수정하지 않는다. 각 작업은 targeted suite GREEN을 요구하고, 전체 suite는 두 known failing suite를 parent setup/현재 setup으로 A/B 실행해 **실패 이름·개수 동일 + 신규 실패 0**을 증명한다. 최종 보고에서 전체 suite를 green으로 표현하지 말 것.
- 순수 함수(완료일 계산, 예약 대상 판정)는 실제 단위 테스트로 검증한다.
- expo-notifications는 네이티브 모듈이라 jest에서 실제 예약을 검증할 수 없다. 대신 `jest.setup.js`에서 모킹하고 **`scheduleNotificationAsync` / `cancelScheduledNotificationAsync` 호출 인자**(identifier, title, body, trigger.date)를 단언한다.
- **Platform.OS 사실 확인(검증 완료)**: `lib/notifications/degassing.ts`는 `Platform.OS === 'web'`일 때 조기 반환한다. 이 리포의 jest 환경은 `jest.config.js`의 `preset: 'jest-expo'` → `node_modules/jest-expo/jest-preset.js` → `node_modules/react-native/jest-preset.js:14-17`의 `haste.defaultPlatform: 'ios'`를 상속하므로 **`Platform.OS`는 기본값이 `'ios'`** 이며 web 조기 반환에 걸리지 않는다. 따라서 별도 Platform 강제는 기본적으로 불필요하다. 다만 **테스트가 vacuous하지 않음을 반드시 증명할 것**: 예약을 단언하는 테스트를 작성한 뒤 대상 함수 호출을 일시적으로 제거했을 때 그 테스트가 실제로 실패하는지 확인하고 결과를 evidence에 남긴다. Android 분기(`setupNotificationChannel`)를 검증할 때만 `Platform.OS`를 `'android'`로 바꿔야 하며, 그 방법은 구현자가 이 환경에서 실제로 동작하는 것을 확인한 뒤 채택한다(`jest.spyOn(Platform, 'OS', 'get')`은 RN Platform 구현에 따라 동작하지 않을 수 있으므로, `jest.doMock` + `jest.isolateModules` 등 실제로 통하는 방식을 확인 후 사용).
- 시간 의존 테스트는 `jest.useFakeTimers({ now: ... })` 또는 명시적 기준 Date 주입으로 결정론적으로 작성한다. 절대 `sleep`/실제 시각 의존 금지.
- Evidence: `.omo/evidence/task-<N>-degassing-notification.txt` (ulw-loop 밖에서 실행되므로 `.omo/evidence/` 사용).

## Execution strategy

### Parallel execution waves
- **Wave 1 (게이트)**: Todo 1 — 브랜치 리베이스. 이후 모든 작업의 전제이므로 단독 실행.
- **Wave 2**: Todo 2, 3 — 공유 순수 함수 신설 / jest 모킹 인프라. 서로 독립.
- **Wave 3**: Todo 4, 5 — UI 계산 리팩터 / 알림 코어 수정. 둘 다 Todo 2에 의존, 서로 독립.
- **Wave 4**: Todo 6, 7, 8 — reconcile 수정 / mutation 연동 검증 / 권한·채널·딥링크 검증. 서로 독립.
- **Wave 5 (게이트)**: Todo 9 — 통합 품질 게이트.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | - | 2,3,4,5,6,7,8,9 | - |
| 2 | 1 | 4,5 | 3 |
| 3 | 1 | 5,6,7,8 | 2 |
| 4 | 2 | 9 | 5 |
| 5 | 2,3 | 6,7,9 | 4 |
| 6 | 3,5 | 9 | 7,8 |
| 7 | 3,5 | 9 | 6,8 |
| 8 | 3 | 9 | 6,7 |
| 9 | 4,5,6,7,8 | F1-F4 | - |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [x] 1. feat/degassing-notification 브랜치를 main 위로 리베이스
  What to do / Must NOT do: `git checkout feat/degassing-notification && git rebase main` 실행. 브랜치는 main 대비 4 behind / 7 ahead이며, 브랜치의 `1aeae50`(docs: CLAUDE.md 간격 규칙)와 `60ac091`(fix(beans): 갤럭시 폴드7 UI 수정)은 main의 `1ed2ae1`/`726b49b`와 **내용이 동일한 중복 커밋**이다. 리베이스 중 git이 이를 자동 drop하면 그대로 두고, 충돌이 나면 **main 쪽 버전을 채택**한다. main에만 있는 `5b91ba2`/`676f3de`(Symphony 워크플로우, `.codex/skills/*`, `WORKFLOW.md`)는 리베이스로 자동 흡수되므로 **절대 삭제하지 않는다** — 리베이스 후 `.codex/skills/`와 `WORKFLOW.md`가 워킹트리에 존재해야 한다. 리베이스 전 `git stash -u`로 미추적 `.omo/`, `.serena/`, `ios/`를 건드리지 말 것(이들은 커밋 대상이 아니므로 그대로 두고, 리베이스는 추적 파일만 다룬다). 코드 로직은 이 todo에서 수정하지 않는다.
  Parallelization: Wave 1 | Blocked by: - | Blocks: 2,3,4,5,6,7,8,9
  References (executor has NO interview context - be exhaustive): 브랜치 커밋 `7674892`(mutation 연동), `638ba94`(채널+reconcile), `fcd9cda`(핸들러+딥링크), `b698f04`(코어+권한 모듈), `88f4160`(패키지+app.json). 브랜치 신규 파일: `lib/notifications/degassing.ts`, `lib/notifications/permissions.ts`, `hooks/useNotificationObserver.ts`. 브랜치 수정 파일: `app.json`, `app/_layout.tsx`, `app/(tabs)/beans.tsx`, `app/beans/add.tsx`, `app/beans/edit/[id].tsx`, `app/beans/[id].tsx`, `package.json`, `pnpm-lock.yaml`. 검증된 사실: 브랜치의 `app/(tabs)/beans.tsx` diff는 알림 관련 17줄뿐이며 NativeWind→StyleSheet 되돌림은 **없다**.
  Acceptance criteria (agent-executable): `git rev-list --left-right --count main...feat/degassing-notification` 이 `0	<N>` 형태(왼쪽=0, 즉 behind 0)일 것. `git log --oneline main..feat/degassing-notification` 에 알림 관련 커밋 5개가 남아 있을 것. `test -f WORKFLOW.md && test -d .codex/skills` 가 성공할 것. `git status --porcelain` 에 conflict 마커(`UU`/`AA`) 없음. `pnpm install --frozen-lockfile=false` 후 `node -e "require.resolve('expo-notifications')"` 성공.
  QA scenarios (name the exact tool + invocation): happy — `bash -c 'git rev-list --left-right --count main...feat/degassing-notification; git log --oneline main..feat/degassing-notification; ls WORKFLOW.md .codex/skills'` 출력이 위 기준 충족. failure — 리베이스 충돌 발생 시 `git rebase --abort` 후 충돌 파일 목록과 원인을 evidence에 기록하고 중단(강제 push/강제 해결 금지). Evidence `.omo/evidence/task-1-degassing-notification.txt`
  Commit: N | (리베이스 자체가 히스토리 재작성이므로 신규 커밋 없음)
  Recommended task executor category: `git` — 순수 git 히스토리 조작이며 코드 변경이 없다.

- [x] 2. 디게싱 완료 시각 공유 순수 함수 신설 + 단위 테스트
  What to do / Must NOT do: `utils/degassingUtils.ts`에 아래를 추가한다. (a) `parseLocalDate(dateString: string): Date | null` — `YYYY-MM-DD`를 **로컬 자정** Date로 파싱(`new Date('YYYY-MM-DD')`는 UTC 자정이라 금지). 정규식 `/^\d{4}-\d{2}-\d{2}$/` 불일치, 존재하지 않는 날짜(예: `2026-02-30`)는 null. (b) `export const DEGASSING_NOTIFICATION_HOUR = 9;` (c) `export function getDegassingCompletionAt(roastDate: string | null, degassingDays: number | null): Date | null` — `roastDate`가 null/파싱 실패, `degassingDays`가 null/비정수/`<= 0`/`> 365`이면 null(`> 365`는 `lib/validation/beanSchema.ts:23`이 이미 `.max(365)`로 막고 있어 정상 경로에서는 도달하지 않는 방어적 가드다 — 제거하지 말 것). 그 외에는 로컬 캘린더로 `roastDate + degassingDays`일의 **09:00:00.000 로컬** Date 반환. 날짜 덧셈은 `date.setDate(date.getDate() + n)` 같은 캘린더 연산을 쓰고 `days * 86400000` 밀리초 덧셈은 금지. 이 todo에서는 **함수 추가만** 하고 기존 `calculateDegassingStatus` 본문은 아직 바꾸지 않는다. 새 파일을 만들지 말고 기존 `utils/degassingUtils.ts`에 넣는다.
  Parallelization: Wave 2 | Blocked by: 1 | Blocks: 4,5
  References (executor has NO interview context - be exhaustive): `utils/degassingUtils.ts` 전체(현재 `getDaysFromRoast`가 `new Date(roastDate)` UTC 파싱 사용, 16-30행 `calculateDegassingStatus`). `lib/date.ts`의 `toLocalIsoDate`(로컬 기준 포맷 선례). `lib/validation/beanSchema.ts:23` — `degassing_days: z.number().int().min(0).max(365).nullable().optional()`. `types/bean.ts` — `roast_date: string | null`, `degassing_days: number | null`. `constants.ts`의 `TIMEZONE = 'Asia/Seoul'`(참고용, 하드코딩 타임존을 쓰지 말고 디바이스 로컬 사용).
  Acceptance criteria (agent-executable): `utils/__tests__/degassingUtils.test.ts` 신설. `pnpm test utils/__tests__/degassingUtils.test.ts` 통과. 테스트가 최소 다음을 단언: roastDate=null→null / degassingDays=null→null / degassingDays=0→null / degassingDays=-1→null / degassingDays=366→null / 잘못된 형식 `'2026/01/01'`→null / 존재하지 않는 날짜 `'2026-02-30'`→null / `('2026-01-01', 14)` → 반환 Date의 `getFullYear()===2026 && getMonth()===0 && getDate()===15 && getHours()===9 && getMinutes()===0`. `pnpm run type-check` 통과.
  QA scenarios (name the exact tool + invocation): happy — `pnpm test utils/__tests__/degassingUtils.test.ts` 전 케이스 통과. failure — `getDegassingCompletionAt('2026-01-01', 14)`가 UTC 파싱으로 회귀하면 `getDate()===15 && getHours()===9` 단언이 실패해야 함을 확인(일부러 `new Date(roastDate)`로 바꿔 실패를 재현한 뒤 되돌리고, 실패 출력을 evidence에 남길 것). Evidence `.omo/evidence/task-2-degassing-notification.txt`
  Commit: Y | feat(degassing): 완료 시각 계산 공유 순수 함수 추가
  Recommended task executor category: `quick` — 단일 파일에 순수 함수 추가 + 테스트 1개로 기계적이다.

- [x] 3. jest에 expo-notifications 모킹 추가
  What to do / Must NOT do: `jest.setup.js`에 `jest.mock('expo-notifications', ...)`를 추가한다. 모킹 대상: `scheduleNotificationAsync`(jest.fn, identifier를 resolve), `cancelScheduledNotificationAsync`(jest.fn), `getAllScheduledNotificationsAsync`(jest.fn, 기본 `[]` resolve), `getPermissionsAsync`/`requestPermissionsAsync`(jest.fn, `{ status: 'granted' }` resolve), `setNotificationChannelAsync`(jest.fn), `setNotificationHandler`(jest.fn), `addNotificationResponseReceivedListener`(jest.fn, `{ remove: jest.fn() }` 반환), `getLastNotificationResponse`(jest.fn, `null` 반환), `AndroidImportance`(`{ HIGH: 6 }`), `SchedulableTriggerInputTypes`(`{ DATE: 'date', TIME_INTERVAL: 'timeInterval' }`). **Expo Notifications 55.0.12의 실제 enum은 LOW=4, DEFAULT=5, HIGH=6**이며 mock은 이 동작을 보존해야 한다. `{ HIGH: 4 }`는 LOW를 HIGH로 위장해 Android heads-up 알림 회귀를 숨기므로 금지한다. 기존 모킹 블록들(expo-router, expo-image 등)의 스타일과 위치 관례를 따른다. 기존 모킹을 수정하거나 제거하지 않는다. `jest.config.js`의 `transformIgnorePatterns`는 이미 `expo(nent)?` 패턴을 포함하므로 **변경하지 않는다**.
  Parallelization: Wave 2 | Blocked by: 1 | Blocks: 5,6,7,8
  References (executor has NO interview context - be exhaustive): `jest.setup.js` 전체(현재 expo-router/expo-status-bar/@expo/vector-icons/expo-image/react-native-safe-area-context/AuthContext 모킹 존재, expo-notifications 모킹 **없음**). `jest.config.js` — preset `jest-expo`, `testEnvironment: 'jsdom'`, `setupFilesAfterEnv: ['<rootDir>/jest.setup.js']`, `moduleNameMapper` `^@/(.*)$`. 브랜치 코드가 사용하는 실제 API: `git show feat/degassing-notification:lib/notifications/degassing.ts`, `:lib/notifications/permissions.ts`, `:hooks/useNotificationObserver.ts`.
  Acceptance criteria (agent-executable): 임시 스모크 테스트로 `import * as Notifications from 'expo-notifications'` 후 `Notifications.scheduleNotificationAsync`가 `jest.fn`임을 단언하고 기본 반환 모양을 검증한다. 실제 모듈을 `jest.requireActual` 또는 설치된 build output으로 확인해 `AndroidImportance.HIGH===6`이고 mock도 6인지 단언한다. `pnpm test` 전체 실행 결과는 known baseline 27 failures / 89 pass와 동일하며 신규 실패 0건이어야 하고, 두 failing suite를 mock 전 setup과 현재 setup으로 A/B 실행했을 때 실패 이름·개수가 동일해야 한다. 확인 후 스모크 테스트는 삭제하거나 Todo 5의 테스트로 흡수한다.
  QA scenarios (name the exact tool + invocation): happy — mock surface 스모크 통과 + targeted notification smoke 통과 + 전체 suite에서 known baseline 외 신규 실패 0건. failure — mock을 우회한 실제 `getPermissionsAsync()`가 jsdom에서 undefined를 반환해 `ensureNotificationPermission()`이 TypeError로 실패하는지 확인하고, 실제 `AndroidImportance.HIGH===6`을 evidence에 기록. Evidence `.omo/evidence/task-3-degassing-notification.txt`
  Commit: Y | test(setup): expo-notifications jest 모킹 추가
  Recommended task executor category: `quick` — `jest.setup.js` 단일 파일에 기존 패턴을 따르는 모킹 블록 추가다.

- [x] 4. calculateDegassingStatus를 공유 함수 기반으로 리팩터 + UI 회귀 테스트
  What to do / Must NOT do: `utils/degassingUtils.ts`의 `calculateDegassingStatus`가 Todo 2의 `parseLocalDate`를 사용하도록 바꾼다. `getDaysFromRoast`의 `new Date(roastDate)`(UTC 자정) 파싱을 로컬 자정 파싱으로 교체하고, 경과일은 **로컬 자정 간 캘린더 일수 차이**로 계산한다. 공개 시그니처 `calculateDegassingStatus(roastDate, degassingDays): DegassingInfo | null`과 반환 필드(`status`, `remainingDays`, `daysFromRoast`)는 **변경 금지** — `BeanDetail.tsx:92`와 `BeanCard.tsx:38`이 그대로 사용한다. `degassingDays <= 0`일 때 null 반환하는 기존 가드도 유지한다(`BeanDetail`이 0일을 "즉시 음용 가능"으로 별도 분기 처리하므로). UI 컴포넌트의 JSX/스타일은 손대지 않는다. **Todo 2 독립 검증 후속 보강도 이 테스트 파일 수정에 함께 포함한다**: `utils/__tests__/degassingUtils.test.ts`의 불필요한 `null as any`를 제거해 타입 escape hatch를 없애고, `2026-12-31`·`2024-02-29` parseLocalDate 케이스에도 `getHours()===0`을 추가해 UTC+ 시간대에서도 UTC 파싱 회귀가 한 단언에만 의존하지 않게 한다. **의도된 동작 변화 1건을 인지할 것**: 현재 `new Date('2026-02-30')` 같은 불가능한 날짜는 Invalid Date가 되어 `daysFromRoast`가 `NaN`으로 전파되지만, `parseLocalDate`는 null을 반환하므로 `calculateDegassingStatus`도 null이 되고 `BeanDetail`은 "로스팅 날짜를 입력하면 디게싱 타임라인이 표시됩니다" 안내로 떨어진다. 이는 NaN 전파보다 나은 동작이므로 허용하되, 테스트로 명시하고 evidence에 기록한다.
  Parallelization: Wave 3 | Blocked by: 2 | Blocks: 9
  References (executor has NO interview context - be exhaustive): `utils/degassingUtils.ts:9-30`. 호출부 2곳: `components/beans/BeanDetail.tsx:3,92`(결과로 `디게싱 완료까지 N일 남았습니다` / `디게싱이 완료되었습니다` 렌더, 186-190행에서 `degassing_days===0`을 별도 분기), `components/beans/BeanCard.tsx:7,38`. 기존 테스트: `components/beans/__tests__/BeanDetail.test.tsx:29-58`(degassing_days=0 즉시음용 문구, roast_date 없이 degassing_days=14인 안내 문구만 단언 — **잔여일수 숫자를 단언하는 기존 테스트는 없음**), `components/beans/__tests__/BeanCard.test.tsx:21`(degassing_days=null). 따라서 파싱 변경이 기존 단언을 깨지 않아야 정상이다.
  Acceptance criteria (agent-executable): `pnpm test components/beans/__tests__/BeanDetail.test.tsx components/beans/__tests__/BeanCard.test.tsx` 통과(회귀 0건). `utils/__tests__/degassingUtils.test.ts`에 `calculateDegassingStatus` 케이스 추가: 로스팅 당일(`daysFromRoast===0`, `remainingDays===degassingDays`, `status==='degassing'`) / 완료 당일(`remainingDays===0`, `status==='completed'`) / 완료 이후(`status==='completed'`, `remainingDays===0`) / `degassingDays===0`→null / `roastDate===null`→null. 시각은 `jest.useFakeTimers({ now: ... })`로 고정. `pnpm run type-check` 통과.
  QA scenarios (name the exact tool + invocation): happy — `pnpm test utils/__tests__/degassingUtils.test.ts components/beans/__tests__/` 전체 통과. failure — KST 기준 `roast_date='2026-01-01'`, `degassing_days=1`, 현재 시각을 `2026-01-02T00:30+09:00`으로 고정했을 때 UTC 파싱이면 `daysFromRoast`가 하루 어긋나 단언이 실패함을 재현해 evidence에 기록. Evidence `.omo/evidence/task-4-degassing-notification.txt`
  Commit: Y | fix(degassing): 완료일 계산을 로컬 캘린더 기준으로 통일
  Recommended task executor category: `unspecified-high` — 날짜 경계 의미가 UI 2개 컴포넌트로 전파되므로 회귀 판단이 필요하다.

- [x] 5. 알림 코어 모듈 수정: 공유 함수 사용 + 문구 교체 + 가드 + 단위 테스트
  What to do / Must NOT do: `lib/notifications/degassing.ts`를 다음대로 수정한다. (a) 로컬 `getCompletionDate`의 dayjs 계산을 제거하고 Todo 2의 `getDegassingCompletionAt(bean.roast_date, bean.degassing_days)`를 사용한다 — 이로써 `degassing_days === 0`과 범위 밖 값이 자동으로 걸러진다. 발송 시각이 현재 이하면 null(예약 안 함) 규칙은 이 모듈에 유지한다. (b) 알림 content를 정확히 다음으로 교체: `title: '디게싱 완료'`, `body: `${bean.name.trim()} 디게싱 기간이 끝났습니다. 맛있게 원두를 즐기세요!``. 기존 문구(`☕ 디게싱 완료!` / `'{name}'의 디게싱이 완료되었어요. 최적의 맛을 즐겨보세요!`)는 삭제한다. (c) `data: { url: `/beans/${bean.id}` }`, `sound: 'default'`, identifier `degassing-{beanId}`는 **유지**한다. (d) `scheduleDegassing`/`cancelDegassing`/`rescheduleDegassing`/`reconcileDegassing`의 시그니처와 `Platform.OS === 'web'` 조기 반환은 유지한다. (e) 예약 실패 시 throw하지 않고 null 반환하는 기존 방어는 유지하되, `catch {}`로 완전히 삼키지 말고 개발 환경에서 원인을 알 수 있도록 `console.warn`으로 남긴다. dayjs import가 더 이상 필요 없으면 제거한다.
  Parallelization: Wave 3 | Blocked by: 2,3 | Blocks: 6,7,9
  References (executor has NO interview context - be exhaustive): `lib/notifications/degassing.ts` 전체(리베이스 후 워킹트리 기준. 원문은 `git show feat/degassing-notification:lib/notifications/degassing.ts`). 현재 구현: `IDENTIFIER_PREFIX = 'degassing-'`, `getDegassingIdentifier`, `getCompletionDate`(dayjs `.hour(9).minute(0).second(0)`), `scheduleDegassing`, `cancelDegassing`, `rescheduleDegassing`, `reconcileDegassing`. `lib/notifications/permissions.ts`의 `ensureNotificationPermission`. `types/bean.ts`의 `Bean`. Todo 2가 추가한 `utils/degassingUtils.ts`의 `getDegassingCompletionAt`, `DEGASSING_NOTIFICATION_HOUR`. 사용자 확정 문구: 제목 `디게싱 완료`, 본문 `{원두명} 디게싱 기간이 끝났습니다. 맛있게 원두를 즐기세요!`.
  Acceptance criteria (agent-executable): `lib/notifications/__tests__/degassing.test.ts` 신설, `pnpm test lib/notifications/__tests__/degassing.test.ts` 통과. 이 리포의 jest 환경은 `Platform.OS === 'ios'`가 기본값이므로(근거: `react-native/jest-preset.js:14-17`의 `haste.defaultPlatform: 'ios'`) **별도 Platform 강제 없이 예약 경로가 실행된다**. Platform을 억지로 모킹하지 말 것. 단언 항목: 미래 완료일 원두 → `Notifications.scheduleNotificationAsync`가 정확히 1회 호출되고 인자가 `identifier === 'degassing-<beanId>'`, `content.title === '디게싱 완료'`, `content.body === '<원두명> 디게싱 기간이 끝났습니다. 맛있게 원두를 즐기세요!'`, `trigger.date`의 `getHours()===9` / `roast_date + degassing_days` 날짜와 일치 / `roast_date===null` → 호출 0회 & null 반환 / `degassing_days===null` → 호출 0회 / `degassing_days===0` → 호출 0회 / 완료일이 과거 → 호출 0회 / 권한 거부(`getPermissionsAsync`,`requestPermissionsAsync`가 `denied`) → 호출 0회 & null 반환 / `rescheduleDegassing` → `cancelScheduledNotificationAsync`가 `degassing-<beanId>`로 호출된 뒤 `scheduleNotificationAsync` 호출. `pnpm run type-check` 통과.
  QA scenarios (name the exact tool + invocation): happy — `pnpm test lib/notifications/__tests__/degassing.test.ts` 전 케이스 통과. failure — vacuous 아님 증명 2건: (1) `scheduleDegassing` 내부의 `scheduleNotificationAsync` 호출을 일시 제거하면 예약 단언 테스트가 실패해야 함, (2) 본문 문자열을 한 글자 바꾸면 body 단언이 실패해야 함. 두 실패 출력을 evidence에 기록한 뒤 원상 복구. Evidence `.omo/evidence/task-5-degassing-notification.txt`
  Commit: Y | fix(notifications): 디게싱 알림 문구·완료일 계산·예약 가드 정정
  Recommended task executor category: `unspecified-high` — 모듈 수정 + 다중 엣지케이스 테스트 + vacuous 테스트 방지 판단이 얽혀 있다.

- [x] 6. reconcile 트리거 조건 수정 + 고아 알림 정리 테스트
  What to do / Must NOT do: 두 가지를 함께 처리한다. **(A) `lib/notifications/degassing.ts`의 과거-aware 활성 원두 필터를 유지·검증**: Todo 5가 로컬 `getCompletionDate`를 제거하면서 `getPendingCompletionAt(bean)`을 도입했고, 이 helper는 공유 `getDegassingCompletionAt` 결과가 null인지와 `completionAt <= new Date()` 과거/현재 경계를 모두 검사한다. `reconcileDegassing`의 `activeBeans`는 반드시 `getPendingCompletionAt(bean) !== null`을 유지해야 한다. **`getDegassingCompletionAt(...) !== null`로 직접 바꾸지 말 것** — 공유 함수 자체는 과거 guard가 없어 elapsed bean을 active로 잘못 분류하고 stale OS 예약을 고아 취소하지 못한다. 이 Todo에서 알림 모듈 로직은 테스트가 결함을 드러낼 때만 최소 수정한다. **(B) `app/(tabs)/beans.tsx`의 트리거 조건 수정**: `beans.length > 0`을 제거해 원두 목록이 빈 배열일 때도 고아 알림이 정리되도록 하되, **인증된 사용자의 원두 쿼리가 성공했을 때만** 실행한다. `hooks/useBeans.ts`의 `useUserBeans`는 미인증 disabled query와 실패한 query 모두 `isLoading === false`, `data === undefined`일 수 있고 화면은 `beans=[]` 기본값을 사용한다. 따라서 `!isLoading && !!user`만으로는 네트워크/Supabase 오류 때 `reconcileDegassing([])`가 실행돼 모든 정상 알림을 취소한다. 최종 조건은 `if (isSuccess && !!user && !hasReconciled.current)` 형태여야 하며 `useUserBeans()`에서 `isSuccess`를 함께 구조분해하고 effect deps에도 포함한다. 빈 배열 성공은 `isSuccess===true`라 고아 정리가 실행되고, pending/error/disabled 상태는 실행되지 않는다. `hasReconciled` ref 가드와 `setupNotificationChannel()` 호출은 유지한다. 화면의 렌더링/스타일/필터 로직은 손대지 않는다.
  Parallelization: Wave 4 | Blocked by: 3,5 | Blocks: 9
  References (executor has NO interview context - be exhaustive): `app/(tabs)/beans.tsx` — Todo 6 첫 커밋 기준 `useEffect(() => { setupNotificationChannel(); }, [])` 와 `useEffect(() => { if (!isLoading && !!user && !hasReconciled.current) { hasReconciled.current = true; reconcileDegassing(beans); } }, [isLoading, user, beans])`; 독립 검증에서 query-error mass cancellation이 재현됐으므로 `isSuccess`로 교체 대상이다. `lib/notifications/degassing.ts`의 `getPendingCompletionAt` 및 `reconcileDegassing`(예약목록에서 `degassing-` 접두사만 추출해 **미래 예약 대상 원두**와 diff, 누락 예약 + 고아 취소). `hooks/useBeans.ts:20-26`의 `useUserBeans` — `enabled: !!user?.id`; disabled/error/success 상태는 `isSuccess`로 구분. `hooks/useAuth.ts`의 `useAuth()`(`user` 제공). Todo 2의 `getDegassingCompletionAt`은 유효한 완료일 계산만 담당하고 과거 여부는 판단하지 않는다.
  Acceptance criteria (agent-executable): reconcile targeted tests 통과. 단언: `getAllScheduledNotificationsAsync`가 `[{ identifier: 'degassing-A' }, { identifier: 'degassing-B' }, { identifier: 'unrelated-timer' }]`를 반환하고 `reconcileDegassing([])` 호출 시 → `cancelScheduledNotificationAsync`가 `degassing-A`, `degassing-B`에 대해서만 호출되고 `unrelated-timer`에는 **호출되지 않음** / 미래 활성 원두 A만 있고 예약이 비었을 때 → A에 대해 `scheduleNotificationAsync` 1회 / 이미 예약된 A가 있고 원두도 A뿐일 때 → 예약·취소 모두 0회(멱등) / 유효하지만 완료 시각이 과거인 원두에 stale `degassing-{id}` 예약이 있으면 activeBeans에서 제외되어 **고아 취소됨** / null·0·invalid 원두도 제외. 화면 가드 검증: `user:null`이면 cached beans 유무와 무관하게 reconcile 0회 / authenticated + query success + 빈 목록이면 `reconcileDegassing([])` 1회 / authenticated + query error(`isSuccess:false`, `isError:true`)면 reconcile 0회 / loading·pending이면 0회 / 성공 후 rerender는 ref로 중복 0회. `pnpm run type-check` 통과.
  QA scenarios (name the exact tool + invocation): happy — `pnpm test lib/notifications/__tests__/degassing.test.ts` 통과. failure — `unrelated-timer` identifier가 취소 대상에 포함되도록 접두사 필터를 일부러 제거하면 테스트가 실패함을 확인해 evidence에 기록(무관한 알림 삭제 방지 회귀 가드). Evidence `.omo/evidence/task-6-degassing-notification.txt`
  Commit: Y | fix(notifications): 원두 목록이 비어도 고아 알림을 정리하도록 수정
  Recommended task executor category: `unspecified-high` — 알림 모듈 필터 교체와 화면의 인증 가드가 함께 얽혀 있고, 잘못하면 정상 알림을 전부 취소하는 회귀가 난다.

- [x] 7. 원두 생성/수정/삭제 알림 연동 회귀 테스트
  What to do / Must NOT do: 생성 시 예약, 수정 시 재예약, 삭제 시 취소가 실제로 호출되는지 검증하는 테스트를 추가한다. 화면 전체 렌더가 무거우면 `lib/notifications/degassing`을 모킹하고 각 화면의 mutation `onSuccess` 경로가 해당 함수를 호출하는지 검증하는 방식으로 좁혀도 된다. 연동 코드 자체(`app/beans/add.tsx`, `app/beans/edit/[id].tsx`, `app/beans/[id].tsx`)는 이미 리베이스로 들어와 있으므로 **로직을 새로 작성하지 말고**, 누락·오류가 발견될 때만 최소 수정한다. 특히 확인할 것: 삭제 화면은 `cancelDegassing(id)`를 `deleteMutation.mutate(id)` **이전에** 호출하고 있는데(낙관적 취소), 삭제가 실패하면 알림만 사라지는 문제가 있다 — `useDeleteBeanMutation`의 `onSuccess`로 옮겨 삭제 성공 후 취소하도록 바꾼다. Alert/네비게이션 동작은 변경 금지.
  Parallelization: Wave 4 | Blocked by: 3,5 | Blocks: 9
  References (executor has NO interview context - be exhaustive): **아래 3개 화면의 알림 연동 코드는 main에는 없고 리베이스로 들어온다. 착수 전 `git diff main@{u}..HEAD -- app/beans/` 또는 각 파일을 직접 읽어 실제 형태를 먼저 확인할 것.** `app/beans/add.tsx` — 브랜치 기준 `createBeanMutation`/`createBeanWithImagesMutation`의 `onSuccess: (bean) => { scheduleDegassing(bean); Alert.alert(...) }`. `hooks/useBeans.ts`의 `useCreateBeanMutation`은 `options?.onSuccess?.(data)`로 `Bean`을 넘기므로 호환된다. `app/beans/edit/[id].tsx` — 브랜치 기준 `useUpdateBeanMutation({ onSuccess: (bean) => { rescheduleDegassing(bean); router.replace(...) } })` 및 파일 상단 주석 "Do NOT pass onError to useUpdateBeanMutation"(이 규칙 준수). `rescheduleDegassing`은 async지만 `onSuccess`는 await되지 않는다 — 이는 **의도된 fire-and-forget**이다(알림은 best-effort 부수효과이며 저장 mutation을 막거나 롤백해선 안 된다). await를 추가하거나 에러를 사용자에게 노출하지 말 것. `app/beans/[id].tsx` — 브랜치 기준 삭제 확인 Alert 내부 `track('bean_deleted'); cancelDegassing(id); deleteMutation.mutate(id);` (낙관적 취소 → 이번에 수정 대상). `hooks/useBeans.ts:115-137`의 `useDeleteBeanMutation`은 내부 `onSuccess: (_, beanId) => { queryClient.removeQueries(...); ...; options?.onSuccess?.() }` 로 **외부 콜백에 beanId를 넘기지 않으므로** 화면에서 `useLocalSearchParams`의 `id`를 클로저로 캡처해 사용한다. 기존 테스트 스타일 참고: `components/beans/__tests__/BeanEditForm.test.tsx`, `__tests__/regression/beanManualEntry.test.ts`, `lib/api/__tests__/beans.deleteBean.test.ts`.
  Acceptance criteria (agent-executable): 신규/수정된 테스트 실행 `pnpm test` 통과. 단언: 생성 성공 → `scheduleDegassing`이 생성된 bean 객체로 1회 호출 / 수정 성공 → `rescheduleDegassing`이 갱신된 bean으로 1회 호출 / 삭제 **성공 후** → `cancelDegassing`이 해당 beanId로 1회 호출 / 삭제 **실패** 시 → `cancelDegassing` 호출 0회. **삭제 경로 테스트 방식**: `cancelDegassing`은 화면이 `useDeleteBeanMutation`에 넘기는 `options.onSuccess` 클로저 안에서 호출되므로 모듈 단위 테스트로는 검증할 수 없다. `app/beans/[id].tsx`를 `@testing-library/react-native`로 렌더하고 `@/lib/notifications/degassing`, `@/hooks/useBeans`, `expo-router`를 모킹한 뒤 삭제 흐름을 태우거나(성공/실패 각각), 그것이 과하면 화면에서 삭제 핸들러를 별도 함수로 추출해 그 함수를 직접 테스트한다. 어느 쪽이든 **성공/실패 두 경로가 모두 실제로 실행되는지** 확인할 것. `pnpm run type-check` 통과.
  QA scenarios (name the exact tool + invocation): happy — `pnpm test` 로 3개 경로 전부 통과. failure — 삭제 실패 시나리오(mutationFn reject)에서 `cancelDegassing`이 호출되면 테스트가 실패하도록 작성하고, 수정 전(낙관적 취소) 코드로는 이 테스트가 실패함을 확인해 evidence에 기록. Evidence `.omo/evidence/task-7-degassing-notification.txt`
  Commit: Y | fix(notifications): 원두 삭제 성공 후에만 알림을 취소하도록 변경
  Recommended task executor category: `unspecified-high` — 화면 3곳과 mutation 훅의 콜백 계약을 함께 다뤄야 한다.

- [x] 8. 권한·Android 채널·포그라운드 핸들러·딥링크 검증
  What to do / Must NOT do: 리베이스로 들어온 다음 요소가 올바른지 검증하고, 문제가 있을 때만 최소 수정한다. (a) `lib/notifications/permissions.ts`의 `setupNotificationChannel`이 Android에서 `degassing` 채널을 `AndroidImportance.HIGH`로 생성 — Android 13+에서 권한 프롬프트가 뜨려면 채널이 먼저 있어야 하므로 `app/(tabs)/beans.tsx` 마운트 시 호출되는 현재 위치를 유지한다. (b) `ensureNotificationPermission`이 이미 granted면 재요청하지 않고 true 반환. (c) `app/_layout.tsx`의 `Notifications.setNotificationHandler`가 모듈 스코프에서 호출되고 `shouldShowBanner: true`, `shouldShowList: true`, `shouldPlaySound: true` 반환. (d) `hooks/useNotificationObserver.ts`가 `getLastNotificationResponse()`(콜드 스타트)와 `addNotificationResponseReceivedListener`(런타임) 양쪽을 처리하고 언마운트 시 `subscription.remove()` 호출. `as Href` 타입 단언이 남아 있는데, 프로젝트 규칙상 `as` 남용을 피해야 하므로 데이터에서 꺼낸 url이 문자열임을 좁힌 뒤 `router.push(url as Href)` 대신 안전한 형태로 정리할 수 있으면 정리한다(불가하면 그대로 두고 이유를 evidence에 기록). 새 기능(알림 설정 화면 등)을 추가하지 않는다.
  Parallelization: Wave 4 | Blocked by: 3 | Blocks: 9
  References (executor has NO interview context - be exhaustive): `lib/notifications/permissions.ts` 전체. `app/_layout.tsx`(리베이스 후: `import * as Notifications from 'expo-notifications'`, 모듈 스코프 `setNotificationHandler`, `RootLayout` 내 `useNotificationObserver()`). `hooks/useNotificationObserver.ts` 전체. `app.json`(리베이스 후: `android.permissions`에 `SCHEDULE_EXACT_ALARM` 추가, plugins에 `["expo-notifications", { "color": "#8B4513", "defaultChannel": "degassing" }]`, version/runtimeVersion `1.0.12`). 공식 문서 근거: Android 13+는 채널이 1개 이상 있어야 권한 프롬프트가 표시됨, `RECEIVE_BOOT_COMPLETED`는 라이브러리가 자동 추가(재부팅 후 예약 복원), Android 12+ 정확 알람에는 `SCHEDULE_EXACT_ALARM` 필요, iOS 포그라운드 표시에는 `setNotificationHandler` 필수.
  Acceptance criteria (agent-executable): `lib/notifications/__tests__/permissions.test.ts` 및 `hooks/__tests__/useNotificationObserver.test.ts` 추가 후 targeted tests 통과. 단언: 기본 환경(`Platform.OS === 'ios'`)에서 `setupNotificationChannel()` → `setNotificationChannelAsync` 호출 0회 / Android 분기 검증은 Platform 전환이 필요한데 이 환경에서 **실제로 동작하는 전환 방식을 먼저 확인**한 뒤(`jest.doMock` + `jest.isolateModules` 등) `setNotificationChannelAsync('degassing', expect.objectContaining({ importance: 6 }))` 호출을 단언한다. 숫자 6은 실제 Expo enum의 `AndroidImportance.HIGH`이며, 가능하면 숫자 리터럴보다 `Notifications.AndroidImportance.HIGH`와의 동일성을 단언한다. 전환 방식이 이 환경에서 신뢰성 있게 동작하지 않으면 **Android 케이스를 억지로 모킹해 통과시키지 말고**, 해당 단언을 생략하고 이유를 evidence에 기록한다 / `getPermissionsAsync`가 granted면 `requestPermissionsAsync` 호출 0회 & true 반환 / denied면 `requestPermissionsAsync` 1회 호출 후 결과 반영 / `getLastNotificationResponse()`가 `data.url='/beans/x'`인 응답을 반환하면 `router.push('/beans/x')` 호출 / 언마운트 시 `subscription.remove()` 호출. **(리베이스 완료 후 상태 기준 — main에서 실행하면 당연히 실패한다)** `node -e "const a=require('./app.json'); const p=a.expo.plugins.find(x=>Array.isArray(x)&&x[0]==='expo-notifications'); if(!p) process.exit(1); if(!a.expo.android.permissions.includes('android.permission.SCHEDULE_EXACT_ALARM')) process.exit(1); console.log('ok')"` 가 `ok` 출력.
  QA scenarios (name the exact tool + invocation): happy — `pnpm test lib/notifications/__tests__/permissions.test.ts hooks/__tests__/useNotificationObserver.test.ts` 통과 + 위 app.json 검증 스크립트 통과. failure — `app.json`에서 `expo-notifications` 플러그인 항목을 임시로 제거하면 검증 스크립트가 exit 1이 되는지 확인하고 되돌린 뒤 evidence에 기록. Evidence `.omo/evidence/task-8-degassing-notification.txt`
  Commit: Y | test(notifications): 권한·채널·딥링크 동작 검증 추가
  Recommended task executor category: `unspecified-high` — 플랫폼 분기·권한 상태·라우터 부수효과를 걸친 검증이다.

- [x] 9. 통합 품질 게이트
  What to do / Must NOT do: 전체 검증을 실행하고 결과를 evidence로 남긴다. (a) `pnpm install` 후 `pnpm run type-check` (b) 변경 파일 대상 `pnpm exec eslint <changed-files>` + 전체 `pnpm run lint` baseline A/B (c) `pnpm test` 전체 baseline A/B + 알림 targeted suites (d) `expo-notifications`가 `package.json` dependencies에 있고 현재 Expo SDK와 호환되는 버전인지 `npx expo install --check` 로 확인 (e) 네이티브 모듈 추가로 인해 **기존 dev build로는 동작하지 않으며 dev build 재빌드가 필요**하다는 점을 최종 handoff에 명시. 실패하는 검사를 skip하거나 테스트를 삭제해 통과시키지 않는다. 리팩터·추가 기능 금지.
  Parallelization: Wave 5 | Blocked by: 4,5,6,7,8 | Blocks: F1,F2,F3,F4
  References (executor has NO interview context - be exhaustive): `package.json` scripts — `type-check: tsc -noEmit -incremental`, `lint: expo lint`, `test: jest`. `jest.config.js`. `app.json`. 기존 테스트 파일 목록: `app/beans/__tests__/add.normalizeInput.test.ts`, `app/beans/__tests__/edit.normalizeInput.test.ts`, `__tests__/regression/beanManualEntry.test.ts`, `__tests__/api/beans.createWithImages.test.ts`, `__tests__/types/beanImage.contract.test.ts`, `components/beans/__tests__/*.tsx`.
  Acceptance criteria (agent-executable): `pnpm run type-check` exit 0 / 변경 파일 대상 `pnpm exec eslint` exit 0 / 전체 `pnpm run lint`는 known baseline 1 error·14 warnings와 파일/rule/개수가 동일해 신규 진단 0건 / 알림 관련 targeted tests 전부 exit 0이며 skip된 신규 테스트 0건 / 전체 `pnpm test`는 known baseline 27 failures 외 **신규 실패 0건**을 parent/current setup A/B로 증명 / `npx expo install --check` 가 expo-notifications 버전 불일치를 보고하지 않음 / **OTA 안전성 검증**: `node -e "const a=require('./app.json'); if(a.expo.runtimeVersion !== '1.0.12'){console.error('runtimeVersion must be 1.0.12 (native module added; OTA to 1.0.11 clients would crash)');process.exit(1);} if(a.expo.version !== '1.0.12'){console.error('version must be 1.0.12');process.exit(1);} console.log('ok')"` 가 `ok` 출력 / `git status --porcelain` 에 `.omo/`, `.serena/`, `ios/` 외 미커밋 변경 없음.
  QA scenarios (name the exact tool + invocation): happy — `pnpm run type-check`, changed-file eslint, 모든 알림 targeted tests가 exit 0이고, 전체 lint/test A/B에서 known baseline 진단·failure set이 동일함을 evidence에 저장. failure — targeted/type-check/changed-file lint 중 하나라도 실패하거나 전체 lint/test에 신규 진단·실패가 생기면 로그 전문과 원인 분석을 evidence에 남기고 중단(우회 금지). Evidence `.omo/evidence/task-9-degassing-notification.txt`
  Commit: N | (검증 전용, 수정이 필요하면 해당 todo 규칙에 맞춰 별도 커밋)
  Recommended task executor category: `unspecified-low` — 정해진 명령 실행과 결과 수집이 전부다.

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [x] F1. 플랜 준수 감사
  What to do: 플랜의 Todo 1-9가 실제로 수행됐는지 코드/명령 증거로 대조한다. 각 Todo의 Acceptance criteria를 재실행하고, worker의 자기보고나 커밋 메시지가 아니라 **파일 내용과 명령 출력**으로만 판정한다.
  Acceptance criteria (agent-executable): `git log --oneline main..HEAD` 의 커밋이 플랜의 Commit 라인과 1:1 대응 / `rg -n "getDegassingCompletionAt" utils/degassingUtils.ts lib/notifications/degassing.ts` 가 정의 1곳 + 사용처 2곳 이상을 반환 / `rg -n "dayjs" lib/notifications/degassing.ts` 가 0건(공유 함수로 대체 완료) / `rg -n "디게싱 기간이 끝났습니다" lib/notifications/degassing.ts` 1건 / `rg -n "beans.length > 0" app/\(tabs\)/beans.tsx` 0건 / `rg -n "getCompletionDate" lib/notifications/degassing.ts` 0건 / 신규 테스트 파일 4개(`utils/__tests__/degassingUtils.test.ts`, `lib/notifications/__tests__/degassing.test.ts`, `lib/notifications/__tests__/permissions.test.ts`, `hooks/__tests__/useNotificationObserver.test.ts`) 존재. 불일치가 1건이라도 있으면 REJECT.
  Evidence `.omo/evidence/F1-degassing-notification.txt`
  Recommended task executor category: `unspecified-high` — 플랜 전체와 코드 상태를 대조하는 판정 작업이다.

- [x] F2. 코드 품질 리뷰
  What to do: 변경된 파일 전체를 읽고 프로젝트 규칙 위반을 찾는다. 검사 항목: `any` 타입 사용, `@ts-ignore`, 불필요한 `as` 단언, 프로덕션 코드에 남은 `console.log`, 빈 `catch {}` 로 에러를 완전히 삼키는 패턴, `useEffect` 남용, 중복된 날짜 계산 로직 잔존 여부.
  Acceptance criteria (agent-executable): `git diff main...HEAD --name-only` 로 변경 파일 목록을 뽑아 각 파일에 대해 `rg -n "\bany\b|@ts-ignore|console\.log" <file>` 실행 → 신규 위반 0건(기존 코드의 기존 위반은 제외하고 이번 diff에서 추가된 것만 판정) / `rg -n "catch\s*\{\s*\}" lib/notifications/` 0건 / 변경 파일 대상 `pnpm exec eslint` exit 0 / 전체 `pnpm run lint`는 known baseline 1 error·14 warnings 외 신규 진단 0건 / `pnpm run type-check` exit 0 / 날짜 계산이 `utils/degassingUtils.ts` 한 곳에만 존재(`rg -n "add\(.*'day'\)|setDate\(" --glob '!node_modules' lib/ utils/ components/ app/` 결과가 `utils/degassingUtils.ts` 외 파일을 포함하지 않을 것).
  Evidence `.omo/evidence/F2-degassing-notification.txt`
  Recommended task executor category: `unspecified-high` — 다중 파일 품질 판정이 필요하다.

- [x] F3. 동작 검증 (에이전트 실행)
  What to do: 사람 개입 없이 확인 가능한 범위에서 기능이 실제로 동작함을 증명한다. 물리 기기 알림 수신은 에이전트가 검증할 수 없으므로 **완료 조건에 넣지 않는다**. 대신 (a) 전체 테스트 스위트를 실행해 알림 예약 페이로드(identifier / title / body / trigger.date)가 계약대로 생성됨을 확인하고, (b) 테스트가 vacuous하지 않음을 뮤테이션으로 증명하며, (c) 앱 번들이 실제로 빌드 가능한지 확인한다.
  Acceptance criteria (agent-executable): 알림 관련 targeted tests 전부 exit 0, 전체 `pnpm test`는 known auth/validation 27 failures 외 신규 실패 0건, `it.skip`/`describe.skip`/`test.todo` 신규 0건(`rg -n "\.skip\(|\.todo\(" utils/__tests__ lib/notifications/__tests__ hooks/__tests__ components/beans/__tests__ app/beans/__tests__` 결과 0건) / **뮤테이션 검증**: `lib/notifications/degassing.ts`의 알림 body 문자열을 임시로 한 글자 바꾸면 `pnpm test lib/notifications/__tests__/degassing.test.ts` 가 실패하고, 되돌리면 다시 통과함을 두 번의 명령 출력으로 증명 / **번들 검증**: `npx expo export --platform ios --output-dir /tmp/degassing-export` 가 exit 0 (expo-notifications import가 번들 타임에 깨지지 않음을 확인). 번들 검증이 환경 제약으로 불가하면 그 사유와 시도한 명령·출력을 evidence에 기록하고 나머지 조건으로 판정한다.
  Evidence `.omo/evidence/F3-degassing-notification.txt`
  Recommended task executor category: `unspecified-high` — 실행·뮤테이션·번들 결과를 종합 판정한다.

- [x] F4. 범위 충실도
  What to do: Must NOT have 목록을 한 항목씩 코드로 반증한다. 요청하지 않은 기능이 추가되지 않았고, 금지 항목이 침범되지 않았음을 확인한다.
  Acceptance criteria (agent-executable): `rg -n "Expo Push|expoPushToken|getExpoPushTokenAsync|push_tokens|pg_cron" --glob '!node_modules' --glob '!.omo' .` 0건 / `git diff main...HEAD --name-only | rg "^supabase/"` 0건(스키마·Edge Function 무변경) / `git diff main...HEAD -- hooks/useNotification.ts` 0바이트(오디오 훅 무변경) / `rg -n "notification_tapped|notification_received" --glob '!node_modules' --glob '!.omo' --glob '!POSTHOG_EVENTS_KO.md' .` 가 `hooks/useAnalytics.ts` 타입 정의 외에는 0건(분석 이벤트 미추가) / `git diff main...HEAD --stat` 에 알림 설정 화면 등 신규 라우트 파일 없음 / `node -e "const a=require('./app.json'); if(a.expo.runtimeVersion!=='1.0.12'||a.expo.version!=='1.0.12')process.exit(1);console.log('ok')"` 가 `ok` / `git status --porcelain` 에 `.omo/`, `.serena/`, `ios/` 외 미커밋 변경 없음.
  Evidence `.omo/evidence/F4-degassing-notification.txt`
  Recommended task executor category: `unspecified-high` — 금지 항목 전체를 코드로 반증한다.

> **기기에서만 확인 가능한 잔여 항목 (완료 게이트 아님, 사용자용 안내)**: 실제 알림 수신·표시, iOS 권한 프롬프트 문구, Android 채널 노출, 알림 탭 시 딥링크 이동은 dev build를 새로 빌드해 기기에서 확인해야 한다. 이는 에이전트가 검증할 수 없으므로 위 F1-F4의 완료 조건에 포함하지 않으며, 실행 완료 보고 시 "빌드 후 기기 확인 필요" 항목으로 사용자에게 안내한다.

## Commit strategy
- 대상 브랜치: `feat/degassing-notification` (Todo 1에서 main 위로 리베이스된 상태). main에 직접 커밋 금지.
- Todo 단위로 1커밋. Conventional Commits + 한국어 요약(리포 기존 관례: `feat(notifications): ...`, `fix(beans): ...`, `test: ...`).
- Todo 1(리베이스)과 Todo 9(검증)는 신규 커밋 없음.
- `.omo/`, `.serena/`, `ios/` 미추적 경로는 절대 스테이징하지 않는다.
- `git push --force` 금지. 리베이스된 브랜치를 원격에 올려야 하면 `--force-with-lease`를 쓰되, 이는 사용자가 명시적으로 요청할 때만 수행한다.
- 최종 통합은 PR로 진행하며, PR 본문에 "네이티브 모듈(expo-notifications) 추가로 기존 dev build에서는 동작하지 않으며 dev build 재빌드가 필요함"을 명시한다.

## Success criteria
- `feat/degassing-notification`이 main 대비 behind 0이고, `.codex/skills/`·`WORKFLOW.md` 등 main의 파일이 보존돼 있다.
- 디게싱 완료 시각을 계산하는 코드 경로가 **하나**뿐이며, UI 표시와 알림 발송이 같은 날짜를 가리킨다(로컬 캘린더 기준).
- 알림 본문이 정확히 `{원두명} 디게싱 기간이 끝났습니다. 맛있게 원두를 즐기세요!`, 제목이 `디게싱 완료`이며 테스트가 이를 문자열 단위로 단언한다.
- 알림은 완료일 오전 9시(로컬)에 1회 예약되고, `roast_date` 없음 / `degassing_days` 없음 / `degassing_days = 0` / 완료일이 과거 / 권한 거부인 경우 예약되지 않는다.
- 원두 생성 시 예약, 수정 시 재예약, **삭제 성공 후** 취소가 각각 검증된다.
- reconcile이 원두 목록이 비어 있어도 `degassing-` 접두사 알림만 골라 고아를 정리하고, 무관한 알림은 건드리지 않는다.
- `pnpm run type-check`, changed-file eslint, 모든 알림 targeted tests가 exit 0이며 신규 테스트에 skip이 없다. 전체 lint는 known 1 error·14 warnings 외 신규 진단 0건, 전체 `pnpm test`는 known auth/validation 27 failures 외 신규 실패 0건임이 A/B로 증명된다.
- 서버사이드 푸시 관련 코드/스키마/설정이 저장소에 추가되지 않았다.
- `hooks/useNotification.ts`(오디오)와 타이머 관련 코드가 변경되지 않았다.
