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
					manualChunks: (id) => {
						if (id.includes("node_modules")) {
							if (
								id.includes("vue") ||
								id.includes("pinia") ||
								id.includes("vue-router") ||
								id.includes("vue-i18n")
							) {
								return "vendor"
							}
							if (
								id.includes("ant-design-vue") ||
								id.includes("lucide-vue-next")
							) {
								return "ui"
							}
							if (id.includes("markdown-it") || id.includes("highlight.js")) {
								return "markdown"
							}
							if (id.includes("mermaid")) {
								return "mermaid"
							}
						}
					},
				},
			},
		},
		base: basePath,
		define: {
			"import.meta.env.VITE_API_BASE": JSON.stringify(apiBase),
			"import.meta.env.VITE_API_URL": JSON.stringify(
				isProduction ? "" : apiUrl,
			),
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
