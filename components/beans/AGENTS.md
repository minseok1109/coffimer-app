# components/beans/ — bean capture & form flow

13 components + `form/` (9 sections) + 4 colocated tests, 2,990 LOC.
Earned its file: 28 files, 25 exports, a three-phase flow no other folder has (score 10).

## THE PHASE MACHINE
`BeanForm.tsx` owns `type Phase = 'capture' | 'analyzing' | 'form'` in plain `useState` and renders exactly one phase component:

| Phase | Component | Does |
|-------|-----------|------|
| capture | `BeanCapturePhase` (246) | Camera/gallery pick, up to 5 images, primary-image choice |
| analyzing | `BeanAnalyzingPhase` (65) | Waits on the `extract-bean-info` Edge Function |
| form | `BeanFormPhase` (143) | Renders `form/` sections, pre-filled with AI results + confidence |

Four hooks feed it: `useBeanMultiImageFlow` (image list, `MAX_IMAGE_COUNT = 5`), `useBeanAnalysis` (AI call + `preEncode`), `useBeanForm` (react-hook-form + zod), `useImageCapture` (permissions + pickers).

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Add a bean field | `lib/validation/beanSchema.ts` → `form/<Section>.tsx` → `form/index.ts` → `types/bean.ts` → `lib/api/beans.ts` `BEAN_SELECT` |
| Shared form styling | `form/styles.ts` (278 LOC, exported as `formStyles`) |
| Section-to-section contract | `form/types.ts` → `BeanFormContext` |
| Degassing badge / chip | `BeanDetail.tsx` (402) and `BeanCard.tsx` (230), both through `calculateDegassingStatus` |
| Remaining-weight bar | `RemainingBar.tsx` (139) — pure `remaining`/`total`/`size` props, colour thresholds at 70/30/0% |
| Roast level UI | `RoastLevelSelector` (picker) vs `RoastLevelSpectrum` (read-only display) |
| Edit (no capture phase) | `BeanEditForm.tsx` (173) — a separate component, not a `BeanForm` mode |

## CONVENTIONS
- `index.ts` exports 10 components; `form/index.ts` exports 7 sections plus `BeanFormContext` and `formStyles`. Add every new file to the matching barrel.
- AI-filled fields carry a confidence number and render `ConfidenceBadge`; never silently overwrite a user-edited field with a later analysis result.
- Cup notes are a `string[]` rendered as `CupNoteTag` chips — add and remove go through `useBeanForm`'s `addCupNote` / `removeCupNote`, not local state.
- `RoastDateSelector` emits a `YYYY-MM-DD` string and that string is the wire format all the way to the DB column; the degassing display reads it back through `utils/degassingUtils`.
- Tests sit in `__tests__/` beside the components (`BeanCard`, `BeanDetail`, `BeanDetail.gallery`, `BeanEditForm`) and render through `@testing-library/react-native`.

## ANTI-PATTERNS
- Don't compute degassing state in a component; `calculateDegassingStatus` and `getDegassingCompletionAt` in `utils/degassingUtils` are the single source and are the only versions the tests pin.
- Don't schedule or cancel notifications here — the bean screens under `app/beans/` own that from their mutation callbacks.
- Don't let a phase component navigate or mutate; `BeanForm` calls back up to the screen through `onSubmit` / `onCancel`.
- Don't duplicate `formStyles` locally — the sections deliberately share one style object so the form stays visually uniform.
