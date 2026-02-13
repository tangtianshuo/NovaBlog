<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import MarkdownViewer from '@/components/MarkdownViewer.vue';
import { Calendar, Clock, Share2, Tag } from 'lucide-vue-next';
import { message } from 'ant-design-vue';
import type { Document } from '../../api/types';
import { useI18n } from 'vue-i18n';

const route = useRoute();
const document = ref<Document | null>(null);
const loading = ref(true);
const { t, locale } = useI18n();

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const shareDocument = () => {
  navigator.clipboard.writeText(window.location.href);
  message.success(t('doc.copied'));
};

onMounted(async () => {
  try {
    const res = await fetch(`/api/documents/${route.params.id}`);
    const data = await res.json();
    if (data.success) {
      document.value = data.data;
    } else {
      message.error(data.error || t('editor.loadError'));
    }
  } catch (e) {
    message.error(t('editor.loadError'));
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-cyber-dark text-white pt-20 pb-10">
    <div class="container mx-auto px-4 max-w-4xl">
      <div v-if="loading" class="text-center text-cyber-green font-mono py-20">
        {{ t('doc.decrypting') }}
      </div>
      
      <div v-else-if="!document" class="text-center text-red-500 font-mono py-20">
        {{ t('doc.notFound') }}
      </div>
      
      <article v-else>
        <!-- Header -->
        <header class="mb-8 border-b border-cyber-primary pb-8">
          <div class="flex flex-wrap gap-2 mb-4">
            <span v-for="tag in document.metadata.tags" :key="tag" class="flex items-center gap-1 text-xs font-mono text-cyber-pink border border-cyber-pink px-2 py-0.5 rounded">
              <Tag class="w-3 h-3" />
              {{ tag }}
            </span>
          </div>
          
          <h1 class="text-3xl md:text-5xl font-bold text-cyber-neon mb-6 font-mono leading-tight">
            {{ document.metadata.title }}
          </h1>
          
          <div class="flex items-center justify-between text-gray-400 font-mono text-sm">
            <div class="flex items-center gap-6">
              <span class="flex items-center gap-2">
                <Calendar class="w-4 h-4" />
                {{ formatDate(document.metadata.createdAt) }}
              </span>
              <span v-if="document.metadata.readingTime" class="flex items-center gap-2">
                <Clock class="w-4 h-4" />
                {{ document.metadata.readingTime }} {{ t('doc.minRead') }}
              </span>
            </div>
            
            <button @click="shareDocument" class="flex items-center gap-2 hover:text-cyber-green transition-colors">
              <Share2 class="w-4 h-4" />
              {{ t('doc.share') }}
            </button>
          </div>
        </header>
        
        <!-- Content -->
        <main class="bg-black bg-opacity-30 p-8 rounded-lg border border-cyber-primary shadow-neon">
          <MarkdownViewer :content="document.content" />
        </main>
      </article>
    </div>
  </div>
</template>