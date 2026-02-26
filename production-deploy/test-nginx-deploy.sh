#!/bin/bash

# 测试Nginx部署配置
echo "=== 测试Nginx部署配置 ==="
echo "1. 检查Dockerfile..."
echo "Dockerfile.frontend.nginx 内容摘要:"
head -30 /home/root123/docker/NovaBlog/production-deploy/Dockerfile.frontend.nginx

echo -e "\n2. 检查Nginx配置..."
echo "nginx.conf 内容摘要:"
head -20 /home/root123/docker/NovaBlog/production-deploy/nginx.conf

echo -e "\n3. 检查docker-compose配置..."
echo "前端服务volumes配置:"
grep -A2 -B2 "volumes:" /home/root123/docker/NovaBlog/production-deploy/docker-compose.production.yml | grep -A2 "frontend:"

echo -e "\n4. 检查dist文件夹..."
echo "dist目录内容:"
ls -la /home/root123/docker/NovaBlog/dist/

echo -e "\n5. 构建并启动测试容器..."
cd /home/root123/docker/NovaBlog/production-deploy

# 停止并删除现有容器
docker compose -f docker-compose.production.yml down 2>/dev/null

# 构建前端镜像
echo "构建前端Nginx镜像..."
docker compose -f docker-compose.production.yml build frontend

# 启动前端服务
echo "启动前端服务..."
docker compose -f docker-compose.production.yml up -d frontend

echo -e "\n6. 等待服务启动..."
sleep 5

echo -e "\n7. 测试服务..."
echo "测试访问 test.html:"
curl -s http://localhost:19088/test.html | grep -o "<h1>.*</h1>" || echo "服务未响应"

echo -e "\n8. 检查容器内dist挂载..."
CONTAINER_ID=$(docker ps -qf "name=novablog-production-frontend")
if [ ! -z "$CONTAINER_ID" ]; then
    echo "容器ID: $CONTAINER_ID"
    echo "容器内/dist目录内容:"
    docker exec $CONTAINER_ID ls -la /dist/
else
    echo "容器未运行"
fi

echo -e "\n=== 测试完成 ==="
echo "访问地址: http://localhost:19088/test.html"
echo "如果需要清理: docker compose -f docker-compose.production.yml down"