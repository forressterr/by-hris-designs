import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['dist', 'node_modules', 'public', '.claude', '.next'] },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      'react-hooks': reactHooks,
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Project doesn't use PropTypes — types come from TypeScript.
      'react/prop-types': 'off',
      // React-Compiler rules (react-hooks v7) flag intentional, working
      // patterns here; opted out (no behaviour change).
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      // TypeScript handles undefined-name resolution; the base rule
      // false-positives on type-only references.
      'no-undef': 'off',
      // Pragmatic `any` is used at a few dynamic boundaries (polymorphic
      // motion tags, the loosely-typed caseStudy data). Tighten in a later pass.
      '@typescript-eslint/no-explicit-any': 'off',
      // Use the TS-aware unused-vars rule (understands type-only usage).
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  prettier,
];
