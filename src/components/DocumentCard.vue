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
  <div @click="navigateToDoc" class="cursor-pointer group border-l-4 border-cyber-primary bg-cyber-dark bg-opacity-50 p-4 hover:border-cyber-neon hover:bg-opacity-80 transition-all duration-300 relative overflow-hidden min-h-[120px]">
    <div class="flex flex-col md:flex-row gap-3 md:gap-4">
      <!-- Thumbnail if exists -->
      <div v-if="doc.coverImage" class="w-full md:w-32 h-24 flex-shrink-0 overflow-hidden rounded border border-gray-800">
        <img :src="doc.coverImage" class="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all" />
      </div>
      
      <div class="flex-1">
        <div class="flex items-center text-xs text-gray-500 mb-1 font-mono gap-2 md:gap-4">
          <span class="flex items-center gap-1">
            <Calendar class="w-3 h-3" />
            {{ formatDate(doc.createdAt) }}
          </span>
          <span v-if="doc.readingTime" class="flex items-center gap-1">
            <Clock class="w-3 h-3" />
            {{ doc.readingTime }} {{ t('doc.minRead') }}
          </span>
        </div>
        
        <h3 class="text-base md:text-lg font-bold text-cyber-neon mb-2 font-mono group-hover:text-white transition-colors">{{ doc.title }}</h3>
        <p class="text-gray-400 text-sm line-clamp-2 mb-3">{{ doc.description }}</p>
        
        <div class="flex flex-wrap gap-2">
          <span v-for="tag in doc.tags" :key="tag" class="text-xs text-cyber-primary bg-opacity-50 px-1.5 py-0.5 rounded font-bold opacity-70 group-hover:opacity-100 transition-opacity">
            {{ tag }}
          </span>
        </div>
      </div>
    </div>
    
    <div class="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-transparent via-cyber-neon to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
  </div>
</template>