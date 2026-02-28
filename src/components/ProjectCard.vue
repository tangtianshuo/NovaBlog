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
		class="group relative bg-cyber-dark border border-cyber-primary hover:border-cyber-neon transition-all duration-300 overflow-hidden rounded-lg"
	>
		<!-- Cyber Corner Effect -->
		<div class="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyber-neon opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
		<div class="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyber-neon opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
		<div class="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyber-neon opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
		<div class="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyber-neon opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>

		<!-- Scan Line Effect -->
		<div class="absolute inset-0 overflow-hidden pointer-events-none z-20">
			<div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyber-neon to-transparent opacity-0 group-hover:opacity-100 scan-line"></div>
		</div>

		<!-- Image -->
		<div class="aspect-video w-full overflow-hidden relative">
			<img
				:src="image"
				:alt="title"
				class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 filter grayscale group-hover:grayscale-0"
			/>
			<div
				class="absolute inset-0 bg-gradient-to-t from-cyber-dark via-transparent to-transparent opacity-90"
			></div>
			<!-- Glowing Overlay -->
			<div class="absolute inset-0 bg-gradient-to-r from-cyber-pink/10 via-transparent to-cyber-neon/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
		</div>

		<!-- Content -->
		<div class="p-4 relative bg-gradient-to-b from-transparent to-cyber-dark/50">
			<!-- Action Buttons -->
			<div class="flex gap-2 mb-3" v-if="link || projectId">
				<a
					v-if="link"
					:href="link"
					target="_blank"
					class="flex-1 bg-transparent border border-cyber-green text-cyber-green p-2 rounded hover:bg-cyber-green hover:text-black transition-all flex items-center justify-center gap-2 font-mono text-sm hover:shadow-[0_0_10px_rgba(57,255,20,0.5)]"
				>
					<ExternalLink class="w-4 h-4" />
					<span>直达链接</span>
				</a>
				<router-link
					v-if="projectId"
					:to="`/project/${projectId}`"
					class="flex-1 bg-transparent border border-cyber-pink text-cyber-pink p-2 rounded hover:bg-cyber-pink hover:text-black transition-all flex items-center justify-center gap-2 font-mono text-sm hover:shadow-[0_0_10px_rgba(255,20,147,0.5)]"
				>
					<BookOpen class="w-4 h-4" />
					<span>详情介绍</span>
				</router-link>
			</div>

			<h3 class="text-xl font-bold text-cyber-neon mb-2 font-mono group-hover:text-white transition-colors group-hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]">
				{{ title }}
			</h3>
			<p class="text-gray-300 text-sm mb-4 line-clamp-3">{{ description }}</p>

			<div class="flex flex-wrap gap-2">
				<span
					v-for="tag in tags"
					:key="tag"
					class="text-xs font-mono text-cyber-neon border border-cyber-neon/50 bg-cyber-neon/10 px-2 py-0.5 rounded"
				>
					#{{ tag }}
				</span>
			</div>
		</div>

		<!-- Glitch effect overlay on hover -->
		<div class="absolute inset-0 border-2 border-cyber-neon opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 shadow-[0_0_20px_rgba(0,255,255,0.5)] z-30"></div>
	</div>
</template>

<style scoped>
	.scan-line {
		animation: scanMove 2s linear infinite;
	}

	@keyframes scanMove {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}
</style>
