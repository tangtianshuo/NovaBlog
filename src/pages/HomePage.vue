<script setup lang="ts">
	import { ref, onMounted, computed } from "vue"
	import ProjectCard from "@/components/ProjectCard.vue"
	import DocumentCard from "@/components/DocumentCard.vue"
	import CollectionCard from "@/components/CollectionCard.vue"
	import type {
		DocumentMetadata,
		CollectionMetadata,
		ProjectMetadata,
	} from "../../api/types"
	import { useI18n } from "vue-i18n"
	import { apiFetch } from "@/utils/api"

	const { t } = useI18n()
	const documents = ref<DocumentMetadata[]>([])
	const collections = ref<CollectionMetadata[]>([])
	const projects = ref<ProjectMetadata[]>([])
	const loading = ref(true)

	onMounted(async () => {
		try {
			const [docsRes, colsRes, projsRes] = await Promise.all([
				apiFetch("/documents?status=published"),
				apiFetch("/collections"),
				apiFetch("/projects"),
			])

			const docsData = await docsRes.json()
			if (docsData.success) {
				documents.value = docsData.data
			}

			const colsData = await colsRes.json()
			if (colsData.success) {
				collections.value = colsData.data
			}

			const projsData = await projsRes.json()
			if (projsData.success) {
				projects.value = projsData.data
			}
		} catch (e) {
			console.error(e)
		} finally {
			loading.value = false
		}
	})
</script>

