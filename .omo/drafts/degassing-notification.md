---
slug: degassing-notification
status: complete
intent: clear
review_required: true
review_outcome: approved (momus round 2, unconditional)
plan_path: .omo/plans/degassing-notification.md
plan_sha256: a66861639e394ba32844448dde692688c92af0589e98781f4f2a1021ba9f2048
review_round_id: degassing-notification-round-2
review_round_limit: 5
round_status: approved
pre_handoff_validation: live sha256 == approved round digest (a66861639e394ba32844448dde692688c92af0589e98781f4f2a1021ba9f2048) — MATCH
review_history:
  - round_id: degassing-notification-round-1
    session: st_01a00974
    plan_sha256: 808b7ee575b39b78da7c2e8c999482f080a7626eb1e00c67d67668d3f18fff21
    result: changes_requested
    blocking: "Final verification wave가 스크립트 기본 골격 그대로여서 실행 불가능. F3 'Real manual QA'가 'Zero human intervention - all verification is agent-executed'와 모순."
    fix: "F1-F4를 각각 agent-executable한 절차·수용 기준·evidence 경로·executor 카테고리로 재작성. F3를 '동작 검증 (에이전트 실행)'으로 교체하고 물리 기기 확인은 완료 게이트에서 제외해 사용자 안내 항목으로 분리."
pending-action: review .omo/plans/degassing-notification.md
metis:
  status: completed
  session: st_01a00967
  folded_in: GAP-1(Platform.OS 사실정정), GAP-2(불가능 날짜 동작변화 명시), GAP-4(삭제 경로 테스트 전략), GAP-5(리베이스 후 확인 리마인더), GAP-6(runtimeVersion OTA 안전성 강제), GAP-8(reconcile activeBeans 필터 캐스케이드), GAP-9(notification_tapped 명시적 제외), GAP-11(reconcile 인증 가드), GAP-12(setupFilesAfterEnv 오타), GAP-13(fire-and-forget 의도 명시)
review:
  momus:
    status: approved
    workspace_root: /Users/ms.bang/Documents/project/personal/coffimer-app
    runtime_home: null
    target: .omo/plans/degassing-notification.md
    round_id: degassing-notification-round-2
    plan_sha256: a66861639e394ba32844448dde692688c92af0589e98781f4f2a1021ba9f2048
    launch_id: launch-2
    session: st_01a00976
    result: "[OKAY] 모든 참조 파일과 호출 계약이 계획 설명과 일치하며, 브랜치 도입 파일도 Todo 1 이후 기준으로 명확히 지정됨. 각 Todo에 실행 가능한 도구·절차·기대 결과가 포함된 QA 시나리오가 있어 작업을 막을 모순이나 누락 없음."
approach: 기존 미머지 브랜치 feat/degassing-notification(expo-notifications 로컬 스케줄링)을 main 위로 리베이스하고, 검증에서 발견된 결함 4건(문구 불일치, UTC/로컬 파싱 이원화, degassing_days=0 스케줄, reconcile 트리거 위치)을 수정한 뒤 테스트를 붙여 머지 가능 상태로 완성한다. 서버사이드 푸시(Supabase Edge Function + Expo Push)는 채택하지 않는다.
---

# Draft: degassing-notification

## Components (topology ledger)
| id | outcome | status | evidence |
|---|---|---|---|
| C1 도메인 계산 단일화 | 디게싱 완료 시각 계산이 순수 함수 1개로 통일되어 UI와 알림이 같은 날짜를 가리킨다 | active | `utils/degassingUtils.ts:9-13`(UTC 파싱) vs `lib/notifications/degassing.ts:15-27`(dayjs 로컬 파싱) |
| C2 알림 코어 모듈 | schedule/cancel/reschedule/reconcile 4개 함수가 요청 문구·엣지케이스 계약대로 동작 | active | `feat/degassing-notification:lib/notifications/degassing.ts` |
| C3 권한·채널·핸들러 | Android 채널 + iOS 권한 + 포그라운드 핸들러 + 딥링크 옵저버 동작 | active | `feat/degassing-notification:lib/notifications/permissions.ts`, `hooks/useNotificationObserver.ts`, `app/_layout.tsx` diff |
| C4 mutation 연동 | 원두 생성/수정/삭제 시 알림이 각각 예약/재예약/취소된다 | active | `app/beans/add.tsx`, `app/beans/edit/[id].tsx`, `app/beans/[id].tsx` diff |
| C5 브랜치 통합 | 브랜치가 main 위로 리베이스되어 충돌 없이 머지 가능 | active | `git rev-list --left-right --count main...feat/degassing-notification` = 4 / 7 |

