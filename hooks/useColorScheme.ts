import { useColorScheme as _useColorScheme } from 'react-native';

export type AppColorScheme = 'light' | 'dark';

// RN 0.83+ returns 'unspecified' (instead of null) when no preference is set.
export function useColorScheme(): AppColorScheme {
  return _useColorScheme() === 'dark' ? 'dark' : 'light';
}
