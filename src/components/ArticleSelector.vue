<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { apiFetch } from '@/utils/api';
import type { DocumentMetadata } from '../../api/types';
import { Search, Plus, X } from 'lucide-vue-next';

const props = defineProps<{
  modelValue: string[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
}>();

const documents = ref<DocumentMetadata[]>([]);
const searchQuery = ref('');
const loading = ref(true);

const fetchDocuments = async () => {
  try {
    const res = await apiFetch('/documents?status=published');
    const data = await res.json();
    if (data.success) {
      documents.value = data.data;
    }
  } catch (e) {
    console.error('Failed to fetch documents', e);
  } finally {
    loading.value = false;
  }
};

const selectedDocs = computed(() => {
  return props.modelValue
    .map(id => documents.value.find(d => d.id === id))
    .filter((d): d is DocumentMetadata => !!d);
});

const unselectedDocs = computed(() => {
  return documents.value
    .filter(d => !props.modelValue.includes(d.id))
    .filter(d => d.title.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

const addDoc = (id: string) => {
  emit('update:modelValue', [...props.modelValue, id]);
};

const removeDoc = (id: string) => {
  emit('update:modelValue', props.modelValue.filter(d => d !== id));
};

const moveUp = (index: number) => {
  if (index === 0) return;
  const newValue = [...props.modelValue];
  [newValue[index - 1], newValue[index]] = [newValue[index], newValue[index - 1]];
  emit('update:modelValue', newValue);
};

const moveDown = (index: number) => {
  if (index === props.modelValue.length - 1) return;
  const newValue = [...props.modelValue];
  [newValue[index + 1], newValue[index]] = [newValue[index], newValue[index + 1]];
  emit('update:modelValue', newValue);
};

onMounted(() => {
  fetchDocuments();
});
</script>

<template>
  <div class="article-selector flex flex-col h-full bg-black bg-opacity-30 border border-cyber-primary rounded-lg overflow-hidden">
    <!-- Selected Articles (Orderable) -->
    <div class="flex-1 overflow-y-auto p-4 border-b border-cyber-primary">
      <h3 class="text-cyber-neon font-mono font-bold mb-4 text-sm uppercase">Selected Articles</h3>
      <div v-if="selectedDocs.length === 0" class="text-gray-500 text-sm italic text-center py-4">
        No articles selected
      </div>
      <div class="space-y-2">
        <div 
          v-for="(doc, index) in selectedDocs" 
          :key="doc.id"
          class="flex items-center justify-between p-2 bg-cyber-dark border border-gray-700 rounded group hover:border-cyber-green transition-colors"
        >
          <div class="flex items-center gap-2 overflow-hidden">
            <span class="text-cyber-green font-mono text-xs w-4">{{ index + 1 }}</span>
            <span class="text-sm truncate">{{ doc.title }}</span>
          </div>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button @click="moveUp(index)" class="p-1 hover:text-cyber-neon disabled:opacity-30" :disabled="index === 0">↑</button>
            <button @click="moveDown(index)" class="p-1 hover:text-cyber-neon disabled:opacity-30" :disabled="index === selectedDocs.length - 1">↓</button>
            <button @click="removeDoc(doc.id)" class="p-1 hover:text-red-500 ml-1"><X class="w-3 h-3" /></button>
          </div>
        </div>
      </div>
    </div>

    <!-- Available Articles (Searchable) -->
    <div class="h-1/2 flex flex-col p-4 bg-black bg-opacity-50">
      <h3 class="text-gray-400 font-mono font-bold mb-2 text-sm uppercase">Available Articles</h3>
      <div class="relative mb-3">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search articles..." 
          class="w-full bg-cyber-dark border border-gray-700 rounded px-3 py-1.5 pl-8 text-sm focus:border-cyber-neon focus:outline-none"
        />
        <Search class="w-3 h-3 text-gray-500 absolute left-2.5 top-2.5" />
      </div>
      
      <div class="flex-1 overflow-y-auto space-y-1">
        <div 
          v-for="doc in unselectedDocs" 
          :key="doc.id"
          @click="addDoc(doc.id)"
          class="flex items-center justify-between p-2 hover:bg-cyber-primary rounded cursor-pointer transition-colors group"
        >
          <span class="text-sm truncate text-gray-300 group-hover:text-white">{{ doc.title }}</span>
          <Plus class="w-3 h-3 text-gray-500 group-hover:text-cyber-green" />
        </div>
        <div v-if="unselectedDocs.length === 0" class="text-center text-gray-500 text-xs py-2">
          No articles found
        </div>
      </div>
    </div>
  </div>
</template>
