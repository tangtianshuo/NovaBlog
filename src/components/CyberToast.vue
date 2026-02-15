<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Check, X, AlertTriangle, Info, Trash2 } from 'lucide-vue-next';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'danger';
  message: string;
  duration?: number;
}

interface Props {
  toast: ToastItem;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [id: string];
}>();

const typingText = ref('');
const typingIndex = ref(0);
const isClosing = ref(false);

const typeConfig = {
  success: {
    icon: Check,
    borderColor: '#39ff14',
    bgColor: 'rgba(57, 255, 20, 0.1)',
    textColor: '#39ff14',
    shadowColor: 'rgba(57, 255, 20, 0.5)'
  },
  error: {
    icon: X,
    borderColor: '#ff0000',
    bgColor: 'rgba(255, 0, 0, 0.1)',
    textColor: '#ff0000',
    shadowColor: 'rgba(255, 0, 0, 0.5)'
  },
  warning: {
    icon: AlertTriangle,
    borderColor: '#fbbf24',
    bgColor: 'rgba(251, 191, 36, 0.1)',
    textColor: '#fbbf24',
    shadowColor: 'rgba(251, 191, 36, 0.5)'
  },
  info: {
    icon: Info,
    borderColor: '#00ffff',
    bgColor: 'rgba(0, 255, 255, 0.1)',
    textColor: '#00ffff',
    shadowColor: 'rgba(0, 255, 255, 0.5)'
  },
  danger: {
    icon: Trash2,
    borderColor: '#ff0000',
    bgColor: 'rgba(255, 0, 0, 0.1)',
    textColor: '#ff0000',
    shadowColor: 'rgba(255, 0, 0, 0.5)'
  }
};

let typingInterval: number | null = null;

const startTyping = () => {
  if (typingInterval) {
    clearInterval(typingInterval);
  }
  
  typingIndex.value = 0;
  typingText.value = '';
  
  const chars = props.toast.message.split('');
  
  const typeNext = () => {
    if (typingIndex.value < chars.length) {
      typingText.value += chars[typingIndex.value];
      typingIndex.value++;
      typingInterval = window.setTimeout(typeNext, 80);
    } else {
      typingInterval = null;
    }
  };
  
  typingInterval = window.setTimeout(typeNext, 100);
};

const close = () => {
  isClosing.value = true;
  setTimeout(() => {
    emit('close', props.toast.id);
  }, 300);
};

onMounted(() => {
  startTyping();
  
  if (props.toast.duration !== 0) {
    const totalTypingTime = (props.toast.message.length * 80) + 1000;
    setTimeout(() => {
      close();
    }, totalTypingTime);
  }
});

onUnmounted(() => {
  if (typingInterval) {
    clearTimeout(typingInterval);
  }
});
</script>

<template>
  <div
    class="cyber-toast"
    :class="{
      'is-closing': isClosing,
      [`type-${toast.type}`]: true
    }"
    :style="{
      '--border-color': typeConfig[toast.type].borderColor,
      '--bg-color': typeConfig[toast.type].bgColor,
      '--text-color': typeConfig[toast.type].textColor,
      '--shadow-color': typeConfig[toast.type].shadowColor
    }"
  >
    <div class="toast-icon">
      <component :is="typeConfig[toast.type].icon" class="icon" />
    </div>
    
    <div class="toast-content">
      <div class="toast-message">
        {{ typingText }}<span class="cursor">_</span>
      </div>
    </div>
    
    <button class="toast-close" @click="close">
      <X class="close-icon" />
    </button>
    
    <div class="scan-line"></div>
  </div>
</template>

<style scoped>
.cyber-toast {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: 0;
  box-shadow: 
    0 0 10px var(--shadow-color),
    0 0 20px var(--shadow-color),
    inset 0 0 20px rgba(0, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: toastSlideIn 0.4s ease-out;
  min-width: 320px;
  max-width: 480px;
  overflow: hidden;
}

.cyber-toast.is-closing {
  opacity: 0;
  transform: translateX(100%);
}

.cyber-toast::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--border-color);
  animation: scanLine 2s linear infinite;
}

.toast-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  color: var(--text-color);
  filter: drop-shadow(0 0 5px var(--shadow-color));
}

.icon {
  width: 24px;
  height: 24px;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-message {
  color: var(--text-color);
  text-shadow: 0 0 5px var(--shadow-color);
  word-break: break-word;
  white-space: pre-wrap;
}

.cursor {
  display: inline-block;
  animation: blink 0.8s step-end infinite;
  color: var(--text-color);
}

.toast-close {
  flex-shrink: 0;
  background: transparent;
  border: 1px solid var(--text-color);
  color: var(--text-color);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.toast-close:hover {
  background: var(--text-color);
  color: #0d0d0d;
}

.close-icon {
  width: 16px;
  height: 16px;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-color), transparent);
  opacity: 0.3;
}

@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scanLine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* Type-specific animations */
.cyber-toast.type-success .toast-icon {
  animation: pulseGreen 1.5s ease-in-out infinite;
}

.cyber-toast.type-error .toast-icon {
  animation: pulseRed 1.5s ease-in-out infinite;
}

.cyber-toast.type-warning .toast-icon {
  animation: pulseYellow 1.5s ease-in-out infinite;
}

.cyber-toast.type-info .toast-icon {
  animation: pulseCyan 1.5s ease-in-out infinite;
}

@keyframes pulseGreen {
  0%, 100% {
    filter: drop-shadow(0 0 5px rgba(57, 255, 20, 0.8));
  }
  50% {
    filter: drop-shadow(0 0 15px rgba(57, 255, 20, 1));
  }
}

@keyframes pulseRed {
  0%, 100% {
    filter: drop-shadow(0 0 5px rgba(255, 0, 0, 0.8));
  }
  50% {
    filter: drop-shadow(0 0 15px rgba(255, 0, 0, 1));
  }
}

@keyframes pulseYellow {
  0%, 100% {
    filter: drop-shadow(0 0 5px rgba(251, 191, 36, 0.8));
  }
  50% {
    filter: drop-shadow(0 0 15px rgba(251, 191, 36, 1));
  }
}

@keyframes pulseCyan {
  0%, 100% {
    filter: drop-shadow(0 0 5px rgba(0, 255, 255, 0.8));
  }
  50% {
    filter: drop-shadow(0 0 15px rgba(0, 255, 255, 1));
  }
}

.cyber-toast.type-danger .toast-icon {
  animation: pulseDanger 1.5s ease-in-out infinite;
}

@keyframes pulseDanger {
  0%, 100% {
    filter: drop-shadow(0 0 5px rgba(255, 0, 0, 0.8));
  }
  50% {
    filter: drop-shadow(0 0 15px rgba(255, 0, 0, 1));
  }
}
</style>
