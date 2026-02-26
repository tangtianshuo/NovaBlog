# NovaBlog Production Deployment

This directory contains production-ready Docker configuration and DevOps automation scripts for NovaBlog.

## Architecture

```
NovaBlog Production Deployment
├── backend (Node.js API) ──┐
├── frontend (Nginx + React)│
└── Docker Network Bridge ──┘
```

### Port Mapping
- **Backend API**: `19087:3001` (different from existing 18087)
- **Frontend**: `19088:8080` (different from existing 18088)

### Network
- Custom bridge network: `novablog-production-network`
- Subnet: `172.20.0.0/16`
- Internal DNS resolution between containers

## Files Structure

### Core Configuration
- `Dockerfile.backend.production` - Backend Dockerfile with multi-stage build
- `Dockerfile.frontend.production` - Frontend Dockerfile with Nginx
- `nginx.conf` - Nginx configuration with security headers
- `docker-compose.production.yml` - Production Docker Compose configuration
- `.env.production` - Environment variables template

### Deployment Scripts
- `deploy.sh` - Full-featured DevOps deployment script
- `quick-deploy.sh` - Simplified one-command deployment

### Data Persistence
- `../data/` - Database and application data
- `../uploads/` - User uploaded files
- `logs/` - Application logs

## Quick Start

### 1. Make scripts executable
```bash
chmod +x deploy.sh quick-deploy.sh
```

### 2. Quick deployment (one command)
```bash
./quick-deploy.sh
```

### 3. Full DevOps deployment
```bash
# Initialize deployment
./deploy.sh init

# Update code and deploy
./deploy.sh deploy

# Check status
./deploy.sh status
```

## DevOps Commands

### Full deployment workflow
```bash
./deploy.sh full
```

### Individual commands
```bash
# Update source code
./deploy.sh update

# Build Docker images
./deploy.sh build

# Deploy application
./deploy.sh deploy

# Stop application
./deploy.sh stop

# Restart application
./deploy.sh restart

# Check status
./deploy.sh status

# View logs
./deploy.sh logs backend
./deploy.sh logs frontend
./deploy.sh logs all

# Create backup
./deploy.sh backup

# Cleanup old resources
./deploy.sh cleanup
```

## Environment Configuration

### 1. Copy environment template
```bash
cp .env.production .env
```

### 2. Edit .env file
```bash
nano .env
```

### Important variables to configure:
- `SESSION_SECRET` - Change to a secure random string
- `JWT_SECRET` - Change to a secure random string
- Database credentials (if using PostgreSQL)
- Redis credentials (if using Redis)

## Health Checks

Both services include health checks:

- **Backend**: `http://localhost:19087/api/health`
- **Frontend**: `http://localhost:19088/health`

## Monitoring

### Container status
```bash
docker compose -f docker-compose.production.yml ps
```

### View logs
```bash
# All logs
docker compose -f docker-compose.production.yml logs

# Specific service
docker compose -f docker-compose.production.yml logs backend
docker compose -f docker-compose.production.yml logs frontend

# Follow logs
docker compose -f docker-compose.production.yml logs -f
```

### Resource usage
```bash
docker stats
```

## Backup and Recovery

### Create backup
```bash
./deploy.sh backup
```

Backups are stored in: `../backup_YYYYMMDD_HHMMSS/`

### Restore from backup
```bash
# Stop application
./deploy.sh stop

# Restore data
cp -r backup_20260226_153000/data/* ../data/
cp -r backup_20260226_153000/uploads/* ../uploads/

# Start application
./deploy.sh deploy
```

## Security Considerations

### 1. Change default secrets
- Update `SESSION_SECRET` and `JWT_SECRET` in `.env`
- Use strong passwords for database (if applicable)

### 2. Network security
- Services run on internal Docker network
- Only necessary ports exposed (19087, 19088)
- Consider adding firewall rules

### 3. File permissions
- Non-root users in containers
- Proper volume permissions
- Log rotation configured

### 4. Updates
- Regularly update base images
- Monitor for security patches
- Use `./deploy.sh update` to pull latest code

## Troubleshooting

### Port conflicts
If ports 19087 or 19088 are already in use:
1. Check current usage: `netstat -tulpn | grep :1908`
2. Modify ports in `docker-compose.production.yml`

### Permission issues
```bash
# Fix directory permissions
sudo chown -R root123:root123 ../data ../uploads
sudo chmod 755 ../data ../uploads
```

### Build failures
```bash
# Clean build cache
docker system prune -f

# Rebuild from scratch
docker compose -f docker-compose.production.yml build --no-cache
```

### Container not starting
```bash
# Check logs
docker compose -f docker-compose.production.yml logs

# Check health status
docker inspect novablog-production-backend | grep -A 5 Health
```

## Integration with Existing Deployment

This production deployment uses different ports (19087/19088) to avoid conflicts with the existing deployment (18087/18088). Both can run simultaneously for testing.

### Switching between deployments
```bash
# Stop production deployment
cd production-deploy
./deploy.sh stop

# Start existing deployment
cd ..
docker compose up -d
```

## CI/CD Integration

The deployment scripts are designed for CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
name: Deploy NovaBlog
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          cd production-deploy
          ./deploy.sh deploy
```

## Performance Optimization

### 1. Build optimization
- Multi-stage Docker builds
- Production-only dependencies
- Nginx caching configuration

### 2. Resource limits
Add to `docker-compose.production.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

### 3. Database optimization
- Consider using PostgreSQL instead of SQLite for production
- Add connection pooling
- Configure proper indexes

## Support

For issues or questions:
1. Check logs: `./deploy.sh logs all`
2. Verify configuration: `cat .env`
3. Check Docker: `docker version`
4. Review this README

## License

This deployment configuration is part of NovaBlog project.