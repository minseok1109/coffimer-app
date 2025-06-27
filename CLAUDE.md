# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Coffimer App is a React Native coffee brewing timer application built with Expo and TypeScript. The app provides step-by-step brewing instructions for various coffee recipes with built-in timer functionality and notifications.

## Key Technologies

- **React Native** (v0.79.3) with **Expo SDK** (v53.0.11) and TypeScript
- **Expo Router** for file-based navigation
- **Supabase** for backend integration
- **expo-notifications** for timer alerts and push notifications
- **expo-audio** for timer sound playback

## Development Commands

```bash
# Start development server
pnpm start
expo start

# Platform-specific development  
pnpm run android    # Android emulator
pnpm run ios       # iOS simulator
pnpm run web       # Web browser

# Code quality
pnpm run lint      # ESLint linting

# Reset project
pnpm run reset-project  # Clean project slate
```

## Architecture Overview

### File-Based Routing (Expo Router)
- `app/` directory contains all routes
- `app/(tabs)/` - Tab navigation layout with home, recipes, profile
- `app/recipes/[id].tsx` - Dynamic recipe detail pages
- `app/recipes/timer/[id].tsx` - Recipe timer functionality
- `_layout.tsx` files define nested navigation structures

### Component Structure
- `components/timer/` - All timer-related UI components with barrel exports
- `components/RecipeCard.tsx` - Recipe list item component
- Components use TypeScript interfaces and follow functional patterns

### Custom Hooks Architecture
- `hooks/useRecipeTimer.ts` - Core timer logic with play/pause/reset functionality
- `hooks/timer/useStepInfo.ts` - Current/next step information calculation
- `hooks/timer/useWaterCalculation.ts` - Water amount tracking logic
- `hooks/useNotification.ts` - Notification scheduling and management
- `hooks/useColorScheme.ts` - Dark/light mode detection

### Data Layer
- `lib/recipes.ts` - Recipe data structure with 15+ coffee brewing recipes
- `lib/supabaseClient.ts` - Supabase configuration and client setup
- `lib/timer/` - Timer utilities, formatters, and TypeScript interfaces
- `constants/` - App constants including colors and timer settings

## Key Data Interfaces

### Recipe Structure
```typescript
interface Recipe {
  id: string;
  name: string;
  steps: RecipeStep[];
  totalTime: number;
  totalWater: number;
  youtubeUrl?: string;
}

interface RecipeStep {
  id: string;
  action: string;
  duration: number;
  waterAmount?: number;
  temperature?: number;
}
```

### Timer State Management
Timer logic is centralized in `useRecipeTimer` hook with states:
- `isRunning`, `isPaused`, `isCompleted`
- `currentStepIndex`, `elapsedTime`, `stepElapsedTime`
- `totalWaterUsed`, `currentStepWater`

## Important File Locations

- Recipe timer page: `app/recipes/timer/[id].tsx`
- Main timer logic: `hooks/useRecipeTimer.ts`
- Recipe data: `lib/recipes.ts`
- Timer components: `components/timer/`
- Navigation setup: `app/(tabs)/_layout.tsx`
- Root layout: `app/_layout.tsx`

## Configuration Notes

- TypeScript path aliases configured: `@/*` maps to root directory
- Expo new architecture enabled
- ESLint uses Expo preset configuration
- Bundle ID: `com.bangbangminseok.coffimerapp`
- Supports iOS, Android, and Web platforms

## Development Patterns

### Component Organization
- Use barrel exports (`index.ts`) for clean imports
- Separate UI components from business logic hooks  
- Follow camelCase naming for component files
- Group related components in subdirectories

### Timer Implementation
- Notifications scheduled at step transitions using `expo-notifications`
- Audio alerts played via `expo-audio` with `/public/alarm.mp3`
- Step progression managed through `currentStepIndex` state
- Water calculations aggregate across completed steps

### Navigation Patterns
- Use `router.push()` for programmatic navigation
- Dynamic routes with `[id]` syntax for recipe detail/timer pages
- Tab navigation configured in `(tabs)/_layout.tsx`
- Stack navigation for modal-style pages

## Testing & Debugging

- No testing framework currently configured
- Use Expo DevTools and Metro bundler logs for debugging
- React Native debugger recommended for state inspection
- Use `expo start --clear` to clear Metro cache if needed