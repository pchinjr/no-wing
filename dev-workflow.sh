#!/bin/bash
# No-wing Development Workflow Script
# Handles rebuilds, testing, and development iteration

set -e

PROJECT_ROOT="/home/pchinjr/Code/no-wing"
DEV_CONFIG_DIR="$PROJECT_ROOT/.no-wing-dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[DEV]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Clean previous builds and configs
clean_dev() {
    log "Cleaning development environment..."
    rm -rf "$DEV_CONFIG_DIR"
    rm -f "$PROJECT_ROOT/no-wing-dev"
    success "Development environment cleaned"
}

# Build development version
build_dev() {
    log "Building development version..."
    cd "$PROJECT_ROOT"
    
    # Type check first
    deno check main.ts || {
        error "Type checking failed"
        exit 1
    }
    
    # Compile development binary
    deno compile --allow-all --output no-wing-dev main.ts || {
        error "Compilation failed"
        exit 1
    }
    
    success "Development binary built: no-wing-dev"
}

# Setup development config
setup_dev_config() {
    log "Setting up development configuration..."
    mkdir -p "$DEV_CONFIG_DIR"
    
    # Create dev-specific config
    cat > "$DEV_CONFIG_DIR/config.json" << EOF
{
  "developerId": "dev-local-$(date +%s)",
  "qId": "q-dev-local",
  "qLevel": "development",
  "region": "us-east-1",
  "setupDate": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "credentials": {
    "profile": "AdministratorAccess-837132623653",
    "region": "us-east-1"
  },
  "workspace": {
    "location": "$PROJECT_ROOT/.no-wing-dev/workspace",
    "syncToProject": true,
    "isolateIdentity": true
  },
  "development": {
    "mode": true,
    "autoReload": true,
    "verboseLogging": true
  }
}
EOF
    
    success "Development config created"
}

# Test development build
test_dev() {
    log "Testing development build..."
    
    # Test basic functionality
    ./no-wing-dev status --config="$DEV_CONFIG_DIR/config.json" || {
        warn "Status command failed (expected for first run)"
    }
    
    # Run unit tests
    log "Running unit tests..."
    deno test --allow-all src/test/*_test.ts || {
        error "Unit tests failed"
        exit 1
    }
    
    success "Development build tested successfully"
}

# Watch for changes and rebuild
watch_dev() {
    log "Starting development watch mode..."
    log "Watching for changes in src/ and main.ts..."
    
    # Initial build
    build_dev
    setup_dev_config
    
    # Watch for changes
    while true; do
        # Use inotifywait if available, otherwise fallback to polling
        if command -v inotifywait >/dev/null 2>&1; then
            inotifywait -r -e modify,create,delete src/ main.ts 2>/dev/null || true
        else
            sleep 2
        fi
        
        log "Changes detected, rebuilding..."
        if build_dev; then
            success "Rebuild successful - ready for testing"
        else
            error "Rebuild failed"
        fi
    done
}

# Show usage
usage() {
    echo "No-wing Development Workflow"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  clean     Clean development environment"
    echo "  build     Build development version"
    echo "  test      Test development build"
    echo "  setup     Setup development configuration"
    echo "  watch     Watch for changes and rebuild"
    echo "  dev       Full development cycle (clean, build, setup, test)"
    echo ""
    echo "Development binary: ./no-wing-dev"
    echo "Development config: $DEV_CONFIG_DIR/"
}

# Main command handling
case "${1:-}" in
    clean)
        clean_dev
        ;;
    build)
        build_dev
        ;;
    test)
        test_dev
        ;;
    setup)
        setup_dev_config
        ;;
    watch)
        watch_dev
        ;;
    dev)
        log "Running full development cycle..."
        clean_dev
        build_dev
        setup_dev_config
        test_dev
        success "Development environment ready!"
        echo ""
        echo "Next steps:"
        echo "  ./no-wing-dev status --config=$DEV_CONFIG_DIR/config.json"
        echo "  ./dev-workflow.sh watch  # for continuous development"
        ;;
    *)
        usage
        exit 1
        ;;
esac
