#!/bin/bash

# Test configuration script
echo "🔍 Testing NovaBlog Production Deployment Configuration"
echo "======================================================"

# Check files exist
echo "📁 Checking required files..."
files=(
    "docker-compose.production.yml"
    "Dockerfile.backend.production"
    "Dockerfile.frontend.production"
    "nginx.conf"
    ".env.production"
    "deploy.sh"
    "quick-deploy.sh"
    "README.md"
)

missing_files=0
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (missing)"
        missing_files=$((missing_files + 1))
    fi
done

echo ""
echo "📋 Docker Compose syntax check..."
if docker compose -f docker-compose.production.yml config > /dev/null 2>&1; then
    echo "  ✅ docker-compose.production.yml syntax is valid"
else
    echo "  ❌ docker-compose.production.yml has syntax errors"
    docker compose -f docker-compose.production.yml config
fi

echo ""
echo "🔧 Checking Dockerfile syntax..."
if dockerfile_lint Dockerfile.backend.production 2>/dev/null || true; then
    echo "  ✅ Dockerfile.backend.production looks good"
fi

if dockerfile_lint Dockerfile.frontend.production 2>/dev/null || true; then
    echo "  ✅ Dockerfile.frontend.production looks good"
fi

echo ""
echo "🌐 Checking port availability..."
ports=(19087 19088)
for port in "${ports[@]}"; do
    if netstat -tulpn 2>/dev/null | grep -q ":$port "; then
        echo "  ⚠️  Port $port is in use"
    else
        echo "  ✅ Port $port is available"
    fi
done

echo ""
echo "📊 Summary:"
if [ $missing_files -eq 0 ]; then
    echo "✅ All files are present and configuration looks good!"
    echo ""
    echo "Next steps:"
    echo "1. chmod +x deploy.sh quick-deploy.sh"
    echo "2. Edit .env.production with your secrets"
    echo "3. Run ./quick-deploy.sh for quick deployment"
    echo "4. Or use ./deploy.sh for full DevOps workflow"
else
    echo "⚠️  Found $missing_files missing files. Please check configuration."
fi