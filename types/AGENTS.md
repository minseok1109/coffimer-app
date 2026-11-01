# types/ — domain types + generated database schema

8 files, 1,803 LOC, 69 exports. `@/types/bean` alone is imported 34 times — the most referenced
module in the codebase. Distinct domain: generated schema next to hand-written domain types (score 10).

## FILES
| File | LOC | Nature |
|------|-----|--------|
| `database.ts` | 1,342 | **Generated** from the Supabase schema (`__InternalSupabase.PostgrestVersion: '12.2.3'`). Exports `Database`, `Json`, and the `Tables`/`TablesInsert`/`TablesUpdate` helpers. |
| `bean.ts` | 129 | Hand-written: `Bean`, `BeanImage`, `RoastLevel`, `BeanType`, `BeanFieldConfidence`, `AIExtractionResult`, create/update inputs |
| `user.ts` | 149 | Auth/profile shapes and API result wrappers |
| `recipe.ts` / `recipe-form.ts` | 44 / 86 | `Recipe`, `RecipeWithSteps`; form-only shapes kept separate from DB shapes |
| `timer.ts` · `event.ts` · `roastery.ts` | 18 · 32 · 3 | Small domain unions and row aliases |

## THE TWO-SOURCE RULE
`database.ts` is the schema mirror; the other files are the app's view of it. They are **not** derived
from each other — `Bean` in `bean.ts` restates the columns that `BEAN_SELECT` in `lib/api/beans.ts`
requests. A schema change therefore needs three coordinated edits:

1. SQL migration in `supabase/migrations/`
2. regenerate `database.ts` (`supabase gen types typescript`; there is **no npm script** for it — run it manually against project `qyjbrwvlzxrtrypwncfl`)
3. hand-update `types/bean.ts` (or the sibling domain file) **and** `BEAN_SELECT`

Skipping step 3 compiles cleanly and fails at runtime with `undefined` fields.

## CONVENTIONS
- Unions over enums: `type RoastLevel = 'light' | 'medium_light' | ...`. Nothing here declares a TypeScript `enum`.
- Field names stay snake_case because they mirror Postgres columns end to end; do not camelise them on the way into a component.
- Nullable columns are written `T | null` rather than optional `?`, so `strictNullChecks` forces a decision at every call site.
- `types/database.ts` feeds `createClient<Database>` in `lib/supabaseClient.ts`; that generic is what types every query in `lib/api/`.

## ANTI-PATTERNS
- Never hand-edit `database.ts` — the next regeneration silently drops the change.
- `user.ts` still declares `error: any` at 7 sites: known debt, not a precedent. New types use `Error` or a discriminated result union.
- Don't add form-shape fields to a DB type; form-only state belongs in `recipe-form.ts` or a zod-inferred type from `lib/validation/`.
- Don't redeclare a row type locally in a component — extend the shared one here so the 34 existing importers stay consistent.
- Types shared with a Supabase Edge Function are not covered by `pnpm type-check`; verify those by hand against `supabase/functions/`.
