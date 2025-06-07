#!/bin/bash
# Claude Code Auto Keep-Alive Script - Prevents timeout disconnections
# Usage: ./scripts/claude-auto-keep-alive.sh

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HEARTBEAT_INTERVAL=30  # Send heartbeat every 30 seconds
MAX_RUNTIME=1800      # Max runtime 30 minutes (1800 seconds)

# Function to print with timestamp
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

# Function to run command with anti-timeout
run_with_keepalive() {
    local cmd="$1"
    local description="$2"
    
    log "${YELLOW}Starting:${NC} $description"
    
    # Start the command in background
    $cmd &
    local pid=$!
    
    # Start time
    local start_time=$(date +%s)
    
    # Keep alive loop
    while kill -0 $pid 2>/dev/null; do
        # Calculate elapsed time
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        # Check if max runtime exceeded
        if [ $elapsed -gt $MAX_RUNTIME ]; then
            log "${YELLOW}Max runtime reached, stopping...${NC}"
            kill $pid 2>/dev/null || true
            break
        fi
        
        # Send heartbeat
        echo -ne "\r${GREEN}⚡ Running${NC} [$elapsed/${MAX_RUNTIME}s] - Process active (PID: $pid)..."
        
        # Wait before next heartbeat
        sleep $HEARTBEAT_INTERVAL
    done
    
    # Clear the line
    echo -ne "\r\033[K"
    
    # Check exit status
    wait $pid
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        log "${GREEN}✅ Completed successfully${NC}"
    else
        log "${YELLOW}⚠️  Completed with exit code: $exit_code${NC}"
    fi
    
    return $exit_code
}

# Main execution based on arguments
case "${1:-help}" in
    dev)
        run_with_keepalive "npm run dev" "Development server"
        ;;
    test)
        run_with_keepalive "npm test" "Running tests"
        ;;
    build)
        run_with_keepalive "npm run build" "Building application"
        ;;
    verify)
        run_with_keepalive "npm run verify" "Full verification (lint + test + build)"
        ;;
    quick)
        run_with_keepalive "npm run verify:quick" "Quick verification"
        ;;
    custom)
        if [ -z "$2" ]; then
            echo "Usage: $0 custom 'your command here'"
            exit 1
        fi
        run_with_keepalive "$2" "Custom command"
        ;;
    *)
        echo "Claude Code Auto Keep-Alive Script"
        echo "Usage: $0 {dev|test|build|verify|quick|custom}"
        echo ""
        echo "Commands:"
        echo "  dev     - Run development server with keep-alive"
        echo "  test    - Run tests with keep-alive"
        echo "  build   - Build application with keep-alive"
        echo "  verify  - Run full verification with keep-alive"
        echo "  quick   - Run quick verification with keep-alive"
        echo "  custom  - Run custom command with keep-alive"
        echo ""
        echo "Example:"
        echo "  $0 dev"
        echo "  $0 custom 'npm run cypress:open'"
        ;;
esac