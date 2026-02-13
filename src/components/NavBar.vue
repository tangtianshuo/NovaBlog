<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { Terminal, Code, LogOut, User, Globe } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const authStore = useAuthStore();
const { t, locale } = useI18n();

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

const toggleLanguage = () => {
  locale.value = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN';
};
</script>

<template>
  <nav class="sticky top-0 z-50 bg-cyber-dark bg-opacity-90 backdrop-blur-md border-b border-cyber-primary">
    <div class="container mx-auto px-4 py-3 flex justify-between items-center">
      <div class="flex items-center space-x-2 cursor-pointer" @click="router.push('/')">
        <Terminal class="text-cyber-neon w-6 h-6" />
        <span class="text-xl font-bold text-cyber-neon font-mono tracking-wider">NOVA_BLOG</span>
      </div>
      
      <div class="flex items-center space-x-6">
        <router-link to="/" class="text-gray-400 hover:text-cyber-neon transition-colors font-mono text-sm">{{ t('nav.home') }}</router-link>
        <router-link to="/#projects" class="text-gray-400 hover:text-cyber-neon transition-colors font-mono text-sm">{{ t('nav.projects') }}</router-link>
        <router-link to="/#blog" class="text-gray-400 hover:text-cyber-neon transition-colors font-mono text-sm">{{ t('nav.docs') }}</router-link>

        <button @click="toggleLanguage" class="text-gray-400 hover:text-cyber-neon transition-colors" :title="t('common.language')">
            <Globe class="w-5 h-5" />
        </button>
        
        <div v-if="authStore.isAuthenticated" class="flex items-center space-x-4 ml-4 pl-4 border-l border-cyber-primary">
          <router-link to="/editor" class="text-cyber-pink hover:text-white transition-colors flex items-center space-x-1">
            <Code class="w-4 h-4" />
            <span class="font-mono text-xs">{{ t('nav.editor') }}</span>
          </router-link>
          
          <router-link to="/admin" class="text-cyber-green hover:text-white transition-colors flex items-center space-x-1">
            <User class="w-4 h-4" />
            <span class="font-mono text-xs">{{ t('nav.admin') }}</span>
          </router-link>
          
          <button @click="handleLogout" class="text-gray-400 hover:text-red-500 transition-colors" :title="t('nav.logout')">
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
  </nav>
</template>
