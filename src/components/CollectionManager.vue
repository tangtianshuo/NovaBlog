<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useCollectionStore } from '@/stores/collection';
import { useCyberToast } from '@/composables/useCyberToast';
import { Edit, Trash2, Plus, ExternalLink, Layers } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import type { CollectionMetadata } from '../../api/types';
import { useI18n } from 'vue-i18n';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const collectionStore = useCollectionStore();
const router = useRouter();
const { t } = useI18n();
const showDeleteDialog = ref(false);
const collectionToDelete = ref<string | null>(null);
const { success, error, danger } = useCyberToast();

const fetchCollections = async () => {
  await collectionStore.fetchCollections();
};

const confirmDelete = (collection: CollectionMetadata) => {
  collectionToDelete.value = collection.id;
  showDeleteDialog.value = true;
};

const deleteCollection = async () => {
  if (!collectionToDelete.value) return;
  try {
    await collectionStore.deleteCollection(collectionToDelete.value);
    danger(t('admin.deleted'));
    showDeleteDialog.value = false;
    collectionToDelete.value = null;
  } catch (e) {
    error(t('admin.deleteError'));
  }
};

const editCollection = (id: string) => {
  router.push(`/editor/collection/${id}`);
};

const createCollection = () => {
  router.push('/editor/collection');
};

onMounted(() => {
  fetchCollections();
});
</script>

<template>
  <div class="collection-manager">
    <div class="manager-header">
      <h2 class="manager-title">{{ t('admin.collections') }}</h2>
      <button 
        @click="createCollection" 
        class="manager-btn manager-btn-create"
      >
        <Plus class="w-5 h-5" />
        <span>{{ t('admin.createCollection') }}</span>
      </button>
    </div>

    <div v-if="collectionStore.loading" class="manager-loading">
      <div class="loading-spinner"></div>
      <p>{{ t('admin.loading') }}</p>
    </div>

    <div v-else-if="collectionStore.collections.length === 0" class="manager-empty">
      <p>{{ t('admin.noCollections') }}</p>
      <button 
        @click="createCollection" 
        class="manager-btn manager-btn-empty"
      >
        <Plus class="w-5 h-5" />
        <span>{{ t('admin.createCollection') }}</span>
      </button>
    </div>

    <div v-else class="manager-content">
      <div class="collection-grid">
        <div 
          v-for="collection in collectionStore.collections" 
          :key="collection.id" 
          class="collection-item"
        >
          <div class="collection-image">
            <img :src="collection.coverImage || '/images/default-collection.png'" :alt="collection.title" />
          </div>
          <div class="collection-info">
            <h3 class="collection-title">{{ collection.title }}</h3>
            <p class="collection-description">{{ collection.description }}</p>
            <div class="collection-meta">
              <div class="collection-stats">
                <Layers class="w-4 h-4" />
                <span>{{ collection.articles.length }} {{ t('common.articles') }}</span>
              </div>
              <div class="collection-actions">
                <a 
                  :href="`/collection/${collection.id}`" 
                  target="_blank" 
                  class="action-link"
                >
                  <ExternalLink class="w-4 h-4" />
                </a>
                <button 
                  @click="editCollection(collection.id)" 
                  class="action-btn action-btn-edit"
                >
                  <Edit class="w-4 h-4" />
                </button>
                <button 
                  @click="confirmDelete(collection)" 
                  class="action-btn action-btn-delete"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :show="showDeleteDialog"
      :title="t('admin.delete')"
      :message="t('admin.deleteConfirm')"
      confirm-text="删除"
      cancel-text="取消"
      type="danger"
      @confirm="deleteCollection"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<style scoped>
.collection-manager {
  width: 100%;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.manager-title {
  font-family: 'Courier New', Courier, monospace;
  font-size: 20px;
  font-weight: bold;
  color: #00ffff;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
  margin: 0;
}

.manager-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 2px solid #00ffff;
  background: rgba(0, 255, 255, 0.1);
  color: #00ffff;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 4px;
}

.manager-btn:hover {
  background: rgba(0, 255, 255, 0.2);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.4);
  transform: scale(1.05);
}

.manager-btn-create {
  background: rgba(57, 255, 20, 0.1);
  border-color: #39ff14;
  color: #39ff14;
}

.manager-btn-create:hover {
  background: rgba(57, 255, 20, 0.2);
  box-shadow: 0 0 15px rgba(57, 255, 20, 0.4);
}

.manager-btn-empty {
  margin-top: 20px;
}

.manager-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 255, 255, 0.3);
  border-top-color: #00ffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.manager-empty {
  text-align: center;
  padding: 40px;
  color: #666;
}

.manager-content {
  width: 100%;
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.collection-item {
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid #333;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.collection-item:hover {
  border-color: #00ffff;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
  transform: translateY(-2px);
}

.collection-image {
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
  background: #111;
}

.collection-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.collection-item:hover .collection-image img {
  transform: scale(1.05);
}

.collection-info {
  padding: 16px;
}

.collection-title {
  font-family: 'Courier New', Courier, monospace;
  font-size: 18px;
  font-weight: bold;
  color: #00ffff;
  margin: 0 0 8px 0;
  text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
}

.collection-description {
  font-size: 14px;
  color: #999;
  margin: 0 0 12px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.collection-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.collection-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #ff006e;
  font-family: 'Courier New', Courier, monospace;
}

.collection-actions {
  display: flex;
  gap: 8px;
}

.action-link,
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #444;
  background: rgba(0, 0, 0, 0.3);
  color: #666;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.action-link:hover,
.action-btn:hover {
  border-color: #00ffff;
  color: #00ffff;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
}

.action-btn-edit:hover {
  border-color: #39ff14;
  color: #39ff14;
  box-shadow: 0 0 10px rgba(57, 255, 20, 0.3);
}

.action-btn-delete:hover {
  border-color: #ff006e;
  color: #ff006e;
  box-shadow: 0 0 10px rgba(255, 0, 110, 0.3);
}
</style>
