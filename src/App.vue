<script setup lang="ts">
	import NavBar from "@/components/NavBar.vue"
	import Breadcrumb from "@/components/Breadcrumb.vue"
	import CyberToastContainer from "@/components/CyberToastContainer.vue"
	import { useRoute } from "vue-router"
	import { computed, onMounted } from "vue"
	import { useTheme } from "@/composables/useTheme"
	import { syncDB } from "@/utils/syncDB"
	import { apiFetch } from "@/utils/api"

	const route = useRoute()
	const showNavBar = computed(() => route.name !== "login")

	useTheme()

	onMounted(async () => {
		await syncDB.init()
		try {
			const [docsRes, projsRes, colsRes] = await Promise.all([
				apiFetch("/documents?status=published"),
				apiFetch("/projects"),
				apiFetch("/collections"),
			])
			const [docsData, projsData, colsData] = await Promise.all([
				docsRes.json(),
				projsRes.json(),
				colsRes.json(),
			])
			await syncDB.reconcileWithRemoteIndex({
				documents: (docsData?.success ? docsData.data : []).map((d: any) => ({
					id: d.id,
					updatedAt: d.updatedAt,
				})),
				projects: (projsData?.success ? projsData.data : []).map((p: any) => ({
					id: p.id,
					updatedAt: p.updatedAt,
				})),
				collections: (colsData?.success ? colsData.data : []).map((c: any) => ({
					id: c.id,
					updatedAt: c.updatedAt,
				})),
			})
		} catch {
			return
		}
	})
</script>

<template>
	<NavBar v-if="showNavBar" />
	<Breadcrumb v-if="showNavBar" />
	<router-view />
	<CyberToastContainer />
</template>
