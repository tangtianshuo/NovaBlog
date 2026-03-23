<script setup lang="ts">
	import { computed, ref, onMounted, nextTick, watch } from "vue"
	import MarkdownIt from "markdown-it"
	import hljs from "highlight.js"
	import "highlight.js/styles/atom-one-dark.css"
	import { useTheme } from "@/composables/useTheme"

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
	const { isDark } = useTheme()

	const renderMermaid = async () => {
		await nextTick()

		if (!previewRef.value) return

		const mermaidModule = await import("mermaid")
		const mermaid = mermaidModule.default

		await mermaid.initialize({
			startOnLoad: false,
			theme: isDark.value ? "dark" : "default",
			securityLevel: "loose",
		})

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

	watch(
		() => props.content,
		() => {
			renderMermaid()
		},
		{ flush: "post" },
	)

	watch(
		() => isDark.value,
		() => {
			renderMermaid()
		},
	)

	onMounted(() => {
		renderMermaid()
	})
</script>

<template>
	<div
		ref="previewRef"
		class="markdown-body prose max-w-none dark:prose-invert"
		v-html="htmlContent"
	></div>
</template>

<style>
	.markdown-body {
		--tw-prose-body: hsl(var(--text));
		--tw-prose-headings: hsl(var(--text));
		--tw-prose-lead: hsl(var(--text));
		--tw-prose-links: hsl(var(--accent));
		--tw-prose-bold: hsl(var(--text));
		--tw-prose-counters: hsl(var(--muted));
		--tw-prose-bullets: hsl(var(--muted));
		--tw-prose-hr: hsl(var(--border));
		--tw-prose-quotes: hsl(var(--text));
		--tw-prose-quote-borders: hsl(var(--border));
		--tw-prose-captions: hsl(var(--muted));
		--tw-prose-code: hsl(var(--text));
		--tw-prose-pre-code: hsl(var(--text));
		--tw-prose-pre-bg: hsl(var(--surface));
		--tw-prose-th-borders: hsl(var(--border));
		--tw-prose-td-borders: hsl(var(--border));
	}

	.dark .markdown-body {
		--tw-prose-invert-body: hsl(var(--text));
		--tw-prose-invert-headings: hsl(var(--text));
		--tw-prose-invert-lead: hsl(var(--text));
		--tw-prose-invert-links: hsl(var(--primary));
		--tw-prose-invert-bold: hsl(var(--text));
		--tw-prose-invert-counters: hsl(var(--muted));
		--tw-prose-invert-bullets: hsl(var(--muted));
		--tw-prose-invert-hr: hsl(var(--border));
		--tw-prose-invert-quotes: hsl(var(--text));
		--tw-prose-invert-quote-borders: hsl(var(--border));
		--tw-prose-invert-captions: hsl(var(--muted));
		--tw-prose-invert-code: hsl(var(--text));
		--tw-prose-invert-pre-code: hsl(var(--text));
		--tw-prose-invert-pre-bg: hsl(var(--surface));
		--tw-prose-invert-th-borders: hsl(var(--border));
		--tw-prose-invert-td-borders: hsl(var(--border));
	}

	.markdown-body a {
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 3px;
	}

	.markdown-body a:hover {
		color: hsl(var(--primary));
	}

	.markdown-body :not(pre) > code {
		background: hsl(var(--surface2));
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		padding: 0.12rem 0.4rem;
		font-weight: 600;
	}

	.markdown-body pre.hljs {
		border-radius: 1rem;
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
		overflow-x: auto;
		padding: 1rem 1.25rem;
	}

	.markdown-body blockquote {
		border-left-color: hsl(var(--primary));
		background: hsl(var(--surface2));
		border-radius: 0.75rem;
		padding: 1rem;
	}

	.markdown-body .mermaid {
		background: hsl(var(--surface));
		border: 1px solid hsl(var(--border));
		border-radius: 1rem;
		padding: 1rem;
	}
</style>
