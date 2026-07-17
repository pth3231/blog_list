import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
    globalIgnores(['dist']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            globals: globals.browser,
            parserOptions: { projectService: true },
        },
        rules: {
            semi: ['error', 'never'],
            quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
            indent: ['error', 4, { SwitchCase: 1, VariableDeclarator: 1 }],
            'comma-dangle': ['error', 'never'],
            'object-curly-spacing': ['error', 'always'],
            'space-in-parens': ['error', 'never'],
            'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0, maxBOF: 0 }],
            'no-trailing-spaces': 'error',
            'no-multi-spaces': ['error', { ignoreEOLComments: true }],
            'prefer-const': 'error',
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-non-null-assertion': 'error',
            '@typescript-eslint/no-unnecessary-condition': 'warn',
            '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true }],
            'no-else-return': 'error',
            'max-params': ['warn', 4],
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
            '@typescript-eslint/naming-convention': [
                'error',
                { selector: 'interface', format: ['PascalCase'], custom: { regex: '^I[A-Z]', match: true } },
                { selector: 'class', format: ['PascalCase'] },
                { selector: 'typeAlias', format: ['PascalCase'] },
                { selector: 'enum', format: ['PascalCase'] },
                {
                    selector: 'function',
                    format: ['camelCase', 'PascalCase'],
                    leadingUnderscore: 'allow',
                    trailingUnderscore: 'allow'
                },
                {
                    selector: 'variable',
                    format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
                    leadingUnderscore: 'allow',
                    trailingUnderscore: 'allow'
                },
                {
                    selector: 'parameter',
                    format: ['camelCase'],
                    leadingUnderscore: 'allow',
                    trailingUnderscore: 'allow',
                    custom: { regex: '^_?$|^_?[a-z][a-zA-Z0-9]*$', match: true }
                }
            ]
        }
    },
    {
        files: ['**/*.ts'],
        rules: {
            '@typescript-eslint/explicit-function-return-type': 'error',
            '@typescript-eslint/no-unnecessary-condition': 'off',
        },
    },
    {
        files: ['src/context/**/*.{ts,tsx}'],
        rules: {
            'react-refresh/only-export-components': 'off',
        },
    },
    { ignores: ['eslint.config.js'] }
])
