<script setup lang="ts">
	import { computed, ref, onMounted, nextTick, watch } from "vue"
	import MarkdownIt from "markdown-it"
	import hljs from "highlight.js"
	import "highlight.js/styles/atom-one-dark.css"

	const props = defineProps<{
		content: string
	}>()

	const md = new MarkdownIt({
		html: true,
		linkify: true,
		typographer: true,
		highlight: function (str, lang) {
			if (lang && hljs.getLanguage(lang)) {
				try {
					return (
						'<pre class="hljs"><code>' +
						hljs.highlight(str, { language: lang, ignoreIllegals: true })
							.value +
						"</code></pre>"
					)
				} catch (__) {}
			}

			return (
				'<pre class="hljs"><code>' + md.utils.escapeHtml(str) + "</code></pre>"
			)
		},
	})

	const htmlContent = computed(() => {
		return md.render(props.content || "")
	})

	const previewRef = ref<HTMLElement | null>(null)

	const renderMermaid = async () => {
		await nextTick()

		if (!previewRef.value) return

		const mermaidModule = await import("mermaid")
		const mermaid = mermaidModule.default

		await mermaid.initialize({
			startOnLoad: false,
			theme: "dark",
			securityLevel: "loose",
		})

		// Find all mermaid code blocks
		const mermaidBlocks = previewRef.value.querySelectorAll(
			"pre code.language-mermaid",
		)

		for (const block of mermaidBlocks) {
			try {
				const code = block.textContent || ""
				const pre = block.parentElement

				if (pre) {
					const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
					const { svg } = await mermaid.render(id, code.trim())
					
					const mermaidDiv = document.createElement("div")
					mermaidDiv.className = "mermaid"
					mermaidDiv.innerHTML = svg

					pre.replaceWith(mermaidDiv)
				}
			} catch (error) {
				console.error("Mermaid rendering error:", error)
			}
		}
	}

	// Watch content changes and re-render mermaid
	watch(
		() => props.content,
		() => {
			renderMermaid()
		},
		{ flush: "post" },
	)

	onMounted(() => {
		renderMermaid()
	})
</script>

<template>
	<div
		ref="previewRef"
		class="markdown-body prose prose-invert prose-cyber max-w-none"
		v-html="htmlContent"
	></div>
</template>

<style>
	/* Custom prose styles for Cyberpunk theme */
	.prose-cyber {
		color: #e5e7eb;
	}

	.prose-cyber h1,
	.prose-cyber h2,
	.prose-cyber h3,
	.prose-cyber h4 {
		color: #00ffff;
		font-family: "Courier New", Courier, monospace;
	}

	.prose-cyber a {
		color: #ff1493;
		text-decoration: none;
		border-bottom: 1px dashed #ff1493;
	}

	.prose-cyber a:hover {
		color: #39ff14;
		border-color: #39ff14;
	}

	.prose-cyber code {
		color: #39ff14;
		background-color: #0d0d0d;
		padding: 0.2em 0.4em;
		border-radius: 0.25rem;
		font-family: "Courier New", Courier, monospace;
	}

	.prose-cyber pre {
		background-color: #0d0d0d;
		border: 1px solid #1a0033;
	}

	.prose-cyber blockquote {
		border-left-color: #00ffff;
		color: #9ca3af;
		background: rgba(26, 0, 51, 0.3);
		padding: 1rem;
	}

	.prose-cyber strong {
		color: #00ffff;
	}

	/* Mermaid diagram styling */
	.prose-cyber .mermaid {
		background-color: rgba(13, 13, 13, 0.5);
		border-radius: 8px;
		padding: 1rem;
		margin: 1rem 0;
	}
</style>
