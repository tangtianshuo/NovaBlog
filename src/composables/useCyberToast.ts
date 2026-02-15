import { ref } from 'vue';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'danger';
  message: string;
  duration?: number;
}

const toasts = ref<ToastItem[]>([]);

export function useCyberToast() {
  const showToast = (message: string, type: ToastItem['type'] = 'info', duration: number = 3000) => {
    const id = Date.now().toString();
    const toast: ToastItem = {
      id,
      type,
      message,
      duration
    };
    
    toasts.value.push(toast);
  };

  const success = (message: string, duration?: number) => showToast(message, 'success', duration);
  const error = (message: string, duration?: number) => showToast(message, 'error', duration);
  const warning = (message: string, duration?: number) => showToast(message, 'warning', duration);
  const info = (message: string, duration?: number) => showToast(message, 'info', duration);
  const danger = (message: string, duration?: number) => showToast(message, 'danger', duration);

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  return {
    toasts,
    showToast,
    success,
    error,
    warning,
    info,
    danger,
    removeToast
  };
}
