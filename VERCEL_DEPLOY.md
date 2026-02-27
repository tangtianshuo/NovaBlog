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

#### 方案 A：仅使用 Git 管理内容（推荐）

1. 通过 Git 管理所有内容
2. 在本地编辑 Markdown 文件
3. 推送到 GitHub 自动部署

```bash
# 本地编辑后
git add data/
git commit -m "Add new article"
git push
```

#### 方案 B：使用外部存储上传图片

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

### Q: 如何更新内容

A:
- **方法 1**：直接修改 `data/` 目录下的 Markdown 文件，提交到 Git
- **方法 2**：使用管理面板，但注意图片上传不会持久化

---

## 生产环境建议

1. **使用 Vercel Pro** 获取更多 Serverless 函数调用
2. **配置 Cloudflare** 获取额外安全防护
3. **使用外部数据库**（如需要用户认证持久化）
4. **定期备份** data 目录到本地

---

## 环境变量参考

```
# 必需
JWT_SECRET=your-secure-random-string

# 可选
SESSION_SECRET=your-secure-random-string
VITE_API_URL= (生产环境留空)
NODE_ENV=production
```
