<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Globe, LogOut, Menu, Moon, Sun, User, X, Pencil, GitBranch, Database, Eraser } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'
import { syncDB } from '@/utils/syncDB'
import { useCyberToast } from '@/composables/useCyberToast'

const router = useRouter()
const authStore = useAuthStore()
const { t, locale } = useI18n()
const { toggleTheme, isDark } = useTheme()
const { success, error } = useCyberToast()

const mobileMenuOpen = ref(false)
const pendingCount = ref(0)
const seeding = ref(false)
const isDev = import.meta.env.DEV

const brandLogo = computed(() => (isDark.value ? '/logo-lite.png' : '/logo.png'))

const refreshPendingCount = async () => {
	pendingCount.value = await syncDB.getQueueCount()
}

const handleLogout = () => {
	authStore.logout()
	router.push('/login')
	mobileMenuOpen.value = false
}

const toggleLanguage = () => {
	locale.value = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
	localStorage.setItem('locale', locale.value)
	document.documentElement.lang = locale.value
}

const closeMenu = () => {
	mobileMenuOpen.value = false
}

const onQueueChanged = () => {
	refreshPendingCount()
}

const seedData = async () => {
	if (!isDev || seeding.value) return
	seeding.value = true
	try {
		const { seedTestData } = await import('@/dev/seed')
		const result = await seedTestData()
		success(t('dev.seedDone'), 5000, {
			detail: `${result.documents} docs · ${result.projects} projects · ${result.collections} collections`,
		})
		await refreshPendingCount()
	} catch (e) {
		error(t('dev.seedFailed'))
	} finally {
		seeding.value = false
	}
}

const clearSeed = async () => {
	if (!isDev || seeding.value) return
	seeding.value = true
	try {
		const { clearSeedData } = await import('@/dev/seed')
		const result = await clearSeedData()
		success(t('dev.clearDone'), 5000, {
			detail: `${result.removed} items`,
		})
		await refreshPendingCount()
	} catch (e) {
		error(t('dev.clearFailed'))
	} finally {
		seeding.value = false
	}
}

onMounted(() => {
	refreshPendingCount()
	window.addEventListener('syncdb:queue-changed', onQueueChanged)
})

onUnmounted(() => {
	window.removeEventListener('syncdb:queue-changed', onQueueChanged)
})
</script>

