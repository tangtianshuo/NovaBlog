<script setup lang="ts">
	import { computed } from "vue"
	import { useRoute, useRouter } from "vue-router"
	import { Home, ChevronRight, ArrowLeft } from "lucide-vue-next"
	import { useI18n } from "vue-i18n"

	const route = useRoute()
	const router = useRouter()
	const { t } = useI18n()

	const breadcrumbs = computed(() => {
		const paths = route.path.split("/").filter((p) => p)
		const items = [{ name: t("nav.home"), path: "/" }]

		let currentPath = ""

		for (const p of paths) {
			currentPath += `/${p}`

			// Skip if it's just an ID (simple heuristic)
			if (p.length > 20 && p.includes("-")) continue

			let name = p
			// Map common paths to localized names
			if (p === "collections") name = t("nav.collections")
			else if (p === "projects") name = t("nav.projects")
			else if (p === "doc") name = t("nav.docs")
			else if (p === "editor") name = t("nav.editor")
			else if (p === "admin") name = t("nav.admin")
			else if (p === "resume") name = t("nav.resume")
			else if (p === "login") name = t("nav.access")

			items.push({
				name: name.charAt(0).toUpperCase() + name.slice(1),
				path: currentPath,
			})
		}

		return items
	})

	const showBack = computed(() => {
		return window.history.length > 1 && route.path !== "/"
	})

	const goBack = () => {
		router.back()
	}
</script>

<template>
	<div
		v-if="route.path !== '/'"
		class="fixed top-[100px] md:top-[53px] left-0 w-full z-40 bg-black bg-opacity-80 backdrop-blur border-b border-gray-800"
	>
		<div class="container mx-auto px-4 py-4 flex items-center justify-between">
			<div class="flex items-center text-sm font-mono text-gray-400">
				<router-link
					to="/"
					class="hover:text-cyber-neon transition-colors flex items-center"
				>
					<Home class="w-4 h-4 mr-1" />
				</router-link>

				<template
					v-for="(item, index) in breadcrumbs"
					:key="item.path"
				>
					<ChevronRight
						v-if="index > 0"
						class="w-4 h-4 mx-2 text-gray-600"
					/>
					<router-link
						v-if="index > 0"
						:to="item.path"
						class="hover:text-cyber-neon transition-colors"
						:class="{
							'text-cyber-neon font-bold': index === breadcrumbs.length - 1,
						}"
					>
						{{ item.name }}
					</router-link>
				</template>
			</div>

			<button
				v-if="showBack"
				@click="goBack"
				class="flex items-center text-xs font-mono text-cyber-pink hover:text-white transition-colors border border-cyber-pink px-2 py-1 rounded hover:bg-cyber-pink hover:bg-opacity-20"
			>
				<ArrowLeft class="w-3 h-3 mr-1" />
				{{ t("project.back") }}
			</button>
		</div>
	</div>
</template>
