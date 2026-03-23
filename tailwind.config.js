/** @type {import('tailwindcss').Config} */
import typography from "@tailwindcss/typography"

export default {
	darkMode: "class",
	content: ["./index.html", "./src/**/*.{js,ts,vue}"],
	theme: {
		container: {
			center: true,
			padding: "2rem",
		},
		extend: {
			colors: {
				cyber: {
					dark: "hsl(var(--bg) / <alpha-value>)",
					primary: "hsl(var(--surface) / <alpha-value>)",
					neon: "hsl(var(--primary) / <alpha-value>)",
					pink: "hsl(var(--accent) / <alpha-value>)",
					green: "hsl(var(--success) / <alpha-value>)",
					yellow: "hsl(var(--warning) / <alpha-value>)",
				},
				base: {
					bg: "hsl(var(--bg) / <alpha-value>)",
					surface: "hsl(var(--surface) / <alpha-value>)",
					surface2: "hsl(var(--surface2) / <alpha-value>)",
					text: "hsl(var(--text) / <alpha-value>)",
					muted: "hsl(var(--muted) / <alpha-value>)",
					border: "hsl(var(--border) / <alpha-value>)",
				},
			},
			fontFamily: {
				mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
				sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "Apple Color Emoji", "Segoe UI Emoji"],
			},
			boxShadow: {
				neon: "0 10px 30px rgba(0, 212, 255, 0.18)",
				"neon-green": "0 10px 30px rgba(16, 185, 129, 0.18)",
				"neon-pink": "0 10px 30px rgba(99, 102, 241, 0.18)",
			},
		},
	},
	plugins: [typography],
}
