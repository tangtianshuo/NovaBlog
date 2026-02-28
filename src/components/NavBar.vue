<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { Terminal, Code, LogOut, User, Globe, FileText, Menu, X } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const authStore = useAuthStore();
const { t, locale } = useI18n();
const mobileMenuOpen = ref(false);

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
  mobileMenuOpen.value = false;
};

const toggleLanguage = () => {
  locale.value = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN';
};

const closeMenu = () => {
  mobileMenuOpen.value = false;
};
</script>

<template>
  <nav class="sticky top-0 z-50 bg-cyber-dark bg-opacity-90 backdrop-blur-md border-b border-cyber-primary">
    <div class="container mx-auto px-4 py-3 flex justify-between items-center">
      <div class="flex items-center space-x-2 cursor-pointer" @click="router.push('/')">
        <Terminal class="text-cyber-neon w-6 h-6" />
        <span class="text-xl font-bold text-cyber-neon font-mono tracking-wider">NOVA_BLOG</span>
      </div>
      
      <!-- Mobile Menu Button -->
      <button 
        class="md:hidden p-2 text-gray-400 hover:text-cyber-neon transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        @click="mobileMenuOpen = !mobileMenuOpen"
        :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
      >
        <Menu v-if="!mobileMenuOpen" class="w-6 h-6" />
        <X v-else class="w-6 h-6" />
      </button>

      <!-- Desktop Navigation -->
      <div class="hidden md:flex items-center space-x-6">
        <router-link to="/" class="text-gray-400 hover:text-cyber-neon transition-colors font-mono text-sm">{{ t('nav.home') }}</router-link>
        <router-link to="/collections" class="text-gray-400 hover:text-cyber-neon transition-colors font-mono text-sm">{{ t('nav.collections') }}</router-link>
        <router-link to="/#projects" class="text-gray-400 hover:text-cyber-neon transition-colors font-mono text-sm">{{ t('nav.projects') }}</router-link>
        <router-link to="/#blog" class="text-gray-400 hover:text-cyber-neon transition-colors font-mono text-sm">{{ t('nav.docs') }}</router-link>

        <button @click="toggleLanguage" class="text-gray-400 hover:text-cyber-neon transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" :title="t('common.language')">
            <Globe class="w-5 h-5" />
        </button>
        
        <div v-if="authStore.isAuthenticated" class="flex items-center space-x-4 ml-4 pl-4 border-l border-cyber-primary">
          <router-link to="/editor" class="text-cyber-pink hover:text-white transition-colors flex items-center space-x-1">
            <Code class="w-4 h-4" />
            <span class="font-mono text-xs">{{ t('nav.editor') }}</span>
          </router-link>

          <router-link to="/resume" class="text-cyber-neon hover:text-white transition-colors flex items-center space-x-1">
            <FileText class="w-4 h-4" />
            <span class="font-mono text-xs">{{ t('nav.resume') }}</span>
          </router-link>
          
          <router-link to="/admin" class="text-cyber-green hover:text-white transition-colors flex items-center space-x-1">
            <User class="w-4 h-4" />
            <span class="font-mono text-xs">{{ t('nav.admin') }}</span>
          </router-link>
          
          <button @click="handleLogout" class="text-gray-400 hover:text-red-500 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" :title="t('nav.logout')">
            <LogOut class="w-4 h-4" />
          </button>
        </div>
        
        <div v-else class="ml-4 pl-4 border-l border-cyber-primary">
          <router-link to="/login" class="text-xs font-mono text-cyber-pink border border-cyber-pink px-3 py-1 rounded hover:bg-cyber-pink hover:text-black transition-all">
            {{ t('nav.access') }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- Mobile Menu Dropdown -->
    <div 
      v-show="mobileMenuOpen" 
      class="md:hidden bg-cyber-dark border-t border-cyber-primary"
    >
      <div class="container mx-auto px-4 py-4 flex flex-col space-y-4">
        <router-link to="/" class="text-gray-400 hover:text-cyber-neon transition-colors font-mono py-3 min-h-[44px] flex items-center" @click="closeMenu">{{ t('nav.home') }}</router-link>
        <router-link to="/#projects" class="text-gray-400 hover:text-cyber-neon transition-colors font-mono py-3 min-h-[44px] flex items-center" @click="closeMenu">{{ t('nav.projects') }}</router-link>
        <router-link to="/#blog" class="text-gray-400 hover:text-cyber-neon transition-colors font-mono py-3 min-h-[44px] flex items-center" @click="closeMenu">{{ t('nav.docs') }}</router-link>

        <button @click="toggleLanguage" class="text-gray-400 hover:text-cyber-neon transition-colors py-3 min-h-[44px] flex items-center justify-start" :title="t('common.language')">
            <Globe class="w-5 h-5 mr-3" />
            <span>{{ locale === 'zh-CN' ? 'English' : '中文' }}</span>
        </button>
        
        <div v-if="authStore.isAuthenticated" class="flex flex-col space-y-4 pt-4 border-t border-cyber-primary">
          <router-link to="/editor" class="text-cyber-pink hover:text-white transition-colors flex items-center py-3 min-h-[44px]" @click="closeMenu">
            <Code class="w-4 h-4 mr-3" />
            <span class="font-mono text-sm">{{ t('nav.editor') }}</span>
          </router-link>

          <router-link to="/resume" class="text-cyber-neon hover:text-white transition-colors flex items-center py-3 min-h-[44px]" @click="closeMenu">
            <FileText class="w-4 h-4 mr-3" />
            <span class="font-mono text-sm">{{ t('nav.resume') }}</span>
          </router-link>
          
          <router-link to="/admin" class="text-cyber-green hover:text-white transition-colors flex items-center py-3 min-h-[44px]" @click="closeMenu">
            <User class="w-4 h-4 mr-3" />
            <span class="font-mono text-sm">{{ t('nav.admin') }}</span>
          </router-link>
          
          <button @click="handleLogout" class="text-gray-400 hover:text-red-500 transition-colors flex items-center py-3 min-h-[44px]" :title="t('nav.logout')">
            <LogOut class="w-4 h-4 mr-3" />
            <span class="font-mono text-sm">{{ t('nav.logout') }}</span>
          </button>
        </div>
        
        <div v-else class="pt-4 border-t border-cyber-primary">
          <router-link to="/login" class="block text-center text-sm font-mono text-cyber-pink border border-cyber-pink px-4 py-3 rounded hover:bg-cyber-pink hover:text-black transition-all min-h-[44px] flex items-center justify-center" @click="closeMenu">
            {{ t('nav.access') }}
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>
