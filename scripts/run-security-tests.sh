#!/bin/bash

# Security Tests Runner for Medical Application
# Executes comprehensive security test suite and generates report

set -e

echo "🔒 Starting Comprehensive Security Tests for Medical Application"
echo "================================================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create security test results directory
SECURITY_RESULTS_DIR="security-test-results"
mkdir -p "$SECURITY_RESULTS_DIR"

# Timestamp for this test run
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$SECURITY_RESULTS_DIR/security-test-report-$TIMESTAMP.md"

echo "# Security Test Report - Medical Application" > "$REPORT_FILE"
echo "**Generated:** $(date)" >> "$REPORT_FILE"
echo "**Environment:** ${NODE_ENV:-development}" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Function to run test suite and capture results
run_test_suite() {
    local test_name="$1"
    local test_pattern="$2"
    local description="$3"
    
    echo -e "${BLUE}Running $test_name...${NC}"
    echo "## $test_name" >> "$REPORT_FILE"
    echo "$description" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Run the test and capture output
    if npm test -- --testPathPattern="$test_pattern" --coverage --coverageDirectory="$SECURITY_RESULTS_DIR/coverage-$test_name" --json --outputFile="$SECURITY_RESULTS_DIR/$test_name-results.json" 2>&1; then
        echo -e "${GREEN}✅ $test_name PASSED${NC}"
        echo "**Status:** ✅ PASSED" >> "$REPORT_FILE"
    else
        echo -e "${RED}❌ $test_name FAILED${NC}"
        echo "**Status:** ❌ FAILED" >> "$REPORT_FILE"
    fi
    echo "" >> "$REPORT_FILE"
}

