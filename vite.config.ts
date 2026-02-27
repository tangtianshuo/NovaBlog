import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import path from "path"
import Inspector from "unplugin-vue-dev-locator/vite"

const apiUrl = process.env.VITE_API_URL || "http://localhost:3001"
const basePath = process.env.VITE_BASE_PATH || "/"
const apiBase = process.env.VITE_API_BASE || "/api"
const isProduction = process.env.NODE_ENV === "production"

export default defineConfig({
	build: {
		sourcemap: "hidden",
	},
	base: basePath,
	define: {
		"import.meta.env.VITE_API_BASE": JSON.stringify(apiBase),
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
})
