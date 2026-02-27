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
  <a :href="`/collection/${collection.id}`" class="collection-card block h-full">
    <div class="card-inner h-full flex flex-col bg-black bg-opacity-40 border border-gray-800 rounded-lg overflow-hidden transition-all hover:border-cyber-green hover:shadow-[0_0_15px_rgba(57,255,20,0.2)] hover:-translate-y-1">
      <div class="card-image h-48 overflow-hidden bg-gray-900 relative group">
        <img 
          :src="collection.coverImage || '/images/default-collection.png'" 
          :alt="collection.title" 
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
        <div class="absolute bottom-3 left-3 flex items-center gap-2 text-white text-xs font-mono">
          <Layers class="w-3 h-3 text-cyber-green" />
          <span>{{ collection.articles.length }} {{ t('common.articles') }}</span>
        </div>
      </div>
      
      <div class="card-content p-4 flex-grow flex flex-col">
        <h3 class="text-xl font-bold text-cyber-neon mb-2 font-mono truncate">{{ collection.title }}</h3>
        <p class="text-gray-400 text-sm mb-4 line-clamp-3 flex-grow">{{ collection.description }}</p>
        
        <div class="card-footer mt-auto pt-3 border-t border-gray-800 flex justify-between items-center text-xs text-gray-500 font-mono">
          <div class="flex items-center gap-1">
            <Calendar class="w-3 h-3" />
            <span>{{ formatDate(collection.updatedAt) }}</span>
          </div>
        </div>
      </div>
    </div>
  </a>
</template>
