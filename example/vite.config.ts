import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Inspect from 'vite-plugin-inspect'
import ViteCSSExportPlugin from '../src'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    ViteCSSExportPlugin({
      cssModule: {
        enableExportMerge: true
      }
    }),
    Inspect()
  ]
})
