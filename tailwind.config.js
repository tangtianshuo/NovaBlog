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
					primary: "#1a0033", // Deep Purple
					neon: "#00ffff", // Neon Blue
					green: "#39ff14", // Fluorescent Green
					dark: "#0d0d0d", // Dark Gray
					pink: "#ff1493", // Bright Pink
					yellow: "#ffff00", // Neon Yellow
				},
			},
			fontFamily: {
				mono: ["Courier New", "Courier", "monospace"],
			},
			boxShadow: {
				neon: "0 0 5px #00ffff, 0 0 10px #00ffff",
				"neon-green": "0 0 5px #39ff14, 0 0 10px #39ff14",
				"neon-pink": "0 0 5px #ff1493, 0 0 10px #ff1493",
			},
		},
	},
	plugins: [typography],
}