<template>
  <nav class="sticky top-0 z-50 border-b border-base-border bg-base-bg/80 backdrop-blur supports-[backdrop-filter]:bg-base-bg/60">
    <div class="container mx-auto px-4 py-3 flex justify-between items-center">
      <div class="flex items-center gap-3 cursor-pointer select-none" @click="router.push('/')">
        <img :src="brandLogo" alt="Nova Core" class="w-7 h-7 rounded" />
        <span class="text-base md:text-lg font-semibold tracking-tight text-base-text">Nova Core</span>
      </div>
      
      <!-- Mobile Menu Button -->
      <button 
        class="md:hidden p-2 text-base-muted hover:text-base-text transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        @click="mobileMenuOpen = !mobileMenuOpen"
        :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
      >
        <Menu v-if="!mobileMenuOpen" class="w-6 h-6" />
        <X v-else class="w-6 h-6" />
      </button>

      <!-- Desktop Navigation -->
      <div class="hidden md:flex items-center space-x-6">
        <router-link to="/" class="text-base-muted hover:text-base-text transition-colors text-sm">{{ t('nav.home') }}</router-link>
        <router-link to="/collections" class="text-base-muted hover:text-base-text transition-colors text-sm">{{ t('nav.collections') }}</router-link>
        <router-link to="/admin" class="text-base-muted hover:text-base-text transition-colors text-sm">{{ t('nav.admin') }}</router-link>

        <button @click="toggleLanguage" class="text-base-muted hover:text-base-text transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" :title="t('common.language')">
          <Globe class="w-5 h-5" />
        </button>

        <button @click="toggleTheme" class="text-base-muted hover:text-base-text transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" :title="isDark ? 'Light' : 'Dark'">
          <Sun v-if="isDark" class="w-5 h-5" />
          <Moon v-else class="w-5 h-5" />
        </button>

        <router-link to="/admin" class="relative text-base-muted hover:text-base-text transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Sync">
          <GitBranch class="w-5 h-5" />
          <span v-if="pendingCount > 0" class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-cyber-neon text-black text-[11px] leading-[18px] text-center font-semibold">
            {{ pendingCount }}
          </span>
        </router-link>

			<button
				v-if="isDev"
				@click="seedData"
				:disabled="seeding"
				class="text-base-muted hover:text-base-text transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
				:title="t('dev.seed')"
			>
				<Database class="w-5 h-5" :class="seeding ? 'animate-pulse' : ''" />
			</button>
			<button
				v-if="isDev"
				@click="clearSeed"
				:disabled="seeding"
				class="text-base-muted hover:text-base-text transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
				:title="t('dev.clearSeed')"
			>
				<Eraser class="w-5 h-5" :class="seeding ? 'animate-pulse' : ''" />
			</button>
        
        <div v-if="authStore.isAuthenticated" class="flex items-center space-x-4 ml-4 pl-4 border-l border-base-border">
          <router-link to="/editor" class="text-cyber-neon hover:text-base-text transition-colors flex items-center space-x-2">
            <Pencil class="w-4 h-4" />
            <span class="text-xs font-medium">{{ t('nav.editor') }}</span>
          </router-link>

          <router-link to="/resume" class="text-base-muted hover:text-base-text transition-colors flex items-center space-x-2">
            <User class="w-4 h-4" />
            <span class="text-xs font-medium">{{ t('nav.resume') }}</span>
          </router-link>
          
          <button @click="handleLogout" class="text-base-muted hover:text-red-500 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" :title="t('nav.logout')">
            <LogOut class="w-4 h-4" />
          </button>
        </div>
        
        <div v-else class="ml-4 pl-4 border-l border-base-border">
          <router-link to="/login" class="text-xs font-semibold text-base-text border border-base-border px-3 py-1.5 rounded-lg hover:bg-base-surface transition-all">
            {{ t('nav.access') }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- Mobile Menu Dropdown -->
    <div 
      v-show="mobileMenuOpen" 
      class="md:hidden bg-base-bg border-t border-base-border"
    >
      <div class="container mx-auto px-4 py-4 flex flex-col space-y-4">
        <router-link to="/" class="text-base-muted hover:text-base-text transition-colors py-3 min-h-[44px] flex items-center" @click="closeMenu">{{ t('nav.home') }}</router-link>
        <router-link to="/collections" class="text-base-muted hover:text-base-text transition-colors py-3 min-h-[44px] flex items-center" @click="closeMenu">{{ t('nav.collections') }}</router-link>
        <router-link to="/admin" class="text-base-muted hover:text-base-text transition-colors py-3 min-h-[44px] flex items-center" @click="closeMenu">{{ t('nav.admin') }}</router-link>

        <button @click="toggleLanguage" class="text-base-muted hover:text-base-text transition-colors py-3 min-h-[44px] flex items-center justify-start" :title="t('common.language')">
            <Globe class="w-5 h-5 mr-3" />
            <span>{{ locale === 'zh-CN' ? 'English' : '中文' }}</span>
        </button>

        <button @click="toggleTheme" class="text-base-muted hover:text-base-text transition-colors py-3 min-h-[44px] flex items-center justify-start">
          <Sun v-if="isDark" class="w-5 h-5 mr-3" />
          <Moon v-else class="w-5 h-5 mr-3" />
          <span>{{ isDark ? 'Light' : 'Dark' }}</span>
        </button>

			<button
				v-if="isDev"
				@click="seedData"
				:disabled="seeding"
				class="text-base-muted hover:text-base-text transition-colors py-3 min-h-[44px] flex items-center justify-start"
			>
				<Database class="w-5 h-5 mr-3" :class="seeding ? 'animate-pulse' : ''" />
				<span>{{ t('dev.seed') }}</span>
			</button>
			<button
				v-if="isDev"
				@click="clearSeed"
				:disabled="seeding"
				class="text-base-muted hover:text-base-text transition-colors py-3 min-h-[44px] flex items-center justify-start"
			>
				<Eraser class="w-5 h-5 mr-3" :class="seeding ? 'animate-pulse' : ''" />
				<span>{{ t('dev.clearSeed') }}</span>
			</button>
        
        <div v-if="authStore.isAuthenticated" class="flex flex-col space-y-4 pt-4 border-t border-base-border">
          <router-link to="/editor" class="text-cyber-neon hover:text-base-text transition-colors flex items-center py-3 min-h-[44px]" @click="closeMenu">
            <Pencil class="w-4 h-4 mr-3" />
            <span class="text-sm font-medium">{{ t('nav.editor') }}</span>
          </router-link>

          <router-link to="/resume" class="text-base-muted hover:text-base-text transition-colors flex items-center py-3 min-h-[44px]" @click="closeMenu">
            <User class="w-4 h-4 mr-3" />
            <span class="text-sm font-medium">{{ t('nav.resume') }}</span>
          </router-link>
          
          <router-link to="/admin" class="text-base-muted hover:text-base-text transition-colors flex items-center py-3 min-h-[44px]" @click="closeMenu">
            <User class="w-4 h-4 mr-3" />
            <span class="text-sm font-medium">{{ t('nav.admin') }}</span>
          </router-link>
          
          <button @click="handleLogout" class="text-base-muted hover:text-red-500 transition-colors flex items-center py-3 min-h-[44px]" :title="t('nav.logout')">
            <LogOut class="w-4 h-4 mr-3" />
            <span class="text-sm font-medium">{{ t('nav.logout') }}</span>
          </button>
        </div>
        
        <div v-else class="pt-4 border-t border-base-border">
          <router-link to="/login" class="block text-center text-sm font-semibold text-base-text border border-base-border px-4 py-3 rounded-lg hover:bg-base-surface transition-all min-h-[44px] flex items-center justify-center" @click="closeMenu">
            {{ t('nav.access') }}
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>
