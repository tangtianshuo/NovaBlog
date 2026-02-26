#!/bin/bash

# NovaBlog Quick Deployment Script
# Simplified one-command deployment

set -e

# Configuration
PROJECT_DIR="/home/root123/docker/NovaBlog"
DEPLOY_DIR="${PROJECT_DIR}/production-deploy"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.production.yml"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 NovaBlog Quick Deployment${NC}"
echo "================================"

# Check if in correct directory
if [ ! -f "${COMPOSE_FILE}" ]; then
    echo -e "${RED}Error: Deployment files not found. Run from project directory.${NC}"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed.${NC}"
    exit 1
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not available.${NC}"
    exit 1
fi

cd "${DEPLOY_DIR}"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs/backend
mkdir -p ../data ../uploads

# Build and deploy
echo "🔨 Building Docker images..."
docker compose -f "${COMPOSE_FILE}" build

echo "🛑 Stopping existing containers..."
docker compose -f "${COMPOSE_FILE}" down 2>/dev/null || true

echo "🚀 Starting services..."
docker compose -f "${COMPOSE_FILE}" up -d

echo "⏳ Waiting for services to start..."
sleep 15

# Check status
echo "📊 Checking deployment status..."
if docker compose -f "${COMPOSE_FILE}" ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "🌐 Services are running at:"
    echo "   Backend API: http://localhost:19087"
    echo "   Frontend:    http://localhost:19088"
    echo "   Health:      http://localhost:19088/health"
    echo ""
    echo "📋 Container status:"
    docker compose -f "${COMPOSE_FILE}" ps
else
    echo -e "${RED}❌ Deployment failed. Check logs:${NC}"
    docker compose -f "${COMPOSE_FILE}" logs --tail=20
    exit 1
fi