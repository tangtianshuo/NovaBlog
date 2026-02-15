<script setup lang="ts">
import { X, AlertTriangle } from 'lucide-vue-next';

interface Props {
  show: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: '确认',
  cancelText: '取消',
  type: 'danger'
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const typeStyles = {
  danger: 'border-cyber-pink text-cyber-pink',
  warning: 'border-yellow-400 text-yellow-400',
  info: 'border-cyber-neon text-cyber-neon'
};
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="emit('cancel')">
      <div class="relative bg-cyber-dark border-2 max-w-md w-full overflow-hidden" :class="typeStyles[type]">
        <div class="absolute top-0 right-0 p-4">
          <button @click="emit('cancel')" class="text-gray-400 hover:text-white transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <div class="p-6">
          <div class="flex items-start gap-4 mb-6">
            <AlertTriangle :class="type === 'danger' ? 'text-cyber-pink' : type === 'warning' ? 'text-yellow-400' : 'text-cyber-neon'" class="w-6 h-6 flex-shrink-0 mt-1" />
            <div class="flex-1">
              <h3 class="text-xl font-bold font-mono mb-2" :class="type === 'danger' ? 'text-cyber-pink' : type === 'warning' ? 'text-yellow-400' : 'text-cyber-neon'">
                {{ title }}
              </h3>
              <p class="text-gray-300 leading-relaxed">{{ message }}</p>
            </div>
          </div>
          
          <div class="flex gap-4 justify-end">
            <button 
              @click="emit('cancel')"
              class="px-6 py-2 border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white transition-all font-mono"
            >
              {{ cancelText }}
            </button>
            <button 
              @click="emit('confirm')"
              :class="type === 'danger' 
                ? 'bg-cyber-pink text-black border-cyber-pink hover:bg-white hover:border-white shadow-neon-pink' 
                : type === 'warning' 
                ? 'bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-300 hover:border-yellow-300'
                : 'bg-cyber-neon text-black border-cyber-neon hover:bg-white hover:border-white shadow-neon'"
              class="px-6 py-2 border font-mono transition-all"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
        
        <div class="absolute inset-0 border-2 pointer-events-none" :class="type === 'danger' ? 'border-cyber-pink opacity-20' : type === 'warning' ? 'border-yellow-400 opacity-20' : 'border-cyber-neon opacity-20'"></div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
