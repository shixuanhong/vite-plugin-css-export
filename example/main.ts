import { createApp } from 'vue'
import App from './App.vue'

import variables from './assets/style/test.module.scss?export'

console.log(variables)
createApp(App).mount('#app')
