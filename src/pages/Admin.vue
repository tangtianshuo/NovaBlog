<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { message } from 'ant-design-vue';
import { Edit, Trash2, ExternalLink } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import type { DocumentMetadata } from '../../api/types';
import { useI18n } from 'vue-i18n';

const authStore = useAuthStore();
const router = useRouter();
const documents = ref<DocumentMetadata[]>([]);
const loading = ref(true);
const { t, locale } = useI18n();

const fetchDocuments = async () => {
  loading.value = true;
  try {
    // Fetch both drafts and published
    const [draftsRes, publishedRes] = await Promise.all([
        fetch('/api/documents?status=draft'),
        fetch('/api/documents?status=published')
    ]);
    
    const draftsData = await draftsRes.json();
    const publishedData = await publishedRes.json();
    
    documents.value = [
        ...(draftsData.success ? draftsData.data : []),
        ...(publishedData.success ? publishedData.data : [])
    ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
  } catch (e) {
    message.error(t('admin.fetchError'));
  } finally {
    loading.value = false;
  }
};

const deleteDocument = async (id: string) => {
  if (!confirm(t('admin.deleteConfirm'))) return;
  try {
    const res = await fetch(`/api/documents/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    if (res.ok) {
        message.success(t('admin.deleted'));
        fetchDocuments();
    }
  } catch (e) {
      message.error(t('admin.deleteError'));
  }
};

const editDocument = (id: string) => {
    // Navigate to editor with document selected
    // Since editor handles selection via internal state, we might need query param or store.
    // For simplicity, let's just go to editor and let user find it, OR add query param support in Editor.
    // I didn't add query param support in Editor.vue.
    // I'll skip deep linking for now, just go to Editor.
    router.push('/editor');
};

onMounted(() => {
  fetchDocuments();
});
</script>

<template>
  <div class="min-h-screen bg-cyber-dark text-white pt-20 px-4">
    <div class="container mx-auto">
        <h1 class="text-3xl font-bold text-cyber-neon mb-8 font-mono">{{ t('admin.title') }}</h1>
        
        <div class="bg-black bg-opacity-50 border border-cyber-primary rounded overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-cyber-primary text-cyber-neon font-mono text-sm">
                        <th class="p-4 border-b border-gray-700">{{ t('admin.table.title') }}</th>
                        <th class="p-4 border-b border-gray-700">{{ t('admin.table.status') }}</th>
                        <th class="p-4 border-b border-gray-700">{{ t('admin.table.updated') }}</th>
                        <th class="p-4 border-b border-gray-700">{{ t('admin.table.actions') }}</th>
                    </tr>
                </thead>
                <tbody class="font-mono text-sm">
                    <tr v-if="loading">
                        <td colspan="4" class="p-4 text-center text-cyber-green">{{ t('admin.loading') }}</td>
                    </tr>
                    <tr v-else-if="documents.length === 0">
                        <td colspan="4" class="p-4 text-center text-gray-500">{{ t('admin.noDocs') }}</td>
                    </tr>
                    <tr v-for="doc in documents" :key="doc.id" class="border-b border-gray-800 hover:bg-white hover:bg-opacity-5 transition-colors">
                        <td class="p-4 font-bold">{{ doc.title }}</td>
                        <td class="p-4">
                            <span 
                                class="px-2 py-1 rounded text-xs font-bold"
                                :class="doc.status === 'published' ? 'bg-cyber-green text-black' : 'bg-cyber-pink text-black'"
                            >
                                {{ t(`common.status.${doc.status}`) }}
                            </span>
                        </td>
                        <td class="p-4 text-gray-400">{{ new Date(doc.updatedAt).toLocaleDateString(locale.value) }}</td>
                        <td class="p-4 flex gap-2">
                            <button @click="editDocument(doc.id)" class="text-cyber-neon hover:text-white" :title="t('admin.edit')">
                                <Edit class="w-4 h-4" />
                            </button>
                            <a v-if="doc.status === 'published'" :href="`/doc/${doc.id}`" target="_blank" class="text-cyber-green hover:text-white" :title="t('admin.view')">
                                <ExternalLink class="w-4 h-4" />
                            </a>
                            <button @click="deleteDocument(doc.id)" class="text-red-500 hover:text-white" :title="t('admin.delete')">
                                <Trash2 class="w-4 h-4" />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
  </div>
</template>