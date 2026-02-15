<script setup lang="ts">
	import { ExternalLink, BookOpen } from "lucide-vue-next"

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
	<div
		class="group relative bg-cyber-dark border border-cyber-primary hover:border-cyber-green transition-all duration-300 overflow-hidden rounded-lg"
	>
		<!-- Image -->
		<div class="aspect-video w-full overflow-hidden relative">
			<img
				:src="image"
				:alt="title"
				class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 filter grayscale group-hover:grayscale-0"
			/>
			<div
				class="absolute inset-0 bg-gradient-to-t from-cyber-dark to-transparent opacity-80"
			></div>
		</div>

		<!-- Content -->
		<div class="p-4 relative">
			<!-- Action Buttons -->
			<div
				class="flex gap-2 mb-3"
				v-if="link || projectId"
			>
				<a
					v-if="link"
					:href="link"
					target="_blank"
					class="flex-1 bg-cyber-green text-black p-2 rounded hover:bg-white transition-all flex items-center justify-center gap-2 font-mono text-sm"
				>
					<ExternalLink class="w-4 h-4" />
					<span>直达链接</span>
				</a>
				<router-link
					v-if="projectId"
					:to="`/project/${projectId}`"
					class="flex-1 bg-cyber-pink text-white p-2 rounded hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 font-mono text-sm"
				>
					<BookOpen class="w-4 h-4" />
					<span>详情介绍</span>
				</router-link>
			</div>

			<h3
				class="text-xl font-bold text-cyber-neon mb-2 font-mono group-hover:text-cyber-green transition-colors"
			>
				{{ title }}
			</h3>
			<p class="text-gray-400 text-sm mb-4 line-clamp-3">{{ description }}</p>

			<div class="flex flex-wrap gap-2">
				<span
					v-for="tag in tags"
					:key="tag"
					class="text-xs font-mono text-cyber-pink border border-cyber-pink px-2 py-0.5 rounded opacity-70"
				>
					#{{ tag }}
				</span>
			</div>
		</div>

		<!-- Glitch effect overlay on hover -->
		<div
			class="absolute inset-0 border-2 border-cyber-green opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 shadow-neon-green"
		></div>
	</div>
</template>
