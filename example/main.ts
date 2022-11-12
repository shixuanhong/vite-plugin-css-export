import { createApp } from 'vue'
import App from './App.vue'

import cssResult from './assets/style/example.css?export'
import scssResult from './assets/style/example.scss?export&shouldTransformString'
import sassResult from './assets/style/example.sass?export'
import lessResult from './assets/style/example.less?export'
import stylResult from './assets/style/example.styl?export'
import stylusResult from './assets/style/example.stylus?export'
import cssModuleResult from './assets/style/example.module.scss?export'
import transformerResult from './assets/style/example-transformer.scss?export'

console.log('.css', cssResult)
console.log('.scss', scssResult)
console.log('.sass', sassResult)
console.log('.less', lessResult)
console.log('.styl', stylResult)
console.log('.stylus', stylusResult)
console.log('css module', cssModuleResult)
console.log('transformer', transformerResult)

createApp(App).mount('#app')
