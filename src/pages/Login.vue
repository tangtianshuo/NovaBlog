<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { message } from 'ant-design-vue';
import { useI18n } from 'vue-i18n';

const username = ref('');
const password = ref('');
const loading = ref(false);
const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const handleLogin = async () => {
  if (!username.value || !password.value) {
    message.warning(t('login.required'));
    return;
  }

  loading.value = true;
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    });

    const data = await response.json();

    if (data.success) {
      authStore.login(data.token, data.user);
      message.success(t('login.success'));
      router.push('/admin');
    } else {
      message.error(data.message || t('login.failed'));
    }
  } catch (error) {
    message.error(t('login.error'));
    console.error(error);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="flex justify-center items-center h-screen bg-cyber-dark bg-opacity-90 relative overflow-hidden">
    <!-- Background Effects -->
    <div class="absolute inset-0 z-0">
        <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-cyber-primary rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-neon rounded-full blur-3xl opacity-10"></div>
    </div>
    
    <div class="w-full max-w-md p-8 bg-cyber-dark border border-cyber-neon shadow-neon rounded z-10 relative">
      <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-pink to-cyber-neon"></div>
      
      <h1 class="text-3xl font-bold text-center text-cyber-neon mb-8 font-mono tracking-widest">{{ t('login.title') }}</h1>
      
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-cyber-neon text-sm font-bold mb-2 font-mono">{{ t('login.username') }}</label>
          <input 
            v-model="username" 
            type="text" 
            class="w-full bg-black border border-cyber-primary text-cyber-neon p-3 rounded focus:outline-none focus:border-cyber-neon focus:shadow-neon transition-all duration-300 font-mono"
            :placeholder="t('login.enterUsername')"
          />
        </div>
        
        <div>
          <label class="block text-cyber-neon text-sm font-bold mb-2 font-mono">{{ t('login.password') }}</label>
          <input 
            v-model="password" 
            type="password" 
            class="w-full bg-black border border-cyber-primary text-cyber-neon p-3 rounded focus:outline-none focus:border-cyber-neon focus:shadow-neon transition-all duration-300 font-mono"
            :placeholder="t('login.enterPassword')"
          />
        </div>
        
        <button 
          type="submit" 
          :disabled="loading"
          class="w-full bg-transparent border border-cyber-pink text-cyber-pink font-bold py-3 px-4 rounded hover:bg-cyber-pink hover:text-black hover:shadow-neon-pink transition-all duration-300 font-mono tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? t('login.authenticating') : t('login.submit') }}
        </button>
      </form>
    </div>
  </div>
</template>