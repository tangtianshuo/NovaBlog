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
	} from "lucide-vue-next"
	import { useRouter, useRoute } from "vue-router"
	import type { DocumentMetadata } from "../../api/types"
	import { useI18n } from "vue-i18n"
	import { apiFetch } from "@/utils/api"
	import { syncDB, type LocalItem } from "@/utils/syncDB"
	import ConfirmDialog from "@/components/ConfirmDialog.vue"
	import ProjectManager from "@/components/ProjectManager.vue"
	import CollectionManager from "@/components/CollectionManager.vue"

	type DataSource = "local" | "remote"

	interface DocumentWithSource extends DocumentMetadata {
		_source: DataSource
		_localAction?: "create" | "update"
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
	const activeTab = ref<"documents" | "projects" | "collections">("documents")
	const syncing = ref(false)
	const pendingCount = ref(0)

	const fetchPendingCount = async () => {
		pendingCount.value = await syncDB.getQueueCount()
	}

	const syncToGitHub = async () => {
		if (syncing.value) return

		const items = await syncDB.getQueue()
		if (items.length === 0) {
			success("没有待同步的内容")
			return
		}

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
				await syncDB.clearQueue()
				pendingCount.value = 0
				success(data.message || "同步成功")
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

			documents.value = mergedDocs.sort(
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
			await syncDB.deleteDocument(docToDelete.value)
			danger('已标记删除，请点击"同步到GitHub"按钮')
			fetchPendingCount()
			fetchDocuments()
			showDeleteDialog.value = false
			docToDelete.value = null
		} catch (e) {
			error("删除失败")
		}
	}

	const editDocument = (id: string) => {
		router.push(`/editor/doc/${id}`)
	}

	onMounted(async () => {
		await syncDB.init()
		fetchPendingCount()
		fetchDocuments()

		if (window.location.hash === "#projects") {
			activeTab.value = "projects"
		}
	})

	watch(
		() => route.hash,
		(hash) => {
			if (hash === "#projects") {
				activeTab.value = "projects"
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
									<span
										class="px-2 py-1 rounded text-xs font-bold"
										:class="
											doc.status === 'published'
												? 'bg-cyber-green text-black'
												: 'bg-cyber-pink text-black'
										"
									>
										{{ t(`common.status.${doc.status}`) }}
									</span>
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
	</div>
</template>
