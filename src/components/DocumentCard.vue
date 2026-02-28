<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Calendar, Clock } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

// Since api types are outside src, vite might complain if imported directly.
// But typescript understands it.
// If not, we define local interface.
interface DocMeta {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  tags?: string[];
  readingTime?: number;
  coverImage?: string;
}

const props = defineProps<{
  doc: DocMeta
}>();

const router = useRouter();
const { t, locale } = useI18n();

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const navigateToDoc = () => {
  router.push(`/doc/${props.doc.id}`);
};
</script>

<template>
  <div @click="navigateToDoc" class="cursor-pointer group relative border border-cyber-primary bg-cyber-dark bg-opacity-80 p-4 hover:border-cyber-neon hover:bg-opacity-90 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all duration-300 relative overflow-hidden min-h-[120px] rounded">
    <!-- Cyber Corner Effect -->
    <div class="absolute top-0 left-0 w-4 h-4 border-t border-l border-cyber-neon opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
    <div class="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyber-neon opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
    <div class="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-cyber-neon opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
    <div class="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-cyber-neon opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
    
    <!-- Scan Line -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyber-neon to-transparent opacity-0 group-hover:opacity-100 scan-line"></div>
    </div>

    <div class="flex flex-col md:flex-row gap-3 md:gap-4 relative z-10">
      <!-- Thumbnail if exists -->
      <div v-if="doc.coverImage" class="w-full md:w-32 h-24 flex-shrink-0 overflow-hidden rounded border border-gray-700">
        <img :src="doc.coverImage" class="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all" />
      </div>
      
      <div class="flex-1">
        <div class="flex items-center text-xs text-gray-400 mb-2 font-mono gap-2 md:gap-4">
          <span class="flex items-center gap-1">
            <Calendar class="w-3 h-3 text-cyber-pink" />
            {{ formatDate(doc.createdAt) }}
          </span>
          <span v-if="doc.readingTime" class="flex items-center gap-1">
            <Clock class="w-3 h-3 text-cyber-green" />
            {{ doc.readingTime }} {{ t('doc.minRead') }}
          </span>
        </div>
        
        <h3 class="text-base md:text-lg font-bold text-cyber-neon mb-2 font-mono group-hover:text-white transition-colors group-hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]">{{ doc.title }}</h3>
        <p class="text-gray-300 text-sm line-clamp-2 mb-3">{{ doc.description }}</p>
        
        <div class="flex flex-wrap gap-2">
          <span v-for="tag in doc.tags" :key="tag" class="text-xs text-cyber-neon border border-cyber-neon/50 bg-cyber-neon/10 px-2 py-0.5 rounded font-bold">
            {{ tag }}
          </span>
        </div>
      </div>
    </div>
    
    <div class="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-transparent via-cyber-neon to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
  </div>
</template>

<style scoped>
  .scan-line {
    animation: scanMove 2s linear infinite;
  }

  @keyframes scanMove {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
</style>