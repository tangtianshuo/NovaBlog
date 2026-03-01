<script setup lang="ts">
import { computed } from 'vue'
import { X, FileText, Folder, Layers, Plus, Edit, Trash2 } from 'lucide-vue-next'

interface SyncItem {
  id: string
  type: 'document' | 'project' | 'collection'
  action: 'create' | 'update' | 'delete'
  title?: string
  data?: {
    metadata?: {
      title?: string
      status?: string
    }
  }
}

const props = defineProps<{
  items: SyncItem[]
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const groupedItems = computed(() => {
  const create: SyncItem[] = []
  const update: SyncItem[] = []
  const remove: SyncItem[] = []

  props.items.forEach(item => {
    if (item.action === 'create') {
      create.push(item)
    } else if (item.action === 'update') {
      update.push(item)
    } else if (item.action === 'delete') {
      remove.push(item)
    }
  })

  return { create, update, remove }
})

const getItemTitle = (item: SyncItem): string => {
  if (item.title) return item.title
  if (item.data?.metadata?.title) return item.data.metadata.title
  return item.id
}

const getItemIcon = (type: string) => {
  switch (type) {
    case 'document': return FileText
    case 'project': return Folder
    case 'collection': return Layers
    default: return FileText
  }
}

const getActionLabel = (action: string) => {
  switch (action) {
    case 'create': return '创建'
    case 'update': return '更新'
    case 'delete': return '删除'
    default: return action
  }
}

const commitMessage = computed(() => {
  const now = new Date()
  const timeStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

  const counts = groupedItems.value
  const parts: string[] = []

  if (counts.create.length > 0) parts.push(`新增 ${counts.create.length}`)
  if (counts.update.length > 0) parts.push(`更新 ${counts.update.length}`)
  if (counts.remove.length > 0) parts.push(`删除 ${counts.remove.length}`)

  return parts.length > 0
    ? `update: ${parts.join(' | ')} (${timeStr})`
    : `sync: ${timeStr}`
})
</script>

<template>
  <div v-if="visible" class="sync-preview-overlay" @click.self="emit('close')">
    <div class="sync-preview-panel">
      <div class="panel-header">
        <h3>📋 即将同步到 GitHub</h3>
        <button class="close-btn" @click="emit('close')">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="panel-content">
        <div class="sync-stats">
          <div class="stat-item create">
            <Plus class="w-4 h-4" />
            <span>新增: {{ groupedItems.create.length }}</span>
          </div>
          <div class="stat-item update">
            <Edit class="w-4 h-4" />
            <span>更新: {{ groupedItems.update.length }}</span>
          </div>
          <div class="stat-item delete">
            <Trash2 class="w-4 h-4" />
            <span>删除: {{ groupedItems.remove.length }}</span>
          </div>
        </div>

        <div class="sync-list">
          <div v-if="groupedItems.create.length > 0" class="list-section">
            <h4 class="section-title create">📝 新增项目</h4>
            <ul>
              <li v-for="item in groupedItems.create" :key="item.id" class="sync-item create">
                <span class="action">[创建]</span>
                <component :is="getItemIcon(item.type)" class="w-3 h-3" />
                <span class="type">[{{ item.type === 'document' ? '文档' : item.type === 'project' ? '项目' : '合集' }}]</span>
                <span class="title">{{ getItemTitle(item) }}</span>
              </li>
            </ul>
          </div>

          <div v-if="groupedItems.update.length > 0" class="list-section">
            <h4 class="section-title update">✏️ 更新项目</h4>
            <ul>
              <li v-for="item in groupedItems.update" :key="item.id" class="sync-item update">
                <span class="action">[更新]</span>
                <component :is="getItemIcon(item.type)" class="w-3 h-3" />
                <span class="type">[{{ item.type === 'document' ? '文档' : item.type === 'project' ? '项目' : '合集' }}]</span>
                <span class="title">{{ getItemTitle(item) }}</span>
              </li>
            </ul>
          </div>

          <div v-if="groupedItems.remove.length > 0" class="list-section">
            <h4 class="section-title delete">🗑️ 删除项目</h4>
            <ul>
              <li v-for="item in groupedItems.remove" :key="item.id" class="sync-item delete">
                <span class="action">[删除]</span>
                <component :is="getItemIcon(item.type)" class="w-3 h-3" />
                <span class="type">[{{ item.type === 'document' ? '文档' : item.type === 'project' ? '项目' : '合集' }}]</span>
                <span class="title">{{ getItemTitle(item) }}</span>
              </li>
            </ul>
          </div>

          <div v-if="items.length === 0" class="empty-state">
            没有待同步的内容
          </div>
        </div>

        <div class="commit-preview">
          <label>提交信息:</label>
          <code>{{ commitMessage }}</code>
        </div>

        <div class="draft-warning" v-if="items.length > 0">
          <span class="warning-icon">⚠️</span>
          <span>草稿不会同步到 GitHub</span>
        </div>
      </div>

      <div class="panel-footer">
        <button class="btn-cancel" @click="emit('close')">取消</button>
        <button
          class="btn-confirm"
          :disabled="items.length === 0"
          @click="emit('confirm')"
        >
          确认同步
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sync-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.sync-preview-panel {
  background: #0d0d0d;
  border: 2px solid #39ff14;
  box-shadow: 0 0 20px rgba(57, 255, 20, 0.3);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  font-family: 'Courier New', Courier, monospace;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #333;
}

.panel-header h3 {
  color: #39ff14;
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
}

.close-btn:hover {
  color: #fff;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.sync-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
}

.stat-item.create {
  background: rgba(57, 255, 20, 0.1);
  color: #39ff14;
  border: 1px solid #39ff14;
}

.stat-item.update {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid #3b82f6;
}

.stat-item.delete {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid #ef4444;
}

.sync-list {
  margin-bottom: 20px;
}

.list-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  margin-bottom: 8px;
  padding: 4px 0;
}

.section-title.create {
  color: #39ff14;
}

.section-title.update {
  color: #3b82f6;
}

.section-title.delete {
  color: #ef4444;
}

.sync-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sync-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  margin-bottom: 4px;
  font-size: 13px;
}

.sync-item.create .action {
  color: #39ff14;
}

.sync-item.update .action {
  color: #3b82f6;
}

.sync-item.delete .action {
  color: #ef4444;
}

.sync-item .type {
  color: #888;
}

.sync-item .title {
  color: #fff;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.commit-preview {
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #333;
  margin-bottom: 12px;
}

.commit-preview label {
  display: block;
  color: #888;
  font-size: 12px;
  margin-bottom: 4px;
}

.commit-preview code {
  color: #39ff14;
  font-size: 13px;
}

.draft-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  color: #fbbf24;
  font-size: 12px;
}

.empty-state {
  text-align: center;
  color: #666;
  padding: 40px;
}

.panel-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #333;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 10px 20px;
  background: transparent;
  border: 1px solid #666;
  color: #888;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.3s;
}

.btn-cancel:hover {
  border-color: #fff;
  color: #fff;
}

.btn-confirm {
  padding: 10px 24px;
  background: #39ff14;
  border: none;
  color: #000;
  font-weight: bold;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.3s;
}

.btn-confirm:hover:not(:disabled) {
  background: #32d912;
}

.btn-confirm:disabled {
  background: #333;
  color: #666;
  cursor: not-allowed;
}
</style>
