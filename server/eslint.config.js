import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  // scripts-legacy/ e db-legacy-supabase-reference/ são material arquivado
  // do Supabase (set/2025), não código novo — não vale aplicar lint nele.
  { ignores: ['dist', 'scripts-legacy', 'db-legacy-supabase-reference'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
);
