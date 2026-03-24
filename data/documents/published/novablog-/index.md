---
title: NovaBlog 云端部署技术方案
content: "\n# NovaBlog 云端部署技术方案\n\n本文档详细介绍 NovaBlog 的云端部署方案，涵盖 Vercel + GitHub 存储 + Cloudflare 的完整技术架构。\n\n---\n\n## 目录\n\n1. [架构概述](#架构概述)\n2. [Vercel 部署](#vercel-部署)\n3. [GitHub 数据存储](#github-数据存储)\n4. [本地 IndexedDB + 批量同步](#本地-indexeddb--批量同步)\n5. [Cloudflare CDN 加速](#cloudflare-cdn-加速)\n6. [环境变量配置](#环境变量配置)\n7. [数据流说明](#数据流说明)\n8. [常见问题](#常见问题)\n\n---\n\n## 架构概述\n\n```\n┌─────────────────────────────────────────────────────────────────┐\n│                           用户                                    │\n└──────────────────────────┬──────────────────────────────────────┘\n                           │\n                           ▼\n┌──────────────────────────────────────────────────────────────────┐\n│                    Cloudflare (CDN + DNS)                        │\n│                   blog.example.com                               │\n└──────────────────────────┬──────────────────────────────────────┘\n                           │\n                           ▼\n┌──────────────────────────────────────────────────────────────────┐\n│                         Vercel                                   │\n│  ┌─────────────────────┐    ┌────────────────────────────────┐  │\n│  │   Vue 3 前端        │    │   Express API (Serverless)    │  │\n│  │   (静态资源)        │◄──►│   • 认证                      │  │\n│  │                     │    │   • GitHub API 同步            │  │\n│  └─────────────────────┘    │   • 数据读写                   │  │\n│                              └────────────────┬────────────────┘  │\n└──────────────────────────────┬─────────────────┴─────────────────┘\n                               │\n                               ▼\n┌──────────────────────────────────────────────────────────────────┐\n│                        GitHub 仓库                               │\n│  • data/documents/    (文章)                                   │\n│  • data/projects/     (项目)                                   │\n│  • data/collections/  (合集)                                   │\n└──────────────────────────────────────────────────────────────────┘\n```\n\n---\n\n## Vercel 部署\n\n### 部署步骤\n\n1. **推送代码到 GitHub**\n\n```bash\ngit add .\ngit commit -m \"Configure for Vercel deployment\"\ngit push origin main\n```\n\n2. **在 Vercel 导入项目**\n   - 访问 [Vercel](https://vercel.com/new)\n   - 使用 GitHub 登录\n   - 导入 NovaBlog 仓库\n   - 配置：\n     - Framework Preset: `Other`\n     - Build Command: `npm run vercel-build`\n     - Output Directory: `dist`\n     - Install Command: `npm install`\n\n3. **配置环境变量**（详见下文）\n\n4. **部署完成**\n\n### vercel.json 配置\n\n```json\n{\n\t\"version\": 2,\n\t\"builds\": [\n\t\t{\n\t\t\t\"src\": \"package.json\",\n\t\t\t\"use\": \"@vercel/static-build\",\n\t\t\t\"config\": {\n\t\t\t\t\"distDir\": \"dist\"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t\"src\": \"api/index.ts\",\n\t\t\t\"use\": \"@vercel/node\",\n\t\t\t\"config\": {\n\t\t\t\t\"maxDuration\": 30\n\t\t\t}\n\t\t}\n\t],\n\t\"rewrites\": [\n\t\t{ \"source\": \"/api/(.*)\", \"destination\": \"/api/index.ts\" },\n\t\t{ \"source\": \"/uploads/(.*)\", \"destination\": \"/uploads/$1\" },\n\t\t{\n\t\t\t\"source\": \"/((?!api/|uploads/|assets/|.*\\\\..*).*)\",\n\t\t\t\"destination\": \"/index.html\"\n\t\t}\n\t]\n}\n```\n\n---\n\n## GitHub 数据存储\n\n### 存储结构\n\n```\ndata/\n├── documents/\n│   ├── draft/\n│   │   └── article-title/\n│   │       └── index.md\n│   └── published/\n│       └── article-title/\n│           └── index.md\n├── projects/\n│   └── project-name/\n│       └── index.md\n└── collections/\n    └── collection-name/\n        └── index.md\n```\n\n### 文件格式\n\n使用 Frontmatter 格式存储：\n\n```markdown\n---\nid: 550e8400-e29b-41d4-a716-446655440000\ntitle: 文章标题\nslug: article-slug\ndescription: 文章描述\nstatus: published\ncreatedAt: 2024-01-01T00:00:00.000Z\nupdatedAt: 2024-01-02T00:00:00.000Z\npublishedAt: 2024-01-02T00:00:00.000Z\ntags:\n  - 技术\n  - Vue\ncategory: tech\nauthor: admin\n---\n\n文章内容...\n```\n\n### GitHub API 同步\n\n后端通过 GitHub API 进行文件操作：\n\n```typescript\n// api/utils/githubSync.ts\nconst GITHUB_API_BASE = \"https://api.github.com\"\n\nasync function createOrUpdateFile(file: {\n\tpath: string\n\tcontent: string\n\tmessage: string\n\tsha?: string\n}): Promise<boolean> {\n\tconst sha = await getFileSha(file.path)\n\n\tconst body = {\n\t\tmessage: file.message,\n\t\tcontent: Buffer.from(file.content).toString(\"base64\"),\n\t\tbranch: BRANCH,\n\t\t...(sha && { sha }),\n\t}\n\n\tconst response = await fetch(\n\t\t`${GITHUB_API_BASE}/repos/${OWNER}/${REPO}/contents/${file.path}`,\n\t\t{\n\t\t\tmethod: \"PUT\",\n\t\t\theaders: await getHeaders(),\n\t\t\tbody: JSON.stringify(body),\n\t\t},\n\t)\n\n\treturn response.ok\n}\n```\n\n---\n\n## 本地 IndexedDB + 批量同步\n\n### 解决的问题\n\nVercel 是无服务器平台，**不允许在运行时写入文件系统**。直接保存文档会失败。\n\n### 解决方案\n\n采用本地存储 + 批量同步的架构：\n\n1. **保存时**：数据存储到浏览器 IndexedDB\n2. **同步时**：批量提交到 GitHub\n\n### 核心代码\n\n#### IndexedDB 工具类\n\n```typescript\n// src/utils/syncDB.ts\nclass IndexedDBManager {\n\tprivate db: IDBDatabase | null = null\n\n\tasync init(): Promise<void> {\n\t\treturn new Promise((resolve, reject) => {\n\t\t\tconst request = indexedDB.open(\"novablog-sync\", 1)\n\n\t\t\trequest.onupgradeneeded = (event) => {\n\t\t\t\tconst db = (event.target as IDBOpenDBRequest).result\n\t\t\t\tdb.createObjectStore(\"syncQueue\", { keyPath: \"id\" })\n\t\t\t}\n\n\t\t\trequest.onsuccess = () => {\n\t\t\t\tthis.db = request.result\n\t\t\t\tresolve()\n\t\t\t}\n\t\t})\n\t}\n\n\tasync saveDocument(\n\t\tdoc: { metadata: Record<string, unknown>; content: string },\n\t\tid?: string,\n\t): Promise<string> {\n\t\tconst docId = id || crypto.randomUUID()\n\t\tawait this.addToQueue({\n\t\t\tid: docId,\n\t\t\ttype: \"document\",\n\t\t\taction: id ? \"update\" : \"create\",\n\t\t\tdata: doc,\n\t\t\ttimestamp: Date.now(),\n\t\t})\n\t\treturn docId\n\t}\n\n\tasync getQueue(): Promise<SyncItem[]> {\n\t\t// 获取所有待同步项\n\t}\n\n\tasync clearQueue(): Promise<void> {\n\t\t// 同步成功后清空队列\n\t}\n}\n\nexport const syncDB = new IndexedDBManager()\n```\n\n#### 同步 API\n\n```typescript\n// api/routes/sync.ts\nrouter.post(\"/\", authenticateToken, async (req, res) => {\n\tconst { items } = req.body\n\n\tfor (const item of items) {\n\t\tif (item.type === \"document\") {\n\t\t\tconst metadata = item.data.metadata\n\t\t\tconst filePath = getDocumentPath(metadata)\n\t\t\tconst fileContent = matter.stringify(content, metadata)\n\n\t\t\tawait createOrUpdateFile({\n\t\t\t\tpath: filePath,\n\t\t\t\tcontent: fileContent,\n\t\t\t\tmessage: generateCommitMessage(item.action, \"document\", title),\n\t\t\t})\n\t\t}\n\t}\n\n\tres.json({ success: true, message: \"同步完成\" })\n})\n```\n\n### 前端界面\n\n在管理页面添加\"同步到 GitHub\"按钮：\n\n```vue\n<template>\n\t<button\n\t\t@click=\"syncToGitHub\"\n\t\t:disabled=\"syncing\"\n\t>\n\t\t<Loader2\n\t\t\tv-if=\"syncing\"\n\t\t\tclass=\"animate-spin\"\n\t\t/>\n\t\t<GitBranch v-else />\n\t\t{{ syncing ? \"同步中...\" : \"同步到GitHub\" }}\n\t\t<span\n\t\t\tv-if=\"pendingCount > 0\"\n\t\t\tclass=\"badge\"\n\t\t\t>{{ pendingCount }}</span\n\t\t>\n\t</button>\n</template>\n```\n\n### 数据来源标签\n\n表格中显示数据来源状态：\n\n| 状态     | 标签    | 说明              |\n| -------- | ------- | ----------------- |\n| 本地新增 | \U0001F7E1 黄色 | 新创建还未同步    |\n| 本地更新 | \U0001F7E0 橙色 | 已修改还未同步    |\n| 已同步   | ⬜ 灰色 | 已经同步到 GitHub |\n\n### 发布时自动清理草稿\n\n```typescript\n// 发布文档时\nif (status === \"published\") {\n  // 1. 检查 GitHub 上是否存在草稿\n  const draftPath = `data/documents/draft/${docId}/index.md`\n  const draftContent = await getFile(draftPath)\n\n  // 2. 如果存在，先删除草稿\n  if (draftContent) {\n    await deleteFile({\n      path: draftPath,\n      message: `删除草稿: ${title} (已发布)`,\n    })\n  }\n\n  // 3. 创建发布版本\n  await createOrUpdateFile({ ... })\n}\n```\n\n### ID 冲突检测\n\n```typescript\n// 前端发布时检测\nif (status === \"published\") {\n\tconst localDocs = await syncDB.getLocalDocuments()\n\tconst existingDraft = localDocs.find(\n\t\t(d) => d.id === docId && d.metadata.status === \"draft\",\n\t)\n\tif (existingDraft) {\n\t\terror(\"无法发布：本地存在相同ID的草稿\")\n\t\treturn\n\t}\n}\n```\n\n---\n\n## Cloudflare CDN 加速\n\n### DNS 配置\n\n在 Cloudflare 控制台添加 DNS 记录：\n\n| 类型  | 名称 | 值                   | 说明     |\n| ----- | ---- | -------------------- | -------- |\n| CNAME | blog | cname.vercel-dns.com | 博客域名 |\n\n### 缓存策略\n\n1. **静态资源**（图片/CSS/JS）：长期缓存\n2. **HTML 页面**：不缓存或短期缓存\n3. **API 请求**：不缓存\n\n### SSL/TLS 配置\n\n1. 在 Cloudflare 中启用 \"Full\" 或 \"Flexible\" 模式\n2. Vercel 会自动配置 SSL 证书\n\n---\n\n## 环境变量配置\n\n### Vercel 环境变量\n\n| 变量名           | 示例值                | 说明                         |\n| ---------------- | --------------------- | ---------------------------- |\n| `JWT_SECRET`     | `your-secret-key`     | JWT 认证密钥                 |\n| `SESSION_SECRET` | `your-session-secret` | 会话密钥                     |\n| `VITE_API_URL`   | (留空)                | 生产环境使用相对路径         |\n| `GITHUB_TOKEN`   | `ghp_xxx`             | GitHub Personal Access Token |\n| `GITHUB_OWNER`   | `your-username`       | GitHub 用户名                |\n| `GITHUB_REPO`    | `novablog`            | 仓库名称                     |\n| `GITHUB_BRANCH`  | `main`                | 分支名称                     |\n\n### GitHub Token 创建步骤\n\n1. 打开 GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)\n2. 点击 \"Generate new token (classic)\"\n3. 配置：\n   - Note: `NovaBlog Vercel`\n   - Expiration: 建议 90 天\n   - Scopes: 勾选 `repo` (完整仓库访问)\n4. 生成后复制 Token\n\n---\n\n## 数据流说明\n\n### 工作流程\n\n```\n┌─────────────────────────────────────────────────────────────────┐\n│                         用户操作                                 │\n│  创建/编辑/删除 文档/项目/合集                                   │\n└────────────────────────────┬────────────────────────────────────┘\n                             │\n                             ▼\n┌─────────────────────────────────────────────────────────────────┐\n│                      IndexedDB (本地)                           │\n│  • 数据保存到浏览器本地存储                                        │\n│  • 显示\"本地新增\"/\"本地更新\"标签                                  │\n│  • 支持离线编辑                                                   │\n└────────────────────────────┬────────────────────────────────────┘\n                             │\n                             ▼\n┌─────────────────────────────────────────────────────────────────┐\n│                     点击\"同步到GitHub\"                           │\n└────────────────────────────┬────────────────────────────────────┘\n                             │\n                             ▼\n┌─────────────────────────────────────────────────────────────────┐\n│                      Vercel Serverless                          │\n│  • 接收同步请求                                                   │\n│  • 调用 GitHub API                                               │\n│  • 批量执行创建/更新/删除操作                                      │\n└────────────────────────────┬────────────────────────────────────┘\n                             │\n                             ▼\n┌─────────────────────────────────────────────────────────────────┐\n│                        GitHub 仓库                              │\n│  • data/documents/                                              │\n│  • data/projects/                                               │\n│  • data/collections/                                            │\n└────────────────────────────┬────────────────────────────────────┘\n                             │\n                             ▼\n┌─────────────────────────────────────────────────────────────────┐\n│                      Vercel 自动部署                             │\n│  • GitHub push 触发部署                                          │\n│  • 更新网站内容                                                   │\n└─────────────────────────────────────────────────────────────────┘\n```\n\n### 发布时特殊处理\n\n```\n用户点击\"发布\"\n     │\n     ▼\n检查本地是否有相同ID的草稿\n     │\n     ├─ 有 ──→ 阻止发布，提示冲突\n     │\n     └─ 无 ──→ 提交到 GitHub\n                 │\n                 ▼\n           检查 GitHub 上是否有草稿\n                 │\n                 ├─ 有 ──→ 先删除草稿文件\n                 │\n                 └─ 无\n                 │\n                 ▼\n           创建/更新发布版本\n```\n\n---\n\n## 常见问题\n\n### Q: 部署后页面空白\n\nA: 检查 `vercel.json` 配置，确保 `base` 路径正确。\n\n### Q: API 请求失败\n\nA: 检查环境变量配置。生产环境下 API 使用相对路径 `/api`。\n\n### Q: GitHub 同步失败\n\nA: 检查环境变量：\n\n- `GITHUB_TOKEN` 是否正确\n- `GITHUB_OWNER` 是否是你的 GitHub 用户名\n- `GITHUB_REPO` 是否存在且你有权限\n- Token 是否有 `repo` 权限\n\n### Q: 上传图片失败\n\nA: Vercel 不支持持久化文件存储。解决方案：\n\n- 将图片放到 `public/images/` 目录，通过 Git 提交\n- 使用 Cloudflare R2、AWS S3 等外部存储\n\n### Q: 如何更新内容\n\nA:\n\n- **方法 1**：直接修改 `data/` 目录，提交到 Git\n- **方法 2**：使用管理面板编辑，批量同步到 GitHub\n\n---\n\n## 生产环境建议\n\n1. **使用 Vercel Pro** - 获取更多 Serverless 函数调用\n2. **配置 Cloudflare** - 获取 CDN 加速和安全防护\n3. **定期续期 Token** - GitHub Token 到期前更新\n4. **定期备份** - 将 data 目录备份到本地\n\n---\n\n## 相关文件\n\n| 文件                      | 说明                   |\n| ------------------------- | ---------------------- |\n| `api/routes/sync.ts`      | 批量同步 API           |\n| `api/utils/githubSync.ts` | GitHub API 工具        |\n| `src/utils/syncDB.ts`     | IndexedDB 工具类       |\n| `src/pages/Admin.vue`     | 管理页面（含同步按钮） |\n| `src/pages/Editor.vue`    | 编辑器                 |\n| `vercel.json`             | Vercel 配置文件        |\n"
description: 使用Vercel做内容托管，Cloudflare做DNS解析，githubRepo做文档存储。
tags:
  - Vercel
  - Cloudflare
  - GithubRepo
status: published
id: 1458b566-574d-40ce-8906-601c8342c6d3
slug: novablog-云端部署技术方案
createdAt: '2026-03-01T03:22:19.582Z'
author: admin
publishedAt: '2026-03-01T03:22:19.582Z'
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
