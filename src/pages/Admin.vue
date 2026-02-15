<script setup lang="ts">
	import { ref, onMounted, watch } from "vue"
	import { useAuthStore } from "@/stores/auth"
	import { useCyberToast } from "@/composables/useCyberToast"
	import { Edit, Trash2, ExternalLink, FileText, Folder } from "lucide-vue-next"
	import { useRouter, useRoute } from "vue-router"
	import type { DocumentMetadata } from "../../api/types"
	import { useI18n } from "vue-i18n"
	import { apiFetch } from "@/utils/api"
	import ConfirmDialog from "@/components/ConfirmDialog.vue"
	import ProjectManager from "@/components/ProjectManager.vue"

	const authStore = useAuthStore()
	const router = useRouter()
	const route = useRoute()
	const documents = ref<DocumentMetadata[]>([])
	const loading = ref(true)
	const { t, locale } = useI18n()
	const showDeleteDialog = ref(false)
	const docToDelete = ref<string | null>(null)
	const { success, error, danger } = useCyberToast()
	const activeTab = ref<"documents" | "projects">("documents")

	const fetchDocuments = async () => {
		loading.value = true
		try {
			// Fetch both drafts and published
			const [draftsRes, publishedRes] = await Promise.all([
				apiFetch("/documents?status=draft"),
				apiFetch("/documents?status=published"),
			])

			const draftsData = await draftsRes.json()
			const publishedData = await publishedRes.json()

			documents.value = [
				...(draftsData.success ? draftsData.data : []),
				...(publishedData.success ? publishedData.data : []),
			].sort(
				(a, b) =>
					new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
			)
		} catch (e) {
			error(t("admin.fetchError"))
		} finally {
			loading.value = false
		}
	}

	const confirmDelete = (doc: DocumentMetadata) => {
		docToDelete.value = doc.id
		showDeleteDialog.value = true
	}

	const deleteDocument = async () => {
		if (!docToDelete.value) return
		try {
			const res = await apiFetch(`/documents/${docToDelete.value}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${authStore.token}`,
				},
			})
			if (res.ok) {
				danger(t("admin.deleted"))
				fetchDocuments()
				showDeleteDialog.value = false
				docToDelete.value = null
			}
		} catch (e) {
			error(t("admin.deleteError"))
		}
	}

	const editDocument = (id: string) => {
		router.push("/editor")
	}

	onMounted(() => {
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
			<h1 class="text-3xl font-bold text-cyber-neon mb-8 font-mono">
				{{ t("admin.title") }}
			</h1>

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
							</td>
							<td class="p-4 text-gray-400">
								{{ new Date(doc.updatedAt).toLocaleDateString(locale.value) }}
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