## Open assumptions (announced defaults)
| assumption | adopted default | rationale | reversible? |
|---|---|---|---|
| 알림 채널/색상 설정 | app.json의 `expo-notifications` 플러그인(`color: #8B4513`, `defaultChannel: degassing`) 유지 | 브랜치 기존 설정, 앱 브랜드 컬러와 일치 | yes |
| iOS 권한 요청 시점 | `scheduleDegassing` 내부(첫 원두 저장 시점) 유지 | 앱 시작 시 무맥락 요청보다 수락률 높음 | yes |
| 딥링크 | 알림 탭 시 `/beans/{id}`로 이동 유지 | 브랜치 기존 동작, 요청과 충돌 없음 | yes |
| 앱 버전 bump | 브랜치의 1.0.11→1.0.12 유지 | 네이티브 모듈 추가라 새 빌드 필수 | yes |
| 사운드 | `sound: 'default'` 유지 | 타이머용 alarm.mp3와 분리 | yes |

## Findings (cited - path:lines)

### F1. 요청 기능이 이미 미머지 브랜치에 구현되어 있음 (직접 검증)
- `git branch -a` → `feat/degassing-notification` 로컬 존재
- 알림 관련 커밋 5개: `88f4160`(패키지+app.json), `b698f04`(코어+권한 모듈), `fcd9cda`(핸들러+딥링크), `638ba94`(채널+reconcile), `7674892`(mutation 연동)
- 신규 파일: `lib/notifications/degassing.ts`(100줄), `lib/notifications/permissions.ts`(22줄), `hooks/useNotificationObserver.ts`(27줄)

### F2. 브랜치 구현 내용 (git show로 원문 확인)
- identifier: `degassing-{beanId}` 접두사 방식 → 멱등 예약/취소 가능
- 완료 시각: `dayjs(roast_date).add(degassing_days,'day').hour(9).minute(0).second(0)` — **오전 9시 로컬**
- `reconcileDegassing(beans)`: OS 예약목록과 원두목록을 diff해 누락 보충 + 고아 취소 (재설치 복구 경로)
- 연동 지점 3곳: `add.tsx` onSuccess → `scheduleDegassing`, `edit/[id].tsx` onSuccess → `rescheduleDegassing`, `[id].tsx` 삭제 → `cancelDegassing`

### F3. 결함 4건 (수정 필요)
1. **문구 불일치**: 브랜치 body = `'{name}'의 디게싱이 완료되었어요. 최적의 맛을 즐겨보세요!` / 요청 = `{원두명} 디게싱 기간이 끝났습니다. 맛있게 원두를 즐기세요!`
2. **날짜 파싱 이원화**: `utils/degassingUtils.ts:9` `new Date(roastDate)` → **UTC 자정** 해석 / `lib/notifications/degassing.ts` `dayjs(roast_date)` → **로컬 자정** 해석. KST(UTC+9)에서 UI 완료 표시일과 알림 발화일이 하루 어긋날 수 있음.
3. **`degassing_days === 0` 처리**: `getCompletionDate`가 `degassing_days === 0`을 걸러내지 않음. 오늘 로스팅 + 0일 설정이면 오늘 09:00이 미래일 때 알림이 예약됨. `BeanDetail.tsx:186-190`은 0일을 "즉시 음용 가능"으로 표시 → 모순.
4. **reconcile 트리거**: `app/(tabs)/beans.tsx`에서 `beans.length > 0`일 때만 실행. 원두를 전부 지운 경우 고아 알림이 정리되지 않음.

### F4. 브랜치 통합 상태 (직접 검증)
- `main...feat/degassing-notification` = **4 behind / 7 ahead**
- main에만 있는 커밋: `1ed2ae1`(CLAUDE.md Spacing), `726b49b`(폴드7 UI 수정), `5b91ba2`+`676f3de`(Symphony/Codex skills, WORKFLOW.md)
- 브랜치에 동일 내용 중복 커밋 2개(`1aeae50`, `60ac091`) 존재 → 리베이스 시 중복 감지/충돌 가능
- **아키텍트가 경고한 "beans.tsx NativeWind→StyleSheet 되돌림"은 diff 직접 확인 결과 사실 아님.** `app/(tabs)/beans.tsx` diff는 알림 import + 2개 useEffect 추가뿐(17줄 변경). diff --stat의 2006 deletions는 브랜치가 main의 Symphony 커밋을 아직 안 받았기 때문이며, 리베이스로 해소됨.
- worktree: `.omo/`, `.serena/`, `ios/` 미추적 — 범위 밖(dirty_worktree 리스크로 기록)

