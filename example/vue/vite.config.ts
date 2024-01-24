import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Inspect from 'vite-plugin-inspect'
import {
  default as ViteCSSExportPlugin,
  kebabCaseToUpperCamelCase
} from '../../src'
import path from 'node:path'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    ViteCSSExportPlugin({
      shouldTransform(id) {
        const include = path.resolve(
          process.cwd(),
          'example/vue/assets/style/share-to-js'
        )
        return path.resolve(id).indexOf(include) > -1
      },
      additionalData: {
        nav: {
          navBgColor: '#fff'
        }
      },
      cssModule: {
        isGlobalCSSModule: false,
        enableExportMerge: true,
        sharedDataExportName: 'cssExportedData'
      },
      propertyNameTransformer: kebabCaseToUpperCamelCase
    }),
    Inspect()
  ]
})
