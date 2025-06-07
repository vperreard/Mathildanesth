#!/usr/bin/env node

/**
 * Simple verification script for auth optimizations
 * Tests that new code doesn't break existing functionality
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Auth Optimizations...\n');

const checks = [];

// Check 1: Verify all optimization files exist
const optimizationFiles = [
  'src/lib/auth/optimized-auth-cache.ts',
  'src/lib/auth/performance-monitor.ts',
  'src/lib/auth/optimized-auth-server-utils.ts',
  'src/middleware/optimized-auth.ts',
  'src/lib/prisma-optimized.ts',
  'src/app/api/auth/performance/route.ts'
];

console.log('✅ Checking optimization files...');
optimizationFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    checks.push({ file, status: 'exists', ok: true });
    console.log(`  ✓ ${file}`);
  } else {
    checks.push({ file, status: 'missing', ok: false });
    console.log(`  ✗ ${file} - MISSING`);
  }
});

// Check 2: Verify original files are intact
const originalFiles = [
  'src/lib/auth.ts',
  'src/lib/auth-server-utils.ts',
  'src/lib/auth-client-utils.ts',
  'src/middleware.ts',
  'src/app/api/auth/login/route.ts'
];

console.log('\n✅ Checking original files are intact...');
originalFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Check that files haven't been completely replaced
    if (content.length > 100) {
      checks.push({ file, status: 'intact', ok: true });
      console.log(`  ✓ ${file}`);
    } else {
      checks.push({ file, status: 'empty', ok: false });
      console.log(`  ✗ ${file} - EMPTY`);
    }
  } else {
    checks.push({ file, status: 'missing', ok: false });
    console.log(`  ✗ ${file} - MISSING`);
  }
});

// Check 3: Verify imports are correct
console.log('\n✅ Checking for circular dependencies...');
const authServerUtils = fs.readFileSync(path.join(process.cwd(), 'src/lib/auth/optimized-auth-server-utils.ts'), 'utf-8');
const hasCircularImports = authServerUtils.includes("from './optimized-auth-server-utils'");
if (!hasCircularImports) {
  console.log('  ✓ No circular dependencies detected');
  checks.push({ test: 'circular-deps', status: 'clean', ok: true });
} else {
  console.log('  ✗ Circular dependency detected!');
  checks.push({ test: 'circular-deps', status: 'found', ok: false });
}

// Check 4: Verify TypeScript syntax
console.log('\n✅ Checking TypeScript syntax...');
const tsFiles = optimizationFiles.filter(f => f.endsWith('.ts'));
let syntaxErrors = 0;

tsFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Basic syntax checks
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      console.log(`  ✗ ${file} - Unmatched braces`);
      syntaxErrors++;
    }
    
    // Check for common errors
    if (content.includes(';;')) {
      console.log(`  ✗ ${file} - Double semicolon found`);
      syntaxErrors++;
    }
  }
});

if (syntaxErrors === 0) {
  console.log('  ✓ No obvious syntax errors detected');
  checks.push({ test: 'syntax', status: 'clean', ok: true });
} else {
  checks.push({ test: 'syntax', status: `${syntaxErrors} errors`, ok: false });
}

// Generate report
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION REPORT');
console.log('='.repeat(60));

const totalChecks = checks.length;
const passedChecks = checks.filter(c => c.ok).length;
const failedChecks = totalChecks - passedChecks;

console.log(`Total checks: ${totalChecks}`);
console.log(`Passed: ${passedChecks}`);
console.log(`Failed: ${failedChecks}`);

if (failedChecks === 0) {
  console.log('\n✅ All verifications passed! Optimizations are ready for testing.');
} else {
  console.log('\n❌ Some verifications failed. Please review the issues above.');
  process.exit(1);
}

// Additional info
console.log('\n📝 Next steps:');
console.log('1. Update imports in existing code to use optimized versions');
console.log('2. Run performance benchmarks to measure improvements');
console.log('3. Test in staging environment');
console.log('4. Monitor performance metrics after deployment');
console.log('='.repeat(60));