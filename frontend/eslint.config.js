import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

// The previous panel's config scoped every rule to **/*.{ts,tsx} while the
// codebase was entirely .jsx, so `npm run lint` passed having checked nothing
// (audit/code-quality.md). Whatever the globs say here, they must match the
// files that actually exist — `npm run lint` prints the count so a silent
// no-op cannot happen twice.
export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },

  // Application source: typed React.
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Unused args are fine when they document a signature, as long as they
      // are marked with a leading underscore.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Build config and the browser-driven checks run in Node, not the browser.
  {
    extends: [js.configs.recommended],
    files: ['vite.config.ts', 'checks/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.node, WebSocket: 'readonly' },
    },
  },
);
