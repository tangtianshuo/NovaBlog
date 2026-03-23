import { syncDB, type SyncItem } from '@/utils/syncDB'

const SEED_PREFIX = 'seed'

const slugify = (value: string) =>
	value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')

const isoDaysAgo = (daysAgo: number) => new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()

const estimateReadingTime = (markdown: string) => {
	const stripped = markdown.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '')
	const words = stripped
		.replace(/[\n\r\t]+/g, ' ')
		.trim()
		.split(' ')
		.filter((w) => w)
		.length
	const cjk = (stripped.match(/[\u4e00-\u9fff]/g) || []).length
	const units = words + cjk / 2
	return Math.max(1, Math.round(units / 200))
}

const buildDocContent = (title: string, lang: 'zh' | 'en') => {
	if (lang === 'en') {
		return `# ${title}

This is seeded content for **Nova Core**. It is designed to test reading experience, typography, and code blocks.

## Why it exists

- Populate the masonry feed quickly
- Verify dark/light theme contrast
- Validate IndexedDB autosave + GitHub sync queue

## Example code

\`\`\`ts
export const sum = (a: number, b: number) => a + b
\`\`\`

## Diagram

\`\`\`mermaid
graph TD
  A[Edit] --> B[IndexedDB]
  B --> C[Sync Queue]
  C --> D[GitHub]
\`\`\`

## Notes

Try resizing the window to verify the reading layout still feels good on small screens.
`
	}

	return `# ${title}

这是一篇用于 **Nova Core** 的测试文章，目的是快速填充内容并验证阅读体验。

## 目标

- 让首页瀑布流有真实密度
- 测试浅色/深色主题的对比度
- 覆盖 Markdown 渲染（代码、表格、引用、Mermaid）

## 代码示例

\`\`\`ts
export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))
\`\`\`

## 结构图

\`\`\`mermaid
graph TD
  A[编辑] --> B[IndexedDB]
  B --> C[同步队列]
  C --> D[GitHub]
\`\`\`

> 提示：切换语言不会改变文章内容语言，但可以验证 UI 文案的中英文切换是否完整。
`
}

const buildProjectContent = (title: string) => `# ${title}

这是一个用于展示的项目说明文档。

## Features

- Modern UI tokens (Light/Dark)
- Masonry feed / infinite load
- Autosave on blur (IndexedDB)
- GitHub sync queue

## Tech

- Vue 3 + TypeScript
- TailwindCSS
`

const buildCollectionContent = (title: string) => `# ${title}

这是一个合集简介，包含若干篇文章用于串联阅读路径。
`

const buildItemId = (type: 'doc' | 'proj' | 'col', index: number) =>
	`${SEED_PREFIX}-${type}-${String(index).padStart(2, '0')}`

const queuePut = async (item: SyncItem) => {
	await syncDB.addToQueue(item)
}

export const seedTestData = async () => {
	await syncDB.init()

	const now = Date.now()
	const docIds: string[] = []

	for (let i = 1; i <= 16; i += 1) {
		const id = buildItemId('doc', i)
		const isEnglish = i % 4 === 0
		const title = isEnglish ? `Seeded Post ${i}: Nova Core Notes` : `测试文章 ${i}：Nova Core 阅读体验`
		const content = buildDocContent(title, isEnglish ? 'en' : 'zh')
		const createdAt = isoDaysAgo(30 - i)
		const readingTime = estimateReadingTime(content)
		const tags = isEnglish ? ['seed', 'english', 'nova-core'] : ['seed', '中文', 'nova-core']
		const coverImage = i % 3 === 0 ? '/images/hero-bg.jpg' : i % 3 === 1 ? '/images/neural-link.jpg' : '/images/neon-genesis.jpg'

		await queuePut({
			id,
			type: 'document',
			action: 'create',
			data: {
				metadata: {
					id,
					title,
					slug: slugify(title) || id,
					description: isEnglish
						? 'Seeded content to validate layout, typography, and sync flows.'
						: '用于验证布局、排版与同步流程的测试内容。',
					status: 'published',
					createdAt,
					updatedAt: createdAt,
					publishedAt: createdAt,
					tags,
					coverImage,
					readingTime,
					author: 'Nova Core',
					category: isEnglish ? 'Notes' : '笔记',
				},
				content,
			},
			timestamp: now - i * 60_000,
		})

		docIds.push(id)
	}

	for (let i = 1; i <= 6; i += 1) {
		const id = buildItemId('proj', i)
		const title = i % 2 === 0 ? `Nova Core Project ${i}` : `示例项目 ${i}`
		const createdAt = isoDaysAgo(20 - i)
		await queuePut({
			id,
			type: 'project',
			action: 'create',
			data: {
				metadata: {
					id,
					title,
					slug: slugify(title) || id,
					description:
						i % 2 === 0
							? 'A seeded project to validate project cards and details.'
							: '用于验证项目卡片与详情页的测试项目。',
					imageUrl: i % 2 === 0 ? '/images/cyber-deck.jpg' : '/images/default-project.png',
					link: 'https://example.com',
					tags: i % 2 === 0 ? ['seed', 'frontend', 'ui'] : ['seed', '项目展示', 'ui'],
					articles: docIds.slice((i - 1) * 2, (i - 1) * 2 + 2),
					createdAt,
					updatedAt: createdAt,
				},
				content: buildProjectContent(title),
			},
			timestamp: now - (100 + i) * 60_000,
		})
	}

	for (let i = 1; i <= 4; i += 1) {
		const id = buildItemId('col', i)
		const title = i % 2 === 0 ? `Seed Collection ${i}` : `示例合集 ${i}`
		const createdAt = isoDaysAgo(10 - i)
		await queuePut({
			id,
			type: 'collection',
			action: 'create',
			data: {
				metadata: {
					id,
					title,
					slug: slugify(title) || id,
					description: i % 2 === 0 ? 'A curated set of seeded articles.' : '用于串联阅读路径的测试合集。',
					coverImage: i % 2 === 0 ? '/images/hero-bg.jpg' : '/images/neural-link.jpg',
					articles: docIds.slice((i - 1) * 3, (i - 1) * 3 + 3),
					createdAt,
					updatedAt: createdAt,
				},
				content: buildCollectionContent(title),
			},
			timestamp: now - (200 + i) * 60_000,
		})
	}

	return {
		documents: 16,
		projects: 6,
		collections: 4,
	}
}

export const clearSeedData = async () => {
	await syncDB.init()
	const items = await syncDB.getQueue()
	const seedItems = items.filter((item) => {
		if (item.id.startsWith(`${SEED_PREFIX}-`)) return true
		const metaId = (item.data as { metadata?: { id?: string } })?.metadata?.id
		return typeof metaId === 'string' && metaId.startsWith(`${SEED_PREFIX}-`)
	})

	for (const item of seedItems) {
		await syncDB.removeFromQueue(item.id)
	}

	return { removed: seedItems.length }
}

