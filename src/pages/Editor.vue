<script setup lang="ts">
	import { ref, onMounted, computed } from "vue"
	import { useAuthStore } from "@/stores/auth"
	import MarkdownViewer from "@/components/MarkdownViewer.vue"
	import { message } from "ant-design-vue"
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
	} from "lucide-vue-next"
	import type { Document, DocumentMetadata } from "../../api/types"
	import { useI18n } from "vue-i18n"

	const authStore = useAuthStore()
	const documents = ref<DocumentMetadata[]>([])
	const currentDoc = ref<Document | null>(null)
	const loading = ref(false)
	const saving = ref(false)
	const viewMode = ref<"draft" | "published">("draft")
	const { t } = useI18n()

	const showToolbar = ref(true)

	// Form data
	const form = ref({
		title: "",
		content: "",
		description: "",
		tags: "",
		category: "",
	})

	const textareaRef = ref<HTMLTextAreaElement | null>(null)

	const fetchDocuments = async () => {
		loading.value = true
		try {
			const res = await fetch(`/api/documents?status=${viewMode.value}`)
			const data = await res.json()
			if (data.success) {
				documents.value = data.data
			}
		} catch (e) {
			message.error(t("admin.fetchError"))
		} finally {
			loading.value = false
		}
	}

	const createNew = () => {
		currentDoc.value = null
		form.value = {
			title: t("editor.untitled"),
			content: "",
			description: "",
			tags: "",
			category: "",
		}
	}

	const selectDocument = async (id: string) => {
		try {
			const res = await fetch(`/api/documents/${id}`)
			const data = await res.json()
			if (data.success) {
				currentDoc.value = data.data
				if (currentDoc.value) {
					form.value = {
						title: currentDoc.value.metadata.title,
						content: currentDoc.value.content,
						description: currentDoc.value.metadata.description,
						tags: currentDoc.value.metadata.tags?.join(", ") || "",
						category: currentDoc.value.metadata.category || "",
					}
				}
			}
		} catch (e) {
			message.error(t("editor.loadError"))
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

		// Set cursor position after inserted text
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
		saving.value = true
		try {
			const payload = {
				title: form.value.title,
				content: form.value.content,
				description: form.value.description,
				tags: form.value.tags
					.split(",")
					.map((t) => t.trim())
					.filter((t) => t),
				category: form.value.category,
				status,
			}

			let url = "/api/documents"
			let method = "POST"

			if (currentDoc.value) {
				url = `/api/documents/${currentDoc.value.metadata.id}`
				method = "PUT"
				if (status !== currentDoc.value.metadata.status) {
					;(payload as any).metadata = { status }
				}
			}

			let body
			if (method === "PUT") {
				body = {
					metadata: {
						title: payload.title,
						description: payload.description,
						tags: payload.tags,
						category: payload.category,
						status: status,
					},
					content: payload.content,
				}
			} else {
				body = { ...payload, status }
			}

			const res = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authStore.token}`,
				},
				body: JSON.stringify(body),
			})

			const data = await res.json()
			if (data.success) {
				message.success(t("editor.saved"))
				currentDoc.value = data.data
				fetchDocuments()
			} else {
				message.error(data.error || t("editor.saveError"))
			}
		} catch (e) {
			message.error(t("editor.saveError"))
			console.error(e)
		} finally {
			saving.value = false
		}
	}

	const deleteDocument = async () => {
		if (!currentDoc.value) return
		if (!confirm(t("admin.deleteConfirm"))) return

		try {
			const res = await fetch(
				`/api/documents/${currentDoc.value.metadata.id}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${authStore.token}`,
					},
				},
			)

			if (res.ok) {
				message.success(t("admin.deleted"))
				createNew()
				fetchDocuments()
			}
		} catch (e) {
			message.error(t("admin.deleteError"))
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

	onMounted(() => {
		fetchDocuments()
		createNew()
	})
</script>

<template>
	<div class="flex h-screen bg-cyber-dark text-white pt-16 overflow-hidden">
		<!-- Sidebar -->
		<aside
			class="w-64 border-r border-cyber-primary flex flex-col bg-black bg-opacity-50"
		>
			<div
				class="p-4 border-b border-cyber-primary flex justify-between items-center"
			>
				<h2 class="font-mono text-cyber-neon font-bold">
					{{ t("editor.files") }}
				</h2>
				<button
					@click="createNew"
					class="text-cyber-pink hover:text-white"
				>
					<Plus class="w-5 h-5" />
				</button>
			</div>

			<div class="p-2 flex gap-2">
				<button
					@click="switchToDraft"
					class="flex-1 text-xs font-mono py-1 rounded transition-colors"
					:class="
						viewMode === 'draft'
							? 'bg-cyber-pink text-black'
							: 'text-gray-500 hover:text-white'
					"
				>
					{{ t("editor.drafts") }}
				</button>
				<button
					@click="switchToPublished"
					class="flex-1 text-xs font-mono py-1 rounded transition-colors"
					:class="
						viewMode === 'published'
							? 'bg-cyber-green text-black'
							: 'text-gray-500 hover:text-white'
					"
				>
					{{ t("editor.published") }}
				</button>
			</div>

			<div class="flex-1 overflow-y-auto p-2 space-y-1">
				<div
					v-for="doc in documents"
					:key="doc.id"
					@click="selectDocument(doc.id)"
					class="p-2 rounded cursor-pointer hover:bg-cyber-primary transition-colors flex items-center gap-2 group"
					:class="{
						'bg-cyber-primary border-l-2 border-cyber-neon':
							currentDoc?.metadata.id === doc.id,
					}"
				>
					<FileText class="w-4 h-4 text-gray-500 group-hover:text-cyber-neon" />
					<span class="text-sm font-mono truncate">{{ doc.title }}</span>
				</div>
			</div>
		</aside>

		<!-- Main Editor -->
		<main class="flex-1 flex flex-col min-w-0">
			<!-- Toolbar -->
			<div
				class="h-14 border-b border-cyber-primary flex items-center justify-between px-4 bg-black bg-opacity-30"
			>
				<input
					v-model="form.title"
					type="text"
					class="bg-transparent text-xl font-bold text-cyber-neon focus:outline-none w-full font-mono"
					:placeholder="t('editor.placeholder.title')"
				/>

				<div class="flex items-center gap-2">
					<button
						@click="saveDocument('draft')"
						:disabled="saving"
						class="flex items-center gap-1 px-3 py-1.5 text-xs font-mono bg-cyber-dark border border-cyber-pink text-cyber-pink rounded hover:bg-cyber-pink hover:text-black transition-all"
					>
						<Save class="w-4 h-4" /> {{ t("editor.save") }}
					</button>

					<button
						@click="saveDocument('published')"
						:disabled="saving"
						class="flex items-center gap-1 px-3 py-1.5 text-xs font-mono bg-cyber-dark border border-cyber-green text-cyber-green rounded hover:bg-cyber-green hover:text-black transition-all"
					>
						<Send class="w-4 h-4" /> {{ t("editor.publish") }}
					</button>

					<button
						v-if="currentDoc"
						@click="deleteDocument"
						class="text-gray-500 hover:text-red-500 ml-2"
					>
						<Trash2 class="w-4 h-4" />
					</button>
				</div>
			</div>

			<!-- Meta Inputs -->
			<div
				class="grid grid-cols-2 gap-4 p-4 border-b border-cyber-primary bg-black bg-opacity-20"
			>
				<input
					v-model="form.description"
					:placeholder="t('editor.placeholder.desc')"
					class="bg-transparent border-b border-gray-700 focus:border-cyber-neon text-sm p-1 focus:outline-none"
				/>
				<input
					v-model="form.tags"
					:placeholder="t('editor.placeholder.tags')"
					class="bg-transparent border-b border-gray-700 focus:border-cyber-neon text-sm p-1 focus:outline-none"
				/>
			</div>

			<!-- Markdown Toolbar -->
			<div
				class="border-b border-cyber-primary bg-black bg-opacity-20 px-4 py-2 flex flex-wrap gap-1 items-center"
			>
				<div class="text-xs text-gray-500 font-mono mr-2">MARKDOWN</div>

				<!-- Headings -->
				<div class="flex gap-1 border-r border-gray-700 pr-2">
					<button
						@click="insertHeading(1)"
						class="p-1.5 hover:bg-cyber-primary rounded"
						title="Heading 1"
					>
						<Heading1 class="w-4 h-4 text-cyber-neon" />
					</button>
					<button
						@click="insertHeading(2)"
						class="p-1.5 hover:bg-cyber-primary rounded"
						title="Heading 2"
					>
						<Heading2 class="w-4 h-4 text-cyber-neon" />
					</button>
					<button
						@click="insertHeading(3)"
						class="p-1.5 hover:bg-cyber-primary rounded"
						title="Heading 3"
					>
						<Heading3 class="w-4 h-4 text-cyber-neon" />
					</button>
				</div>

				<!-- Text Formatting -->
				<div class="flex gap-1 border-r border-gray-700 pr-2">
					<button
						@click="insertBold"
						class="p-1.5 hover:bg-cyber-primary rounded"
						title="Bold"
					>
						<Bold class="w-4 h-4 text-cyber-pink" />
					</button>
					<button
						@click="insertItalic"
						class="p-1.5 hover:bg-cyber-primary rounded"
						title="Italic"
					>
						<Italic class="w-4 h-4 text-cyber-pink" />
					</button>
					<button
						@click="insertStrikethrough"
						class="p-1.5 hover:bg-cyber-primary rounded"
						title="Strikethrough"
					>
						<Strikethrough class="w-4 h-4 text-cyber-pink" />
					</button>
				</div>

				<!-- Lists & Block Elements -->
				<div class="flex gap-1 border-r border-gray-700 pr-2">
					<button
						@click="insertList(false)"
						class="p-1.5 hover:bg-cyber-primary rounded"
						title="Bullet List"
					>
						<List class="w-4 h-4 text-cyber-green" />
					</button>
					<button
						@click="insertList(true)"
						class="p-1.5 hover:bg-cyber-primary rounded"
						title="Numbered List"
					>
						<Type class="w-4 h-4 text-cyber-green" />
					</button>
					<button
						@click="insertBlockquote"
						class="p-1.5 hover:bg-cyber-primary rounded"
						title="Blockquote"
					>
						<Quote class="w-4 h-4 text-cyber-green" />
					</button>
					<button
						@click="insertHorizontalRule"
						class="p-1.5 hover:bg-cyber-primary rounded"
						title="Horizontal Rule"
					>
						<div class="w-4 h-4 text-cyber-green font-bold">---</div>
					</button>
				</div>

				<!-- Code -->
				<div class="flex gap-1 border-r border-gray-700 pr-2">
					<button
						@click="insertCode"
						class="p-1.5 hover:bg-cyber-primary rounded"
						title="Inline Code"
					>
						<Code class="w-4 h-4 text-cyber-neon" />
					</button>
					<button
						@click="insertCodeBlock"
						class="p-1.5 hover:bg-cyber-primary rounded"
						title="Code Block"
					>
						<div class="w-4 h-4 text-cyber-neon font-mono text-xs font-bold">
							{ }
						</div>
					</button>
				</div>

				<!-- Links & Media -->
				<div class="flex gap-1">
					<button
						@click="insertLink"
						class="p-1.5 hover:bg-cyber-primary rounded"
						title="Link"
					>
						<Link class="w-4 h-4 text-cyber-neon" />
					</button>
					<button
						@click="insertImage"
						class="p-1.5 hover:bg-cyber-primary rounded"
						title="Image"
					>
						<Image class="w-4 h-4 text-cyber-neon" />
					</button>
					<button
						@click="insertTable"
						class="p-1.5 hover:bg-cyber-primary rounded"
						title="Table"
					>
						<Table class="w-4 h-4 text-cyber-neon" />
					</button>
					<button
						@click="insertMermaid"
						class="p-1.5 hover:bg-cyber-primary rounded"
						title="Flowchart"
					>
						<RefreshCw class="w-4 h-4 text-cyber-pink" />
					</button>
				</div>
			</div>

			<!-- Editor/Preview Split -->
			<div class="flex-1 flex overflow-hidden">
				<!-- Editor -->
				<div class="w-1/2 border-r border-cyber-primary flex flex-col">
					<textarea
						ref="textareaRef"
						v-model="form.content"
						class="flex-1 w-full bg-cyber-dark p-4 font-mono text-sm focus:outline-none resize-none"
						:placeholder="t('editor.placeholder.content')"
					></textarea>
				</div>

				<!-- Preview -->
				<div class="w-1/2 overflow-y-auto bg-black bg-opacity-30 p-8">
					<MarkdownViewer :content="form.content" />
				</div>
			</div>
		</main>
	</div>
</template>
