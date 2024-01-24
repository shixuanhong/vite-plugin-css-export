import { createApp } from 'vue'
import App from './App.vue'

import cssResult from './assets/style/example.css?export&inline'
import scssResult from './assets/style/example.scss?export&inline'
import sassResult from './assets/style/example.sass?export&inline'
import lessResult from './assets/style/example.less?export&inline'
import stylResult from './assets/style/example.styl?export&inline'
import stylusResult from './assets/style/example.stylus?export&inline'
import { default as cssModuleResult, cssExportedData } from './assets/style/example.module.scss?export'
import transformerResult from './assets/style/example-transformer.scss?export&inline'
import shouldTransformResult from "./assets/style/share-to-js/index.scss?inline";

console.log('.css', cssResult)
console.log('.scss', scssResult)
console.log('.sass', sassResult)
console.log('.less', lessResult)
console.log('.styl', stylResult)
console.log('.stylus', stylusResult)
console.log('css module', cssModuleResult, cssExportedData)
console.log('transformer', transformerResult)
console.log('shouldTransformResult', shouldTransformResult)

createApp(App).mount('#app')