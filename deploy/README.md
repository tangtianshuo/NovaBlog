# NovaBlog 生产环境部署指南

## 目录结构

```
deploy/
├── deploy.sh                      # 自动化部署脚本
├── docker-compose.production.yml  # 生产环境 Docker Compose 配置
└── nginx.novablog.conf           # Nginx 配置文件
```

## 快速开始

### 方式一：使用默认配置

```bash
# 设置环境变量并运行部署脚本
export REPO_URL="https://github.com/your-username/novablog.git"
export BRANCH="release"

# 运行部署脚本
sudo ./deploy.sh
```

### 方式二：自定义配置

```bash
# 自定义所有参数
REPO_URL="https://github.com/your-username/novablog.git" \
BRANCH="release" \
APP_DIR="/var/www/novablog" \
BACKUP_DIR="/var/backups/novablog" \
COMPOSE_FILE="docker-compose.production.yml" \
sudo ./deploy.sh
```

## 环境变量说明

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `REPO_URL` | (必填) | Git 仓库地址 |
| `BRANCH` | `release` | 要部署的分支 |
| `APP_DIR` | `/opt/novablog` | 应用部署目录 |
| `BACKUP_DIR` | `/opt/novablog_backups` | 备份目录 |
| `COMPOSE_FILE` | `docker-compose.production.yml` | Docker Compose 配置文件 |

## 部署流程

1. **检查环境** - 验证 git、docker、docker-compose 已安装
2. **数据备份** - 自动备份 data 和 uploads 目录（保留7天）
3. **代码拉取** - 从 Git 拉取最新的 release 分支
4. **停止容器** - 停止旧的服务容器
5. **构建启动** - 重新构建镜像并启动容器
6. **健康检查** - 验证服务是否正常运行
7. **状态展示** - 显示容器运行状态

## 端口配置

| 服务 | 端口 | 说明 |
|------|------|------|
| Frontend | 18088 | 前端 Web 服务 |
| Backend | 18087 | 后端 API 服务 |

## Nginx 配置（可选）

如果需要通过域名访问，可以使用 Nginx 反向代理：

```bash
# 复制 Nginx 配置
sudo cp deploy/nginx.novablog.conf /etc/nginx/sites-available/novablog

# 启用配置
sudo ln -s /etc/nginx/sites-available/novablog /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

## Docker 环境要求

- Docker >= 20.10
- Docker Compose >= 2.0 (或 docker-compose)
- 至少 2GB 可用内存
- 至少 10GB 可用磁盘空间

## 故障排查

### 查看日志

```bash
# 查看所有容器日志
docker compose -f /opt/novablog/docker-compose.production.yml logs -f

# 查看特定服务日志
docker compose -f /opt/novablog/docker-compose.production.yml logs -f backend
docker compose -f /opt/novablog/docker-compose.production.yml logs -f frontend
```

### 手动重启服务

```bash
cd /opt/novablog
docker compose -f docker-compose.production.yml restart
```

### 回滚到之前的版本

```bash
# 查看备份
ls -la /opt/novablog_backups/

# 停止服务
docker compose -f /opt/novablog/docker-compose.production.yml down

# 恢复数据
cp -r /opt/novablog_backups/backup_XXX/data /opt/novablog/
cp -r /opt/novablog_backups/backup_XXX/uploads /opt/novablog/

# 重启服务
docker compose -f /opt/novablog/docker-compose.production.yml up -d
```

## 定时自动部署（可选）

可以使用 cron 设置定时部署：

```bash
# 编辑 crontab
sudo crontab -e

# 添加定时任务（每天凌晨 3 点自动部署）
0 3 * * * cd /opt/novablog && REPO_URL="https://github.com/your-repo/novablog.git" BRANCH=release /opt/novablog/deploy/deploy.sh >> /var/log/novablog-deploy.log 2>&1
```