### F5. expo-notifications API 근거 (docs.expo.dev)
- 설치: `npx expo install expo-notifications`
- DATE 트리거: `trigger: { type: SchedulableTriggerInputTypes.DATE, date }` — 브랜치 코드와 일치
- `cancelScheduledNotificationAsync(identifier)`는 없는 identifier에도 안전하게 resolve
- Android: `RECEIVE_BOOT_COMPLETED`는 라이브러리가 자동 추가(재부팅 생존), Android 12+ 정확 알람은 `SCHEDULE_EXACT_ALARM` 필요 → 브랜치 app.json에 이미 추가됨
- Android 13+: 채널이 최소 1개 생성돼야 권한 프롬프트가 뜸 → `setupNotificationChannel()`이 담당
- iOS 포그라운드 표시에는 `setNotificationHandler` 필수 → `_layout.tsx`에 이미 추가됨
- 로컬 알림은 FCM/APNs 크리덴셜 불필요

### F6. 현재 코드 기준 사실
- `package.json`: expo ~54.0.33, expo-notifications **미설치**(main), dayjs 존재, expo-dev-client/EAS 사용 중
- `types/bean.ts`: `roast_date: string | null`, `degassing_days: number | null`
- `lib/validation/beanSchema.ts:23`: `degassing_days` 는 정수 0~365 또는 null
- `hooks/useNotification.ts`는 **오디오 전용**(expo-audio) — 알림과 무관, 확장 금지
- `hooks/useBeans.ts`: mutation onSuccess 콜백이 `bean`을 인자로 전달 → 연동 지점으로 충분
- 테스트 인프라: jest + @testing-library/react-native, `utils/`·`lib/` 순수 함수 테스트 다수 존재

## Decisions (with rationale)
1. **클라이언트 로컬 스케줄링(expo-notifications) 채택, 서버사이드 푸시 미채택.** 서버사이드의 유일한 이론적 우위(재설치 생존)는 토큰 재등록에 앱 실행이 필요하므로 reconcile과 동일 전제가 됨. DAU ~15, 원두 기능 미사용 상태에서 push_tokens 테이블·pg_cron·APNs/FCM 크리덴셜 비용은 정당화되지 않음.
2. **기존 브랜치를 리베이스해서 완성.** 동일 아키텍처를 새로 작성할 이유가 없고, 브랜치 구조(오디오 훅과 분리된 `lib/notifications/` 경계, identifier 멱등성, reconcile 자가치유)가 이미 옳음.
3. **완료일 계산은 순수 함수 1개로 통일**하고 UI(`degassingUtils`)와 알림 모듈이 공유. 로컬 캘린더 기준 파싱으로 통일.
4. **`hooks/useNotification.ts`(오디오)는 건드리지 않음.**

## Scope IN
- 브랜치 `feat/degassing-notification`을 main 위로 리베이스
- 완료일 계산 순수 함수 추출 + UI/알림 양쪽 공유 + 단위 테스트
- 알림 문구를 요청 문구로 교체
- `degassing_days === 0` / 과거 시각 / roast_date 없음 / 삭제 / 수정 엣지케이스 처리 + 테스트
- reconcile 트리거 조건 수정(빈 목록에서도 고아 정리)
- expo-notifications 설치·app.json 플러그인·Android 채널·iOS 권한·포그라운드 핸들러·딥링크
- 타입체크/린트/테스트 통과

## Scope OUT (Must NOT have)
- Supabase Edge Function, pg_cron, push_tokens 테이블, Expo Push API — 일절 도입 금지
- DB 스키마 변경(`degassing_notified_at` 등 컬럼 추가 금지)
- 알림 설정 화면(on/off 토글, 시간 커스터마이즈 UI) — 요청에 없음
- 디게싱 외 다른 알림(개봉일, 잔여량, 레시피 등)
- `hooks/useNotification.ts`(오디오) 수정
- 원두 탭/상세 화면의 스타일·레이아웃 변경
- EAS 빌드 실행·스토어 제출

## Open questions
1. 브랜치 재사용 vs 새로 구현 — 추천: 브랜치 리베이스 후 완성
2. 알림 발송 시각 — 추천: 완료일 오전 9시(로컬)
3. 알림 문구 최종 확정 — 추천: `{원두명} 디게싱 기간이 끝났습니다. 맛있게 원두를 즐기세요!`
4. 테스트 전략 — 추천: 순수 함수는 tests-after 단위 테스트, 에이전트 QA 항상 포함

## Approval gate
status: awaiting-approval
next: 승인 시 `.omo/plans/degassing-notification.md` 작성 → metis 갭 분석 → momus 고정밀 리뷰(세션마다 신규, 최대 5라운드)
