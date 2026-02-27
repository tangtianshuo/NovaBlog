<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { apiFetch } from '@/utils/api';
import type { Collection, DocumentMetadata } from '../../api/types';
import { useI18n } from 'vue-i18n';
import MarkdownViewer from '@/components/MarkdownViewer.vue';
import { Layers, Calendar, ArrowRight } from 'lucide-vue-next';

const route = useRoute();
const { t, locale } = useI18n();
const collection = ref<Collection | null>(null);
const articles = ref<DocumentMetadata[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const fetchCollection = async () => {
  const id = route.params.id as string;
  try {
    const res = await apiFetch(`/collections/${id}`);
    const data = await res.json();
    if (data.success) {
      collection.value = data.data;
      await fetchArticles(data.data.metadata.articles);
    } else {
      error.value = data.error;
    }
  } catch (e) {
    error.value = 'Failed to fetch collection';
  } finally {
    loading.value = false;
  }
};

const fetchArticles = async (articleIds: string[]) => {
  if (!articleIds || articleIds.length === 0) return;
  
  try {
    // In a real app, we might want a batch fetch API
    // For now, we fetch all published documents and filter
    const res = await apiFetch('/documents?status=published');
    const data = await res.json();
    if (data.success) {
      const allDocs = data.data as DocumentMetadata[];
      // Map IDs to docs, preserving order
      const docsMap = new Map(allDocs.map(d => [d.id, d]));
      articles.value = articleIds
        .map(id => docsMap.get(id))
        .filter((d): d is DocumentMetadata => !!d);
    }
  } catch (e) {
    console.error('Failed to fetch articles', e);
  }
};

onMounted(() => {
  fetchCollection();
});

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
</script>

<template>
  <div class="min-h-screen bg-cyber-dark text-white font-sans pt-20 px-4">
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyber-green"></div>
    </div>

    <div v-else-if="error" class="text-center py-20 text-red-500 font-mono">
      {{ error }}
    </div>

    <div v-else-if="collection" class="container mx-auto max-w-4xl pb-20">
      <!-- Header -->
      <div class="mb-12 text-center">
        <h1 class="text-4xl md:text-5xl font-bold text-cyber-neon mb-6 font-mono tracking-tight">
          {{ collection.metadata.title }}
        </h1>
        <p class="text-xl text-gray-400 mb-6 font-mono max-w-2xl mx-auto">
          {{ collection.metadata.description }}
        </p>
        <div class="flex justify-center items-center gap-6 text-sm text-gray-500 font-mono">
          <div class="flex items-center gap-2">
            <Layers class="w-4 h-4 text-cyber-pink" />
            <span>{{ articles.length }} {{ t('common.articles') }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Calendar class="w-4 h-4 text-cyber-green" />
            <span>{{ formatDate(collection.metadata.updatedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Cover Image -->
      <div v-if="collection.metadata.coverImage" class="mb-12 rounded-xl overflow-hidden shadow-2xl border border-gray-800">
        <img 
          :src="collection.metadata.coverImage" 
          :alt="collection.metadata.title" 
          class="w-full h-auto max-h-[400px] object-cover"
        />
      </div>

      <!-- Collection Content (Intro) -->
      <div v-if="collection.content" class="mb-16 bg-black bg-opacity-30 p-8 rounded-xl border border-gray-800">
        <MarkdownViewer :content="collection.content" />
      </div>

      <!-- Articles List -->
      <div class="space-y-6">
        <h2 class="text-2xl font-bold text-cyber-pink mb-8 font-mono border-b border-gray-800 pb-4 inline-block">
          {{ t('collections.contents') }}
        </h2>
        
        <div v-if="articles.length === 0" class="text-gray-500 font-mono italic">
          {{ t('collections.noArticles') }}
        </div>

        <div 
          v-for="(article, index) in articles" 
          :key="article.id"
          class="group relative pl-8 border-l-2 border-gray-800 hover:border-cyber-green transition-colors duration-300"
        >
          <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-cyber-dark border-2 border-gray-600 group-hover:border-cyber-green transition-colors duration-300"></div>
          
          <a :href="`/doc/${article.id}`" class="block">
            <div class="flex items-baseline gap-4 mb-2">
              <span class="text-cyber-green font-mono text-sm">0{{ index + 1 }}</span>
              <h3 class="text-xl font-bold group-hover:text-cyber-neon transition-colors">
                {{ article.title }}
              </h3>
            </div>
            <p class="text-gray-400 text-sm mb-3 line-clamp-2">
              {{ article.description }}
            </p>
            <div class="flex items-center gap-2 text-xs text-cyber-pink opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-mono">
              <span>{{ t('common.readMore') }}</span>
              <ArrowRight class="w-3 h-3" />
            </div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
