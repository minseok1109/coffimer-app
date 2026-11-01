# PROJECT KNOWLEDGE BASE

**Generated:** 2026-09-27
**Commit:** ec28a2b
**Branch:** main

## OVERVIEW

Coffimer — Expo/React Native app for coffee brewing recipes with a step timer, plus bean
inventory with degassing-completion notifications. Expo ~54 + expo-router ~6, React 19.1,
RN 0.81.5, TypeScript ~5.9 strict, TanStack Query v5, Supabase, react-hook-form + zod.

## STRUCTURE

```
coffimer-app/
├── app/              # expo-router routes, 22 screens — see app/AGENTS.md
├── components/       # 67 .tsx in 9 folders — see components/AGENTS.md (+ beans/AGENTS.md)
├── hooks/            # 25 hooks, query keys + mutations — see hooks/AGENTS.md
├── lib/              # api/, notifications/, validation/, supabaseClient — see lib/AGENTS.md
├── types/            # generated database.ts + domain types — see types/AGENTS.md
├── services/         # static-class layer parallel to lib/api (recipes only)
├── utils/            # degassingUtils.ts — the date math everything else trusts
├── src/tw/           # NativeWind helpers, ZERO importers (see UNIQUE STYLES)
├── supabase/         # 10 SQL migrations + 2 Deno edge functions, no deploy script
├── __tests__/        # root suite; more colocated __tests__/ next to their modules
└── app.json / eas.json / biome.jsonc / jest.config.js
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add/modify a screen or route | `app/` | provider order + route list in `app/AGENTS.md` |
| Data fetching, cache keys, mutations | `hooks/` | query-key factories documented there |
| Supabase reads/writes | `lib/api/*`, `services/*` | never call `supabaseClient` from a screen |
| Degassing date math | `utils/degassingUtils.ts` | `parseLocalDate`, `getDegassingCompletionAt` |
| Notification scheduling/copy | `lib/notifications/` | identifier `degassing-<beanId>`, Korean copy |
| Permission / Android channel | `lib/notifications/permissions.ts` | channel `degassing`; wired from `(tabs)/beans.tsx` + `debug.ts`, never `degassing.ts` |
| Deep link handling | `hooks/useNotificationObserver.ts` | `data.url` → `router.push`, `isBeanDeepLink` guard |
| DB column change | `types/` | 3-step schema-change path in `types/AGENTS.md` |
| Bean create/edit form | `components/beans/` | phase machine documented there |
| Form validation schemas | `lib/validation/` | zod, 17 importers |

## CODE MAP

Measured by import/reference count (most-imported first):

| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| Bean types | module | `types/bean.ts` | 34 | domain type hub |
| validation schemas | module | `lib/validation/` | 17 | zod schemas for every form |
| `supabaseClient` | module | `lib/supabaseClient.ts` | 15 | single Supabase client |
| api classes | module | `lib/api/` | 14 | static-class data access |
| Recipe types | module | `types/recipe.ts` | 11 | recipe/step shapes |
| notifications | module | `lib/notifications/` | 11 | schedule/cancel/reconcile |
| `AuthContext` | context | `contexts/AuthContext.tsx` | 7 | session + user |
| beans barrel | module | `components/beans/` | 7 | bean UI entry |

Export counts: `lib` 109, `components` 79, `hooks` 75, `types` 69, `utils` 35.
Largest files: `types/database.ts` 1342 (generated), `lib/recipes.ts` 720 (static data),
`app/recipes/[id].tsx` 710, `components/recipe/EditForm.tsx` 685,
`supabase/functions/extract-bean-info/index.ts` 621, `app/auth/signUp.tsx` 617.

## CONVENTIONS

- Layering is strict: screen → hook → (`lib/api/*` | `services/*`) → `lib/supabaseClient`.
- Path alias `@/* → ./*`; `tsconfig.json` is `strict` + `strictNullChecks`.
- `app.json` enables `typedRoutes` and `reactCompiler`; routes are type-checked.
- Timezone-sensitive tests pin time via `jest.useFakeTimers({ now: Date.UTC(...) })`.
- Jest: `jest-expo` preset, jsdom env, `@/` via `moduleNameMapper`, `.claude/` ignored.
- Biome via `biome.jsonc` = `{"extends": ["ultracite"]}`; run `npx ultracite format|lint`.
- All user-facing copy is Korean.

## ANTI-PATTERNS (THIS PROJECT)

- **Never `new Date(dateString)` for a roast/brew date.** Use `parseLocalDate` — UTC parsing
  shifts the degassing calendar boundary by a day in negative-offset zones.
- Never cancel a notification optimistically; `cancelDegassing` belongs in mutation `onSuccess`.
- Never reconcile notifications on query `!isLoading`; require `isSuccess` or an error state
  mass-cancels every scheduled notification.
- Keep notification *scheduling and cancelling* inside `lib/notifications/`. The module-scope
  `setNotificationHandler` in `app/_layout.tsx` and the response listener in
  `hooks/useNotificationObserver.ts` are sanctioned read sites, not violations.
- Avoid `useEffect`: 31 sites (`hooks/` 17, `components/` 9, `app/` 5, `contexts/` 0). Five are
  essential — auth subscription, notification response listener, `setInterval` tick, debounce
  timeout, audio init. The 12 in `useAppUpdates`/`useUpdateNotification` and `useRecipeTimer`'s
  reset are debt, not precedent.
- Do not add `className=`/NativeWind to product code (see below).
- Do not import `supabaseClient` from a screen or component.

## UNIQUE STYLES

NativeWind 5.0.0-preview is installed and fully wired (`metro.config.js` `withNativewind`,
`global.css`, `nativewind-env.d.ts`) but **unused**: `className=` appears in 0 files across
`app/`, `components/`, `src/`, `__tests__/`. Real UI is `StyleSheet.create` (19/22 screens,
45/67 components), and `src/tw/` (`cn()` + styled wrappers, 4 files) has zero importers.
Match the file you are editing — that means `StyleSheet.create`.

## COMMANDS

```bash
pnpm start                 # expo start (pnpm 10.14.0)
pnpm ios | android | web   # expo run:<platform>
pnpm type-check            # tsc -noEmit -incremental
pnpm test                  # jest (also test:watch, test:coverage)
pnpm lint                  # expo lint
npx ultracite format       # Biome 2.1.2 formatter
pnpm reset-project         # Expo template scaffold reset — rarely what you want
```

No build script: EAS owns builds via `eas.json`. App 1.0.13, bundle
`com.bangbangminseok.coffimerapp`, scheme `coffimerapp` + https `coffimer.app` intent filter.

## NOTES

- Degassing notifications fire at 09:00 device-local on `roast_date + degassing_days`
  (`DEGASSING_NOTIFICATION_HOUR = 9` in `utils/degassingUtils.ts`). A dropped schedule is only
  rebuilt by `reconcileDegassing`, which runs once per `(tabs)/beans.tsx` mount.
- Every `lib/notifications/` entry point no-ops silently on at least one guard (web, permission,
  elapsed time) and `scheduleDegassing` swallows throws with `console.warn`: absence of an error is
  never proof a notification was scheduled. Per-function guards are listed in `lib/AGENTS.md`.
- `lib/supabaseClient.ts` hardcodes the project URL and anon key in source (project
  `qyjbrwvlzxrtrypwncfl`); only PostHog keys come from `EXPO_PUBLIC_*`.
- Recipes have two parallel data layers — `lib/api/recipes.ts` and `services/recipeService.ts`
  — and `useRecipes.ts` uses both. Check which one a call site expects before editing.
- `pnpm type-check` **excludes** `supabase/functions/**/*`; the 2 Deno edge functions and 10
  SQL migrations there have no npm script and no type gate.
- `types/user.ts` declares `error: any` at 7 sites.
- 29 test files: root `__tests__/` plus colocated suites in `app/beans`, `components/beans`,
  `lib/api`, `lib/notifications`, `hooks`, `utils`. `jest.setup.js` mocks expo-router,
  expo-notifications, expo-image, expo-status-bar, vector-icons.
