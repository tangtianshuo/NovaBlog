<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MarkdownViewer from '@/components/MarkdownViewer.vue';
import { useCyberToast } from '@/composables/useCyberToast';
import { ExternalLink, ArrowLeft } from 'lucide-vue-next';
import type { Project } from '../../api/types';
import { apiFetch } from '@/utils/api';
import { useI18n } from 'vue-i18n';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { error } = useCyberToast();

const project = ref<Project | null>(null);
const loading = ref(true);

const fetchProject = async () => {
  loading.value = true;
  try {
    const res = await apiFetch(`/projects/${route.params.id}`);
    const data = await res.json();
    if (data.success) {
      project.value = data.data;
    } else {
      error(t('project.loadError'));
    }
  } catch (e) {
    error(t('project.loadError'));
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  fetchProject();
});
</script>

<template>
  <div class="project-detail">
    <div class="container">
      <!-- Back Button -->
      <button 
        @click="goBack" 
        class="back-button"
      >
        <ArrowLeft class="w-5 h-5" />
        <span>{{ t('project.back') }}</span>
      </button>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>{{ t('project.loading') }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="!project" class="error-state">
        <p>{{ t('project.notFound') }}</p>
        <button 
          @click="goBack" 
          class="error-button"
        >
          {{ t('project.back') }}
        </button>
      </div>

      <!-- Project Content -->
      <div v-else class="project-content">
        <!-- Header -->
        <div class="project-header">
          <div class="header-left">
            <h1 class="project-title">{{ project.metadata.title }}</h1>
            <p class="project-description">{{ project.metadata.description }}</p>
            <div class="project-tags">
              <span 
                v-for="tag in project.metadata.tags" 
                :key="tag" 
                class="tag"
              >
                #{{ tag }}
              </span>
            </div>
          </div>
          <div class="header-right">
            <a 
              v-if="project.metadata.link" 
              :href="project.metadata.link" 
              target="_blank" 
              class="project-link"
            >
              <ExternalLink class="w-5 h-5" />
              <span>{{ t('project.visitLink') }}</span>
            </a>
          </div>
        </div>

        <!-- Image -->
        <div class="project-image-container">
          <img 
            :src="project.metadata.imageUrl" 
            :alt="project.metadata.title" 
            class="project-image"
          />
        </div>

        <!-- Content -->
        <div class="markdown-content">
          <MarkdownViewer :content="project.content" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-detail {
  min-height: 100vh;
  background: #0d0d0d;
  color: #e0e0e0;
  padding: 100px 20px 60px;
}

.container {
  max-width: 900px;
  margin: 0 auto;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(0, 255, 255, 0.1);
  border: 2px solid #00ffff;
  border-radius: 4px;
  color: #00ffff;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 30px;
}

.back-button:hover {
  background: rgba(0, 255, 255, 0.2);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.4);
  transform: translateX(-5px);
}

.loading-state,
.error-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(0, 255, 255, 0.3);
  border-top-color: #00ffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-button {
  margin-top: 20px;
  padding: 12px 20px;
  background: rgba(255, 0, 110, 0.1);
  border: 2px solid #ff006e;
  border-radius: 4px;
  color: #ff006e;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.error-button:hover {
  background: rgba(255, 0, 110, 0.2);
  box-shadow: 0 0 15px rgba(255, 0, 110, 0.4);
}

.project-content {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 30px;
  margin-bottom: 30px;
  padding-bottom: 30px;
  border-bottom: 2px solid rgba(0, 255, 255, 0.3);
}

.header-left {
  flex: 1;
}

.project-title {
  font-family: 'Courier New', Courier, monospace;
  font-size: 36px;
  font-weight: bold;
  color: #00ffff;
  margin: 0 0 15px 0;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
  line-height: 1.2;
}

.project-description {
  font-size: 16px;
  color: #999;
  margin: 0 0 15px 0;
  line-height: 1.6;
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag {
  font-size: 14px;
  color: #ff006e;
  border: 1px solid #ff006e;
  padding: 6px 12px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  transition: all 0.3s ease;
}

.tag:hover {
  background: rgba(255, 0, 110, 0.1);
  box-shadow: 0 0 10px rgba(255, 0, 110, 0.3);
}

.header-right {
  flex-shrink: 0;
}

.project-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  background: rgba(57, 255, 20, 0.1);
  border: 2px solid #39ff14;
  border-radius: 4px;
  color: #39ff14;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.project-link:hover {
  background: rgba(57, 255, 20, 0.2);
  box-shadow: 0 0 15px rgba(57, 255, 20, 0.4);
  transform: scale(1.05);
}

.project-image-container {
  width: 100%;
  margin-bottom: 40px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid rgba(0, 255, 255, 0.3);
}

.project-image {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.3s ease;
}

.project-image:hover {
  transform: scale(1.02);
}

.markdown-content {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(0, 255, 255, 0.2);
  border-radius: 8px;
  padding: 30px;
}

.markdown-content :deep(h1) {
  font-family: 'Courier New', Courier, monospace;
  color: #00ffff;
  margin-top: 30px;
  margin-bottom: 15px;
  font-size: 28px;
}

.markdown-content :deep(h2) {
  font-family: 'Courier New', Courier, monospace;
  color: #00ffff;
  margin-top: 25px;
  margin-bottom: 12px;
  font-size: 24px;
}

.markdown-content :deep(p) {
  line-height: 1.8;
  margin-bottom: 15px;
}

.markdown-content :deep(code) {
  background: rgba(0, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', Courier, monospace;
  color: #00ffff;
}

.markdown-content :deep(pre) {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 6px;
  padding: 20px;
  overflow-x: auto;
  margin: 20px 0;
}

.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
}

.markdown-content :deep(a) {
  color: #ff006e;
  text-decoration: none;
  transition: all 0.3s ease;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
  box-shadow: 0 0 10px rgba(255, 0, 110, 0.3);
}
</style>
