#!/bin/bash

# Debug deployment script to identify the nginx.conf error

set -e

echo "🔍 Debugging NovaBlog deployment..."
echo "=================================="

# Check current directory
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la

echo ""
echo "🔍 Checking Dockerfile.frontend.production..."
cat Dockerfile.frontend.production

echo ""
echo "🔍 Checking for nginx.conf file..."
if [ -f "nginx.conf" ]; then
    echo "✅ nginx.conf exists"
    echo "File size: $(wc -l < nginx.conf) lines"
else
    echo "❌ nginx.conf does not exist"
fi

echo ""
echo "🔍 Checking docker-compose.production.yml build context..."
grep -A5 "build:" docker-compose.production.yml

echo ""
echo "🔍 Testing Docker build command..."
echo "Running: docker build -f Dockerfile.frontend.production --no-cache ../ 2>&1 | tail -20"
docker build -f Dockerfile.frontend.production --no-cache ../ 2>&1 | tail -20

echo ""
echo "🔍 Debug complete."