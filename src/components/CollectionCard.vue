<script setup lang="ts">
import type { CollectionMetadata } from '../../api/types';
import { Layers, Calendar } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  collection: CollectionMetadata;
}>();

const { t, locale } = useI18n();

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
</script>

<template>
  <a :href="`/collection/${collection.id}`" class="collection-card block h-full group">
    <!-- Cyber Corner Effect -->
    <div class="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyber-green opacity-0 group-hover:opacity-100 transition-opacity z-20"></div>
    <div class="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyber-green opacity-0 group-hover:opacity-100 transition-opacity z-20"></div>
    <div class="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyber-green opacity-0 group-hover:opacity-100 transition-opacity z-20"></div>
    <div class="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyber-green opacity-0 group-hover:opacity-100 transition-opacity z-20"></div>

    <div class="card-inner h-full flex flex-col bg-cyber-dark border border-gray-800 rounded-lg overflow-hidden transition-all duration-300 group-hover:border-cyber-green group-hover:shadow-[0_0_25px_rgba(57,255,20,0.3)] group-hover:-translate-y-1">
      
      <!-- Scan Line -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none z-10">
        <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyber-green to-transparent opacity-0 group-hover:opacity-100 scan-line"></div>
      </div>

      <div class="card-image h-48 overflow-hidden bg-gray-900 relative group">
        <img 
          :src="collection.coverImage || '/images/default-project.png'" 
          :alt="collection.title" 
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-cyber-dark via-transparent to-transparent opacity-80"></div>
        <!-- Glowing Overlay -->
        <div class="absolute inset-0 bg-gradient-to-r from-cyber-green/10 via-transparent to-cyber-pink/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div class="absolute bottom-3 left-3 flex items-center gap-2 text-white text-xs font-mono">
          <Layers class="w-3 h-3 text-cyber-green" />
          <span>{{ collection.articles.length }} {{ t('common.articles') }}</span>
        </div>
      </div>
      
      <div class="card-content p-4 flex-grow flex flex-col relative z-10 bg-gradient-to-b from-transparent to-black/30">
        <h3 class="text-xl font-bold text-cyber-neon mb-2 font-mono truncate group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.8)] transition-all">
          {{ collection.title }}
        </h3>
        <p class="text-gray-300 text-sm mb-4 line-clamp-3 flex-grow">{{ collection.description }}</p>
        
        <div class="card-footer mt-auto pt-3 border-t border-gray-800 flex justify-between items-center text-xs text-gray-400 font-mono">
          <div class="flex items-center gap-1">
            <Calendar class="w-3 h-3 text-cyber-green" />
            <span>{{ formatDate(collection.updatedAt) }}</span>
          </div>
        </div>
      </div>
    </div>
  </a>
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
