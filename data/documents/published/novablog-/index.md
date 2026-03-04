---
title: NovaBlog 云端部署技术方案
description: 使用Vercel做内容托管，Cloudflare做DNS解析，githubRepo做文档存储。
tags:
  - Vercel
  - Cloudflare
  - GithubRepo
status: published
id: 1458b566-574d-40ce-8906-601c8342c6d3
slug: novablog-云端部署技术方案
createdAt: "2026-03-01T03:22:19.582Z"
updatedAt: "2026-03-01T03:22:19.582Z"
author: admin
publishedAt: "2026-03-01T03:22:19.582Z"
---

# NovaBlog 云端部署技术方案

本文档详细介绍 NovaBlog 的云端部署方案，涵盖 Vercel + GitHub 存储 + Cloudflare 的完整技术架构。

---

## 目录

1. [架构概述](#架构概述)
2. [Vercel 部署](#vercel-部署)
3. [GitHub 数据存储](#github-数据存储)
4. [本地 IndexedDB + 批量同步](#本地-indexeddb--批量同步)
5. [Cloudflare CDN 加速](#cloudflare-cdn-加速)
6. [环境变量配置](#环境变量配置)
7. [数据流说明](#数据流说明)
8. [常见问题](#常见问题)

---

## 架构概述

```
┌─────────────────────────────────────────────────────────────────┐
│                           用户                                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Cloudflare (CDN + DNS)                        │
│                   blog.example.com                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                         Vercel                                   │
│  ┌─────────────────────┐    ┌────────────────────────────────┐  │
│  │   Vue 3 前端        │    │   Express API (Serverless)    │  │
│  │   (静态资源)        │◄──►│   • 认证                      │  │
│  │                     │    │   • GitHub API 同步            │  │
│  └─────────────────────┘    │   • 数据读写                   │  │
│                              └────────────────┬────────────────┘  │
└──────────────────────────────┬─────────────────┴─────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                        GitHub 仓库                               │
│  • data/documents/    (文章)                                   │
│  • data/projects/     (项目)                                   │
│  • data/collections/  (合集)                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Vercel 部署

### 部署步骤

1. **推送代码到 GitHub**

```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

2. **在 Vercel 导入项目**
   - 访问 [Vercel](https://vercel.com/new)
   - 使用 GitHub 登录
   - 导入 NovaBlog 仓库
   - 配置：
     - Framework Preset: `Other`
     - Build Command: `npm run vercel-build`
     - Output Directory: `dist`
     - Install Command: `npm install`

3. **配置环境变量**（详见下文）

4. **部署完成**

### vercel.json 配置

```json
{
	"version": 2,
	"builds": [
		{
			"src": "package.json",
			"use": "@vercel/static-build",
			"config": {
				"distDir": "dist"
			}
		},
		{
			"src": "api/index.ts",
			"use": "@vercel/node",
			"config": {
				"maxDuration": 30
			}
		}
	],
	"rewrites": [
		{ "source": "/api/(.*)", "destination": "/api/index.ts" },
		{ "source": "/uploads/(.*)", "destination": "/uploads/$1" },
		{
			"source": "/((?!api/|uploads/|assets/|.*\\..*).*)",
			"destination": "/index.html"
		}
	]
}
```

---

## GitHub 数据存储

### 存储结构

```
data/
├── documents/
│   ├── draft/
│   │   └── article-title/
│   │       └── index.md
│   └── published/
│       └── article-title/
│           └── index.md
├── projects/
│   └── project-name/
│       └── index.md
└── collections/
    └── collection-name/
        └── index.md
```

### 文件格式

使用 Frontmatter 格式存储：

```markdown
---
id: 550e8400-e29b-41d4-a716-446655440000
title: 文章标题
slug: article-slug
description: 文章描述
status: published
createdAt: 2024-01-01T00:00:00.000Z
updatedAt: 2024-01-02T00:00:00.000Z
publishedAt: 2024-01-02T00:00:00.000Z
tags:
  - 技术
  - Vue
category: tech
author: admin
---

文章内容...
```

### GitHub API 同步

后端通过 GitHub API 进行文件操作：

```typescript
// api/utils/githubSync.ts
const GITHUB_API_BASE = "https://api.github.com"

async function createOrUpdateFile(file: {
	path: string
	content: string
	message: string
	sha?: string
}): Promise<boolean> {
	const sha = await getFileSha(file.path)

	const body = {
		message: file.message,
		content: Buffer.from(file.content).toString("base64"),
		branch: BRANCH,
		...(sha && { sha }),
	}

	const response = await fetch(
		`${GITHUB_API_BASE}/repos/${OWNER}/${REPO}/contents/${file.path}`,
		{
			method: "PUT",
			headers: await getHeaders(),
			body: JSON.stringify(body),
		},
	)

	return response.ok
}
```

---

## 本地 IndexedDB + 批量同步

### 解决的问题

Vercel 是无服务器平台，**不允许在运行时写入文件系统**。直接保存文档会失败。

### 解决方案

采用本地存储 + 批量同步的架构：

1. **保存时**：数据存储到浏览器 IndexedDB
2. **同步时**：批量提交到 GitHub

### 核心代码

#### IndexedDB 工具类

```typescript
// src/utils/syncDB.ts
class IndexedDBManager {
	private db: IDBDatabase | null = null

	async init(): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open("novablog-sync", 1)

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result
				db.createObjectStore("syncQueue", { keyPath: "id" })
			}

			request.onsuccess = () => {
				this.db = request.result
				resolve()
			}
		})
	}

	async saveDocument(
		doc: { metadata: Record<string, unknown>; content: string },
		id?: string,
	): Promise<string> {
		const docId = id || crypto.randomUUID()
		await this.addToQueue({
			id: docId,
			type: "document",
			action: id ? "update" : "create",
			data: doc,
			timestamp: Date.now(),
		})
		return docId
	}

	async getQueue(): Promise<SyncItem[]> {
		// 获取所有待同步项
	}

	async clearQueue(): Promise<void> {
		// 同步成功后清空队列
	}
}

export const syncDB = new IndexedDBManager()
```

#### 同步 API

```typescript
// api/routes/sync.ts
router.post("/", authenticateToken, async (req, res) => {
	const { items } = req.body

	for (const item of items) {
		if (item.type === "document") {
			const metadata = item.data.metadata
			const filePath = getDocumentPath(metadata)
			const fileContent = matter.stringify(content, metadata)

			await createOrUpdateFile({
				path: filePath,
				content: fileContent,
				message: generateCommitMessage(item.action, "document", title),
			})
		}
	}

	res.json({ success: true, message: "同步完成" })
})
```

### 前端界面

在管理页面添加"同步到 GitHub"按钮：

```vue
<template>
	<button
		@click="syncToGitHub"
		:disabled="syncing"
	>
		<Loader2
			v-if="syncing"
			class="animate-spin"
		/>
		<GitBranch v-else />
		{{ syncing ? "同步中..." : "同步到GitHub" }}
		<span
			v-if="pendingCount > 0"
			class="badge"
			>{{ pendingCount }}</span
		>
	</button>
</template>
```

### 数据来源标签

表格中显示数据来源状态：

| 状态     | 标签    | 说明              |
| -------- | ------- | ----------------- |
| 本地新增 | 🟡 黄色 | 新创建还未同步    |
| 本地更新 | 🟠 橙色 | 已修改还未同步    |
| 已同步   | ⬜ 灰色 | 已经同步到 GitHub |

### 发布时自动清理草稿

```typescript
// 发布文档时
if (status === "published") {
  // 1. 检查 GitHub 上是否存在草稿
  const draftPath = `data/documents/draft/${docId}/index.md`
  const draftContent = await getFile(draftPath)

  // 2. 如果存在，先删除草稿
  if (draftContent) {
    await deleteFile({
      path: draftPath,
      message: `删除草稿: ${title} (已发布)`,
    })
  }

  // 3. 创建发布版本
  await createOrUpdateFile({ ... })
}
```

### ID 冲突检测

```typescript
// 前端发布时检测
if (status === "published") {
	const localDocs = await syncDB.getLocalDocuments()
	const existingDraft = localDocs.find(
		(d) => d.id === docId && d.metadata.status === "draft",
	)
	if (existingDraft) {
		error("无法发布：本地存在相同ID的草稿")
		return
	}
}
```

---

## Cloudflare CDN 加速

### DNS 配置

在 Cloudflare 控制台添加 DNS 记录：

| 类型  | 名称 | 值                   | 说明     |
| ----- | ---- | -------------------- | -------- |
| CNAME | blog | cname.vercel-dns.com | 博客域名 |

### 缓存策略

1. **静态资源**（图片/CSS/JS）：长期缓存
2. **HTML 页面**：不缓存或短期缓存
3. **API 请求**：不缓存

### SSL/TLS 配置

1. 在 Cloudflare 中启用 "Full" 或 "Flexible" 模式
2. Vercel 会自动配置 SSL 证书

---

## 环境变量配置

### Vercel 环境变量

| 变量名           | 示例值                | 说明                         |
| ---------------- | --------------------- | ---------------------------- |
| `JWT_SECRET`     | `your-secret-key`     | JWT 认证密钥                 |
| `SESSION_SECRET` | `your-session-secret` | 会话密钥                     |
| `VITE_API_URL`   | (留空)                | 生产环境使用相对路径         |
| `GITHUB_TOKEN`   | `ghp_xxx`             | GitHub Personal Access Token |
| `GITHUB_OWNER`   | `your-username`       | GitHub 用户名                |
| `GITHUB_REPO`    | `novablog`            | 仓库名称                     |
| `GITHUB_BRANCH`  | `main`                | 分支名称                     |

### GitHub Token 创建步骤

1. 打开 GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 点击 "Generate new token (classic)"
3. 配置：
   - Note: `NovaBlog Vercel`
   - Expiration: 建议 90 天
   - Scopes: 勾选 `repo` (完整仓库访问)
4. 生成后复制 Token

---

## 数据流说明

### 工作流程

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户操作                                 │
│  创建/编辑/删除 文档/项目/合集                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      IndexedDB (本地)                           │
│  • 数据保存到浏览器本地存储                                        │
│  • 显示"本地新增"/"本地更新"标签                                  │
│  • 支持离线编辑                                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     点击"同步到GitHub"                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Vercel Serverless                          │
│  • 接收同步请求                                                   │
│  • 调用 GitHub API                                               │
│  • 批量执行创建/更新/删除操作                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub 仓库                              │
│  • data/documents/                                              │
│  • data/projects/                                               │
│  • data/collections/                                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Vercel 自动部署                             │
│  • GitHub push 触发部署                                          │
│  • 更新网站内容                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 发布时特殊处理

```
用户点击"发布"
     │
     ▼
检查本地是否有相同ID的草稿
     │
     ├─ 有 ──→ 阻止发布，提示冲突
     │
     └─ 无 ──→ 提交到 GitHub
                 │
                 ▼
           检查 GitHub 上是否有草稿
                 │
                 ├─ 有 ──→ 先删除草稿文件
                 │
                 └─ 无
                 │
                 ▼
           创建/更新发布版本
```

---

## 常见问题

### Q: 部署后页面空白

A: 检查 `vercel.json` 配置，确保 `base` 路径正确。

### Q: API 请求失败

A: 检查环境变量配置。生产环境下 API 使用相对路径 `/api`。

### Q: GitHub 同步失败

A: 检查环境变量：

- `GITHUB_TOKEN` 是否正确
- `GITHUB_OWNER` 是否是你的 GitHub 用户名
- `GITHUB_REPO` 是否存在且你有权限
- Token 是否有 `repo` 权限

### Q: 上传图片失败

A: Vercel 不支持持久化文件存储。解决方案：

- 将图片放到 `public/images/` 目录，通过 Git 提交
- 使用 Cloudflare R2、AWS S3 等外部存储

### Q: 如何更新内容

A:

- **方法 1**：直接修改 `data/` 目录，提交到 Git
- **方法 2**：使用管理面板编辑，批量同步到 GitHub

---

## 生产环境建议

1. **使用 Vercel Pro** - 获取更多 Serverless 函数调用
2. **配置 Cloudflare** - 获取 CDN 加速和安全防护
3. **定期续期 Token** - GitHub Token 到期前更新
4. **定期备份** - 将 data 目录备份到本地

---

## 相关文件

| 文件                      | 说明                   |
| ------------------------- | ---------------------- |
| `api/routes/sync.ts`      | 批量同步 API           |
| `api/utils/githubSync.ts` | GitHub API 工具        |
| `src/utils/syncDB.ts`     | IndexedDB 工具类       |
| `src/pages/Admin.vue`     | 管理页面（含同步按钮） |
| `src/pages/Editor.vue`    | 编辑器                 |
| `vercel.json`             | Vercel 配置文件        |
