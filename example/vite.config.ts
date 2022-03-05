import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Inspect from 'vite-plugin-inspect'
import { default as ViteCSSExportPlugin, kebabCaseToUpperCamelCase } from '../src'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    ViteCSSExportPlugin({
      additionalData: {
        nav: {
          navBgColor: '#fff'
        }
      },
      cssModule: {
        isGlobalCSSModule: false,
        enableExportMerge: false,
        sharedDataExportName: 'cssExportedData',
      },
      propertyNameTransformer: kebabCaseToUpperCamelCase
    }),
    Inspect()
  ]
})
