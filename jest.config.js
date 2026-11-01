// RN 0.88 exposes some entry points only via package "exports" (they live in src/),
// but the RN jest preset maps `react-native/*` to the package root and jest-expo 58
// only aliases a couple of them. Map every exact `./src/*` export explicitly.
const reactNativeExports = require('react-native/package.json').exports;
const reactNativeSrcExports = Object.fromEntries(
  Object.entries(reactNativeExports).flatMap(([subpath, entry]) => {
    const target = typeof entry === 'string' ? entry : entry.default;
    if (
      subpath.includes('*') ||
      typeof target !== 'string' ||
      !target.startsWith('./src/')
    ) {
      return [];
    }
    return [
      [
        `^react-native/${subpath.slice(2)}$`,
        `<rootDir>/node_modules/react-native/${target.slice(2)}`,
      ],
    ];
  }),
);

module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-hook-form|@hookform/.*|zod)'
  ],
  moduleNameMapper: {
    ...reactNativeSrcExports,
    '^@/(.*)$': '<rootDir>/$1',
  },
  modulePathIgnorePatterns: [
    '<rootDir>/.claude/',
  ],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/scripts/**',
    '!**/android/**',
    '!**/ios/**',
  ],
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
};
