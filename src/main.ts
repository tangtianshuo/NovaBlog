import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';

// Create Vue application instance
const app = createApp(App)

// Use Pinia
app.use(createPinia())

// Use Router
app.use(router)

// Use i18n
app.use(i18n)

// Use Ant Design Vue
app.use(Antd)

// Mount application
app.mount('#app')