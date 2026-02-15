---
id: 5b9cb665-ed28-4d48-a18a-280c16f09fd0
title: RESTful API 设计规范
status: published
createdAt: '2026-02-15T03:55:24.550Z'
updatedAt: '2026-02-15T03:56:24.498Z'
tags:
  - api
  - 后端
  - 架构
author: admin
publishedAt: '2026-02-15T03:56:24.498Z'
description: 设计高质量 RESTful API 的最佳实践
---

# RESTful API 设计规范

本文档提供了 RESTful API 设计的最佳实践，帮助您构建清晰、一致、易用的 API。

## 基本原则

### REST 架构风格

REST (Representational State Transfer) 是一种架构风格，主要特点：

- **无状态**：每个请求包含所有必要信息
- **统一接口**：使用标准 HTTP 方法
- **可缓存**：响应可被缓存
- **分层系统**：客户端不需要知道是否连接到最终服务器
- **按需代码**：服务器可以扩展客户端功能

### HTTP 方法

| 方法 | 用途 | 幂等性 | 请求体 |
|------|------|---------|--------|
| GET | 获取资源 | 是 | 否 |
| POST | 创建资源 | 否 | 是 |
| PUT | 完整更新资源 | 是 | 是 |
| PATCH | 部分更新资源 | 否 | 是 |
| DELETE | 删除资源 | 是 | 否 |

## URL 设计

### 资源命名

使用名词复数形式：

```http
# ✅ 正确
GET    /api/users
POST   /api/users
GET    /api/users/{id}
PUT    /api/users/{id}
DELETE /api/users/{id}

# ❌ 错误
GET    /api/getUsers
POST   /api/createUser
GET    /api/user/{id}
```

### 层级关系

```http
GET    /api/users/{userId}/posts
POST   /api/users/{userId}/posts
GET    /api/users/{userId}/posts/{postId}
DELETE /api/users/{userId}/posts/{postId}
```

### 查询参数

```http
# 分页
GET /api/users?page=1&limit=20

# 过滤
GET /api/users?status=active&role=admin

# 排序
GET /api/users?sort=name:asc,created_at:desc

# 搜索
GET /api/users?q=zhang&fields=name,email
```

### 版本控制

```http
# URL 版本控制
GET /api/v1/users
GET /api/v2/users

# Header 版本控制
GET /api/users
Headers:
  API-Version: v1
```

## 请求和响应

### 请求格式

```typescript
// GET 请求示例
GET /api/users/123
Headers:
  Authorization: Bearer <token>
  Accept: application/json

// POST 请求示例
POST /api/users
Headers:
  Content-Type: application/json
  Authorization: Bearer <token>

Body:
{
  "name": "张三",
  "email": "zhang@example.com",
  "age": 25
}
```

### 响应格式

**成功响应**：

