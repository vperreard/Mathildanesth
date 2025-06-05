#!/bin/bash
# Claude Auto - Automation script for common development tasks
# Usage: ./scripts/claude-auto.sh [command]
# This script groups common commands to reduce permission prompts

set -e # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🤖 Claude Auto - Development Automation${NC}"
echo "==========================================="

case "$1" in
  "test")
    echo -e "${YELLOW}Running all tests...${NC}"
    npm test
    ;;
    
  "check")
    echo -e "${YELLOW}Running full verification suite...${NC}"
    npm run lint
    npm test
    npm run build
    echo -e "${GREEN}✅ All checks passed!${NC}"
    ;;
    
  "dev")
    echo -e "${YELLOW}Starting development environment...${NC}"
    npm run dev
    ;;
    
  "audit")
    echo -e "${YELLOW}Running technical debt audit...${NC}"
    npm run audit:debt
    ;;
    
  "quick")
    echo -e "${YELLOW}Running quick tests...${NC}"
    npm run test:fast
    npm run lint
    echo -e "${GREEN}✅ Quick checks completed!${NC}"
    ;;
    
  "coverage")
    echo -e "${YELLOW}Running tests with coverage...${NC}"
    npm run test:coverage
    ;;
    
  "etape")
    echo -e "${YELLOW}Running project checkpoint...${NC}"
    npm run etape
    ;;
    
  "watch")
    echo -e "${YELLOW}Starting test watch mode...${NC}"
    npm test -- --watch
    ;;
    
  "verify-commit")
    echo -e "${YELLOW}Pre-commit verification...${NC}"
    npm run lint
    npm test
    echo -e "${GREEN}✅ Ready to commit!${NC}"
    ;;
    
  *)
    echo "Usage: $0 {test|check|dev|audit|quick|coverage|etape|watch|verify-commit}"
    echo ""
    echo "Commands:"
    echo "  test          - Run all tests"
    echo "  check         - Full verification (lint + test + build)"
    echo "  dev           - Start development server"
    echo "  audit         - Run technical debt audit"
    echo "  quick         - Quick tests + lint"
    echo "  coverage      - Tests with coverage report"
    echo "  etape         - Project status checkpoint"
    echo "  watch         - Test watch mode"
    echo "  verify-commit - Pre-commit checks"
    exit 1
    ;;
esac