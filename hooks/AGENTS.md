# hooks/ — data, auth, timer, update state

25 root hooks + `timer/` (2 hooks, barrelled) + `__tests__/`, 3,256 LOC, 75 exports.
Earned its file: file count, symbol density, and the highest inbound reference count in the repo (score 13).

## IMPORT & NAMING
- **No root barrel.** Import the exact file: `import { useUserBeans } from '@/hooks/useBeans'`. Only `hooks/timer` has an `index.ts` (`useStepInfo`, `useWaterCalculation`).
- One domain per file; a file exports the whole hook family for that domain (`useBeans.ts` → `useUserBeans`, `useBeanDetail`, `useCreateBeanMutation`, `useCreateBeanWithImagesMutation`, `useUpdateBeanMutation`, `useDeleteBeanMutation`).

## QUERY KEY FACTORIES
`beanKeys` (in `useBeans.ts`) and `recipeKeys` (in `useRecipes.ts`) are exported `as const` hierarchies — `all` → `lists()` → `userBeans(userId)` / `list(filters)` → `details()` → `detail(id)`. Build every key from the factory so invalidation by prefix keeps working; never inline a literal `['beans', ...]` array.

## MUTATION CONTRACT
Mutation hooks take `options?: { onSuccess?, onError? }`, do the cache work first, then call the caller's callback:
`invalidateQueries(beanKeys.userBeans(userId))` → `setQueryData(beanKeys.detail(id), data)` → `options?.onSuccess?.(data)`.
That ordering is what makes a screen's post-success side effect (notification, navigation) safe.
Errors are thrown from `mutationFn` and surfaced by the caller — `app/beans/edit/[id].tsx` deliberately passes no `onError` so `useBeanForm`'s `submitErrorMessage` stays that form's single error path. Check a screen's existing path before adding a second one.

## WHERE TO LOOK
| Task | File | LOC |
|------|------|-----|
| Session, login, PostHog identify | `useAuth.ts` (wrapped by `contexts/AuthContext`) | 342 |
| OTA update check/download/apply | `useAppUpdates.ts`, `useUpdateNotification.ts` | 324 / 393 |
| Brew timer state machine | `useRecipeTimer.ts` + `timer/useStepInfo`, `timer/useWaterCalculation` | 156 |
| Notification taps / alarm sound | `useNotificationObserver.ts` (routes `data.url` through `isBeanDeepLink`), `useNotification.ts` (expo-audio alarm) | 44 / 71 |
| Bean form, AI analysis, images | `useBeanForm`, `useBeanAnalysis`, `useBeanMultiImageFlow`, `useImageCapture` | 102 / 127 / 36 / 83 |
| Analytics events | `useAnalytics.ts` → `track()` | 222 |

## EFFECTS ARE NOT EXEMPT HERE
The repo-wide "avoid `useEffect`" rule applies to this directory too; 17 of the repo's 31 call sites just happen to live here. Only synchronization with something outside React earns one:

| Essential effect | What it synchronizes |
|------------------|----------------------|
| `useAuth.ts` (1) | `secureStorage` auto-login bootstrap + `supabase.auth.onAuthStateChange` subscription |
| `useNotificationObserver.ts` (1) | `addNotificationResponseReceivedListener` plus the last-response replay; returns `subscription.remove()` |
| `useRecipeTimer.ts` (1 of 2) | the `setInterval` tick |
| `useDebounce.ts` (1) | the trailing `setTimeout` |
| `useNotification.ts` (1) | `AudioModule` mode + player volume init |

`useAppUpdates.ts` (5) and `useUpdateNotification.ts` (6) copy `expo-updates` values into local state through effect chains, and `useRecipeTimer`'s second effect resets state when `recipe.id` changes. Those 12 are debt: derive during render, or remount by key, instead of copying the pattern into a new hook.

## ANTI-PATTERNS
- `enabled: !!user?.id` guards every user-scoped query — that is the auth isolation boundary; a new user-scoped query without it leaks another account's rows into the cache.
- Don't add a barrel `index.ts` here — 25 hooks behind one entry point pulls every dependency into any consumer's bundle graph.
- Don't mutate the cache without invalidating the list key too; detail-only updates leave a stale list.
- Don't duplicate a query key shape in a test; import the factory.
