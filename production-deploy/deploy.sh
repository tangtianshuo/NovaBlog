#!/bin/bash

# NovaBlog Production Deployment Script
# DevOps automation for CI/CD pipeline

set -e  # Exit on error

# Configuration
PROJECT_NAME="novablog-production"
PROJECT_DIR="/home/root123/docker/NovaBlog"
DEPLOY_DIR="${PROJECT_DIR}/production-deploy"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.production.yml"
ENV_FILE="${DEPLOY_DIR}/.env.production"
GIT_REPO="https://github.com/tangtianshuo/NovaBlog.git"
GIT_BRANCH="main"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
check_privileges() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "Running as root. Consider using a non-root user with docker privileges."
    elif groups | grep -q docker; then
        log_info "User has docker privileges."
    else
        log_error "User does not have docker privileges. Add user to docker group: sudo usermod -aG docker \$USER"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed. Please install Git."
        exit 1
    fi
    
    log_success "All prerequisites are satisfied."
}

# Initialize deployment directory
init_deployment() {
    log_info "Initializing deployment directory..."
    
    # Create necessary directories
    mkdir -p "${DEPLOY_DIR}/logs/backend"
    mkdir -p "${DEPLOY_DIR}/logs/nginx"
    mkdir -p "${PROJECT_DIR}/data"
    mkdir -p "${PROJECT_DIR}/uploads"
    
    # Set permissions
    chmod 755 "${DEPLOY_DIR}/logs/backend"
    chmod 755 "${DEPLOY_DIR}/logs/nginx"
    chmod 755 "${PROJECT_DIR}/data"
    chmod 755 "${PROJECT_DIR}/uploads"
    
    log_success "Deployment directory initialized."
}

# Clone or update repository
update_code() {
    log_info "Updating source code..."
    
    if [ -d "${PROJECT_DIR}/.git" ]; then
        # Repository exists, pull updates
        cd "${PROJECT_DIR}"
        git fetch origin
        git checkout "${GIT_BRANCH}"
        git pull origin "${GIT_BRANCH}"
        log_success "Code updated from repository."
    else
        # Clone repository
        log_info "Cloning repository..."
        git clone -b "${GIT_BRANCH}" "${GIT_REPO}" "${PROJECT_DIR}"
        log_success "Repository cloned."
    fi
    
    # Install dependencies
    log_info "Installing dependencies..."
    cd "${PROJECT_DIR}"
    npm ci --only=production
    log_success "Dependencies installed."
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."
    
    cd "${DEPLOY_DIR}"
    
    # Build backend
    log_info "Building backend image..."
    docker compose -f "${COMPOSE_FILE}" build --no-cache backend
    
    # Build frontend
    log_info "Building frontend image..."
    docker compose -f "${COMPOSE_FILE}" build --no-cache frontend
    
    log_success "Docker images built successfully."
}

# Deploy application
deploy() {
    log_info "Deploying application..."
    
    cd "${DEPLOY_DIR}"
    
    # Stop existing containers if running
    if docker compose -f "${COMPOSE_FILE}" ps | grep -q "Up"; then
        log_info "Stopping existing containers..."
        docker compose -f "${COMPOSE_FILE}" down
    fi
    
    # Start containers
    log_info "Starting containers..."
    docker compose -f "${COMPOSE_FILE}" up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 10
    
    # Check container status
    check_status
    
    log_success "Application deployed successfully!"
}

# Check deployment status
check_status() {
    log_info "Checking deployment status..."
    
    cd "${DEPLOY_DIR}"
    
    # Check if containers are running
    if docker compose -f "${COMPOSE_FILE}" ps | grep -q "Up"; then
        log_success "Containers are running."
        
        # Show container status
        echo ""
        docker compose -f "${COMPOSE_FILE}" ps
        
        # Show logs briefly
        echo ""
        log_info "Recent logs:"
        docker compose -f "${COMPOSE_FILE}" logs --tail=10
        
        # Show network information
        echo ""
        log_info "Network information:"
        echo "Backend API: http://localhost:19087"
        echo "Frontend: http://localhost:19088"
        echo "Health check: http://localhost:19088/health"
    else
        log_error "Containers are not running."
        docker compose -f "${COMPOSE_FILE}" ps
        exit 1
    fi
}

