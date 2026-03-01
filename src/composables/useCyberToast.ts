import { ref } from 'vue';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'danger';
  title?: string;
  message: string;
  detail?: string;
  action?: { label: string; to?: string; handler?: () => void };
  duration?: number;
}

const toasts = ref<ToastItem[]>([]);

export function useCyberToast() {
  const showToast = (
    message: string,
    type: ToastItem['type'] = 'info',
    duration: number = 3000,
    options?: { title?: string; detail?: string; action?: ToastItem['action'] }
  ) => {
    const id = Date.now().toString();
    const toast: ToastItem = {
      id,
      type,
      message,
      ...options,
      duration
    };
    
    toasts.value.push(toast);
  };

  const success = (
    message: string,
    duration?: number,
    options?: { title?: string; detail?: string; action?: ToastItem['action'] }
  ) => showToast(message, 'success', duration ?? 4000, options);

  const error = (
    message: string,
    duration?: number,
    options?: { title?: string; detail?: string; action?: ToastItem['action'] }
  ) => showToast(message, 'error', duration ?? 5000, options);

  const warning = (
    message: string,
    duration?: number,
    options?: { title?: string; detail?: string; action?: ToastItem['action'] }
  ) => showToast(message, 'warning', duration ?? 4000, options);

  const info = (
    message: string,
    duration?: number,
    options?: { title?: string; detail?: string; action?: ToastItem['action'] }
  ) => showToast(message, 'info', duration ?? 3000, options);

  const danger = (
    message: string,
    duration?: number,
    options?: { title?: string; detail?: string; action?: ToastItem['action'] }
  ) => showToast(message, 'danger', duration ?? 5000, options);

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
