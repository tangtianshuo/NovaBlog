<script setup lang="ts">
	import NavBar from "@/components/NavBar.vue"
	import CyberToastContainer from "@/components/CyberToastContainer.vue"
	import { useRoute } from "vue-router"
	import { computed } from "vue"

	const route = useRoute()
	const showNavBar = computed(() => route.name !== "login")
</script>

<template>
	<NavBar v-if="showNavBar" />
	<router-view />
	<CyberToastContainer />
</template>
