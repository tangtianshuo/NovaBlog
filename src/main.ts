import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { initTheme } from '@/composables/useTheme'

const app = createApp(App)

initTheme()

app.use(createPinia())

app.use(router)

app.use(i18n)

app.mount('#app')

if (import.meta.env.DEV) {
	const w = window as any
	w.__novaCore = {
		seed: async () => {
			const { seedTestData } = await import('@/dev/seed')
			return seedTestData()
		},
		clearSeed: async () => {
			const { clearSeedData } = await import('@/dev/seed')
			return clearSeedData()
		},
	}
}
