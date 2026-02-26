#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

REPO_URL="https://github.com/tangtianshuo/NovaBlog.git"
BRANCH="release"
COMPOSE_FILE="docker-compose.production.yml"
APP_DIR="/home/root123/docker/NovaBlog/"
BACKUP_DIR="/home/root123/docker/NovaBlog/"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."

    if ! command -v git &> /dev/null; then
        log_error "git is not installed"
        exit 1
    fi

    if ! command -v docker &> /dev/null; then
        log_error "docker is not installed"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "docker-compose is not installed"
        exit 1
    fi

    log_info "All requirements satisfied"
}

backup_data() {
    if [ -d "$APP_DIR/data" ]; then
        log_info "Backing up data..."
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
        mkdir -p "$BACKUP_PATH"
        cp -r "$APP_DIR/data" "$BACKUP_PATH/"
        if [ -d "$APP_DIR/uploads" ]; then
            cp -r "$APP_DIR/uploads" "$BACKUP_PATH/"
        fi
        log_info "Backup created at $BACKUP_PATH"

        find "$BACKUP_DIR" -type d -name "backup_*" -mtime +7 -exec rm -rf {} \; 2>/dev/null || true
    fi
}

clone_or_pull() {
    log_info "Cloning/Pulling repository..."

    if [ -z "$REPO_URL" ]; then
        log_error "REPO_URL environment variable is not set"
        exit 1
    fi

    if [ ! -d "$APP_DIR/.git" ]; then
        log_info "Cloning repository to $APP_DIR..."
        mkdir -p "$APP_DIR"
        git clone -b "$BRANCH" --single-branch "$REPO_URL" "$APP_DIR"
    else
        log_info "Pulling latest changes..."
        cd "$APP_DIR"
        git fetch origin
        git checkout "$BRANCH"
        git pull origin "$BRANCH"
    fi

    log_info "Repository updated to latest $BRANCH branch"
}

stop_containers() {
    log_info "Stopping existing containers..."
    cd "$APP_DIR"

    if docker compose version &> /dev/null; then
        docker compose -f $COMPOSE_FILE down --remove-orphans 2>/dev/null || true
    else
        docker-compose -f $COMPOSE_FILE down --remove-orphans 2>/dev/null || true
    fi
}

build_and_start() {
    log_info "Building and starting containers..."
    cd "$APP_DIR"

    COMPOSE_CMD=""
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose -f $COMPOSE_FILE"
    else
        COMPOSE_CMD="docker-compose -f $COMPOSE_FILE"
    fi

    log_info "Using compose file: $COMPOSE_FILE"
    $COMPOSE_CMD build --no-cache
    $COMPOSE_CMD up -d

    log_info "Containers started successfully"
}

health_check() {
    log_info "Performing health check..."

    MAX_RETRIES=30
    RETRY_INTERVAL=2
    RETRIED=0

    while [ $RETRIED -lt $MAX_RETRIES ]; do
        if curl -sf "http://localhost:18088/" > /dev/null 2>&1; then
            log_info "Frontend is healthy"
            return 0
        fi

        RETRIED=$((RETRIED + 1))
        log_warn "Waiting for frontend to be ready... ($RETRIED/$MAX_RETRIES)"
        sleep $RETRY_INTERVAL
    done

    log_error "Health check failed - frontend not responding"
    return 1
}

show_status() {
    log_info "Container status:"
    cd "$APP_DIR"

    if docker compose version &> /dev/null; then
        docker compose -f $COMPOSE_FILE ps
    else
        docker-compose -f $COMPOSE_FILE ps
    fi
}

main() {
    echo "=========================================="
    echo "  NovaBlog Production Deployment Script"
    echo "=========================================="
    echo ""

    log_info "Starting deployment process..."
    log_info "Branch: $BRANCH"
    log_info "Repository: $REPO_URL"
    log_info "App Directory: $APP_DIR"
    echo ""

    check_requirements

    backup_data

    clone_or_pull

    stop_containers

    build_and_start

    if health_check; then
        log_info "Deployment completed successfully!"
    else
        log_error "Deployment completed but health check failed"
        show_status
        exit 1
    fi

    show_status

    echo ""
    log_info "Deployment finished at $(date)"
}

main "$@"
