import tseslint from 'typescript-eslint';
import pluginUnusedImports from 'eslint-plugin-unused-imports';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      'frontend/.next/**',
      'frontend/public/**',
      'frontend/coverage/**',
      'frontend/scripts/**',
      'frontend/test-results/**',
      'frontend/e2e/**',
    ],
  },
  {
    plugins: {
      'unused-imports': pluginUnusedImports,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { args: 'all', argsIgnorePattern: '^_', vars: 'all', varsIgnorePattern: '^_' },
      ],
    },
  },
);
