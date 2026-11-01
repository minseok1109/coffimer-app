# components/ — shared UI

67 `.tsx` files: 9 feature folders plus 5 root-level components.
Earned its file: 79 exports, 9 subdirs, imported by nearly every screen (score 15).

## STRUCTURE
| Folder | Files | Barrel | Role |
|--------|-------|--------|------|
| `beans/` | 13 + `form/` | yes | Bean capture → AI analysis → form flow (has its own AGENTS.md) |
| `create-recipe/` | 11 + `grind-size/` | yes | 4-step recipe wizard (`Step1`–`Step4`, `StepIndicator`) + bottom sheets |
| `timer/` | 11 | yes | Brew timer UI: `TimerDisplay`, `ProgressBars` (282), `StepCard` (262), water grids |
| `recipe/` | 2 | **no** | `EditForm.tsx` (685) + `StepEditor.tsx` (486) — import by full path |
| `filter/` | 4 | yes | Chips + `FilterBottomSheet` for the recipe list |
| `auth/` | 2 | yes | `ErrorMessage`, `ReferralSourceBottomSheet` (306) |
| `roasteries/` `events/` `calendar/` | 2 / 1 / 1 | yes | Cards + `CustomDayComponent` for react-native-calendars |
| root files | 5 | — | `RecipeCard` (382), `UpdateModal` (416), `UpdateSnackbar` (334), `UpdateManager` (108), `NotificationDebugToolbar` (87) |

## WHERE TO LOOK
| Task | Location |
|------|----------|
| OTA update UI | `UpdateManager.tsx` mounts in `app/_layout.tsx`; modal and snackbar are its children |
| Recipe list item | `RecipeCard.tsx` (root level, not `recipe/`) |
| Recipe *editing* form | `recipe/EditForm.tsx` — the largest UI file in the repo |
| Bottom sheets | `@gorhom/bottom-sheet`, one per domain: `create-recipe/`, `filter/`, `auth/` |
| Dev-only notification triggers | `NotificationDebugToolbar.tsx` → `lib/notifications/debug.ts` |

## CONVENTIONS
- Eight folders carry an `index.ts` — `auth`, `beans`, `calendar`, `create-recipe`, `events`, `filter`, `roasteries`, `timer` — and are imported through it (`@/components/beans`). `recipe/` has none, so `@/components/recipe/EditForm` is the correct import there.
- Props contracts are `interface <Component>Props` declared directly above the component; components are named exports while screens are default exports.
- Visual constants come from `constants/Colors.ts`; the brand brown `#8B4513` still recurs inline in older files.
- Components hold presentation state only (open/close, selected index). Server state arrives as props from a screen's query hook, so a component stays renderable in a test without a QueryClient.

## ANTI-PATTERNS
- Don't add a component without adding it to its folder's barrel — a half-updated `index.ts` silently breaks the `@/components/<folder>` import contract.
- Don't call a mutation hook inside a presentational component; the screen owns the mutation and passes handlers down.
- Don't grow `recipe/EditForm.tsx` or the `create-recipe/` steps further — split into sections the way `beans/form/` already does.
- Don't reach into another folder's internals; cross-folder reuse means promoting the component to the root level (as `RecipeCard` is).
