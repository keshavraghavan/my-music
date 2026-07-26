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
      // The app is mid-migration off inline styles (see sx.ts). Until Phase 2
      // lands CSS Modules, `any` is still the thing we most want to prevent.
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  // Accessibility is a Phase 2 deliverable: today every control is a
  // <div onClick>, so these rules would report hundreds of pre-existing
  // violations and drown out new ones. They are set to 'warn' so the debt is
  // visible in `npm run lint` output without failing CI, and get promoted to
  // 'error' as Phase 2 converts each screen.
  {
    files: ['src/**/*.tsx'],
    rules: {
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
    },
  },

  // Must stay last: turns off every stylistic rule that would fight Prettier.
  prettier,
);
