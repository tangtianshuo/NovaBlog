<script setup lang="ts">
	import { computed, onMounted, onUnmounted, ref } from "vue"
	import ProjectCard from "@/components/ProjectCard.vue"
	import DocumentCard from "@/components/DocumentCard.vue"
	import type { DocumentMetadata, ProjectMetadata } from "../../api/types"
	import { useI18n } from "vue-i18n"
	import { apiFetch } from "@/utils/api"
	import { FolderKanban, Newspaper } from "lucide-vue-next"
	import { syncDB, type LocalItem } from "@/utils/syncDB"

	const { t } = useI18n()
	const documents = ref<DocumentMetadata[]>([])
	const projects = ref<ProjectMetadata[]>([])
	const loading = ref(true)
	const activeTab = ref<"blog" | "projects">("blog")

	const pageSize = 12
	const visibleDocs = ref(pageSize)
	const visibleProjects = ref(pageSize)
	const sentinel = ref<HTMLElement | null>(null)
	let observer: IntersectionObserver | null = null

	const canLoadMore = computed(() => {
		return activeTab.value === "blog"
			? visibleDocs.value < documents.value.length
			: visibleProjects.value < projects.value.length
	})

	const visibleItems = computed(() => {
		return activeTab.value === "blog"
			? documents.value.slice(0, visibleDocs.value)
			: projects.value.slice(0, visibleProjects.value)
	})

	const loadMore = () => {
		if (!canLoadMore.value) return
		if (activeTab.value === "blog") {
			visibleDocs.value = Math.min(visibleDocs.value + pageSize, documents.value.length)
		} else {
			visibleProjects.value = Math.min(visibleProjects.value + pageSize, projects.value.length)
		}
	}

	onMounted(async () => {
		try {
			const [docsRes, projsRes, localDocs, localProjs] = await Promise.all([
				apiFetch("/documents?status=published"),
				apiFetch("/projects"),
				syncDB.getLocalDocuments(),
				syncDB.getLocalProjects(),
			])

			const docsData = await docsRes.json()
			const projsData = await projsRes.json()

			const localPublishedDocs = localDocs
				.filter((d) => (d.metadata as any)?.status === "published")
				.map((d: LocalItem) => {
					const metadata = d.metadata as any
					return {
						...(metadata || {}),
						id: String(metadata?.id || d.id),
						createdAt: String(metadata?.createdAt || new Date(d.timestamp).toISOString()),
						updatedAt: String(metadata?.updatedAt || new Date(d.timestamp).toISOString()),
						tags: Array.isArray(metadata?.tags) ? metadata.tags : [],
					} as DocumentMetadata
				})

			const remoteDocs = docsData?.success ? (docsData.data as DocumentMetadata[]) : []
			const mergedDocs = new Map<string, DocumentMetadata>()
			for (const d of localPublishedDocs) mergedDocs.set(d.id, d)
			for (const d of remoteDocs) mergedDocs.set(d.id, d)
			documents.value = Array.from(mergedDocs.values()).sort(
				(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
			)

			const localProjects = localProjs.map((p: LocalItem) => {
				const metadata = p.metadata as any
				return {
					...(metadata || {}),
					id: String(metadata?.id || p.id),
					createdAt: String(metadata?.createdAt || new Date(p.timestamp).toISOString()),
					updatedAt: String(metadata?.updatedAt || new Date(p.timestamp).toISOString()),
					tags: Array.isArray(metadata?.tags) ? metadata.tags : [],
					imageUrl: String(metadata?.imageUrl || "/images/default-project.png"),
				} as ProjectMetadata
			})

			const remoteProjects = projsData?.success ? (projsData.data as ProjectMetadata[]) : []
			const mergedProjects = new Map<string, ProjectMetadata>()
			for (const p of localProjects) mergedProjects.set(p.id, p)
			for (const p of remoteProjects) mergedProjects.set(p.id, p)
			projects.value = Array.from(mergedProjects.values()).sort(
				(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
			)
		} finally {
			loading.value = false
		}

		observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					loadMore()
				}
			},
			{ rootMargin: "600px" },
		)

		if (sentinel.value) observer.observe(sentinel.value)
	})

	onUnmounted(() => {
		observer?.disconnect()
		observer = null
	})
