<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useCyberToast } from '@/composables/useCyberToast';
import { Edit, Trash2, Plus, ExternalLink } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import type { ProjectMetadata } from '../../api/types';
import { useI18n } from 'vue-i18n';
import { apiFetch } from '@/utils/api';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const authStore = useAuthStore();
const router = useRouter();
const projects = ref<ProjectMetadata[]>([]);
const loading = ref(true);
const { t, locale } = useI18n();
const showDeleteDialog = ref(false);
const projectToDelete = ref<string | null>(null);
const { success, error, danger } = useCyberToast();

const fetchProjects = async () => {
  loading.value = true;
  try {
    const res = await apiFetch('/projects');
    const data = await res.json();
    if (data.success) {
      projects.value = data.data;
    } else {
      error(data.error || 'Failed to fetch projects');
    }
  } catch (e) {
    error(t('admin.fetchError'));
  } finally {
    loading.value = false;
  }
};

const confirmDelete = (project: ProjectMetadata) => {
  projectToDelete.value = project.id;
  showDeleteDialog.value = true;
};

const deleteProject = async () => {
  if (!projectToDelete.value) return;
  try {
    const res = await apiFetch(`/projects/${projectToDelete.value}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    });
    if (res.ok) {
      danger(t('admin.deleted'));
      fetchProjects();
      showDeleteDialog.value = false;
      projectToDelete.value = null;
    }
  } catch (e) {
    error(t('admin.deleteError'));
  }
};

const editProject = (id: string) => {
  router.push(`/editor/project/${id}`);
};

const createProject = () => {
  router.push('/editor/project');
};

onMounted(() => {
  fetchProjects();
});
</script>

<template>
  <div class="project-manager">
    <div class="manager-header">
      <h2 class="manager-title">{{ t('admin.projects') }}</h2>
      <button 
        @click="createProject" 
        class="manager-btn manager-btn-create"
      >
        <Plus class="w-5 h-5" />
        <span>{{ t('admin.createProject') }}</span>
      </button>
    </div>

    <div v-if="loading" class="manager-loading">
      <div class="loading-spinner"></div>
      <p>{{ t('admin.loading') }}</p>
    </div>

    <div v-else-if="projects.length === 0" class="manager-empty">
      <p>{{ t('admin.noProjects') }}</p>
      <button 
        @click="createProject" 
        class="manager-btn manager-btn-empty"
      >
        <Plus class="w-5 h-5" />
        <span>{{ t('admin.createProject') }}</span>
      </button>
    </div>

    <div v-else class="manager-content">
      <div class="project-grid">
        <div 
          v-for="project in projects" 
          :key="project.id" 
          class="project-item"
        >
          <div class="project-image">
            <img :src="project.imageUrl" :alt="project.title" />
          </div>
          <div class="project-info">
            <h3 class="project-title">{{ project.title }}</h3>
            <p class="project-description">{{ project.description }}</p>
            <div class="project-meta">
              <div class="project-tags">
                <span 
                  v-for="tag in project.tags" 
                  :key="tag" 
                  class="tag"
                >
                  #{{ tag }}
                </span>
              </div>
              <div class="project-actions">
                <a 
                  v-if="project.link" 
                  :href="project.link" 
                  target="_blank" 
                  class="action-link"
                >
                  <ExternalLink class="w-4 h-4" />
                </a>
                <button 
                  @click="editProject(project.id)" 
                  class="action-btn action-btn-edit"
                >
                  <Edit class="w-4 h-4" />
                </button>
                <button 
                  @click="confirmDelete(project)" 
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
      @confirm="deleteProject"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<style scoped>
.project-manager {
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

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.project-item {
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid #333;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.project-item:hover {
  border-color: #00ffff;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
  transform: translateY(-2px);
}

.project-image {
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
  background: #111;
}

.project-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.project-item:hover .project-image img {
  transform: scale(1.05);
}

.project-info {
  padding: 16px;
}

.project-title {
  font-family: 'Courier New', Courier, monospace;
  font-size: 18px;
  font-weight: bold;
  color: #00ffff;
  margin: 0 0 8px 0;
  text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
}

.project-description {
  font-size: 14px;
  color: #999;
  margin: 0 0 12px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  font-size: 12px;
  color: #ff006e;
  border: 1px solid #ff006e;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', Courier, monospace;
}

.project-actions {
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
