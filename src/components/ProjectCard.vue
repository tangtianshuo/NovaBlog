<script setup lang="ts">
	import { ExternalLink, BookOpen, ArrowUpRight } from "lucide-vue-next"

	defineProps<{
		title: string
		description: string
		image: string
		link?: string
		tags: string[]
		projectId?: string
	}>()
</script>

<template>
	<article class="group rounded-2xl border border-base-border bg-base-surface overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-neon hover:border-cyber-neon">
		<div class="relative">
			<div class="aspect-video overflow-hidden">
				<img :src="image" :alt="title" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
			</div>
			<div class="absolute inset-0 bg-gradient-to-t from-base-bg/70 via-transparent to-transparent"></div>
			<div class="absolute top-3 right-3 rounded-full border border-base-border bg-base-bg/70 backdrop-blur px-2 py-1 text-xs text-base-muted">
				<span>{{ tags?.length ? tags[0] : 'Project' }}</span>
			</div>
		</div>

		<div class="p-4">
			<div class="flex items-start justify-between gap-3">
				<h3 class="text-base md:text-lg font-semibold tracking-tight text-base-text">
					{{ title }}
				</h3>
				<ArrowUpRight class="w-4 h-4 text-base-muted transition group-hover:text-base-text" />
			</div>
			<p class="mt-2 text-sm text-base-muted line-clamp-3 leading-relaxed">
				{{ description }}
			</p>

			<div class="mt-4 flex gap-2" v-if="link || projectId">
				<a
					v-if="link"
					:href="link"
					target="_blank"
					class="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-base-border bg-base-bg px-3 py-2 text-sm font-semibold text-base-text hover:bg-base-surface2 transition"
				>
					<ExternalLink class="w-4 h-4" />
					<span>Link</span>
				</a>
				<router-link
					v-if="projectId"
					:to="`/project/${projectId}`"
					class="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-base-border bg-base-bg px-3 py-2 text-sm font-semibold text-base-text hover:bg-base-surface2 transition"
				>
					<BookOpen class="w-4 h-4" />
					<span>Detail</span>
				</router-link>
			</div>

			<div v-if="tags?.length" class="mt-4 flex flex-wrap gap-2">
				<span
					v-for="tag in tags"
					:key="tag"
					class="rounded-full border border-base-border bg-base-bg px-2.5 py-1 text-xs font-medium text-base-muted"
				>
					{{ tag }}
				</span>
			</div>
		</div>
	</article>
</template>
