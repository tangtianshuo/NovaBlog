import { ref, computed, watch } from 'vue'

type Theme = 'light' | 'dark'

const theme = ref<Theme>('light')
let initialized = false

const getPreferredTheme = (): Theme => {
	if (typeof window === 'undefined') return 'light'
	const saved = localStorage.getItem('theme') as Theme | null
	if (saved === 'light' || saved === 'dark') return saved
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const applyTheme = (t: Theme) => {
	if (typeof document === 'undefined') return
	document.documentElement.classList.remove('light', 'dark')
	document.documentElement.classList.add(t)
	if (typeof localStorage !== 'undefined') localStorage.setItem('theme', t)
}

export const initTheme = () => {
	if (initialized) return
	initialized = true
	const preferred = getPreferredTheme()
	theme.value = preferred
	applyTheme(preferred)
	watch(
		theme,
		(t) => {
			applyTheme(t)
		},
		{ flush: 'post' },
	)
}

export function useTheme() {
  initTheme()

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  return {
    theme,
    toggleTheme,
    isDark: computed(() => theme.value === 'dark'),
  }
}

export const setTheme = (t: Theme) => {
	initTheme()
	theme.value = t
}
