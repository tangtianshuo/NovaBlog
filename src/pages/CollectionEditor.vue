<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCollectionStore } from '@/stores/collection';
import { useCyberToast } from '@/composables/useCyberToast';
import { useI18n } from 'vue-i18n';
import MarkdownViewer from '@/components/MarkdownViewer.vue';
import ArticleSelector from '@/components/ArticleSelector.vue';
import { Save, Trash2, ArrowLeft, Upload } from 'lucide-vue-next';
import { apiFetch } from '@/utils/api';

const route = useRoute();
const router = useRouter();
const collectionStore = useCollectionStore();
const { t } = useI18n();
const { success, error, danger } = useCyberToast();

const loading = ref(true);
const saving = ref(false);
const showDeleteDialog = ref(false);

const form = ref({
  title: '',
  description: '',
  content: '',
  coverImage: '',
  articles: [] as string[],
});

const isNew = computed(() => !route.params.id);

const fetchCollection = async () => {
  if (isNew.value) {
    loading.value = false;
    return;
  }
  
  try {
    const id = route.params.id as string;
    await collectionStore.fetchCollection(id);
    const collection = collectionStore.currentCollection;
    if (collection) {
      form.value = {
        title: collection.metadata.title,
        description: collection.metadata.description,
        content: collection.content,
        coverImage: collection.metadata.coverImage || '',
        articles: collection.metadata.articles || [],
      };
    }
  } catch (e) {
    error(t('editor.loadError'));
  } finally {
    loading.value = false;
  }
};

const saveCollection = async () => {
  if (!form.value.title) {
    error('Title is required');
    return;
  }

  saving.value = true;
  try {
    if (isNew.value) {
      await collectionStore.createCollection(form.value);
    } else {
      await collectionStore.updateCollection(route.params.id as string, form.value);
    }
    success(t('editor.saved'));
    router.push('/admin#collections');
  } catch (e) {
    error(t('editor.saveError'));
  } finally {
    saving.value = false;
  }
};

const deleteCollection = async () => {
  if (isNew.value) return;
  
  try {
    await collectionStore.deleteCollection(route.params.id as string);
    danger(t('admin.deleted'));
    router.push('/admin#collections');
  } catch (e) {
    error(t('admin.deleteError'));
  }
};

const fileInputRef = ref<HTMLInputElement | null>(null);
const uploading = ref(false);

const triggerUpload = () => {
  fileInputRef.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  const file = target.files[0];
  const formData = new FormData();
  formData.append('file', file);

  uploading.value = true;
  try {
    const res = await apiFetch('/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.success) {
      form.value.coverImage = data.url;
      success(t('editor.uploadSuccess'));
    } else {
      error(data.error || t('editor.uploadError'));
    }
  } catch (e) {
    error(t('editor.uploadError'));
  } finally {
    uploading.value = false;
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
  }
};

onMounted(() => {
  fetchCollection();
});
</script>

<template>
  <div class="flex h-screen bg-cyber-dark text-white pt-16 overflow-hidden">
    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Header -->
      <div class="h-16 border-b border-cyber-primary flex items-center justify-between px-6 bg-black bg-opacity-30 flex-shrink-0">
        <div class="flex items-center gap-4">
          <button @click="router.push('/admin#collections')" class="text-gray-500 hover:text-cyber-neon transition-colors">
            <ArrowLeft class="w-5 h-5" />
          </button>
          <h1 class="text-xl font-mono font-bold text-cyber-neon">
            {{ isNew ? t('admin.createCollection') : t('admin.editCollection') }}
          </h1>
        </div>
        
        <div class="flex items-center gap-3">
          <button
            v-if="!isNew"
            @click="deleteCollection"
            class="flex items-center gap-2 px-4 py-2 text-sm font-mono text-gray-500 hover:text-red-500 transition-colors"
          >
            <Trash2 class="w-4 h-4" />
            <span>{{ t('admin.delete') }}</span>
          </button>
          <button
            @click="saveCollection"
            :disabled="saving"
            class="flex items-center gap-2 px-6 py-2 bg-cyber-neon text-black font-bold font-mono rounded hover:bg-white transition-all disabled:opacity-50"
          >
            <Save class="w-4 h-4" />
            <span>{{ saving ? t('common.saving') : t('editor.save') }}</span>
          </button>
        </div>
      </div>

      <!-- Editor Body -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Panel: Metadata & Articles -->
        <div class="w-1/3 min-w-[350px] max-w-[500px] border-r border-cyber-primary flex flex-col overflow-y-auto bg-black bg-opacity-20 p-6 gap-6">
          <!-- Metadata Form -->
          <div class="space-y-4">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-mono text-cyber-neon">Title</label>
              <input 
                v-model="form.title" 
                type="text" 
                class="bg-cyber-dark border border-gray-700 rounded px-3 py-2 focus:border-cyber-neon focus:outline-none transition-colors"
                placeholder="Collection Title"
              />
            </div>
            
            <div class="flex flex-col gap-2">
              <label class="text-sm font-mono text-cyber-neon">Description</label>
              <textarea 
                v-model="form.description" 
                rows="3"
                class="bg-cyber-dark border border-gray-700 rounded px-3 py-2 focus:border-cyber-neon focus:outline-none transition-colors resize-none"
                placeholder="Brief description..."
              ></textarea>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-mono text-cyber-neon">Cover Image</label>
              <div class="flex gap-2">
                <input 
                  v-model="form.coverImage" 
                  type="text" 
                  class="flex-1 bg-cyber-dark border border-gray-700 rounded px-3 py-2 focus:border-cyber-neon focus:outline-none text-sm"
                  placeholder="Image URL"
                />
                <button 
                  @click="triggerUpload"
                  class="p-2 border border-gray-700 rounded hover:border-cyber-neon hover:text-cyber-neon transition-colors"
                  :disabled="uploading"
                >
                  <Upload class="w-4 h-4" :class="{ 'animate-pulse': uploading }" />
                </button>
                <input 
                  type="file" 
                  ref="fileInputRef" 
                  class="hidden" 
                  accept="image/*" 
                  @change="handleFileUpload" 
                />
              </div>
              <div v-if="form.coverImage" class="mt-2 h-32 rounded overflow-hidden border border-gray-700">
                <img :src="form.coverImage" class="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          <!-- Article Selector -->
          <div class="flex-1 flex flex-col min-h-[300px]">
            <label class="text-sm font-mono text-cyber-neon mb-2">Articles</label>
            <ArticleSelector v-model="form.articles" />
          </div>
        </div>

        <!-- Right Panel: Content Editor -->
        <div class="flex-1 flex flex-col bg-cyber-dark">
          <div class="border-b border-cyber-primary px-4 py-2 bg-black bg-opacity-30 text-xs font-mono text-gray-500">
            COLLECTION INTRO (MARKDOWN)
          </div>
          <div class="flex-1 flex">
            <textarea 
              v-model="form.content" 
              class="flex-1 bg-transparent p-6 font-mono text-sm focus:outline-none resize-none"
              placeholder="# Introduction&#10;&#10;Write a comprehensive introduction for this collection..."
            ></textarea>
            <div class="flex-1 border-l border-cyber-primary bg-black bg-opacity-10 p-6 overflow-y-auto">
              <MarkdownViewer :content="form.content" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
