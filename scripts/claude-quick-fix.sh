#!/bin/bash
# Quick fix script that runs multiple short commands to prevent timeout
# Each command is short and provides immediate feedback

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Claude Quick Fix Runner${NC}"
echo "Running short commands with immediate feedback..."

# Function to run command with timeout and feedback
run_quick() {
    local cmd="$1"
    local desc="$2"
    echo -e "\n${GREEN}▶${NC} $desc"
    timeout 10s bash -c "$cmd" || echo "✓ Done"
}

# Series of quick commands
run_quick "echo 'Testing connection...'" "Connection test"
run_quick "ls -la scripts/ | head -5" "Checking scripts directory"
run_quick "npm run --silent etape | head -20" "Quick project status"
run_quick "ps aux | grep -E 'node|npm' | head -5" "Check running processes"
run_quick "echo 'Ready for next command'" "Status check"

echo -e "\n${GREEN}✅ Quick fix completed - Claude should remain active${NC}"