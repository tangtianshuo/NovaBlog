# Docker 部署指南

本项目支持通过 Docker 快速部署，使用 Docker Compose 管理前端和后端服务。

## 快速启动

```bash
docker-compose up -d
```

## Nginx 反向代理（/nova 前缀）

将以下配置保存为 `/etc/nginx/conf.d/novablog.conf`：

```
server {
    listen 80;
    server_name _;

    client_max_body_size 20m;

    location /nova/ {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://127.0.0.1:18088/;
    }

    location /nova/api/ {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://127.0.0.1:18087/;
    }
}
```

前端构建时使用的 Base 路径与 API 前缀已在 Docker 构建参数中设置为：

- Base 路径：`/nova`
- API 前缀：`/nova/api`

因此在 Nginx 下可直接通过 `http://<your-host>/nova` 访问应用。

## 服务说明

### 前端服务

- **容器名**: novablog-frontend
- **内部端口**: 8080
- **访问地址**: http://localhost:18088

### 后端服务

- **容器名**: novablog-backend
- **外部端口**: 18087
- **内部端口**: 3001
- **访问地址**: http://localhost:18087/api

## 网络配置

前后端通过 Docker Bridge 网络 `novablog-network` 进行通信：

- 前端通过 `http://backend:3001/api` 访问后端 API
- 后端服务名为 `backend`

## 数据持久化

以下数据卷会持久化存储：

- `data`: 存储文档数据
- `uploads`: 存储上传的文件

## 环境变量

创建 `.env` 文件配置以下变量（参考 `.env.example`）：

```env
# 后端端口
PORT=3001

# 前端端口（Docker）
FRONTEND_PORT=18088

# API URL（生产环境）
VITE_API_URL=http://localhost:18087/api

# JWT 密钥（生产环境必须修改）
JWT_SECRET=your-secret-key-change-this-in-production
```

## 常用命令

### 启动服务

```bash
docker-compose up -d
```

### 重新构建并启动（变更了 Base 路径或 API 前缀时）

```bash
docker-compose up -d --build
```

### 停止服务

```bash
docker-compose down
```

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看前端日志
docker-compose logs -f frontend

# 查看后端日志
docker-compose logs -f backend
```

### 重新构建并启动

```bash
docker-compose up -d --build
```

### 进入容器

```bash
# 进入前端容器
docker-compose exec frontend sh

# 进入后端容器
docker-compose exec backend sh
```

## 初始化数据

首次启动后，需要创建管理员用户：

```bash
# 进入后端容器
docker-compose exec backend sh

# 创建用户（需要实现注册接口或手动添加）
# 目前需要在 data/users.json 中手动创建用户
```

## 注意事项

1. **端口冲突**: 确保 18088 和 18087 端口未被占用
2. **数据备份**: 定期备份 `data` 和 `uploads` 目录
3. **安全配置**: 生产环境务必修改 `JWT_SECRET`
4. **反向代理**: 生产环境建议使用 Nginx/Caddy 作为反向代理

## 故障排查

### 前端无法访问后端

检查网络连接：

```bash
docker network inspect novablog-network
```

### 数据未保存

检查数据卷挂载：

```bash
docker volume ls
```

### 重新构建镜像

```bash
docker-compose build --no-cache
docker-compose up -d
```
