---
title: Docker 部署实战指南
description: 使用 Docker 快速部署应用到生产环境
tags: docker, 部署, devops
category: 技术
status: published
created_at: 2024-01-20T14:30:00Z
updated_at: 2024-01-20T14:30:00Z
readingTime: 15
---

# Docker 部署实战指南

本指南将帮助您使用 Docker 容器化部署应用，实现快速、一致的环境配置。

## 为什么使用 Docker？

Docker 提供了以下优势：

- **环境一致性**：开发、测试、生产环境完全一致
- **快速部署**：一键启动完整应用栈
- **资源隔离**：每个服务独立运行，互不干扰
- **易于扩展**：通过配置轻松扩展服务
- **版本管理**：镜像版本化，便于回滚

## 基础概念

### 镜像（Image）

镜像是只读的模板，包含运行应用所需的所有内容：

```bash
# 拉取镜像
docker pull nginx:latest

# 查看本地镜像
docker images
```

### 容器（Container）

容器是镜像的运行实例：

```bash
# 运行容器
docker run -d -p 80:80 nginx

# 查看运行中的容器
docker ps

# 停止容器
docker stop <container-id>
```

### 卷（Volume）

卷用于数据持久化：

```bash
# 创建卷
docker volume create mydata

# 挂载卷
docker run -v mydata:/data nginx
```

## Docker Compose

使用 Docker Compose 管理多容器应用：

### 配置示例

```yaml
version: "3.8"

services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./html:/usr/share/nginx/html
    networks:
      - app-network

  api:
    build: ./api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    networks:
      - app-network
    depends_on:
      - db

  db:
    image: postgres:14
    volumes:
      - dbdata:/var/lib/postgresql/data
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  dbdata:
```

### 常用命令

```bash
# 启动所有服务
docker-compose up -d

# 查看服务日志
docker-compose logs -f

# 停止所有服务
docker-compose down

# 重新构建并启动
docker-compose up -d --build
```

## 本项目部署

本项目已配置完整的 Docker 支持：

### 快速启动

```bash
# 克隆项目
git clone <repository-url>
cd NovaBlog

# 启动服务
docker-compose up -d
```

### 服务说明

| 服务 | 容器名            | 外部端口 | 内部端口 |
| ---- | ----------------- | -------- | -------- |
| 前端 | novablog-frontend | 18088    | 8080     |
| 后端 | novablog-backend  | 18087    | 3001     |

### 网络配置

前后端通过 Bridge 网络通信：

```mermaid
graph LR
    A[浏览器 18088] --> B[前端容器 8080]
    B --> C{API 请求}
    C --> D[后端容器 3001]
    D --> E[数据卷]
```

## 生产环境优化

### 镜像优化

```dockerfile
# 使用多阶段构建减小镜像体积
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --only=production
EXPOSE 8080
CMD ["node", "server.js"]
```

### 安全配置

```yaml
# docker-compose.yml
services:
  app:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

### 资源限制

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 512M
        reservations:
          cpus: "0.25"
          memory: 256M
```

## 监控和日志

### 查看资源使用

```bash
# 查看容器资源统计
docker stats

# 查看容器详细信息
docker inspect <container-id>
```

### 日志管理

```bash
# 查看实时日志
docker logs -f <container-id>

# 查看最近 100 行日志
docker logs --tail 100 <container-id>

# 查看特定时间范围的日志
docker logs --since 2024-01-01T00:00:00 <container-id>
```

## 故障排查

### 常见问题

**问题 1：容器无法启动**

```bash
# 查看容器日志
docker logs <container-id>

# 检查端口占用
netstat -tunlp | grep <port>
```

**问题 2：网络连接失败**

```bash
# 检查网络
docker network ls
docker network inspect <network-name>

# 测试容器间连接
docker exec <container> ping <other-container>
```

**问题 3：数据卷权限问题**

```bash
# 修复权限
sudo chown -R $(id -u):$(id -g) ./data
```

## 最佳实践

1. **使用 .dockerignore**：排除不需要的文件
2. **分层构建**：优化 Dockerfile 构建层
3. **健康检查**：配置容器健康检查
4. **日志轮转**：配置日志大小和数量限制
5. **定期更新**：及时更新基础镜像和依赖

## 参考资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 参考](https://docs.docker.com/compose/)
- [Docker 最佳实践](https://docs.docker.com/develop/dev-best-practices/)

---

**提示**：生产环境部署前，请务必进行充分的测试和备份！
