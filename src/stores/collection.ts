import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiFetch } from '@/utils/api';
import type { Collection, CollectionMetadata } from '../../api/types';
import { useAuthStore } from './auth';

export const useCollectionStore = defineStore('collection', () => {
  const collections = ref<CollectionMetadata[]>([]);
  const currentCollection = ref<Collection | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const authStore = useAuthStore();

  async function fetchCollections() {
    loading.value = true;
    error.value = null;
    try {
      const res = await apiFetch('/collections');
      const data = await res.json();
      if (data.success) {
        collections.value = data.data;
      } else {
        error.value = data.error;
      }
    } catch (e) {
      error.value = 'Failed to fetch collections';
    } finally {
      loading.value = false;
    }
  }

  async function fetchCollection(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const res = await apiFetch(`/collections/${id}`);
      const data = await res.json();
      if (data.success) {
        currentCollection.value = data.data;
      } else {
        error.value = data.error;
      }
    } catch (e) {
      error.value = 'Failed to fetch collection';
    } finally {
      loading.value = false;
    }
  }

  async function createCollection(collection: Partial<CollectionMetadata> & { content?: string }) {
    loading.value = true;
    error.value = null;
    try {
      const res = await apiFetch('/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`,
        },
        body: JSON.stringify(collection),
      });
      const data = await res.json();
      if (data.success) {
        await fetchCollections();
        return data.data;
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      error.value = e.message || 'Failed to create collection';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateCollection(id: string, updates: Partial<CollectionMetadata> & { content?: string }) {
    loading.value = true;
    error.value = null;
    try {
      const res = await apiFetch(`/collections/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`,
        },
        body: JSON.stringify({
          metadata: updates,
          content: updates.content
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchCollections();
        if (currentCollection.value && currentCollection.value.metadata.id === id) {
          await fetchCollection(id);
        }
        return data.data;
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      error.value = e.message || 'Failed to update collection';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function deleteCollection(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const res = await apiFetch(`/collections/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        await fetchCollections();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      error.value = e.message || 'Failed to delete collection';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    collections,
    currentCollection,
    loading,
    error,
    fetchCollections,
    fetchCollection,
    createCollection,
    updateCollection,
    deleteCollection,
  };
});