# Stop application
stop() {
    log_info "Stopping application..."
    
    cd "${DEPLOY_DIR}"
    
    if docker compose -f "${COMPOSE_FILE}" ps | grep -q "Up"; then
        docker compose -f "${COMPOSE_FILE}" down
        log_success "Application stopped."
    else
        log_warning "Application is not running."
    fi
}

# Restart application
restart() {
    log_info "Restarting application..."
    
    cd "${DEPLOY_DIR}"
    docker compose -f "${COMPOSE_FILE}" restart
    log_success "Application restarted."
}

# View logs
view_logs() {
    log_info "Showing logs..."
    
    cd "${DEPLOY_DIR}"
    
    case "$1" in
        backend)
            docker compose -f "${COMPOSE_FILE}" logs -f backend
            ;;
        frontend)
            docker compose -f "${COMPOSE_FILE}" logs -f frontend
            ;;
        all)
            docker compose -f "${COMPOSE_FILE}" logs -f
            ;;
        *)
            docker compose -f "${COMPOSE_FILE}" logs --tail=50
            ;;
    esac
}

# Backup data
backup() {
    log_info "Creating backup..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="${PROJECT_DIR}/backup_${TIMESTAMP}"
    
    mkdir -p "${BACKUP_DIR}"
    
    # Backup data
    if [ -d "${PROJECT_DIR}/data" ]; then
        cp -r "${PROJECT_DIR}/data" "${BACKUP_DIR}/"
    fi
    
    # Backup uploads
    if [ -d "${PROJECT_DIR}/uploads" ]; then
        cp -r "${PROJECT_DIR}/uploads" "${BACKUP_DIR}/"
    fi
    
    # Backup docker-compose file
    cp "${COMPOSE_FILE}" "${BACKUP_DIR}/"
    cp "${ENV_FILE}" "${BACKUP_DIR}/" 2>/dev/null || true
    
    log_success "Backup created at: ${BACKUP_DIR}"
}

# Cleanup old backups and images
cleanup() {
    log_info "Cleaning up old resources..."
    
    # Remove old backups (keep last 5)
    find "${PROJECT_DIR}" -maxdepth 1 -type d -name "backup_*" | sort -r | tail -n +6 | xargs rm -rf 2>/dev/null || true
    
    # Remove dangling images
    docker image prune -f
    
    # Remove stopped containers
    docker container prune -f
    
    log_success "Cleanup completed."
}

# Show usage
show_usage() {
    echo -e "${BLUE}NovaBlog Production Deployment Script${NC}"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  init      - Initialize deployment directory"
    echo "  update    - Update source code from repository"
    echo "  build     - Build Docker images"
    echo "  deploy    - Deploy application (update + build + deploy)"
    echo "  stop      - Stop application"
    echo "  restart   - Restart application"
    echo "  status    - Check deployment status"
    echo "  logs      - View logs (backend|frontend|all)"
    echo "  backup    - Create backup of data"
    echo "  cleanup   - Cleanup old backups and images"
    echo "  full      - Full deployment (init + deploy)"
    echo ""
    echo "Examples:"
    echo "  $0 init"
    echo "  $0 deploy"
    echo "  $0 logs backend"
    echo "  $0 status"
}

# Main execution
main() {
    check_privileges
    check_prerequisites
    
    case "$1" in
        init)
            init_deployment
            ;;
        update)
            update_code
            ;;
        build)
            build_images
            ;;
        deploy)
            update_code
            build_images
            deploy
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        status)
            check_status
            ;;
        logs)
            view_logs "$2"
            ;;
        backup)
            backup
            ;;
        cleanup)
            cleanup
            ;;
        full)
            init_deployment
            update_code
            build_images
            deploy
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"