<script setup lang="ts">
	import { ref, onMounted, computed, nextTick } from "vue"
	import { useAuthStore } from "@/stores/auth"
	import { useRoute, useRouter } from "vue-router"
	import MarkdownViewer from "@/components/MarkdownViewer.vue"
	import ArticleSelector from "@/components/ArticleSelector.vue"
	import { useCyberToast } from "@/composables/useCyberToast"
	import { apiFetch } from "@/utils/api"
	import { syncDB } from "@/utils/syncDB"
	import {
		FileText,
		Save,
		Trash2,
		Send,
		Plus,
		RefreshCw,
		Image,
		Table,
		Code,
		List,
		Link,
		Type,
		Quote,
		Heading1,
		Heading2,
		Heading3,
		Bold,
		Italic,
		Strikethrough,
		Upload,
	} from "lucide-vue-next"
	import type {
		Document,
		DocumentMetadata,
		Project,
		ProjectMetadata,
	} from "../../api/types"
	import { useI18n } from "vue-i18n"
	import ConfirmDialog from "@/components/ConfirmDialog.vue"

	const authStore = useAuthStore()
	const route = useRoute()
	const router = useRouter()
	const documents = ref<DocumentMetadata[]>([])
	const projects = ref<ProjectMetadata[]>([])
	const currentDoc = ref<Document | null>(null)
	const currentProject = ref<Project | null>(null)
	const loading = ref(false)
	const saving = ref(false)
	const autosaving = ref(false)
	const lastAutosaveAt = ref<number | null>(null)
	const viewMode = ref<"draft" | "published">("draft")
	const { t } = useI18n()

	const showToolbar = ref(true)
	const showDeleteDialog = ref(false)
	const { success, error, danger } = useCyberToast()

	const isEditingProject = computed(
		() => route.name === "project-create" || route.name === "project-editor",
	)
	const isReady = computed(() => {
		if (isEditingProject.value) {
			return true
		}
		return !loading.value
	})

	const fileInputRef = ref<HTMLInputElement | null>(null)
	const uploading = ref(false)
	const mediaInputRef = ref<HTMLInputElement | null>(null)
	const uploadingMedia = ref(false)

	const triggerUpload = () => {
		fileInputRef.value?.click()
	}

	const triggerMediaUpload = () => {
		mediaInputRef.value?.click()
	}

	const handleFileUpload = async (event: Event) => {
		const target = event.target as HTMLInputElement
		if (!target.files || target.files.length === 0) return

		const file = target.files[0]
		const formData = new FormData()
		formData.append("file", file)

		uploading.value = true
		try {
			const res = await apiFetch("/upload", {
				method: "POST",
				body: formData,
			})
			const data = await res.json()
			if (data.success) {
				form.value.imageUrl = data.url
				success(t("editor.uploadSuccess") || "Image uploaded successfully")
			} else {
				error(data.error || t("editor.uploadError") || "Upload failed")
			}
		} catch (e) {
			error(t("editor.uploadError") || "Upload failed")
			console.error(e)
		} finally {
			uploading.value = false
			if (fileInputRef.value) {
				fileInputRef.value.value = ""
			}
		}
	}

	const handleMediaUpload = async (event: Event) => {
		const target = event.target as HTMLInputElement
		if (!target.files || target.files.length === 0) return

		const file = target.files[0]

		if (file.size > 5 * 1024 * 1024) {
			error("文件大小不能超过 5MB")
			return
		}

		const documentId = currentDoc.value?.metadata.id || `doc-${Date.now()}`
		const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
		const relativePath = `assets/${filename}`

		uploadingMedia.value = true
		try {
			const reader = new FileReader()
			reader.onload = async () => {
				const base64Data = reader.result as string

				await syncDB.saveMedia({
					id: `media-${Date.now()}`,
					documentId,
					filename,
					data: base64Data,
					type: file.type,
					size: file.size,
					path: relativePath,
					timestamp: Date.now(),
				})

				const markdownImage = `![${file.name}](${relativePath})`
				insertText(markdownImage)

				success("图片已保存到本地，同步到GitHub后将显示", 5000)
			}
			reader.readAsDataURL(file)
		} catch (e) {
			error("上传失败")
			console.error(e)
		} finally {
			uploadingMedia.value = false
			if (mediaInputRef.value) {
				mediaInputRef.value.value = ""
			}
		}
	}

	const insertText = (text: string) => {
		const textarea = textareaRef.value
		if (!textarea) return

		const start = textarea.selectionStart
		const end = textarea.selectionEnd
		const content = form.value.content

		form.value.content =
			content.substring(0, start) + text + content.substring(end)

		nextTick(() => {
			textarea.focus()
			textarea.setSelectionRange(start + text.length, start + text.length)
		})
	}

	const form = ref({
		title: "",
		content: "",
		description: "",
		tags: "",
		category: "",
		imageUrl: "",
		link: "",
		articles: [] as string[],
	})

	const workingDocId = ref<string>(crypto.randomUUID())
	const workingProjectId = ref<string>(crypto.randomUUID())

	const textareaRef = ref<HTMLTextAreaElement | null>(null)

	const fetchDocuments = async () => {
		loading.value = true
		try {
			const res = await apiFetch(`/documents?status=${viewMode.value}`)
			const data = await res.json()
			if (data.success) {
				documents.value = data.data
			}
		} catch (e) {
			error(t("admin.fetchError"))
		} finally {
			loading.value = false
		}
	}

	const createNew = () => {
		currentDoc.value = null
		currentProject.value = null
		workingDocId.value = crypto.randomUUID()
		workingProjectId.value = crypto.randomUUID()
		form.value = {
			title: t("editor.untitled"),
			content: "",
			description: "",
			tags: "",
			category: "",
			imageUrl: "",
			link: "",
			articles: [],
		}
	}

	const selectDocument = async (id: string) => {
		try {
			const res = await apiFetch(`/documents/${id}`)
			const data = await res.json()
			if (data.success) {
				currentDoc.value = data.data
				workingDocId.value = id
				if (currentDoc.value) {
					form.value = {
						title: currentDoc.value.metadata.title,
						content: currentDoc.value.content,
						description: currentDoc.value.metadata.description,
						tags: currentDoc.value.metadata.tags?.join(", ") || "",
						category: currentDoc.value.metadata.category || "",
						imageUrl: "",
						link: "",
						articles: [],
					}
				}
			}
		} catch (e) {
			error(t("editor.loadError"))
		}
	}

	const selectProject = async (id: string) => {
		try {
			const res = await apiFetch(`/projects/${id}`)
			const data = await res.json()
			if (data.success) {
				currentProject.value = data.data
				workingProjectId.value = id
				if (currentProject.value) {
					form.value = {
						title: currentProject.value.metadata.title,
						content: currentProject.value.content,
						description: currentProject.value.metadata.description,
						tags: currentProject.value.metadata.tags?.join(", ") || "",
						category: "",
						imageUrl: currentProject.value.metadata.imageUrl || "",
						link: currentProject.value.metadata.link || "",
						articles: currentProject.value.metadata.articles || [],
					}
				}
			} else {
				error(data.error || t("editor.loadError"))
			}
		} catch (e) {
			error(t("editor.loadError"))
		}
	}

	const autosaveToIndexedDB = async () => {
		if (saving.value || loading.value || autosaving.value) return
		autosaving.value = true
		try {
			if (isEditingProject.value) {
				const projectId = currentProject.value?.metadata.id
					? String(currentProject.value.metadata.id)
					: workingProjectId.value
				const payload = {
					title: form.value.title.trim() || t("editor.untitled"),
					content: form.value.content,
					description: form.value.description || "",
					tags: form.value.tags
						.split(",")
						.map((v) => v.trim())
						.filter((v) => v),
					imageUrl: form.value.imageUrl || "",
					link: form.value.link || "",
				}
				const articlesArray = Array.isArray(form.value.articles) ? [...form.value.articles] : []
				await syncDB.saveProject(
					{
						metadata: {
							...payload,
							id: projectId,
							slug:
								currentProject.value?.metadata.slug ||
								payload.title.toLowerCase().replace(/\s+/g, "-"),
							createdAt:
								currentProject.value?.metadata.createdAt ||
								new Date().toISOString(),
							articles: articlesArray,
						},
						content: payload.content,
					},
					projectId,
				)
			} else {
				const docId = currentDoc.value?.metadata.id
					? String(currentDoc.value.metadata.id)
					: workingDocId.value
				const status =
					(currentDoc.value?.metadata.status as "draft" | "published" | undefined) ||
					(viewMode.value as "draft" | "published")
				const payload = {
					title: form.value.title.trim() || t("editor.untitled"),
					content: form.value.content,
					description: form.value.description || "",
					tags: form.value.tags
						.split(",")
						.map((v) => v.trim())
						.filter((v) => v),
					category: form.value.category || "",
					status,
				}
				await syncDB.saveDocument(
					{
						metadata: {
							...payload,
							id: docId,
							slug:
								currentDoc.value?.metadata.slug ||
								payload.title.toLowerCase().replace(/\s+/g, "-"),
							createdAt:
								currentDoc.value?.metadata.createdAt ||
								new Date().toISOString(),
							author: currentDoc.value?.metadata.author || "admin",
							publishedAt:
								status === "published" &&
								currentDoc.value?.metadata.status !== "published"
									? new Date().toISOString()
									: currentDoc.value?.metadata.publishedAt,
						},
						content: payload.content,
					},
					docId,
				)
			}
			lastAutosaveAt.value = Date.now()
		} catch {
			return
		} finally {
			autosaving.value = false
		}
	}

	const insertAtCursor = (
		text: string,
		beforeCursor: string = "",
		afterCursor: string = "",
	) => {
		const textarea = textareaRef.value
		if (!textarea) return

		const start = textarea.selectionStart
		const end = textarea.selectionEnd
		const currentValue = form.value.content

		const newValue =
			currentValue.substring(0, start) +
			beforeCursor +
			text +
			afterCursor +
			currentValue.substring(end)
		form.value.content = newValue

		setTimeout(() => {
			const newPosition = start + beforeCursor.length + text.length
			textarea.setSelectionRange(newPosition, newPosition)
			textarea.focus()
		}, 0)
	}

	const insertHeading = (level: 1 | 2 | 3) => {
		const symbol = "#".repeat(level)
		insertAtCursor(`${symbol} `, "")
	}

	const insertBold = () => {
		insertAtCursor("bold", "**", "**")
	}

	const insertItalic = () => {
		insertAtCursor("italic", "*", "*")
	}

	const insertStrikethrough = () => {
		insertAtCursor("strikethrough", "~~", "~~")
	}

	const insertCode = () => {
		insertAtCursor("code", "`", "`")
	}

	const insertCodeBlock = () => {
		insertAtCursor("", "```\n", "\n```")
	}

	const insertLink = () => {
		const url = prompt("Enter URL:")
		if (url) {
			insertAtCursor("link text", "[", `](${url})`)
		}
	}

	const insertImage = () => {
		const url = prompt("Enter image URL:")
		if (url) {
			insertAtCursor("alt text", `![`, `](${url})`)
		}
	}

	const insertTable = () => {
		const tableTemplate = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`
		insertAtCursor(tableTemplate.trim())
	}

	const insertList = (ordered: boolean) => {
		const symbol = ordered ? "1. " : "- "
		insertAtCursor(`${symbol}list item`)
	}

	const insertBlockquote = () => {
		insertAtCursor("quote", "> ")
	}

	const insertHorizontalRule = () => {
		insertAtCursor("---\n")
	}

	const insertMermaid = () => {
		const mermaidTemplate =
			"```mermaid\ngraph TD\n    A[Start] --> B{Is it working?}\n    B -- Yes --> C[Great!]\n    B -- No --> D[Debug]\n```"
		insertAtCursor(mermaidTemplate)
	}

	const saveDocument = async (status: "draft" | "published" = "draft") => {
		if (!form.value.title || form.value.title.trim() === "") {
			error("请输入标题")
			return
		}

		saving.value = true
		try {
			if (isEditingProject.value) {
				const payload = {
					title: form.value.title.trim(),
					content: form.value.content,
					description: form.value.description || "",
					tags: form.value.tags
						.split(",")
						.map((t) => t.trim())
						.filter((t) => t),
					imageUrl: form.value.imageUrl || "",
					link: form.value.link || "",
				}

				const projectId = currentProject.value?.metadata.id
					? String(currentProject.value.metadata.id)
					: crypto.randomUUID()

				const articlesArray = Array.isArray(form.value.articles) 
					? [...form.value.articles] 
					: []

				await syncDB.saveProject(
					{
						metadata: {
							...payload,
							id: projectId,
							slug:
								currentProject.value?.metadata.slug ||
								payload.title.toLowerCase().replace(/\s+/g, "-"),
							createdAt:
								currentProject.value?.metadata.createdAt ||
								new Date().toISOString(),
							articles: articlesArray,
						},
						content: payload.content,
					},
					projectId || undefined,
				)

				success('已保存到本地，请点击"同步到GitHub"按钮上传')
				router.push("/admin#projects")
			} else {
				const payload = {
					title: form.value.title.trim(),
					content: form.value.content,
					description: form.value.description || "",
					tags: form.value.tags
						.split(",")
						.map((t) => t.trim())
						.filter((t) => t),
					category: form.value.category || "",
					status,
				}

				const docId = currentDoc.value?.metadata.id
					? String(currentDoc.value.metadata.id)
					: crypto.randomUUID()

				if (status === "published") {
					const localDocs = await syncDB.getLocalDocuments()
					const existingDraft = localDocs.find(
						(d) => d.id === docId && d.metadata.status === "draft",
					)
					if (existingDraft) {
						error("无法发布：本地存在相同ID的草稿，请先删除草稿或使用新ID")
						saving.value = false
						return
					}
				}

				await syncDB.saveDocument(
					{
						metadata: {
							...payload,
							id: docId,
							slug:
								currentDoc.value?.metadata.slug ||
								payload.title.toLowerCase().replace(/\s+/g, "-"),
							createdAt:
								currentDoc.value?.metadata.createdAt ||
								new Date().toISOString(),
							author: currentDoc.value?.metadata.author || "admin",
							publishedAt:
								status === "published" &&
								currentDoc.value?.metadata.status !== "published"
									? new Date().toISOString()
									: currentDoc.value?.metadata.publishedAt,
						},
						content: payload.content,
					},
					docId || undefined,
				)

				if (status === "published") {
					success('已保存到本地，请点击"同步到GitHub"按钮上传')
				} else {
					success('已保存到本地，请点击"同步到GitHub"按钮上传')
				}
				fetchDocuments()
			}
		} catch (e) {
			error("保存失败")
			console.error(e)
		} finally {
			saving.value = false
		}
	}

	const confirmDelete = () => {
		showDeleteDialog.value = true
	}

	const deleteDocument = async () => {
		if (isEditingProject.value) {
			if (!currentProject.value) return
			try {
				await syncDB.deleteProject(String(currentProject.value.metadata.id))
				danger('已标记删除，请点击"同步到GitHub"按钮')
				createNew()
				router.push("/admin#projects")
				showDeleteDialog.value = false
			} catch (e) {
				error("删除失败")
			}
		} else {
			if (!currentDoc.value) return
			try {
				await syncDB.deleteDocument(String(currentDoc.value.metadata.id))
				danger('已标记删除，请点击"同步到GitHub"按钮')
				createNew()
				fetchDocuments()
				showDeleteDialog.value = false
			} catch (e) {
				error("删除失败")
			}
		}
	}

	const toggleViewMode = () => {
		viewMode.value = viewMode.value === "draft" ? "published" : "draft"
		fetchDocuments()
	}

	const switchToDraft = () => {
		viewMode.value = "draft"
		fetchDocuments()
	}

	const switchToPublished = () => {
		viewMode.value = "published"
		fetchDocuments()
	}

	onMounted(async () => {
		if (isEditingProject.value) {
			if (route.params.id) {
				selectProject(route.params.id as string)
			} else {
				createNew()
			}
		} else {
			if (route.name === "document-editor" && route.params.id) {
				await selectDocument(route.params.id as string)
				if (currentDoc.value?.metadata.status === "published") {
					viewMode.value = "published"
				}
				await fetchDocuments()
			} else {
				await fetchDocuments()
				createNew()
			}
		}
	})
</script>

<template>
	<div
		class="flex h-screen bg-base-bg text-base-text pt-6 md:pt-4 overflow-hidden"
	>
		<!-- Sidebar - Only show when editing documents -->
		<aside
			v-if="!isEditingProject"
			class="w-64 border-r border-base-border flex flex-col bg-base-surface flex-shrink-0"
		>
			<div
				class="p-4 border-b border-base-border flex justify-between items-center"
			>
				<h2 class="font-mono text-base-text font-bold">
					{{ t("editor.files") }}
				</h2>
				<button
					@click="createNew"
					class="text-base-muted hover:text-cyber-neon transition-colors"
				>
					<Plus class="w-5 h-5" />
				</button>
			</div>

			<div class="p-2">
				<div
					class="flex gap-2 p-1 rounded-lg bg-base-surface2 border border-base-border"
				>
					<button
						@click="switchToDraft"
						class="flex-1 text-xs font-mono py-1.5 rounded-md transition-colors"
						:class="
							viewMode === 'draft'
								? 'bg-base-bg text-base-text border border-base-border'
								: 'text-base-muted hover:text-base-text'
						"
					>
						{{ t("editor.drafts") }}
					</button>
					<button
						@click="switchToPublished"
						class="flex-1 text-xs font-mono py-1.5 rounded-md transition-colors"
						:class="
							viewMode === 'published'
								? 'bg-base-bg text-base-text border border-base-border'
								: 'text-base-muted hover:text-base-text'
						"
					>
						{{ t("editor.published") }}
					</button>
				</div>
			</div>

			<div class="flex-1 overflow-y-auto p-2 space-y-1">
				<div
					v-for="doc in documents"
					:key="doc.id"
					@click="selectDocument(doc.id)"
					class="p-2 rounded-lg cursor-pointer hover:bg-base-surface2 transition-colors flex items-center gap-2 group"
					:class="{
						'bg-base-surface2 border-l-2 border-cyber-neon':
							currentDoc?.metadata.id === doc.id,
					}"
				>
					<FileText class="w-4 h-4 text-base-muted group-hover:text-cyber-neon" />
					<span class="text-sm font-mono truncate text-base-text">{{ doc.title }}</span>
				</div>
			</div>
		</aside>

		<!-- Main Editor -->
		<main
			v-if="isReady"
			class="flex-1 flex flex-col min-w-0 overflow-hidden"
		>
			<!-- Editor Mode Indicator -->
			<div
				class="border-b px-4 py-2 flex items-center justify-between"
				:class="
					isEditingProject
						? 'bg-cyber-pink bg-opacity-20 border-cyber-pink'
						: 'bg-cyber-neon bg-opacity-20 border-cyber-neon'
				"
			>
				<span
					class="text-xs font-mono font-bold"
					:class="isEditingProject ? 'text-cyber-pink' : 'text-cyber-neon'"
				>
					{{ isEditingProject ? "PROJECT EDITOR" : "ARTICLE EDITOR" }}
				</span>
			</div>

			<!-- Toolbar -->
			<div
				class="h-14 border-b border-base-border flex items-center justify-between px-4 bg-base-bg"
			>
				<input
					v-model="form.title"
					type="text"
					class="bg-transparent text-xl font-semibold text-base-text focus:outline-none w-full"
					:placeholder="t('editor.placeholder.title')"
					@blur="autosaveToIndexedDB"
				/>

				<div class="flex items-center gap-3">
					<div class="hidden sm:flex items-center gap-2 text-xs text-base-muted">
						<span v-if="autosaving">{{ t('common.saving') }}</span>
						<span v-else-if="lastAutosaveAt">{{ t('common.updated') }} {{ new Date(lastAutosaveAt).toLocaleTimeString() }}</span>
					</div>
					<button
						@click="saveDocument('draft')"
						:disabled="saving"
						class="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-base-surface border border-base-border text-base-text rounded-lg hover:bg-base-surface2 transition-all"
					>
						<Save class="w-4 h-4" /> {{ t("editor.save") }}
					</button>

					<button
						v-if="!isEditingProject"
						@click="saveDocument('published')"
						:disabled="saving"
						class="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-base-surface border border-base-border text-base-text rounded-lg hover:bg-base-surface2 transition-all"
					>
						<Send class="w-4 h-4" /> {{ t("editor.publish") }}
					</button>

					<button
						v-if="currentDoc || currentProject"
						@click="confirmDelete"
						class="text-gray-500 hover:text-red-500 ml-2"
					>
						<Trash2 class="w-4 h-4" />
					</button>
				</div>
			</div>

			<!-- Meta Inputs -->
			<div
				class="grid grid-cols-2 gap-4 p-4 border-b border-base-border bg-base-surface"
			>
				<div class="flex flex-col gap-1">
					<label class="text-xs text-gray-500 font-mono">{{
						t("editor.label.desc")
					}}</label>
					<input
						v-model="form.description"
						:placeholder="t('editor.placeholder.desc')"
						class="bg-transparent border-b border-base-border focus:border-cyber-neon text-sm p-1 focus:outline-none w-full"
						@blur="autosaveToIndexedDB"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-xs text-gray-500 font-mono">{{
						t("editor.label.tags")
					}}</label>
					<input
						v-model="form.tags"
						:placeholder="t('editor.placeholder.tags')"
						class="bg-transparent border-b border-base-border focus:border-cyber-neon text-sm p-1 focus:outline-none w-full"
						@blur="autosaveToIndexedDB"
					/>
				</div>

				<div
					v-if="isEditingProject"
					class="col-span-2 flex flex-col gap-1"
				>
					<label class="text-xs text-gray-500 font-mono">{{
						t("editor.label.imageUrl")
					}}</label>
					<div class="flex gap-2">
						<input
							v-model="form.imageUrl"
							:placeholder="t('editor.placeholder.imageUrl')"
								class="bg-transparent border-b border-base-border focus:border-cyber-neon text-sm p-1 focus:outline-none w-full"
								@blur="autosaveToIndexedDB"
						/>
						<button
							@click="triggerUpload"
							class="p-1 hover:text-cyber-neon transition-colors"
							:title="t('editor.upload') || 'Upload Image'"
							:disabled="uploading"
						>
							<Upload
								class="w-4 h-4"
								:class="{ 'animate-pulse': uploading }"
							/>
						</button>
						<input
							type="file"
							ref="fileInputRef"
							class="hidden"
							accept="image/*"
							@change="handleFileUpload"
						/>
					</div>
				</div>

				<div
					v-if="isEditingProject"
					class="col-span-2 flex flex-col gap-1"
				>
					<label class="text-xs text-gray-500 font-mono">{{
						t("editor.label.link")
					}}</label>
					<input
						v-model="form.link"
						:placeholder="t('editor.placeholder.link')"
						class="bg-transparent border-b border-base-border focus:border-cyber-neon text-sm p-1 focus:outline-none w-full"
						@blur="autosaveToIndexedDB"
					/>
				</div>

				<div
					v-if="isEditingProject"
					class="col-span-2 flex flex-col gap-1"
				>
					<label class="text-xs text-gray-500 font-mono"> 关联文档 </label>
					<ArticleSelector v-model="form.articles" />
				</div>
			</div>

			<!-- Markdown Toolbar -->
			<div
				class="border-b border-base-border bg-base-surface px-4 py-2 flex flex-wrap gap-1 items-center"
			>
				<!-- Headings -->
				<div class="flex gap-1 border-r border-base-border pr-2 mr-1">
					<button
						@click="insertHeading(1)"
						class="p-1.5 hover:bg-base-surface2 rounded text-base-text transition-colors"
						title="Heading 1"
					>
						<Heading1 class="w-4 h-4" />
					</button>
					<button
						@click="insertHeading(2)"
						class="p-1.5 hover:bg-base-surface2 rounded text-base-text transition-colors"
						title="Heading 2"
					>
						<Heading2 class="w-4 h-4" />
					</button>
					<button
						@click="insertHeading(3)"
						class="p-1.5 hover:bg-base-surface2 rounded text-base-text transition-colors"
						title="Heading 3"
					>
						<Heading3 class="w-4 h-4" />
					</button>
				</div>

				<!-- Text Formatting -->
				<div class="flex gap-1 border-r border-base-border pr-2 mr-1">
					<button
						@click="insertBold"
						class="p-1.5 hover:bg-base-surface2 rounded text-base-text transition-colors"
						title="Bold"
					>
						<Bold class="w-4 h-4" />
					</button>
					<button
						@click="insertItalic"
						class="p-1.5 hover:bg-base-surface2 rounded text-base-text transition-colors"
						title="Italic"
					>
						<Italic class="w-4 h-4" />
					</button>
					<button
						@click="insertStrikethrough"
						class="p-1.5 hover:bg-base-surface2 rounded text-base-text transition-colors"
						title="Strikethrough"
					>
						<Strikethrough class="w-4 h-4" />
					</button>
				</div>

				<!-- Lists & Block Elements -->
				<div class="flex gap-1 border-r border-base-border pr-2 mr-1">
					<button
						@click="insertList(false)"
						class="p-1.5 hover:bg-base-surface2 rounded text-base-text transition-colors"
						title="Bullet List"
					>
						<List class="w-4 h-4" />
					</button>
					<button
						@click="insertList(true)"
						class="p-1.5 hover:bg-base-surface2 rounded text-base-text transition-colors"
						title="Numbered List"
					>
						<Type class="w-4 h-4" />
					</button>
					<button
						@click="insertBlockquote"
						class="p-1.5 hover:bg-base-surface2 rounded text-base-text transition-colors"
						title="Blockquote"
					>
						<Quote class="w-4 h-4" />
					</button>
					<button
						@click="insertHorizontalRule"
						class="p-1.5 hover:bg-base-surface2 rounded text-base-text transition-colors"
						title="Horizontal Rule"
					>
						<div class="w-4 h-4 font-bold flex items-center justify-center">---</div>
					</button>
				</div>

				<!-- Code -->
				<div class="flex gap-1 border-r border-base-border pr-2 mr-1">
					<button
						@click="insertCode"
						class="p-1.5 hover:bg-base-surface2 rounded text-base-text transition-colors"
						title="Inline Code"
					>
						<Code class="w-4 h-4" />
					</button>
					<button
						@click="insertCodeBlock"
						class="p-1.5 hover:bg-base-surface2 rounded text-base-text transition-colors flex items-center justify-center"
						title="Code Block"
					>
						<span class="font-mono text-xs font-bold leading-none">{ }</span>
					</button>
				</div>

				<!-- Links & Media -->
				<div class="flex gap-1">
					<button
						@click="insertLink"
						class="p-1.5 hover:bg-base-surface2 rounded text-base-text transition-colors"
						title="Link"
					>
						<Link class="w-4 h-4" />
					</button>
					<button
						@click="insertImage"
						class="p-1.5 hover:bg-base-surface2 rounded text-base-text transition-colors"
						title="Image URL"
					>
						<Image class="w-4 h-4" />
					</button>
					<button
						@click="triggerMediaUpload"
						class="p-1.5 hover:bg-base-surface2 rounded relative text-base-text transition-colors"
						title="Upload Image"
						:disabled="uploadingMedia"
					>
						<Upload
							class="w-4 h-4"
							:class="{ 'animate-pulse text-yellow-500': uploadingMedia }"
						/>
					</button>
					<input
						ref="mediaInputRef"
						type="file"
						class="hidden"
						accept="image/*"
						@change="handleMediaUpload"
					/>
					<button
						@click="insertTable"
						class="p-1.5 hover:bg-base-surface2 rounded text-base-text transition-colors"
						title="Table"
					>
						<Table class="w-4 h-4" />
					</button>
					<button
						@click="insertMermaid"
						class="p-1.5 hover:bg-base-surface2 rounded text-base-text transition-colors"
						title="Flowchart"
					>
						<RefreshCw class="w-4 h-4" />
					</button>
				</div>
			</div>

			<!-- Editor/Preview Split -->
			<div class="flex-1 flex overflow-hidden">
				<!-- Editor -->
				<div class="w-1/2 border-r border-base-border flex flex-col bg-base-bg">
					<textarea
						ref="textareaRef"
						v-model="form.content"
						class="flex-1 w-full bg-transparent p-6 font-mono text-sm focus:outline-none resize-none leading-relaxed text-base-text"
						:placeholder="t('editor.placeholder.content')"
						@blur="autosaveToIndexedDB"
					></textarea>
				</div>

				<!-- Preview -->
				<div class="w-1/2 overflow-y-auto bg-base-surface p-8">
					<MarkdownViewer :content="form.content" />
				</div>
			</div>
		</main>

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