# Function to check security dependencies
check_security_dependencies() {
    echo -e "${BLUE}Checking security dependencies...${NC}"
    echo "## Security Dependencies Check" >> "$REPORT_FILE"
    
    # Check for known vulnerabilities
    if command -v npm audit &> /dev/null; then
        echo "### NPM Audit Results" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        npm audit >> "$REPORT_FILE" 2>&1 || true
        echo '```' >> "$REPORT_FILE"
    fi
    
    # Check for outdated packages
    echo "### Outdated Packages" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    npm outdated >> "$REPORT_FILE" 2>&1 || true
    echo '```' >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# Function to analyze code for security patterns
analyze_security_patterns() {
    echo -e "${BLUE}Analyzing security patterns...${NC}"
    echo "## Security Pattern Analysis" >> "$REPORT_FILE"
    
    # Check for potential security issues in code
    echo "### Potential Security Issues" >> "$REPORT_FILE"
    
    # Check for dangerous patterns
    dangerous_patterns=(
        "eval("
        "dangerouslySetInnerHTML"
        "innerHTML.*="
        "document.write"
        "setTimeout.*string"
        "setInterval.*string"
        "exec("
        "system("
        "__dirname.*\.\."
        "process\.env\.[A-Z_]*.*console"
    )
    
    issues_found=0
    for pattern in "${dangerous_patterns[@]}"; do
        echo "Checking for pattern: $pattern" >&2
        matches=$(grep -r -n "$pattern" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null || true)
        if [ -n "$matches" ]; then
            echo "⚠️ Found potentially dangerous pattern: $pattern" >> "$REPORT_FILE"
            echo '```' >> "$REPORT_FILE"
            echo "$matches" >> "$REPORT_FILE"
            echo '```' >> "$REPORT_FILE"
            ((issues_found++))
        fi
    done
    
    if [ $issues_found -eq 0 ]; then
        echo "✅ No dangerous patterns found in codebase" >> "$REPORT_FILE"
    fi
    echo "" >> "$REPORT_FILE"
}

# Main execution
echo -e "${YELLOW}Preparing security test environment...${NC}"

# Set test environment variables
export NODE_ENV=test
export JWT_SECRET=test-secret-for-security-tests
export SKIP_DATABASE_SEED=true

echo "## Test Configuration" >> "$REPORT_FILE"
echo "- **Node Environment:** $NODE_ENV" >> "$REPORT_FILE"
echo "- **Test Database:** In-memory/Mock" >> "$REPORT_FILE"
echo "- **Security Level:** Maximum" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Run security dependency checks
check_security_dependencies

# Run code pattern analysis
analyze_security_patterns

# Run comprehensive security test suites
run_test_suite "Authentication Security" "authService.*security|authService.*comprehensive" "Tests for authentication mechanisms, JWT security, session management, and login protection."

run_test_suite "Authorization & RBAC" "authorization.*security|auth\.security" "Tests for role-based access control, permission validation, and privilege escalation prevention."

run_test_suite "SQL Injection Prevention" "prisma.*injection.*security" "Tests for SQL injection prevention in all Prisma database queries."

run_test_suite "XSS Protection" "xss.*protection" "Tests for cross-site scripting prevention, input validation, and output sanitization."

run_test_suite "Security Integration" "security.*integration" "End-to-end security tests covering complete attack scenarios and security workflows."

run_test_suite "API Route Security" "api.*auth|route.*security" "Tests for API endpoint protection, authentication middleware, and route authorization."

# Generate coverage summary
echo "## Test Coverage Summary" >> "$REPORT_FILE"
if [ -d "$SECURITY_RESULTS_DIR" ]; then
    # Combine coverage reports if available
    echo "Coverage reports generated in: $SECURITY_RESULTS_DIR/coverage-*" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Security recommendations
echo "## Security Recommendations" >> "$REPORT_FILE"
echo "Based on the test results, here are security recommendations:" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "### Critical (High Priority)" >> "$REPORT_FILE"
echo "- [ ] Ensure all authentication endpoints are properly protected" >> "$REPORT_FILE"
echo "- [ ] Validate all user inputs for XSS and injection attacks" >> "$REPORT_FILE"
echo "- [ ] Implement proper session management and token validation" >> "$REPORT_FILE"
echo "- [ ] Enforce role-based access control for all medical data" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "### Important (Medium Priority)" >> "$REPORT_FILE"
echo "- [ ] Implement comprehensive audit logging for all sensitive operations" >> "$REPORT_FILE"
echo "- [ ] Add rate limiting to prevent brute force attacks" >> "$REPORT_FILE"
echo "- [ ] Ensure proper CORS configuration for medical applications" >> "$REPORT_FILE"
echo "- [ ] Implement data encryption for sensitive medical information" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "### Recommended (Low Priority)" >> "$REPORT_FILE"
echo "- [ ] Add security headers (HSTS, CSP, X-Frame-Options)" >> "$REPORT_FILE"
echo "- [ ] Implement automated security scanning in CI/CD pipeline" >> "$REPORT_FILE"
echo "- [ ] Regular security dependency updates" >> "$REPORT_FILE"
echo "- [ ] Security awareness training for development team" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Final summary
echo "## Test Summary" >> "$REPORT_FILE"
echo "Security test suite completed at $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "### Files Generated" >> "$REPORT_FILE"
echo "- Main report: $REPORT_FILE" >> "$REPORT_FILE"
echo "- Coverage reports: $SECURITY_RESULTS_DIR/coverage-*/" >> "$REPORT_FILE"
echo "- Test results: $SECURITY_RESULTS_DIR/*-results.json" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Generate JSON summary for CI/CD
cat > "$SECURITY_RESULTS_DIR/security-summary.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "environment": "${NODE_ENV:-development}",
  "reportFile": "$REPORT_FILE",
  "testSuites": [
    "Authentication Security",
    "Authorization & RBAC", 
    "SQL Injection Prevention",
    "XSS Protection",
    "Security Integration",
    "API Route Security"
  ],
  "status": "completed",
  "coverageDirectory": "$SECURITY_RESULTS_DIR"
}
EOF

echo ""
echo -e "${GREEN}🔒 Security test suite completed!${NC}"
echo -e "${BLUE}📊 Report generated: $REPORT_FILE${NC}"
echo -e "${BLUE}📁 Results directory: $SECURITY_RESULTS_DIR${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the security test report"
echo "2. Address any failed tests or security issues"
echo "3. Update security documentation"
echo "4. Schedule regular security test runs"
echo ""

# Open report if on macOS and in interactive mode
if [[ "$OSTYPE" == "darwin"* ]] && [[ -t 1 ]]; then
    read -p "Would you like to open the security report? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$REPORT_FILE"
    fi
fi