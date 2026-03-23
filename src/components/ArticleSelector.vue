<script setup lang="ts">
	import { ref, onMounted, computed } from "vue"
	import { apiFetch } from "@/utils/api"
	import type { DocumentMetadata } from "../../api/types"
	import { Search, Plus, X } from "lucide-vue-next"

	const props = defineProps<{
		modelValue: string[]
	}>()

	const emit = defineEmits<{
		(e: "update:modelValue", value: string[]): void
	}>()

	const documents = ref<DocumentMetadata[]>([])
	const searchQuery = ref("")
	const loading = ref(true)

	const fetchDocuments = async () => {
		try {
			const res = await apiFetch("/documents?status=published")
			const data = await res.json()
			if (data.success) {
				documents.value = data.data
			}
		} catch (e) {
			console.error("Failed to fetch documents", e)
		} finally {
			loading.value = false
		}
	}

	const selectedDocs = computed(() => {
		return props.modelValue
			.map((id) => documents.value.find((d) => d.id === id))
			.filter((d): d is DocumentMetadata => !!d)
	})

	const unselectedDocs = computed(() => {
		return documents.value
			.filter((d) => !props.modelValue.includes(d.id))
			.filter((d) =>
				d.title.toLowerCase().includes(searchQuery.value.toLowerCase()),
			)
	})

	const addDoc = (id: string) => {
		emit("update:modelValue", [...props.modelValue, id])
	}

	const removeDoc = (id: string) => {
		emit(
			"update:modelValue",
			props.modelValue.filter((d) => d !== id),
		)
	}

	const moveUp = (index: number) => {
		if (index === 0) return
		const newValue = [...props.modelValue]
		;[newValue[index - 1], newValue[index]] = [
			newValue[index],
			newValue[index - 1],
		]
		emit("update:modelValue", newValue)
	}

	const moveDown = (index: number) => {
		if (index === props.modelValue.length - 1) return
		const newValue = [...props.modelValue]
		;[newValue[index + 1], newValue[index]] = [
			newValue[index],
			newValue[index + 1],
		]
		emit("update:modelValue", newValue)
	}

	onMounted(() => {
		fetchDocuments()
	})
</script>

<template>
	<div class="flex flex-col h-full">
		<!-- Search -->
		<div class="mb-4">
			<div class="relative">
				<Search
					class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-muted"
				/>
				<input
					v-model="searchQuery"
					type="text"
					class="w-full bg-base-bg border border-base-border rounded-xl pl-9 pr-4 py-2 focus:border-cyber-neon focus:ring-1 focus:ring-cyber-neon focus:outline-none transition-all text-sm text-base-text"
					placeholder="Search articles..."
				/>
			</div>
		</div>

		<!-- Selected Articles -->
		<div
			v-if="selectedDocs.length > 0"
			class="mb-4"
		>
			<h4
				class="text-xs text-base-muted font-medium uppercase tracking-wider mb-2"
			>
				Selected ({{ selectedDocs.length }})
			</h4>
			<div class="space-y-2 max-h-40 overflow-y-auto pr-2">
				<div
					v-for="(doc, index) in selectedDocs"
					:key="doc.id"
					class="flex items-center justify-between p-2.5 bg-base-surface border border-base-border rounded-xl group hover:border-cyber-neon/50 transition-colors"
				>
					<div class="flex items-center gap-3 overflow-hidden">
						<span
							class="text-cyber-neon font-mono text-xs w-4 font-semibold text-center"
							>{{ index + 1 }}</span
						>
						<span class="text-sm truncate text-base-text font-medium">{{
							doc.title
						}}</span>
					</div>
					<div
						class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-base-surface pl-2"
					>
						<button
							@click="moveUp(index)"
							class="p-1.5 text-base-muted hover:text-cyber-neon hover:bg-base-surface2 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
							:disabled="index === 0"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="m18 15-6-6-6 6" />
							</svg>
						</button>
						<button
							@click="moveDown(index)"
							class="p-1.5 text-base-muted hover:text-cyber-neon hover:bg-base-surface2 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
							:disabled="index === selectedDocs.length - 1"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="m6 9 6 6 6-6" />
							</svg>
						</button>
						<button
							@click="removeDoc(doc.id)"
							class="p-1.5 text-base-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors ml-1"
						>
							<X class="w-3.5 h-3.5" />
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Available Articles -->
		<div class="flex-1 flex flex-col min-h-0">
			<h4
				class="text-xs text-base-muted font-medium uppercase tracking-wider mb-2"
			>
				Available
			</h4>
			<div class="flex-1 overflow-y-auto pr-2 space-y-1.5">
				<div
					v-for="doc in unselectedDocs"
					:key="doc.id"
					@click="addDoc(doc.id)"
					class="p-2.5 bg-transparent border border-transparent hover:bg-base-surface hover:border-base-border rounded-xl cursor-pointer transition-all flex items-center justify-between group"
				>
					<span
						class="text-sm truncate text-base-muted group-hover:text-base-text transition-colors"
						>{{ doc.title }}</span
					>
					<div
						class="p-1 rounded-md bg-base-surface2 opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100"
					>
						<Plus class="w-3.5 h-3.5 text-base-text" />
					</div>
				</div>
				<div
					v-if="unselectedDocs.length === 0"
					class="text-sm text-base-muted text-center py-8 bg-base-surface/30 rounded-xl border border-dashed border-base-border"
				>
					No articles found
				</div>
			</div>
		</div>
	</div>
</template>
