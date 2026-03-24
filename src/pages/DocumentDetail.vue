<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import MarkdownViewer from '@/components/MarkdownViewer.vue';
import { Calendar, Clock, Share2, Tag } from 'lucide-vue-next';
import { message } from 'ant-design-vue';
import type { Document } from '../../api/types';
import { useI18n } from 'vue-i18n';
import { apiFetch } from '@/utils/api';
import { syncDB } from '@/utils/syncDB';

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
    const res = await apiFetch(`/documents/${route.params.id}`);
    const data = await res.json();
    if (data.success) {
      document.value = data.data;
    } else {
		const local = await syncDB.getLocalItemById(String(route.params.id));
		if (local && local.type === 'document') {
			const metadata = local.metadata as any;
			document.value = {
				metadata: {
					...(metadata || {}),
					id: String(metadata?.id || local.id),
					tags: Array.isArray(metadata?.tags) ? metadata.tags : [],
					readingTime: metadata?.readingTime || undefined,
					updatedAt: String(metadata?.updatedAt || new Date(local.timestamp).toISOString()),
					createdAt: String(metadata?.createdAt || new Date(local.timestamp).toISOString()),
				},
				content: local.content || '',
			};
		} else {
			message.error(data.error || t('editor.loadError'));
		}
    }
  } catch (e) {
		try {
			const local = await syncDB.getLocalItemById(String(route.params.id));
			if (local && local.type === 'document') {
				const metadata = local.metadata as any;
				document.value = {
					metadata: {
						...(metadata || {}),
						id: String(metadata?.id || local.id),
						tags: Array.isArray(metadata?.tags) ? metadata.tags : [],
						readingTime: metadata?.readingTime || undefined,
						updatedAt: String(metadata?.updatedAt || new Date(local.timestamp).toISOString()),
						createdAt: String(metadata?.createdAt || new Date(local.timestamp).toISOString()),
					},
					content: local.content || '',
				};
			} else {
				message.error(t('editor.loadError'));
			}
		} catch {
			message.error(t('editor.loadError'));
		}
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-base-bg text-base-text pt-20 pb-10">
    <div class="container mx-auto px-4 max-w-4xl">
      <div v-if="loading" class="text-center text-cyan-500 font-mono py-20">
        {{ t('doc.decrypting') }}
      </div>
      
      <div v-else-if="!document" class="text-center text-red-500 font-mono py-20">
        {{ t('doc.notFound') }}
      </div>
      
      <article v-else>
        <!-- Header -->
        <header class="mb-6 md:mb-8 border-b border-base-border pb-6 md:pb-8">
          <div class="flex flex-wrap gap-2 mb-4">
            <span v-for="tag in (document.metadata.tags || [])" :key="tag" class="flex items-center gap-1 text-xs font-mono text-indigo-500 border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 rounded-full">
              <Tag class="w-3 h-3" />
              {{ tag }}
            </span>
          </div>
          
          <h1 class="text-2xl md:text-5xl font-bold text-base-text mb-4 md:mb-6 font-mono leading-tight">
            {{ document.metadata.title }}
          </h1>
          
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-base-muted font-mono text-xs sm:text-sm">
            <div class="flex flex-wrap items-center gap-3 sm:gap-6">
              <span class="flex items-center gap-2">
                <Calendar class="w-4 h-4" />
                {{ formatDate(document.metadata.createdAt) }}
              </span>
              <span v-if="document.metadata.readingTime" class="flex items-center gap-2">
                <Clock class="w-4 h-4" />
                {{ document.metadata.readingTime }} {{ t('doc.minRead') }}
              </span>
            </div>
            
            <button @click="shareDocument" class="flex items-center gap-2 hover:text-cyan-500 transition-colors min-h-[44px] py-2 sm:py-0">
              <Share2 class="w-4 h-4" />
              <span>{{ t('doc.share') }}</span>
            </button>
          </div>
        </header>
        
        <!-- Content -->
        <main class="bg-base-surface p-4 md:p-8 rounded-2xl border border-base-border shadow-sm">
          <MarkdownViewer :content="document.content" :asset-base-url="`/api/media/${encodeURIComponent(document.metadata.id)}/`" />
        </main>
      </article>
    </div>
  </div>
</template>
