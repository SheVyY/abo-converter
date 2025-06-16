#!/bin/bash

# ABO Converter Web App Runner
# Automatically runs the latest version of the webapp

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEBAPP_DIR="$SCRIPT_DIR/web-app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_help() {
    echo -e "${BLUE}ABO Converter Web App Runner${NC}"
    echo ""
    echo "Usage: $0 [MODE]"
    echo ""
    echo "Modes:"
    echo "  dev      - Run in development mode with hot reload (default)"
    echo "  docker   - Run in Docker container (production-like)"
    echo "  build    - Build and run production version locally"
    echo "  clean    - Clean up Docker containers and images"
    echo "  help     - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0           # Run in development mode"
    echo "  $0 dev       # Run in development mode"
    echo "  $0 docker    # Run in Docker"
    echo "  $0 build     # Build and run production locally"
}

check_webapp_dir() {
    if [ ! -d "$WEBAPP_DIR" ]; then
        echo -e "${RED}Error: Web app directory not found at $WEBAPP_DIR${NC}"
        exit 1
    fi
    cd "$WEBAPP_DIR"
}

check_dependencies() {
    if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
        echo -e "${YELLOW}Installing dependencies...${NC}"
        npm install
    fi
}

run_dev() {
    echo -e "${GREEN}Starting webapp in development mode...${NC}"
    echo -e "${BLUE}URL: http://localhost:3000${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
    echo ""
    
    check_webapp_dir
    check_dependencies
    npm run dev
}

run_docker() {
    echo -e "${GREEN}Starting webapp in Docker...${NC}"
    echo -e "${BLUE}URL: http://localhost:3002${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
    echo ""
    
    check_webapp_dir
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}Error: Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
    
    # Stop any existing containers
    docker-compose down 2>/dev/null || true
    
    # Build and run
    docker-compose up --build
}

run_build() {
    echo -e "${GREEN}Building and running production version...${NC}"
    echo -e "${BLUE}URL: http://localhost:3000${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
    echo ""
    
    check_webapp_dir
    check_dependencies
    
    echo -e "${YELLOW}Building application...${NC}"
    npm run build
    
    echo -e "${YELLOW}Starting production server...${NC}"
    npm run start
}

clean_docker() {
    echo -e "${YELLOW}Cleaning up Docker containers and images...${NC}"
    
    check_webapp_dir
    
    # Stop and remove containers
    docker-compose down --volumes --remove-orphans 2>/dev/null || true
    
    # Remove images
    docker-compose down --rmi all 2>/dev/null || true
    
    # Clean up unused Docker resources
    docker system prune -f
    
    echo -e "${GREEN}Docker cleanup completed${NC}"
}

# Default mode
MODE="${1:-dev}"

case "$MODE" in
    "dev")
        run_dev
        ;;
    "docker")
        run_docker
        ;;
    "build")
        run_build
        ;;
    "clean")
        clean_docker
        ;;
    "help"|"-h"|"--help")
        print_help
        ;;
    *)
        echo -e "${RED}Error: Unknown mode '$MODE'${NC}"
        echo ""
        print_help
        exit 1
        ;;
esac