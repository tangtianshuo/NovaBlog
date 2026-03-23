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

			if (p.length > 20 && p.includes("-")) continue

			let name = p
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
		class="sticky top-[56px] left-0 w-full z-40 bg-base-bg/80 backdrop-blur border-b border-base-border"
	>
		<div class="container mx-auto px-4 py-3 flex items-center justify-between">
			<div class="flex items-center text-sm text-base-muted">
				<router-link
					to="/"
					class="hover:text-base-text transition-colors flex items-center"
				>
					<Home class="w-4 h-4 mr-1" />
				</router-link>

				<template
					v-for="(item, index) in breadcrumbs"
					:key="item.path"
				>
					<ChevronRight
						v-if="index > 0"
						class="w-4 h-4 mx-2 text-base-border"
					/>
					<router-link
						v-if="index > 0"
						:to="item.path"
						class="hover:text-base-text transition-colors"
						:class="{
							'text-base-text font-semibold': index === breadcrumbs.length - 1,
						}"
					>
						{{ item.name }}
					</router-link>
				</template>
			</div>

			<button
				v-if="showBack"
				@click="goBack"
				class="flex items-center text-xs font-semibold text-base-text transition-colors border border-base-border px-3 py-1.5 rounded-lg hover:bg-base-surface"
			>
				<ArrowLeft class="w-3 h-3 mr-1" />
				{{ t("project.back") }}
			</button>
		</div>
	</div>
</template>
