<script setup lang="ts">
	import { ref, computed } from "vue"
	import { useRouter } from "vue-router"
	import { useAuthStore } from "@/stores/auth"
	import { useCyberToast } from "@/composables/useCyberToast"
	import { useI18n } from "vue-i18n"
	import { apiFetch } from "@/utils/api"
	import { ArrowLeft } from "lucide-vue-next"
	import { useTheme } from "@/composables/useTheme"
	import { withBaseUrl } from '@/utils/asset-utils';

	const username = ref("")
	const password = ref("")
	const loading = ref(false)
	const router = useRouter()
	const authStore = useAuthStore()
	const { t } = useI18n()
	const { warning, success, error } = useCyberToast()
	const { isDark } = useTheme()

	const handleLogin = async () => {
		if (!username.value || !password.value) {
			warning(t("login.required"))
			return
		}

		loading.value = true
		try {
			const response = await apiFetch("/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					username: username.value,
					password: password.value,
				}),
			})

			const data = await response.json()

			if (data.success) {
				authStore.login(data.token, data.user)
				success(t("login.success"))
				router.push("/admin")
			} else {
				error(data.message || t("login.failed"))
			}
		} catch (e) {
			error(t("login.error"))
		} finally {
			loading.value = false
		}
	}
</script>

<template>
	<div
		class="flex justify-center items-center h-screen bg-base-bg relative overflow-hidden"
	>
		<!-- Back to Home Button -->
		<router-link
			to="/"
			class="fixed top-6 left-6 z-50 flex items-center gap-2 text-base-muted hover:text-base-text transition-colors text-sm min-h-[44px] min-w-[44px] px-4 py-2 border border-base-border rounded-xl bg-base-surface/50 hover:bg-base-surface backdrop-blur"
		>
			<ArrowLeft class="w-4 h-4" />
			<span class="hidden sm:inline">{{ t("nav.home") }}</span>
		</router-link>

		<!-- Logo -->
		<div class="fixed top-6 right-6 z-50 flex items-center gap-3">
			<img :src="withBaseUrl(isDark ? 'logo-lite.png' : 'logo.png')" alt="Nova Core" class="w-8 h-8 rounded" />
			<span class="text-xl font-bold tracking-tight text-base-text hidden sm:inline">Nova Core</span>
		</div>

		<!-- Background Effects -->
		<div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
			<div class="absolute inset-0 bg-gradient-to-b from-base-surface to-base-bg"></div>
			<div class="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-neon/10 rounded-full blur-[100px] animate-pulse"></div>
			<div class="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-cyber-pink/5 rounded-full blur-[120px]"></div>
		</div>

		<div class="w-full max-w-[400px] p-8 sm:p-10 bg-base-surface/80 backdrop-blur-xl border border-base-border rounded-3xl z-10 relative shadow-2xl">
			<h1 class="text-2xl sm:text-3xl font-bold text-center text-base-text mb-2 tracking-tight">
				{{ t("login.title") }}
			</h1>
			<p class="text-center text-base-muted text-sm mb-8">
				Sign in to your account
			</p>

			<form @submit.prevent="handleLogin" class="space-y-5">
				<div>
					<label class="block text-base-text text-sm font-medium mb-2">{{ t("login.username") }}</label>
					<input
						v-model="username"
						type="text"
						class="w-full bg-base-bg border border-base-border text-base-text px-4 py-3 rounded-xl focus:outline-none focus:border-cyber-neon focus:ring-1 focus:ring-cyber-neon transition-all duration-200"
						:placeholder="t('login.enterUsername')"
					/>
				</div>

				<div>
					<label class="block text-base-text text-sm font-medium mb-2">{{ t("login.password") }}</label>
					<input
						v-model="password"
						type="password"
						class="w-full bg-base-bg border border-base-border text-base-text px-4 py-3 rounded-xl focus:outline-none focus:border-cyber-neon focus:ring-1 focus:ring-cyber-neon transition-all duration-200"
						:placeholder="t('login.enterPassword')"
					/>
				</div>

				<button
					type="submit"
					:disabled="loading"
					class="w-full mt-4 bg-base-text text-base-bg font-semibold py-3.5 px-4 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
				>
					<span v-if="loading" class="w-5 h-5 border-2 border-base-bg border-t-transparent rounded-full animate-spin"></span>
					{{ loading ? t("login.authenticating") : t("login.submit") }}
				</button>
			</form>
		</div>
	</div>
</template>
