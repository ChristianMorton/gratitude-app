import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // The e2e run's distDir (see next.config.ts). Not covered by '.next/**', and
    // linting 88 files of generated build output is 669 errors of pure noise.
    '.next-e2e/**',
    // Generated third-party worker copied by postinstall, not authored source.
    'public/maplibre/**',
    // Prisma's generated client.
    'src/generated/**',
    // Tooling, not application code.
    '.claude/**',
    '.impeccable/**',
  ]),
  {
    rules: {
      // `const { secret: _secret, ...rest } = row` is how we drop fields that must
      // not be serialised. The underscore marks it deliberate.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
])

export default eslintConfig
