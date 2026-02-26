# NovaBlog

一个基于 Vue 3 + TypeScript + Express 的全栈博客与作品集管理系统，采用 Cyber/Tech 风格设计。

## 特性

- **技术风格 UI** - 赛博朋克主题的现代响应式界面
- **Markdown 文档管理** - 支持 Mermaid 图表、语法高亮的文档系统
- **作品集展示** - 项目展示与管理，支持图片和标签
- **简历编辑器** - 在线编辑和导出 PDF 简历
- **国际化支持** - 中英文双语切换
- **认证系统** - JWT 身份验证，保护管理后台
- **Docker 部署** - 支持容器化部署

## 技术栈

### 前端

- Vue 3 (Composition API)
- TypeScript
- Vite
- Pinia (状态管理)
- Vue Router
- Vue I18n
- Ant Design Vue
- Tailwind CSS
- markdown-it + highlight.js

### 后端

- Express.js
- TypeScript
- JWT 认证
- Multer (文件上传)
- Gray-matter (Markdown 解析)

## 项目结构

```
NovaBlog/
├── api/                    # Express 后端 API
│   ├── routes/            # API 路由
│   │   ├── auth.ts        # 认证相关
│   │   ├── documents.ts   # 文档管理
│   │   ├── projects.ts    # 项目管理
│   │   ├── resume.ts      # 简历
│   │   └── upload.ts      # 文件上传
│   ├── utils/             # 工具函数
│   └── types.ts           # 类型定义
├── src/                   # Vue 前端源码
│   ├── components/        # Vue 组件
│   ├── pages/             # 页面组件
│   ├── stores/            # Pinia 状态管理
│   ├── router/            # 路由配置
│   ├── composables/       # 组合式函数
│   ├── locales/           # 国际化文件
│   └── utils/             # 工具函数
├── data/                  # 数据存储
│   ├── documents/         # Markdown 文档
│   └── projects/          # 项目数据
├── public/                # 静态资源
├── uploads/               # 上传文件
└── deploy/                # 部署配置
```

## 快速开始

### 前置要求

- Node.js 18+
- npm 9+

### 安装

```bash
npm install
```

### 开发模式

同时启动前端和后端：

```bash
npm run dev
```

或者分别启动：

```bash
# 启动前端开发服务器
npm run client:dev

# 启动后端服务器
npm run server:dev
```

### 构建

```bash
npm run build
```

### 代码检查

```bash
npm run lint        # 检查代码
npm run lint:fix    # 自动修复
```

## 环境变量

复制 `.env.example` 为 `.env` 并配置：

```env
# 服务器配置
PORT=3000

# JWT 密钥 (生成随机字符串)
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret

# 前端配置
VITE_API_BASE=/api
VITE_BASE_PATH=/
```

## 功能说明

### 文档管理

- 访问 `/editor` 创建新文档
- 支持 Markdown 语法
- 支持 Mermaid 图表
- 语法高亮
- 发布/下架管理

### 作品集

- 访问 `/editor/project` 创建项目
- 支持封面图片
- 自定义标签
- 项目详情页展示

### 简历

- 访问 `/resume` 编辑简历
- 支持 PDF 导出

### 管理后台

- 访问 `/admin` 查看系统概览
- 管理文档和项目
- 查看统计数据

## Docker 部署

### 开发环境

```bash
docker-compose up
```

### 生产环境

```bash
cd production-deploy
docker-compose -f docker-compose.production.yml up -d
```

## 页面路由

| 路径 | 说明 |
|------|------|
| `/` | 首页 |
| `/doc/:id` | 文档详情 |
| `/project/:id` | 项目详情 |
| `/login` | 登录 |
| `/editor` | 文档编辑器 |
| `/editor/project` | 创建项目 |
| `/admin` | 管理后台 |
| `/resume` | 简历编辑 |

## License

MIT
