# Vercel 部署指南

## 快速部署

### 1. 推送代码到 GitHub

```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

### 2. 在 Vercel 导入项目

1. 访问 [Vercel](https://vercel.com/new)
2. 使用 GitHub 登录
3. 导入你的 NovaBlog 仓库
4. 配置设置：
   - Framework Preset: `Other`
   - Build Command: `npm run vercel-build` (或留空使用 package.json)
   - Output Directory: `dist`
   - Install Command: `npm install`

### 3. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `JWT_SECRET` | 随机字符串 | 用于 JWT 认证 |
| `SESSION_SECRET` | 随机字符串 | 用于会话 |
| `VITE_API_URL` | (留空) | 生产环境使用相对路径 |

### 4. 部署

点击 Deploy 按钮等待部署完成。

---

## 🔄 网页编辑后自动同步到 GitHub

### 配置步骤

#### 1. 创建 GitHub Personal Access Token

1. 打开 GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 点击 "Generate new token (classic)"
3. 设置：
   - Note: `NovaBlog Vercel`
   - Expiration: 建议 90 天
   - Scopes: 勾选 `repo` (完整仓库访问)
4. 点击 "Generate token"
5. **复制生成的 token**（只显示一次！）

#### 2. 在 Vercel 添加环境变量

在 Vercel 项目 Settings → Environment Variables 中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `GITHUB_TOKEN` | 你的 Personal Access Token | GitHub API 认证 |
| `GITHUB_OWNER` | 你的 GitHub 用户名 | 仓库所有者 |
| `GITHUB_REPO` | `novablog` | 仓库名称 |
| `GITHUB_BRANCH` | `main` | 分支名称（默认 main）|

#### 3. 测试同步功能

1. 部署完成后，访问网站管理员界面
2. 创建或编辑一篇文章
3. 保存后，检查 GitHub 仓库
4. 应该能看到自动提交的更改

### 同步原理

```
用户保存文章
    ↓
后端 API 处理保存请求
    ↓
同时调用 GitHub API 提交到仓库
    ↓
GitHub 触发 Vercel 自动部署
    ↓
网站更新（可选：可以关闭自动部署）
```

### 自动部署设置（可选）

如果希望 GitHub 提交后自动重新部署：

1. 在 GitHub 仓库设置 → Webhooks
2. 添加 webhook：
   - Payload URL: `https://api.vercel.com/v1/integrations/deploy/prj_xxx`
   - Events: 选择 "Just the push event"

---

## 自定义域名配置

### 通过 Cloudflare 添加域名

1. **在 Cloudflare 中添加 DNS 记录**：

   | 类型 | 名称 | 值 |
   |------|------|-----|
   | CNAME | blog | cname.vercel-dns.com |

2. **在 Vercel 中添加域名**：
   - 进入项目 → Settings → Domains
   - 添加你的域名

3. **Vercel 会自动配置 SSL 证书**

---

## 数据存储说明

### ⚠️ 重要：Vercel 临时文件系统

Vercel 使用无状态服务器，**重启后文件系统会重置**。这意味着：

| 数据类型 | 存储方式 | 持久化 |
|----------|----------|--------|
| 文章/项目/集合 | `data/` 文件夹 | ✅ Git 仓库 |
| 上传的图片 | `uploads/` 文件夹 | ❌ 不会持久化 |

### 推荐工作流

#### 方案 A：网页编辑自动同步（推荐）

1. 配置 GitHub 环境变量（如上所述）
2. 在网页上编辑文章
3. 自动同步到 GitHub 仓库

#### 方案 B：仅使用 Git 管理内容

1. 通过 Git 管理所有内容
2. 在本地编辑 Markdown 文件
3. 推送到 GitHub 自动部署

```bash
# 本地编辑后
git add data/
git commit -m "Add new article"
git push
```

#### 方案 C：使用外部存储上传图片

如果需要支持图片上传，可以：

1. **使用 Cloudflare R2**（推荐，免费 10GB）
2. **使用 AWS S3**
3. **使用第三方图床**

---

## 上传功能说明

由于 Vercel 不支持持久化文件存储，**上传的图片在部署后会丢失**。

### 解决方案

1. **使用外部存储**（推荐）
   - Cloudflare R2
   - AWS S3
   - 阿里云 OSS

2. **手动上传图片**
   - 将图片放到 `public/images/` 目录
   - 通过 Git 提交

---

## 常见问题

### Q: 部署后页面空白

A: 检查 `vercel.json` 配置，确保 `base` 路径正确。如果使用子路径，设置为 `/your-repo-name/`

### Q: API 请求失败

A: 检查环境变量配置。生产环境下 API 使用相对路径 `/api`

### Q: 上传图片失败

A: 这是已知限制。请使用外部存储或手动上传到 `public/images/`

### Q: GitHub 同步失败

A: 检查环境变量：
- `GITHUB_TOKEN` 是否正确
- `GITHUB_OWNER` 是否是你的 GitHub 用户名
- `GITHUB_REPO` 是否存在且你有权限
- Token 是否有 `repo` 权限

### Q: 如何更新内容

A:
- **方法 1**：直接修改 `data/` 目录下的 Markdown 文件，提交到 Git
- **方法 2**：使用管理面板编辑，会自动同步到 GitHub

---

## 生产环境建议

1. **使用 Vercel Pro** 获取更多 Serverless 函数调用
2. **配置 Cloudflare** 获取额外安全防护
3. **定期续期 Token** GitHub Token 到期前更新
4. **定期备份** data 目录到本地

---

## 环境变量参考

```
# 必需
JWT_SECRET=your-secure-random-string

# 会话（可选）
SESSION_SECRET=your-secure-random-string

# 前端配置（生产环境留空）
VITE_API_URL=

# GitHub 同步（可选）
GITHUB_TOKEN=your-github-personal-access-token
GITHUB_OWNER=your-github-username
GITHUB_REPO=novablog
GITHUB_BRANCH=main

# Node 环境
NODE_ENV=production
```
