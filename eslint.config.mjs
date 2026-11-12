import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/** @type {import('eslint').Linter.Config[]} */
export default [
    { ignores: ["node_modules", "dist"] },
    { files: ["**/*.{js,mjs,cjs,ts}"] },
    { languageOptions: { globals: { ...globals.browser, ...globals.node } } },

    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    eslintPluginPrettierRecommended,

    {
        rules: {
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    caughtErrors: "none",
                    ignoreRestSiblings: true,
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-this-alias": "off",
            "no-undef": "off",
            "no-unused-expressions": "error",
            "prefer-const": "error",
            "no-console": "off",
        },
    },
];
