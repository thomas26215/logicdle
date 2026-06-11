import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from '@/router/index.js'
import App from './App.vue'
import '@/assets/styles.css'

const pinia = createPinia()
const app   = createApp(App)
app.use(pinia).use(router)

// Initialise le thème avant le premier rendu
import { useThemeStore } from '@/stores/themeStore.js'
useThemeStore(pinia) // appel unique qui applique le bon thème sur <html>

app.mount('#app')
