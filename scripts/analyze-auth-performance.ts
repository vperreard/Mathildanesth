#!/usr/bin/env node

/**
 * Static Analysis of Auth Performance Issues
 * Analyzes code to identify performance bottlenecks without running server
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface PerformanceIssue {
  file: string;
  line: number;
  type: 'sync-operation' | 'multiple-queries' | 'inefficient-cache' | 'missing-optimization';
  severity: 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
}

class AuthPerformanceAnalyzer {
  private issues: PerformanceIssue[] = [];

  async analyze() {
    console.log('🔍 Analyzing Auth Performance Issues...\n');

    // Analyze core auth files
    this.analyzeFile('/workspace/src/lib/auth.ts');
    this.analyzeFile('/workspace/src/lib/auth-server-utils.ts');
    this.analyzeFile('/workspace/src/middleware.ts');
    this.analyzeFile('/workspace/src/app/api/auth/login/route.ts');
    this.analyzeFile('/workspace/src/app/api/auth/me/route.ts');

    // Generate report
    this.generateReport();
  }

  private analyzeFile(filePath: string) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Check for synchronous bcrypt operations
        if (line.includes('bcrypt.compareSync') || (line.includes('bcrypt.compare') && !line.includes('await'))) {
          this.issues.push({
            file: filePath,
            line: index + 1,
            type: 'sync-operation',
            severity: 'high',
            description: 'Synchronous bcrypt operation blocks event loop',
            recommendation: 'Use await bcrypt.compare() for async operation'
          });
        }

        // Check for missing select in Prisma queries
        if (line.includes('prisma.user.find') && !line.includes('select:')) {
          this.issues.push({
            file: filePath,
            line: index + 1,
            type: 'multiple-queries',
            severity: 'medium',
            description: 'Prisma query fetches all fields',
            recommendation: 'Add select clause to fetch only needed fields'
          });
        }

        // Check for inefficient cache keys
        if (line.includes('cache.set') && line.includes('token')) {
          this.issues.push({
            file: filePath,
            line: index + 1,
            type: 'inefficient-cache',
            severity: 'medium',
            description: 'Using full token as cache key (long string)',
            recommendation: 'Use hash of token or user ID as cache key'
          });
        }

        // Check for missing async/await
        if ((line.includes('verifyToken') || line.includes('createToken')) && !line.includes('await') && !line.includes('async')) {
          this.issues.push({
            file: filePath,
            line: index + 1,
            type: 'sync-operation',
            severity: 'high',
            description: 'JWT operations might be blocking',
            recommendation: 'Ensure JWT operations are async'
          });
        }

        // Check for multiple token verifications
        if (line.includes('verifyAuthToken') || line.includes('verifyToken')) {
          const fileBasename = filePath.split('/').pop();
          if (fileBasename?.includes('route.ts')) {
            this.issues.push({
              file: filePath,
              line: index + 1,
              type: 'multiple-queries',
              severity: 'medium',
              description: 'Token re-verification after middleware check',
              recommendation: 'Pass verified user data from middleware via headers/context'
            });
          }
        }

        // Check for missing connection pooling
        if (line.includes('new PrismaClient') && !lines.some(l => l.includes('connection_limit'))) {
          this.issues.push({
            file: filePath,
            line: index + 1,
            type: 'missing-optimization',
            severity: 'high',
            description: 'No Prisma connection pooling configured',
            recommendation: 'Configure connection pooling in datasource URL'
          });
        }
      });
    } catch (error) {
      console.error(`Failed to analyze ${filePath}:`, error);
    }
  }

  private generateReport() {
    console.log('📊 AUTH PERFORMANCE ANALYSIS REPORT');
    console.log('=' .repeat(60));
    console.log(`Total Issues Found: ${this.issues.length}`);
    console.log(`High Severity: ${this.issues.filter(i => i.severity === 'high').length}`);
    console.log(`Medium Severity: ${this.issues.filter(i => i.severity === 'medium').length}`);
    console.log(`Low Severity: ${this.issues.filter(i => i.severity === 'low').length}`);
    console.log('');

    // Group by type
    const byType = this.issues.reduce((acc, issue) => {
      if (!acc[issue.type]) acc[issue.type] = [];
      acc[issue.type].push(issue);
      return acc;
    }, {} as Record<string, PerformanceIssue[]>);

    Object.entries(byType).forEach(([type, issues]) => {
      console.log(`\n🔸 ${type.toUpperCase().replace(/-/g, ' ')} (${issues.length} issues)`);
      issues.forEach(issue => {
        console.log(`   ${issue.severity.toUpperCase()}: ${issue.file}:${issue.line}`);
        console.log(`   → ${issue.description}`);
        console.log(`   ✓ ${issue.recommendation}`);
      });
    });

    console.log('\n' + '=' .repeat(60));
    console.log('🎯 OPTIMIZATION PRIORITIES:');
    console.log('1. Replace sync bcrypt operations with async');
    console.log('2. Implement proper JWT token caching');
    console.log('3. Optimize Prisma queries with select clauses');
    console.log('4. Configure connection pooling');
    console.log('5. Avoid redundant token verifications');
    console.log('=' .repeat(60));

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      totalIssues: this.issues.length,
      byType: Object.entries(byType).map(([type, issues]) => ({
        type,
        count: issues.length,
        issues: issues.map(i => ({
          file: i.file.replace('/workspace/', ''),
          line: i.line,
          severity: i.severity,
          description: i.description
        }))
      })),
      recommendations: [
        'Replace sync bcrypt operations with async',
        'Implement proper JWT token caching',
        'Optimize Prisma queries with select clauses',
        'Configure connection pooling',
        'Avoid redundant token verifications'
      ]
    };

    const fs = require('fs');
    const path = require('path');
    const resultsDir = path.join(process.cwd(), 'results');
    
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(resultsDir, 'auth-performance-analysis.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n💾 Detailed analysis saved to: results/auth-performance-analysis.json');
  }
}

// Run analysis
const analyzer = new AuthPerformanceAnalyzer();
analyzer.analyze().catch(console.error);