</script>

<template>
	<div class="min-h-screen bg-base-bg text-base-text">
		<section class="relative overflow-hidden">
			<div class="absolute inset-0">
				<div class="absolute inset-0 bg-gradient-to-b from-base-surface to-base-bg"></div>
				<div class="absolute -top-24 left-1/2 h-72 w-[700px] -translate-x-1/2 rounded-full bg-cyber-neon/15 blur-3xl"></div>
				<div class="absolute -bottom-24 left-1/2 h-72 w-[700px] -translate-x-1/2 rounded-full bg-cyber-pink/10 blur-3xl"></div>
			</div>

			<div class="container mx-auto px-4 pt-14 pb-10 relative">
				<div class="max-w-3xl">
					<h1 class="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-tight">
						Nova Core
					</h1>
					<p class="mt-4 text-base sm:text-lg text-base-muted leading-relaxed">
						{{ t('home.subtitle') }}
					</p>
					<div class="mt-6 inline-flex items-center gap-2 rounded-xl border border-base-border bg-base-bg/60 p-1">
						<button
							@click="activeTab = 'blog'"
							class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
							:class="activeTab === 'blog' ? 'bg-base-surface text-base-text shadow' : 'text-base-muted hover:text-base-text'"
						>
							<Newspaper class="w-4 h-4" />
							{{ t('nav.docs') }}
						</button>
						<button
							@click="activeTab = 'projects'"
							class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
							:class="activeTab === 'projects' ? 'bg-base-surface text-base-text shadow' : 'text-base-muted hover:text-base-text'"
						>
							<FolderKanban class="w-4 h-4" />
							{{ t('nav.projects') }}
						</button>
					</div>
				</div>
			</div>
		</section>

		<section class="container mx-auto px-4 pb-16">
			<div v-if="loading" class="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
				<div v-for="i in 12" :key="i" class="mb-4 break-inside-avoid">
					<div class="rounded-2xl border border-base-border bg-base-surface p-4 shimmer">
						<div class="h-4 w-2/3 rounded bg-base-surface2"></div>
						<div class="mt-3 h-3 w-full rounded bg-base-surface2"></div>
						<div class="mt-2 h-3 w-5/6 rounded bg-base-surface2"></div>
						<div class="mt-4 flex gap-2">
							<div class="h-6 w-14 rounded-full bg-base-surface2"></div>
							<div class="h-6 w-16 rounded-full bg-base-surface2"></div>
						</div>
					</div>
				</div>
			</div>

			<div v-else-if="visibleItems.length === 0" class="py-16 text-center">
				<div class="mx-auto max-w-md rounded-2xl border border-base-border bg-base-surface p-8">
					<div class="text-base-muted">{{ t('home.noData') }}</div>
				</div>
			</div>

			<div v-else class="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
				<div v-for="item in visibleItems" :key="item.id" class="mb-4 break-inside-avoid">
					<DocumentCard v-if="activeTab === 'blog'" :doc="item as any" />
					<ProjectCard
						v-else
						:title="(item as any).title"
						:description="(item as any).description"
						:image="(item as any).imageUrl || '/images/default-project.png'"
						:link="(item as any).link"
						:tags="(item as any).tags"
						:projectId="(item as any).id"
					/>
				</div>
			</div>

			<div class="mt-10 flex justify-center">
				<button
					v-if="canLoadMore"
					@click="loadMore"
					class="inline-flex items-center justify-center rounded-xl border border-base-border bg-base-surface px-5 py-2.5 text-sm font-semibold text-base-text hover:bg-base-surface2 transition"
				>
					{{ t('home.loading') }}
				</button>
				<div ref="sentinel" class="h-10 w-full"></div>
			</div>
		</section>

		<footer class="border-t border-base-border bg-base-bg">
			<div class="container mx-auto px-4 py-10 text-sm text-base-muted flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>© 2026 Nova Core</div>
				<div class="text-xs">{{ t('home.footer') }}</div>
			</div>
		</footer>
	</div>
</template>
