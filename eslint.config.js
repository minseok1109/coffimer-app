// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // jest.setup.js is executed by Jest, where `jest` is a runtime global.
    // eslint-config-expo declares no Jest globals, and `no-undef` is only
    // disabled for TypeScript files, so this JS setup file needs the global
    // declared explicitly. Scoped to this one file so no other source picks
    // up test-only globals.
    files: ['jest.setup.js'],
    languageOptions: {
      globals: {
        jest: 'readonly',
      },
    },
  },
]);
