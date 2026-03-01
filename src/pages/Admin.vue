<script setup lang="ts">
	import { ref, onMounted, watch, computed } from "vue"
	import { useAuthStore } from "@/stores/auth"
	import { useCyberToast } from "@/composables/useCyberToast"
	import {
		Edit,
		Trash2,
		ExternalLink,
		FileText,
		Folder,
		Layers,
		GitBranch,
		Loader2,
		RotateCcw,
		Trash,
	} from "lucide-vue-next"
	import { useRouter, useRoute } from "vue-router"
	import type { DocumentMetadata } from "../../api/types"
	import { useI18n } from "vue-i18n"
	import { apiFetch } from "@/utils/api"
	import { syncDB, type LocalItem } from "@/utils/syncDB"
	import ConfirmDialog from "@/components/ConfirmDialog.vue"
	import ProjectManager from "@/components/ProjectManager.vue"
	import CollectionManager from "@/components/CollectionManager.vue"
	import StatusTag from "@/components/StatusTag.vue"
	import SyncPreview from "@/components/SyncPreview.vue"

	type DataSource = "local" | "remote"

	interface DocumentWithSource extends DocumentMetadata {
		_source: DataSource
		_localAction?: "create" | "update"
	}

	interface TrashItem {
		id: string
		itemId: string
		type: "document" | "project" | "collection"
		title: string
		deletedAt: number
		data?: {
			metadata: Record<string, unknown>
			content: string
		}
	}

	const authStore = useAuthStore()
	const router = useRouter()
	const route = useRoute()
	const documents = ref<DocumentWithSource[]>([])
	const localDocuments = ref<LocalItem[]>([])
	const loading = ref(true)
	const { t, locale } = useI18n()
	const showDeleteDialog = ref(false)
	const docToDelete = ref<string | null>(null)
	const { success, error, danger } = useCyberToast()
	const activeTab = ref<"documents" | "projects" | "collections" | "trash">(
		"documents",
	)
	const syncing = ref(false)
	const pendingCount = ref(0)
	const draftCount = ref(0)
	const showSyncPreview = ref(false)
	const syncPreviewItems = ref<
		{
			id: string
			type: "document" | "project" | "collection"
			action: "create" | "update" | "delete"
			title?: string
			data?: { metadata?: { title?: string; status?: string } }
		}[]
	>([])
	const trashItems = ref<TrashItem[]>([])
	const trashCount = ref(0)

	const fetchPendingCount = async () => {
		pendingCount.value = await syncDB.getQueueCount()
		draftCount.value = await syncDB.getDraftCount()
	}

	const fetchTrashItems = async () => {
		trashItems.value = await syncDB.getTrashItems()
	}

	const fetchTrashCount = async () => {
		trashCount.value = await syncDB.getTrashCount()
	}

	const syncToGitHub = async () => {
		if (syncing.value) return

		const allItems = await syncDB.getQueue()
		const items = allItems.filter((item) => {
			if (item.type === "document") {
				const metadata = item.data as { metadata?: { status?: string } }
				return metadata.metadata?.status !== "draft"
			}
			return true
		})

		if (items.length === 0) {
			const hasDrafts = allItems.some(
				(item) =>
					item.type === "document" &&
					(item.data as { metadata?: { status?: string } })?.metadata
						?.status === "draft",
			)
			if (hasDrafts) {
				success("草稿已保存到本地，不会同步到GitHub")
			} else {
				success("没有待同步的内容")
			}
			return
		}

		showSyncPreview.value = true
		syncPreviewItems.value = items.map((item) => ({
			id: item.id,
			type: item.type as "document" | "project" | "collection",
			action: item.action as "create" | "update" | "delete",
			title:
				(item.data as { metadata?: { title?: string } })?.metadata?.title ||
				item.id,
			data: item.data as {
				metadata?: { title?: string; status?: string }
			},
		}))
	}

	const handleSyncConfirm = async () => {
		showSyncPreview.value = false
		await performSync()
	}

	const performSync = async () => {
		if (syncing.value) return

		const allItems = await syncDB.getQueue()
		const items = allItems.filter((item) => {
			if (item.type === "document") {
				const metadata = item.data as { metadata?: { status?: string } }
				return metadata.metadata?.status !== "draft"
			}
			return true
		})

		syncing.value = true
		try {
			const res = await apiFetch("/sync", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authStore.token}`,
				},
				body: JSON.stringify({ items }),
			})

			const data = await res.json()
			if (data.success) {
				const syncedIds = items.map((item) => item.id)

				for (const item of allItems) {
					if (syncedIds.includes(item.id)) {
						await syncDB.removeFromQueue(item.id)
					}
				}

				const draftCount = await syncDB.getDraftCount()
				if (draftCount > 0) {
					await syncDB.clearDrafts()
					success(data.message || "同步成功", 5000, {
						detail: `已同步 ${items.length} 项，草稿已从本地清除 (${draftCount} 个)`,
					})
				} else {
					success(data.message || "同步成功")
				}

				await fetchPendingCount()
				fetchDocuments()
			} else {
				error(data.error || "同步失败")
			}
		} catch (e) {
			error("同步失败")
		} finally {
			syncing.value = false
		}
	}

	const fetchDocuments = async () => {
		loading.value = true
		try {
			const [draftsRes, publishedRes, localDocs] = await Promise.all([
				apiFetch("/documents?status=draft"),
				apiFetch("/documents?status=published"),
				syncDB.getLocalDocuments(),
			])

			const draftsData = await draftsRes.json()
			const publishedData = await publishedRes.json()

			localDocuments.value = localDocs

			const remoteDocs: DocumentWithSource[] = [
				...(draftsData.success ? draftsData.data : []),
				...(publishedData.success ? publishedData.data : []),
			].map((doc) => ({
				...doc,
				_source: "remote" as DataSource,
			}))

			const localDocsWithSource: DocumentWithSource[] = localDocs.map(
				(doc) => ({
					id: doc.metadata.id as string,
					title: doc.metadata.title as string,
					slug: doc.metadata.slug as string,
					description: doc.metadata.description as string,
					status: doc.metadata.status as "draft" | "published",
					createdAt: doc.metadata.createdAt as string,
					updatedAt: new Date(doc.timestamp).toISOString(),
					publishedAt: doc.metadata.publishedAt as string,
					tags: doc.metadata.tags as string[],
					coverImage: doc.metadata.coverImage as string,
					author: doc.metadata.author as string,
					category: doc.metadata.category as string,
					_source: "local" as DataSource,
					_localAction: doc.action,
				}),
			)

			const mergedDocs = [...localDocsWithSource]
			for (const remoteDoc of remoteDocs) {
				const localIndex = mergedDocs.findIndex((d) => d.id === remoteDoc.id)
				if (localIndex >= 0) {
					mergedDocs[localIndex] = remoteDoc
				} else {
					mergedDocs.push(remoteDoc)
				}
			}

			const trashItems = await syncDB.getTrashItems()
			const trashDocIds = trashItems
				.filter((item) => item.type === "document")
				.map((item) => item.itemId)

			const filteredDocs = mergedDocs.filter(
				(doc) => !trashDocIds.includes(doc.id),
			)

			documents.value = filteredDocs.sort(
				(a, b) =>
					new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
			)
		} catch (e) {
			error(t("admin.fetchError"))
		} finally {
			loading.value = false
		}
	}

	const confirmDelete = (doc: DocumentWithSource) => {
		docToDelete.value = doc.id
		showDeleteDialog.value = true
	}

	const deleteDocument = async () => {
		if (!docToDelete.value) return
		try {
			const doc = documents.value.find((d) => d.id === docToDelete.value)
			if (doc) {
				await syncDB.addToTrash({
					id: `trash-doc-${docToDelete.value}`,
					itemId: docToDelete.value,
					type: "document",
					title: doc.title,
					deletedAt: Date.now(),
					data: {
						metadata: JSON.parse(JSON.stringify(doc)),
						content: "",
					},
				})
			}
			await syncDB.deleteDocument(docToDelete.value)
			await fetchTrashItems()
			await fetchTrashCount()
			await fetchPendingCount()
			await fetchDocuments()
			danger("已移入回收站，请在回收站中删除或恢复")
			showDeleteDialog.value = false
			docToDelete.value = null
		} catch (e) {
			console.error("删除失败:", e)
			error("删除失败: " + (e instanceof Error ? e.message : String(e)))
		}
	}

	const restoreFromTrash = async (item: TrashItem) => {
		try {
			await syncDB.removeFromTrash(item.id)
			await fetchTrashItems()
			await fetchTrashCount()
			success(`已恢复: ${item.title}`)
		} catch (e) {
			error("恢复失败")
		}
	}

	const permanentDelete = async (item: TrashItem) => {
		try {
			await syncDB.removeFromTrash(item.id)
			await syncDB.addToQueue({
				id: `perm-delete-${item.itemId}-${Date.now()}`,
				type: "delete",
				action: "delete",
				data: { id: item.itemId, type: item.type },
				timestamp: Date.now(),
			})
			await fetchTrashItems()
			await fetchTrashCount()
			await fetchPendingCount()
			danger(`已永久删除: ${item.title}`, 5000, {
				detail: "已添加到待同步队列，点击「同步到GitHub」执行删除",
			})
		} catch (e) {
			error("删除失败")
		}
	}

	const emptyTrash = async () => {
		try {
			const items = await syncDB.getTrashItems()
			for (const item of items) {
				await syncDB.addToQueue({
					id: `perm-delete-${item.itemId}-${Date.now()}`,
					type: "delete",
					action: "delete",
					data: { id: item.itemId, type: item.type },
					timestamp: Date.now(),
				})
			}
			await syncDB.clearTrash()
			await fetchTrashItems()
			await fetchTrashCount()
			await fetchPendingCount()
			danger("已清空回收站")
		} catch (e) {
			error("清空失败")
		}
	}

	const editDocument = (id: string) => {
		router.push(`/editor/doc/${id}`)
	}

	onMounted(async () => {
		await syncDB.init()
		fetchPendingCount()
		fetchDocuments()
		fetchTrashItems()
		fetchTrashCount()

		if (window.location.hash === "#projects") {
			activeTab.value = "projects"
		} else if (window.location.hash === "#trash") {
			activeTab.value = "trash"
		}
	})

	watch(
		() => route.hash,
		(hash) => {
			if (hash === "#projects") {
				activeTab.value = "projects"
			} else if (hash === "#trash") {
				activeTab.value = "trash"
			} else {
				activeTab.value = "documents"
			}
		},
	)
</script>

<template>
	<div class="min-h-screen bg-cyber-dark text-white pt-20 px-4">
		<div class="container mx-auto">
			<div class="flex items-center justify-between mb-8">
				<h1 class="text-3xl font-bold text-cyber-neon font-mono">
					{{ t("admin.title") }}
				</h1>
				<button
					@click="syncToGitHub"
					:disabled="syncing"
					class="flex items-center gap-2 px-4 py-2 border-2 rounded font-mono transition-all"
					:class="
						syncing
							? 'border-gray-700 text-gray-500 cursor-not-allowed'
							: pendingCount > 0
								? 'border-cyber-green text-cyber-green bg-cyber-green bg-opacity-10 hover:bg-opacity-20'
								: 'border-gray-700 text-gray-500 hover:border-cyber-green hover:text-cyber-green'
					"
				>
					<Loader2
						v-if="syncing"
						class="w-5 h-5 animate-spin"
					/>
					<GitBranch
						v-else
						class="w-5 h-5"
					/>
					<span>{{ syncing ? "同步中..." : "同步到GitHub" }}</span>
					<span
						v-if="pendingCount > 0"
						class="ml-1 px-2 py-0.5 bg-cyber-green text-black text-xs rounded-full"
					>
						{{ pendingCount }}
					</span>
					<span
						v-if="draftCount > 0"
						class="ml-1 px-2 py-0.5 bg-yellow-500 text-black text-xs rounded-full"
						title="草稿不会同步"
					>
						📝 {{ draftCount }}
					</span>
				</button>
			</div>

			<!-- Tabs -->
			<div class="flex gap-4 mb-6">
				<button
					@click="activeTab = 'documents'"
					class="flex items-center gap-2 px-6 py-3 border-2 rounded font-mono transition-all"
					:class="
						activeTab === 'documents'
							? 'border-cyber-green text-cyber-green bg-cyber-green bg-opacity-10'
							: 'border-gray-700 text-gray-500 hover:border-cyber-green hover:text-cyber-green'
					"
				>
					<FileText class="w-5 h-5" />
					<span>{{ t("admin.documents") }}</span>
				</button>
				<button
					@click="activeTab = 'projects'"
					class="flex items-center gap-2 px-6 py-3 border-2 rounded font-mono transition-all"
					:class="
						activeTab === 'projects'
							? 'border-cyber-green text-cyber-green bg-cyber-green bg-opacity-10'
							: 'border-gray-700 text-gray-500 hover:border-cyber-green hover:text-cyber-green'
					"
				>
					<Folder class="w-5 h-5" />
					<span>{{ t("admin.projects") }}</span>
				</button>
				<button
					@click="activeTab = 'collections'"
					class="flex items-center gap-2 px-6 py-3 border-2 rounded font-mono transition-all"
					:class="
						activeTab === 'collections'
							? 'border-cyber-green text-cyber-green bg-cyber-green bg-opacity-10'
							: 'border-gray-700 text-gray-500 hover:border-cyber-green hover:text-cyber-green'
					"
				>
					<Layers class="w-5 h-5" />
					<span>{{ t("admin.collections") }}</span>
				</button>
				<button
					@click="activeTab = 'trash'"
					class="flex items-center gap-2 px-6 py-3 border-2 rounded font-mono transition-all"
					:class="
						activeTab === 'trash'
							? 'border-cyber-green text-cyber-green bg-cyber-green bg-opacity-10'
							: 'border-gray-700 text-gray-500 hover:border-cyber-green hover:text-cyber-green'
					"
				>
					<Trash class="w-5 h-5" />
					<span>回收站</span>
					<span
						v-if="trashCount > 0"
						class="ml-1 px-2 py-0.5 bg-cyber-pink text-black text-xs rounded-full"
					>
						{{ trashCount }}
					</span>
				</button>
			</div>

			<!-- Documents Tab -->
			<div
				v-if="activeTab === 'documents'"
				class="bg-black bg-opacity-50 border border-cyber-primary rounded overflow-hidden"
			>
				<table class="w-full text-left border-collapse">
					<thead>
						<tr class="bg-cyber-primary text-cyber-neon font-mono text-sm">
							<th class="p-4 border-b border-gray-700">
								{{ t("admin.table.title") }}
							</th>
							<th class="p-4 border-b border-gray-700">
								{{ t("admin.table.status") }}
							</th>
							<th class="p-4 border-b border-gray-700">
								{{ t("admin.table.updated") }}
							</th>
							<th class="p-4 border-b border-gray-700">
								{{ t("admin.table.actions") }}
							</th>
						</tr>
					</thead>
					<tbody class="font-mono text-sm">
						<tr v-if="loading">
							<td
								colspan="4"
								class="p-4 text-center text-cyber-green"
							>
								{{ t("admin.loading") }}
							</td>
						</tr>
						<tr v-else-if="documents.length === 0">
							<td
								colspan="4"
								class="p-4 text-center text-gray-500"
							>
								{{ t("admin.noDocs") }}
							</td>
						</tr>
						<tr
							v-for="doc in documents"
							:key="doc.id"
							class="border-b border-gray-800 hover:bg-white hover:bg-opacity-5 transition-colors"
						>
							<td class="p-4 font-bold">{{ doc.title }}</td>
							<td class="p-4">
								<div class="flex flex-wrap gap-2">
									<StatusTag
										:status="
											doc.operationStatus ||
											(doc.status === 'published' ? 'published' : 'draft')
										"
										:show-icon="true"
									/>
									<span
										v-if="doc._source === 'local'"
										class="px-2 py-1 rounded text-xs font-bold"
										:class="
											doc._localAction === 'create'
												? 'bg-yellow-500 text-black'
												: 'bg-orange-500 text-black'
										"
									>
										{{
											doc._localAction === "create" ? "本地新增" : "本地更新"
										}}
									</span>
									<span
										v-else
										class="px-2 py-1 rounded text-xs font-bold bg-gray-600 text-white"
									>
										已同步
									</span>
								</div>
							</td>
							<td class="p-4 text-gray-400">
								{{ new Date(doc.updatedAt).toLocaleDateString(locale) }}
							</td>
							<td class="p-4 flex gap-2">
								<button
									@click="editDocument(doc.id)"
									class="text-cyber-neon hover:text-white"
									:title="t('admin.edit')"
								>
									<Edit class="w-4 h-4" />
								</button>
								<a
									v-if="doc.status === 'published'"
									:href="`/doc/${doc.id}`"
									target="_blank"
									class="text-cyber-green hover:text-white"
									:title="t('admin.view')"
								>
									<ExternalLink class="w-4 h-4" />
								</a>
								<button
									@click="confirmDelete(doc)"
									class="text-red-500 hover:text-white"
									:title="t('admin.delete')"
								>
									<Trash2 class="w-4 h-4" />
								</button>
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<!-- Projects Tab -->
			<ProjectManager v-if="activeTab === 'projects'" />

			<!-- Collections Tab -->
			<CollectionManager v-if="activeTab === 'collections'" />

			<!-- Trash Tab -->
			<div
				v-if="activeTab === 'trash'"
				class="bg-black bg-opacity-50 border border-cyber-primary rounded overflow-hidden"
			>
				<div
					class="flex justify-between items-center p-4 border-b border-gray-700"
				>
					<h3 class="text-cyber-neon font-mono">回收站</h3>
					<button
						v-if="trashItems.length > 0"
						@click="emptyTrash"
						class="px-4 py-2 border border-red-500 text-red-500 rounded font-mono text-sm hover:bg-red-500 hover:text-white transition-all"
					>
						清空回收站
					</button>
				</div>
				<table class="w-full text-left border-collapse">
					<thead>
						<tr class="bg-cyber-primary text-cyber-neon font-mono text-sm">
							<th class="p-4 border-b border-gray-700">类型</th>
							<th class="p-4 border-b border-gray-700">标题</th>
							<th class="p-4 border-b border-gray-700">删除时间</th>
							<th class="p-4 border-b border-gray-700">操作</th>
						</tr>
					</thead>
					<tbody class="font-mono text-sm">
						<tr v-if="trashItems.length === 0">
							<td
								colspan="4"
								class="p-4 text-center text-gray-500"
							>
								回收站是空的
							</td>
						</tr>
						<tr
							v-for="item in trashItems"
							:key="item.id"
							class="border-b border-gray-800 hover:bg-white hover:bg-opacity-5 transition-colors"
						>
							<td class="p-4">
								<span
									class="px-2 py-1 rounded text-xs font-bold"
									:class="{
										'bg-cyber-green text-black': item.type === 'document',
										'bg-blue-500 text-white': item.type === 'project',
										'bg-purple-500 text-white': item.type === 'collection',
									}"
								>
									{{
										item.type === "document"
											? "文档"
											: item.type === "project"
												? "项目"
												: "合集"
									}}
								</span>
							</td>
							<td class="p-4 font-bold">{{ item.title }}</td>
							<td class="p-4 text-gray-400">
								{{ new Date(item.deletedAt).toLocaleString() }}
							</td>
							<td class="p-4 flex gap-2">
								<button
									@click="restoreFromTrash(item)"
									class="text-cyber-green hover:text-white"
									title="恢复"
								>
									<RotateCcw class="w-4 h-4" />
								</button>
								<button
									@click="permanentDelete(item)"
									class="text-red-500 hover:text-white"
									title="永久删除"
								>
									<Trash2 class="w-4 h-4" />
								</button>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

		<ConfirmDialog
			:show="showDeleteDialog"
			:title="t('admin.delete')"
			:message="t('admin.deleteConfirm')"
			confirm-text="删除"
			cancel-text="取消"
			type="danger"
			@confirm="deleteDocument"
			@cancel="showDeleteDialog = false"
		/>

		<SyncPreview
			:visible="showSyncPreview"
			:items="syncPreviewItems"
			@close="showSyncPreview = false"
			@confirm="handleSyncConfirm"
		/>
	</div>
</template>
