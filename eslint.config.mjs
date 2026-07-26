import js from '@eslint/js';
import next from 'eslint-config-next';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'out/**',
      'node_modules/**',
      'next-env.d.ts',
      'playwright-report/**',
      'test-results/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...next,

  {
    rules: {
      // Unused values are usually a leftover, but an underscore prefix is the
      // conventional way to say "deliberately ignored".
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // The app is mid-migration off inline styles (see sx.ts), so `any` is
      // still the thing we most want to prevent.
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  // Accessibility was a Phase 2 deliverable and it landed: every control is a
  // real control, so these rules are errors now rather than the 'warn' that
  // kept Phase 1's 151-violation backlog visible without failing CI.
  {
    files: ['src/**/*.tsx'],
    rules: {
      'jsx-a11y/no-static-element-interactions': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
    },
  },

  // Must stay last: turns off every stylistic rule that would fight Prettier.
  prettier,
);
