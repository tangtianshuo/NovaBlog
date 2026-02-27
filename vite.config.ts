import { defineConfig, loadEnv } from "vite"
import vue from "@vitejs/plugin-vue"
import path from "path"
import Inspector from "unplugin-vue-dev-locator/vite"

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "")
	const apiUrl = env.VITE_API_URL || "http://localhost:3001"
	const basePath = env.VITE_BASE_PATH || "/"
	const apiBase = env.VITE_API_BASE || "/api"
	const isProduction = mode === "production"

	return {
		build: {
			sourcemap: "hidden",
			rollupOptions: {
				output: {
					manualChunks: {
						vendor: ["vue", "vue-router", "pinia", "vue-i18n"],
						ui: ["ant-design-vue", "lucide-vue-next"],
						markdown: ["markdown-it", "highlight.js", "mermaid"],
					},
				},
			},
		},
		base: basePath,
		define: {
			"import.meta.env.VITE_API_BASE": JSON.stringify(apiBase),
			"import.meta.env.VITE_API_URL": JSON.stringify(isProduction ? "" : apiUrl),
		},
		plugins: [vue(), Inspector()],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
		server: {
			proxy: {
				"/api": {
					target: apiUrl,
					changeOrigin: true,
					secure: false,
				},
				"/uploads": {
					target: apiUrl,
					changeOrigin: true,
					secure: false,
				},
			},
		},
	}
})