<template>
	<div class="min-h-screen bg-cyber-dark text-white font-sans">
		<!-- Hero Section -->
		<header
			class="relative h-[60vh] flex items-center justify-center overflow-hidden"
		>
			<div
				class="absolute inset-0 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center opacity-30"
			></div>
			<div
				class="absolute inset-0 bg-gradient-to-b from-transparent to-cyber-dark"
			></div>

			<div class="relative z-10 text-center px-4">
				<h1
					class="text-5xl md:text-7xl font-bold mb-4 font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyber-pink via-cyber-neon to-cyber-green animate-pulse"
				>
					{{ t("home.title") }}
				</h1>
				<p
					class="text-xl md:text-2xl text-cyber-neon font-mono mb-8 typing-effect"
				>
					{{ t("home.subtitle") }}
				</p>
				<div class="flex justify-center gap-4">
					<a
						href="#projects"
						class="px-6 py-2 border border-cyber-pink text-cyber-pink hover:bg-cyber-pink hover:text-black transition-all font-mono"
					>
						{{ t("home.viewProjects") }}
					</a>
					<a
						href="#collections"
						class="px-6 py-2 border border-cyber-green text-cyber-green hover:bg-cyber-green hover:text-black transition-all font-mono"
					>
						{{ t("home.collections") }}
					</a>
					<a
						href="#blog"
						class="px-6 py-2 border border-cyber-neon text-cyber-neon hover:bg-cyber-neon hover:text-black transition-all font-mono"
					>
						{{ t("home.readDocs") }}
					</a>
				</div>
			</div>
		</header>

		<!-- Projects Section -->
		<section
			id="projects"
			class="py-20 relative overflow-hidden"
		>
			<div
				class="absolute inset-0 bg-gradient-to-br from-cyber-primary via-black to-black"
			></div>
			<div
				class="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"
			></div>
			<div
				class="absolute inset-0 bg-gradient-to-t from-cyber-neon/5 to-transparent"
			></div>
			<div class="absolute inset-0 overflow-hidden pointer-events-none">
				<div
					class="absolute -top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 rotate-45 bg-gradient-to-r from-transparent via-cyber-neon/20 to-transparent sweep-light"
				></div>
			</div>
			<div class="absolute inset-0 overflow-hidden pointer-events-none">
				<div
					class="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyber-neon to-transparent opacity-80 scan-horizontal"
				></div>
				<div
					class="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-transparent via-cyber-neon to-transparent opacity-80 scan-vertical"
				></div>
			</div>
			<div class="container mx-auto px-4 relative z-10">
				<h2
					class="text-3xl font-bold mb-12 text-center text-cyber-neon font-mono relative inline-block left-1/2 transform -translate-x-1/2"
				>
					<span class="absolute -inset-1 bg-cyber-neon blur opacity-20"></span>
					{{ t("home.projectArchive") }}
				</h2>

				<div
					v-if="loading"
					class="text-center text-cyber-neon font-mono"
				>
					{{ t("home.loading") }}
				</div>

				<div
					v-else-if="projects.length === 0"
					class="text-center text-gray-500 font-mono"
				>
					{{ t("admin.noProjects") }}
				</div>

				<div
					v-else
					class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
				>
					<ProjectCard
						v-for="project in projects"
						:key="project.id"
						:title="project.title"
						:description="project.description"
						:image="project.imageUrl || '/images/default-project.png'"
						:link="project.link"
						:tags="project.tags"
						:projectId="project.id"
					/>
				</div>
			</div>
		</section>

		<!-- Divider -->
		<div class="container mx-auto px-4">
			<div
				class="w-full h-px bg-gradient-to-r from-transparent via-cyber-primary to-transparent opacity-50"
			></div>
		</div>
		<section
			id="collections"
			class="py-20 relative overflow-hidden"
		>
			<div
				class="absolute inset-0 bg-gradient-to-br from-cyber-green/10 via-black to-black"
			></div>
			<div
				class="absolute inset-0 bg-[linear-gradient(rgba(57,255,20,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"
			></div>
			<div
				class="absolute inset-0 bg-gradient-to-t from-cyber-green/5 to-transparent"
			></div>
			<div class="absolute inset-0 overflow-hidden pointer-events-none">
				<div
					class="absolute -top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 rotate-45 bg-gradient-to-r from-transparent via-cyber-green/20 to-transparent sweep-light"
					style="animation-delay: -0.7s"
				></div>
			</div>
			<div class="absolute inset-0 overflow-hidden pointer-events-none">
				<div
					class="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyber-green to-transparent opacity-80 scan-horizontal"
					style="animation-delay: -0.7s"
				></div>
				<div
					class="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-transparent via-cyber-green to-transparent opacity-80 scan-vertical"
					style="animation-delay: -0.7s"
				></div>
			</div>
			<div class="container mx-auto px-4 relative z-10">
				<h2
					class="text-3xl font-bold mb-12 text-center text-cyber-green font-mono relative inline-block left-1/2 transform -translate-x-1/2"
				>
					<span class="absolute -inset-1 bg-cyber-green blur opacity-20"></span>
					{{ t("home.collections") }}
				</h2>

				<div
					v-if="loading"
					class="text-center text-cyber-green font-mono"
				>
					{{ t("home.loading") }}
				</div>

				<div
					v-else-if="collections.length === 0"
					class="text-center text-gray-500 font-mono"
				>
					{{ t("home.noData") }}
				</div>

				<div
					v-else
					class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
				>
					<CollectionCard
						v-for="collection in collections"
						:key="collection.id"
						:collection="collection"
					/>
				</div>
			</div>
		</section>

		<!-- Divider -->
		<div class="container mx-auto px-4">
			<div
				class="w-full h-px bg-gradient-to-r from-transparent via-cyber-primary to-transparent opacity-50"
			></div>
		</div>

		<!-- Blog Section -->
		<section
			id="blog"
			class="py-20 relative overflow-hidden"
		>
			<div
				class="absolute inset-0 bg-gradient-to-br from-cyber-pink/10 via-black to-black"
			></div>
			<div
				class="absolute inset-0 bg-[linear-gradient(rgba(255,20,147,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,20,147,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"
			></div>
			<div
				class="absolute inset-0 bg-gradient-to-t from-cyber-pink/5 to-transparent"
			></div>
			<div class="absolute inset-0 overflow-hidden pointer-events-none">
				<div
					class="absolute -top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 rotate-45 bg-gradient-to-r from-transparent via-cyber-pink/20 to-transparent sweep-light"
					style="animation-delay: -1.4s"
				></div>
			</div>
			<div class="absolute inset-0 overflow-hidden pointer-events-none">
				<div
					class="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyber-pink to-transparent opacity-80 scan-horizontal"
					style="animation-delay: -1.4s"
				></div>
				<div
					class="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-transparent via-cyber-pink to-transparent opacity-80 scan-vertical"
					style="animation-delay: -1.4s"
				></div>
			</div>
			<div class="container mx-auto px-4 relative z-10">
				<h2
					class="text-3xl font-bold mb-12 text-center text-cyber-pink font-mono relative inline-block left-1/2 transform -translate-x-1/2"
				>
					<span class="absolute -inset-1 bg-cyber-pink blur opacity-20"></span>
					{{ t("home.dataLogs") }}
				</h2>

				<div
					v-if="loading"
					class="text-center text-cyber-green font-mono"
				>
					{{ t("home.loading") }}
				</div>

				<div
					v-else-if="documents.length === 0"
					class="text-center text-gray-500 font-mono"
				>
					{{ t("home.noData") }}
				</div>

				<div
					v-else
					class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
				>
					<DocumentCard
						v-for="doc in documents"
						:key="doc.id"
						:doc="doc"
					/>
				</div>
			</div>
		</section>

		<!-- Footer -->
		<footer
			class="py-8 border-t border-cyber-primary text-center text-gray-500 font-mono text-xs"
		>
			<p>{{ t("home.footer") }}</p>
		</footer>
	</div>
</template>

<style scoped>
	.typing-effect {
		border-right: 2px solid #39ff14;
		white-space: nowrap;
		overflow: hidden;
		animation:
			typing 3.5s steps(40, end),
			blink-caret 0.75s step-end infinite;
		display: inline-block;
	}

	@keyframes typing {
		from {
			width: 0;
		}
		to {
			width: 100%;
		}
	}

	@keyframes blink-caret {
		from,
		to {
			border-color: transparent;
		}
		50% {
			border-color: #39ff14;
		}
	}

	.scan-horizontal {
		animation: scanHorizontal 3s linear infinite;
	}

	.scan-vertical {
		animation: scanVertical 4s linear infinite;
	}

	@keyframes scanHorizontal {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(200%);
		}
	}

	@keyframes scanVertical {
		0% {
			transform: translateY(-100%);
		}
		100% {
			transform: translateY(200%);
		}
	}

	.sweep-light {
		animation: sweepLight 6s ease-in-out infinite;
	}

	@keyframes sweepLight {
		0% {
			transform: translateX(-100%) rotate(45deg);
		}
		50%,
		100% {
			transform: translateX(100%) rotate(45deg);
		}
	}
</style>
