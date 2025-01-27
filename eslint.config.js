/* eslint-disable import/no-extraneous-dependencies */
import { fileURLToPath } from 'node:url';
import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import pluginVitest from '@vitest/eslint-plugin'
import runrigStyle from '@runrig/eslint-config-runrig';

const settings = {
  'import/resolver': {
    typescript: true,
    vite: {
      viteConfig: {
        resolve: {
          alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
          },
        },
      },
    },
  },
};

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
    settings,
  },

  {
    name: 'app/files-to-ignore',
    ignores: [
      '**/dist/**',
      '**/dist-ssr/**',
      '**/coverage/**',
      './*.config.*',
    ],
  },

  ...runrigStyle,
  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    name: 'app/vue-script-setup-ts',
    files: ['**/*.vue'],
    settings,
    /**
     * VUE SFC WORKAROUNDS
     * These are all rules that I'm just turning off for now out of convenience
     * b/c there's some issue between Vue, TS, and ESLint when using SFCs that
     * have a <script setup lang="ts"> template, but I don't have time to fiddle
     * around with it right now.
     */
    rules: {
      // https://eslint.vuejs.org/user-guide/#the-variables-used-in-the-template-are-warned-by-no-unused-vars-rule
      '@typescript-eslint/no-unused-vars': 'off',
      // https://eslint.vuejs.org/rules/valid-v-for.html
      'vue/valid-v-for': ['off'],
      'import/no-unresolved': ['error', {
        ignore: [
          // For vite-svg-loader: https://github.com/jpkleemans/vite-svg-loader
          // This should be fixable with an alias plus rollup's find/replace,
          // but that hasn't worked so far.
          '\\.svg\\?component',
          // Issue w/ `"exports"` in package.json, related to but not fixed by:
          // https://github.com/unovue/radix-vue/issues/925
          'radix-vue/namespaced',
        ],
      }],
    },
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },
);
