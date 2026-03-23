<script setup lang="ts">
import { ref, onMounted } from 'vue';
import CollectionCard from '@/components/CollectionCard.vue';
import type { CollectionMetadata } from '../../api/types';
import { useI18n } from 'vue-i18n';
import { apiFetch } from '@/utils/api';
import { syncDB, type LocalItem } from '@/utils/syncDB';

const { t } = useI18n();
const collections = ref<CollectionMetadata[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const [res, localCols] = await Promise.all([
      apiFetch('/collections'),
      syncDB.getLocalCollections(),
    ]);
    const data = await res.json();

    const localCollections = localCols.map((c: LocalItem) => {
      const metadata = c.metadata as any;
      return {
        ...(metadata || {}),
        id: String(metadata?.id || c.id),
        createdAt: String(metadata?.createdAt || new Date(c.timestamp).toISOString()),
        updatedAt: String(metadata?.updatedAt || new Date(c.timestamp).toISOString()),
        articles: Array.isArray(metadata?.articles) ? metadata.articles : [],
      } as CollectionMetadata;
    });

    const remoteCollections = data?.success ? (data.data as CollectionMetadata[]) : [];
    const merged = new Map<string, CollectionMetadata>();
    for (const c of localCollections) merged.set(c.id, c);
    for (const c of remoteCollections) merged.set(c.id, c);
    collections.value = Array.from(merged.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-base-bg text-base-text font-sans pt-20 px-4">
    <div class="container mx-auto">
      <h1 class="text-4xl font-bold text-cyber-neon mb-8 font-mono text-center">
        {{ t('collections.title') }}
      </h1>
      
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyber-green"></div>
      </div>
      
      <div v-else-if="collections.length === 0" class="text-center py-20 text-gray-500 font-mono">
        {{ t('collections.noData') }}
      </div>
      
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
        <CollectionCard
          v-for="collection in collections"
          :key="collection.id"
          :collection="collection"
        />
      </div>
    </div>
  </div>
</template>
