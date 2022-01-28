import { createApp } from 'vue'
import App from './App.vue'
import variables from './assets/style/variables.scss?export'

import variables2 from './assets/style/test.module.scss'

console.log(variables,variables2)
createApp(App).mount('#app')
