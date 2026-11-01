# lib/ — Supabase access, notifications, validation, static data

8 root modules + 7 subdirs, 3,080 LOC, 109 exports. The most-imported directory in the repo
(`@/lib/validation` 17, `@/lib/supabaseClient` 15, `@/lib/api` 14, `@/lib/notifications` 11). Score 15.

## SUBDIR MAP
| Path | Contents |
|------|----------|
| `api/` | `BeanAPI`, `RecipeAPI`, `FavoritesAPI` + `events.ts`, `roasteries.ts`, `beanAnalysis.ts`. **No barrel** — import the file. |
| `notifications/` | `degassing.ts` (104), `permissions.ts` (22), `debug.ts` (30), `content.ts` (10) + 4 test files |
| `validation/` | Zod: `beanFormSchema`, `recipeSchema`/`recipeEditSchema`, `signUpSchema`/`signInSchema` + `getDefault*Form()` factories |
| `timer/` | `formatters.ts` (324, 18 functions) + `types.ts`, barrelled via `export *` |
| `beans/` | `normalizeBeanInput.ts` — form → DB normalisation, unit-tested from `app/beans/__tests__` |
| `storage/` | `beanImage.ts` — Supabase Storage upload/delete by path |
| `calendar/` | `locale.ts` — Korean calendar locale, imported for **side effect** in `app/_layout.tsx` |
| root | `supabaseClient.ts`, `recipes.ts` (720 static recipes), `grinders.ts` (295), `recipeApi.ts`, `secureStorage.ts`, `errors.ts`, `date.ts`, `youtube.ts` |

## DATA ACCESS
- API classes are **static-only**: `export class BeanAPI { static async getUserBeans(...) }`. Never instantiate; never add instance state.
- `lib/api/beans.ts` defines `BEAN_SELECT`, the single select string (including nested `images:bean_images(...)`). Change it whenever a bean column is added, or the new field silently returns `undefined`.
- `services/recipeService.ts` and `lib/api/recipes.ts` are parallel recipe layers and `useRecipes.ts` imports both. Check which one a call site uses before adding a method; don't widen the split.
- `supabaseClient.ts` hardcodes the project URL and anon key in source (not `process.env`) and configures `AsyncStorage` persistence with `flowType: 'pkce'`. It is typed `createClient<Database>`.

## NOTIFICATIONS (`notifications/`, 166 LOC)
The identifier is deterministic — `` `degassing-${beanId}` `` off the `degassing-` prefix — which is what makes cancel, reschedule and reconcile addressable without storing ids anywhere.

Guards belong to individual functions; there is no shared wrapper, so read the one you are calling:

| Function | Its own guards / behaviour |
|----------|---------------------------|
| `scheduleDegassing(bean)` | `Platform.OS === 'web'` → `null`; no completion time or one already elapsed → `null`; `ensureNotificationPermission()` false → `null`; a `scheduleNotificationAsync` throw is `console.warn`ed and returns `null` so a best-effort notification never fails the bean save |
| `cancelDegassing(beanId)` | web → return. **No** permission or date check — cancelling an unknown identifier is safe — and a throw is warned and swallowed |
| `rescheduleDegassing(bean)` | none of its own: `cancelDegassing` then `scheduleDegassing`, inheriting both sets |
| `reconcileDegassing(beans)` | web → return; then diffs `getAllScheduledNotificationsAsync()` against beans that still have a pending completion, scheduling the missing and cancelling orphans. Permission and date checks happen per bean inside `scheduleDegassing` |
| `ensureNotificationPermission()` | web → `false`; returns early when status is already `granted`, otherwise requests |
| `setupNotificationChannel()` | Android only: channel `degassing`, `AndroidImportance.HIGH`, sound `default`. Callers are `app/(tabs)/beans.tsx` and `debug.ts` — `degassing.ts` never calls it |
| `debug.ts` | `__DEV__`-only, fixed identifier `debug-degassing`, 5-second `TIME_INTERVAL` trigger on the `degassing` channel |

- `content.ts` is the only home for copy and the deep link: title `디게싱 완료`, body from the trimmed bean name, `data.url = /beans/${id}`, `sound: 'default'`.
- Fire time comes from `utils/degassingUtils.getDegassingCompletionAt` (`DEGASSING_NOTIFICATION_HOUR = 9`); `degassing.ts` adds only the "already elapsed" rejection on top of it.

## ANTI-PATTERNS
- Don't throw a bare `Error` where a typed one exists — `errors.ts` restores the prototype chain (`Object.setPrototypeOf`) because Babel breaks `instanceof` in React Native; copy that pattern for new error classes.
- Keep *scheduling and cancelling* inside `notifications/`: no `scheduleNotificationAsync` / `cancelScheduledNotificationAsync` call belongs outside this directory. Reading the notification stream is a different concern and already has its two homes — the module-scope `setNotificationHandler` in `app/_layout.tsx` and the response listener in `hooks/useNotificationObserver.ts`.
- Don't put React imports in this directory; `lib/` stays framework-free apart from the `Platform`/notification modules.
