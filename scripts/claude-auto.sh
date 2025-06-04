#!/bin/bash
# Script d'automatisation pour Claude Code - Réduit les demandes d'autorisation

case "$1" in
  "test")
    echo "🧪 Running tests..."
    npm test -- --watchAll=false
    ;;
  
  "test-watch")
    echo "🧪 Starting test watcher..."
    npm test -- --watch
    ;;
  
  "test-file")
    echo "🧪 Testing file: $2"
    npm test -- "$2" --watchAll=false
    ;;
  
  "fix-lint")
    echo "🔧 Fixing lint issues..."
    npm run lint:fix
    ;;
  
  "check")
    echo "✅ Running full check..."
    npm run lint
    npm test -- --watchAll=false
    npm run build
    ;;
  
  "dev")
    echo "🚀 Starting dev environment..."
    npm run dev
    ;;
  
  "audit")
    echo "📊 Running tech debt audit..."
    node scripts/audit-tech-debt.js
    ;;
  
  "etape")
    echo "📋 Running project status check..."
    npm run etape
    ;;
  
  *)
    echo "Usage: ./scripts/claude-auto.sh [command]"
    echo "Commands:"
    echo "  test        - Run all tests once"
    echo "  test-watch  - Run tests in watch mode"
    echo "  test-file   - Test specific file"
    echo "  fix-lint    - Auto-fix lint issues"
    echo "  check       - Full project check (lint, test, build)"
    echo "  dev         - Start dev server"
    echo "  audit       - Run tech debt audit"
    echo "  etape       - Check project status"
    ;;
esac