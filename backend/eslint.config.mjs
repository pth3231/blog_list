// @ts-check
import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
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
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
            '@typescript-eslint/naming-convention': [
                'error',
                { selector: 'interface', format: ['PascalCase'], custom: { regex: '^I[A-Z]', match: true } },
                { selector: 'class', format: ['PascalCase'] },
                { selector: 'typeAlias', format: ['PascalCase'] },
                { selector: 'enum', format: ['PascalCase'] },
                { selector: 'function', format: ['camelCase'] },
                { selector: 'variable', format: ['camelCase', 'UPPER_CASE'] },
                {
                    selector: 'parameter',
                    format: ['camelCase'],
                    leadingUnderscore: 'allow',
                    trailingUnderscore: 'allow',
                    custom: { regex: '^_?$|^_?[a-z][a-zA-Z0-9]*$', match: true }
                }
            ]
        }
    }
)
