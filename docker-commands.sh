#!/bin/bash
# docker-commands.sh
# Script de comandos útiles para Docker

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de utilidad
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

# Función para mostrar ayuda
show_help() {
    echo "TruckMatch Docker Commands"
    echo ""
    echo "Usage: ./docker-commands.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build           Build production image"
    echo "  dev             Start development environment"
    echo "  prod            Start production environment"
    echo "  stop            Stop all services"
    echo "  restart         Restart all services"
    echo "  logs            Show logs for all services"
    echo "  logs-api        Show API logs only"
    echo "  logs-db         Show database logs only"
    echo "  clean           Remove all containers and volumes"
    echo "  seed            Run database seeder"
    echo "  shell           Open shell in API container"
    echo "  db-shell        Open PostgreSQL shell"
    echo "  status          Show status of all services"
    echo "  help            Show this help message"
}

# Construir imagen
build() {
    log_info "Building TruckMatch API Docker image..."
    docker-compose build --no-cache truckmatch-api
    log_success "Build completed!"
}

# Desarrollo
dev() {
    log_info "Starting development environment..."
    docker-compose --profile dev up -d
    log_success "Development environment started!"
    log_info "API available at: http://localhost:5001"
    log_info "Use 'docker-commands.sh logs' to see logs"
}

# Producción
prod() {
    log_info "Starting production environment..."
    docker-compose up -d truckmatch-api postgres
    log_success "Production environment started!"
    log_info "API available at: http://localhost:5000"
}

# Parar servicios
stop() {
    log_info "Stopping all services..."
    docker-compose down
    log_success "All services stopped!"
}

# Reiniciar servicios
restart() {
    log_info "Restarting services..."
    docker-compose restart
    log_success "Services restarted!"
}

# Ver logs
logs() {
    docker-compose logs -f
}

# Ver logs de API
logs_api() {
    docker-compose logs -f truckmatch-api
}

# Ver logs de base de datos
logs_db() {
    docker-compose logs -f postgres
}

# Limpiar todo
clean() {
    log_warning "This will remove all containers, networks, and volumes!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Cleaning up..."
        docker-compose down -v --remove-orphans
        docker system prune -f
        log_success "Cleanup completed!"
    else
        log_info "Cleanup cancelled."
    fi
}

# Ejecutar seeder
seed() {
    log_info "Running database seeder..."
    docker-compose exec truckmatch-api npm run seed
    log_success "Database seeded!"
}

# Shell en contenedor API
shell() {
    log_info "Opening shell in API container..."
    docker-compose exec truckmatch-api sh
}

# Shell de base de datos
db_shell() {
    log_info "Opening PostgreSQL shell..."
    docker-compose exec postgres psql -U truckmatch_user -d truckmatch_db
}

# Estado de servicios
status() {
    log_info "Service status:"
    docker-compose ps
}

# Main script logic
case "${1:-help}" in
    build)
        build
        ;;
    dev)
        dev
        ;;
    prod)
        prod
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs
        ;;
    logs-api)
        logs_api
        ;;
    logs-db)
        logs_db
        ;;
    clean)
        clean
        ;;
    seed)
        seed
        ;;
    shell)
        shell
        ;;
    db-shell)
        db_shell
        ;;
    status)
        status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        echo
        show_help
        exit 1
        ;;
esac