```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "张三",
    "email": "zhang@example.com",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

**列表响应**：

```json
{
  "success": true,
  "data": [
    { "id": "1", "name": "张三" },
    { "id": "2", "name": "李四" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**错误响应**：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "邮箱格式不正确",
    "details": [
      {
        "field": "email",
        "message": "必须是有效的邮箱地址"
      }
    ]
  }
}
```

## 状态码

### 成功状态码

| 状态码 | 含义 | 使用场景 |
|--------|------|---------|
| 200 OK | 请求成功 | GET、PUT、PATCH |
| 201 Created | 资源创建成功 | POST |
| 204 No Content | 成功但无返回内容 | DELETE |

### 客户端错误

| 状态码 | 含义 | 使用场景 |
|--------|------|---------|
| 400 Bad Request | 请求参数错误 | 参数验证失败 |
| 401 Unauthorized | 未认证 | 缺少或无效的 token |
| 403 Forbidden | 无权限 | 已认证但权限不足 |
| 404 Not Found | 资源不存在 | 请求的资源不存在 |
| 409 Conflict | 资源冲突 | 重复创建、状态冲突 |
| 422 Unprocessable Entity | 语义错误 | 业务逻辑错误 |
| 429 Too Many Requests | 请求过多 | 触发限流 |

### 服务器错误

| 状态码 | 含义 | 使用场景 |
|--------|------|---------|
| 500 Internal Server Error | 服务器内部错误 | 未预期的错误 |
| 502 Bad Gateway | 网关错误 | 上游服务不可用 |
| 503 Service Unavailable | 服务不可用 | 维护中、过载 |

## 认证和授权

### JWT 认证

```typescript
// 登录获取 Token
POST /api/auth/login
Body: { "username": "admin", "password": "password" }
Response: {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}

// 使用 Token 访问受保护资源
GET /api/users
Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 刷新 Token

```http
POST /api/auth/refresh
Headers: Authorization: Bearer <expired-token>

Response: {
  "token": "<new-token>",
  "expiresIn": 86400
}
```

## 数据验证

### 请求验证

```typescript
// 使用验证库（如 Joi、Zod）
const schema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().min(0).max(120)
})

const result = schema.safeParse(request.body)
if (!result.success) {
  return response.status(400).json({
    error: result.error.flatten()
  })
}
```

### 响应验证

```typescript
// 使用 DTO 确保响应格式一致
class UserDTO {
  id: string
  name: string
  email: string
  
  excludeSensitive() {
    return { id: this.id, name: this.name }
  }
}

const user = await User.findById(id)
return response.json(new UserDTO(user).excludeSensitive())
```

## 分页和过滤

### 分页参数

```http
GET /api/users?page=1&limit=20&sort=name:asc
```

```typescript
interface PaginationParams {
  page: number      // 当前页，从 1 开始
  limit: number     // 每页数量，默认 20
  sort?: string     // 排序字段:方向
  fields?: string   // 返回字段，逗号分隔
}
```

### 响应格式

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 过滤和搜索

```http
# 多条件过滤
GET /api/users?status=active&role=admin&created_after=2024-01-01

# 全文搜索
GET /api/users?q=zhang&search_fields=name,email,phone

# 范围查询
GET /api/products?price_min=100&price_max=1000
```

## 缓存策略

### ETag

```typescript
// 生成 ETag
const etag = crypto
  .createHash('md5')
  .update(JSON.stringify(data))
  .digest('hex')

response.setHeader('ETag', etag)

// 条件请求
if (request.headers['if-none-match'] === etag) {
  return response.status(304).end()
}
```

### Cache-Control

```typescript
// 公共资源，缓存 1 小时
response.setHeader('Cache-Control', 'public, max-age=3600')

// 私有资源，不缓存
response.setHeader('Cache-Control', 'private, no-cache')

// 永不缓存
response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
```

## API 文档

### OpenAPI 规范

```yaml
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0
paths:
  /api/users:
    get:
      summary: 获取用户列表
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
    post:
      summary: 创建用户
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserInput'
      responses:
        '201':
          description: 创建成功
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
```

### 文档工具

- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Redoc](https://github.com/Redocly/redoc)
- [Postman](https://www.postman.com/)

## 安全最佳实践

### HTTPS

```typescript
// 强制 HTTPS
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`)
    }
    next()
  })
}
```

### CORS

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

### 限流

```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 最多 100 次请求
  message: '请求过多，请稍后再试'
})

app.use('/api/', limiter)
```

## 测试

### 集成测试

```typescript
describe('User API', () => {
  it('should create user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: '张三', email: 'zhang@example.com' })
      .expect(201)
    
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveProperty('id')
  })
  
  it('should return 400 for invalid email', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: '张三', email: 'invalid-email' })
      .expect(400)
    
    expect(response.body.success).toBe(false)
  })
})
```

## 监控和日志

### 请求日志

```typescript
app.use((req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    })
  })
  
  next()
})
```

### 错误追踪

```typescript
app.use((error, req, res, next) => {
  console.error('Error:', error)
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON'
    })
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal Server Error'
  })
})
```

## API 版本演进

### 向后兼容

```typescript
// v1 API
app.get('/api/v1/users', (req, res) => {
  res.json({ users: [...] })
})

// v2 API（新功能）
app.get('/api/v2/users', (req, res) => {
  res.json({ 
    data: [...],
    metadata: { version: '2.0' }
  })
})
```

### 废弃策略

```http
GET /api/v1/users
Headers:
  X-API-Deprecation: true
  X-API-Sunset: 2024-12-31
  Link: <https://api.example.com/v2/users>; rel="successor-version"

Response:
  Warning: 299 - "Deprecated API, please migrate to v2"
```

## 参考资源

- [REST API 设计指南](https://restfulapi.net/)
- [OpenAPI 规范](https://swagger.io/specification/)
- [HTTP 状态码](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status)

---

**提示**：好的 API 设计应该让开发者能够直观地理解和使用！
