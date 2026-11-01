# app/ — Expo Router routes

22 route files; the file path IS the URL, and every screen is a default-exported function.
Earned its file: 24 files, 6 subdirs, own routing config (score 12).

## STRUCTURE
```
app/
├── _layout.tsx        # providers + module-scope foreground notification handler
├── index.tsx          # auth gate → Redirect to /(tabs) or /auth/login
├── (tabs)/            # 6 tabs (index, recipes, beans, events, roasteries, profile)
├── auth/              # login.tsx (461), signUp.tsx (617)
├── beans/             # [id], add, edit/[id], __tests__/ (normalizeInput)
├── recipes/           # [id] (710), edit/[id], timer/[id]
├── events/[id].tsx · roasteries/[id].tsx · create-recipe.tsx · info.tsx · licenses.tsx
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add a provider | `_layout.tsx` | Order: GestureHandlerRootView → PostHogProvider → AuthProvider → QueryClientProvider → Stack |
| Foreground notification behaviour | `_layout.tsx` | `Notifications.setNotificationHandler` sits at module scope, above the component |
| Notification tap → navigation | `_layout.tsx` calls `useNotificationObserver()` | the hook owns the listener and the `isBeanDeepLink` guard |
| Tab title / icon | `(tabs)/_layout.tsx` | Ionicons + lucide `Bean`; `tabBarButton` kills the Android ripple |
| Brew timer screen | `recipes/timer/[id].tsx` | thin wrapper over `useRecipeTimer` |
| Degassing notification wiring | `beans/add.tsx`, `beans/edit/[id].tsx`, `beans/[id].tsx`, `(tabs)/beans.tsx` | see CONVENTIONS — `add` has two mutation paths |

## CONVENTIONS
- A screen is wiring only: query/mutation hook + `Alert` + `router.back()` / `router.replace()`. Anything reusable belongs in `hooks/` or `lib/`.
- Notification side effects live in mutation callbacks, never in render. `beans/add.tsx` runs two paths — `useCreateBeanMutation` and `useCreateBeanWithImagesMutation` — and each calls `scheduleDegassing(bean)` in its own `onSuccess`; `beans/edit/[id].tsx` calls `rescheduleDegassing(bean)` before `router.back()`; `beans/[id].tsx` calls `cancelDegassing(id)` inside the delete mutation's `onSuccess`.
- `(tabs)/beans.tsx` owns this directory's only notification effects: `setupNotificationChannel()` on mount, and one `reconcileDegassing(beans)` per mount gated on `isSuccess && !!user` behind a `hasReconciled` ref — the guard exists because `data = []` cannot otherwise be told apart from an errored or signed-out query.
- `beans/edit/[id].tsx` passes no `onError` on purpose: `useBeanForm`'s `submitErrorMessage` is that form's single error path.
- One `QueryClient` is created in `RootLayout` via `useState(() => new QueryClient())` and provided to the whole tree; screens reach it through `useQueryClient()`.
- `__DEV__`-only UI is gated inline: `{__DEV__ && <NotificationDebugToolbar />}`.
- `_layout.tsx` imports `../global.css` and `@/lib/calendar/locale` for their side effects only — keep them at the top of the import list.

## ANTI-PATTERNS
- Don't bypass typed routes (`experiments.typedRoutes: true` in app.json) with untyped string concatenation in `router.push`.
- Don't register a route file without a default export — Expo Router renders a blank screen instead of failing loudly.
- Don't add a second `Notifications.setNotificationHandler`; it is global and last-write-wins.
- Don't move a screen's post-mutation side effect down into the mutation hook — the hook is shared across screens, the reaction is not.
