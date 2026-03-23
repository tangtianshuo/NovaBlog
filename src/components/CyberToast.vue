<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Check, X, AlertTriangle, Info, Trash2 } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'danger';
  title?: string;
  message: string;
  detail?: string;
  action?: { label: string; to?: string; handler?: () => void };
  duration?: number;
}

interface Props {
  toast: ToastItem;
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [id: string] }>()

const router = useRouter()
const isClosing = ref(false)

const typeConfig = computed(() => {
	const map = {
		success: { icon: Check, accent: 'text-cyber-green', border: 'border-cyber-green/30' },
		error: { icon: X, accent: 'text-red-500', border: 'border-red-500/30' },
		warning: { icon: AlertTriangle, accent: 'text-amber-500', border: 'border-amber-500/30' },
		info: { icon: Info, accent: 'text-cyber-neon', border: 'border-cyber-neon/30' },
		danger: { icon: Trash2, accent: 'text-red-500', border: 'border-red-500/30' },
	} as const
	return map[props.toast.type]
})

const close = () => {
	isClosing.value = true
	setTimeout(() => emit('close', props.toast.id), 220)
}

const handleAction = () => {
	if (!props.toast.action) return
	if (props.toast.action.to) router.push(props.toast.action.to)
	else if (props.toast.action.handler) props.toast.action.handler()
	close()
}

onMounted(() => {
  if (props.toast.duration !== 0) {
		setTimeout(() => close(), props.toast.duration ?? 4000)
  }
});
</script>

<template>
  <div
    class="pointer-events-auto w-[360px] max-w-[92vw] rounded-2xl border bg-base-bg/90 backdrop-blur shadow-lg transition-all"
    :class="[
      typeConfig.border,
      isClosing ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
    ]"
  >
    <div class="flex items-start gap-3 p-4">
      <div class="mt-0.5">
        <component :is="typeConfig.icon" class="w-5 h-5" :class="typeConfig.accent" />
      </div>

      <div class="min-w-0 flex-1">
        <div v-if="toast.title" class="text-sm font-semibold text-base-text">
          {{ toast.title }}
        </div>
        <div class="text-sm text-base-text leading-relaxed break-words">
          {{ toast.message }}
        </div>
        <div v-if="toast.detail" class="mt-1 text-xs text-base-muted break-words">
          {{ toast.detail }}
        </div>
        <button
          v-if="toast.action"
          class="mt-3 inline-flex items-center justify-center rounded-xl border border-base-border bg-base-surface px-3 py-1.5 text-xs font-semibold text-base-text hover:bg-base-surface2 transition"
          @click="handleAction"
        >
          {{ toast.action.label }}
        </button>
      </div>

      <button
        class="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-base-border bg-base-surface text-base-muted hover:text-base-text hover:bg-base-surface2 transition"
        @click="close"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <div class="h-0.5 w-full overflow-hidden rounded-b-2xl bg-base-border">
      <div class="h-full w-1/2 bg-cyber-neon/60" :class="toast.duration === 0 ? 'w-0' : 'animate-[toastbar_4s_linear_forwards]'" />
    </div>
  </div>
</template>

<style scoped>
@keyframes toastbar {
	from {
		transform: translateX(-100%);
	}
	to {
		transform: translateX(100%);
	}
}
</style>
