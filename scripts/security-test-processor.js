/**
 * Security Test Results Processor
 * Analyzes security test results and generates security insights
 */

const fs = require('fs');
const path = require('path');

class SecurityTestProcessor {
  constructor() {
    this.securityMetrics = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      securityCoverage: 0,
      vulnerabilitiesFound: [],
      securityIssues: [],
      recommendations: []
    };
  }

  process(testResults) {
    try {
      this.analyzeTestResults(testResults);
      this.generateSecurityReport();
      this.createSecurityBadge();
      
      console.log('🔒 Security test analysis completed');
      console.log(`📊 ${this.securityMetrics.passedTests}/${this.securityMetrics.totalTests} security tests passed`);
      
      if (this.securityMetrics.failedTests > 0) {
        console.warn(`⚠️ ${this.securityMetrics.failedTests} security tests failed`);
      }
      
      if (this.securityMetrics.vulnerabilitiesFound.length > 0) {
        console.error(`🚨 ${this.securityMetrics.vulnerabilitiesFound.length} potential vulnerabilities found`);
      }
      
      return testResults;
    } catch (error) {
      console.error('Error processing security test results:', error);
      return testResults;
    }
  }

  analyzeTestResults(results) {
    this.securityMetrics.totalTests = results.numTotalTests || 0;
    this.securityMetrics.passedTests = results.numPassedTests || 0;
    this.securityMetrics.failedTests = results.numFailedTests || 0;
    this.securityMetrics.skippedTests = results.numPendingTests || 0;

    // Analyze test suites for security-specific patterns
    if (results.testResults) {
      results.testResults.forEach(testFile => {
        this.analyzeTestFile(testFile);
      });
    }

    // Calculate security coverage
    this.calculateSecurityCoverage(results);
    
    // Generate recommendations based on results
    this.generateRecommendations();
  }

  analyzeTestFile(testFile) {
    const fileName = path.basename(testFile.testFilePath);
    
    // Identify security test categories
    const securityCategories = {
      authentication: /auth.*security|login.*security|session.*security/i,
      authorization: /authorization|rbac|permission/i,
      injection: /injection|sql.*security|xss/i,
      validation: /validation|sanitiz|input.*security/i,
      encryption: /encrypt|crypto|hash/i,
      session: /session|token|jwt/i
    };

    Object.entries(securityCategories).forEach(([category, pattern]) => {
      if (pattern.test(fileName) || pattern.test(testFile.testFilePath)) {
        this.analyzeSecurityCategory(testFile, category);
      }
    });

    // Check for failed security tests
    if (testFile.testResults) {
      testFile.testResults.forEach(test => {
        if (test.status === 'failed') {
          this.securityMetrics.vulnerabilitiesFound.push({
            test: test.title,
            file: fileName,
            category: this.identifySecurityCategory(test.title),
            severity: this.assessSeverity(test.title),
            message: test.failureMessages?.[0] || 'No failure message'
          });
        }
      });
    }
  }

  analyzeSecurityCategory(testFile, category) {
    const categoryMetrics = {
      category,
      file: path.basename(testFile.testFilePath),
      totalTests: testFile.numPassingTests + testFile.numFailingTests + testFile.numPendingTests,
      passed: testFile.numPassingTests,
      failed: testFile.numFailingTests,
      coverage: testFile.coverage ? this.extractCoverageMetrics(testFile.coverage) : null
    };

    // Store category-specific analysis
    if (!this.securityMetrics.categoryAnalysis) {
      this.securityMetrics.categoryAnalysis = {};
    }
    
    if (!this.securityMetrics.categoryAnalysis[category]) {
      this.securityMetrics.categoryAnalysis[category] = [];
    }
    
    this.securityMetrics.categoryAnalysis[category].push(categoryMetrics);
  }

  identifySecurityCategory(testTitle) {
    const categories = {
      'Authentication': /login|auth|password|credential/i,
      'Authorization': /permission|role|access|rbac/i,
      'Injection': /injection|sql|xss|script/i,
      'Validation': /validation|sanitiz|input|output/i,
      'Session': /session|token|jwt|cookie/i,
      'Encryption': /encrypt|hash|crypto|secure/i
    };

    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(testTitle)) {
        return category;
      }
    }
    
    return 'General Security';
  }

  assessSeverity(testTitle) {
    const criticalPatterns = /injection|xss|authentication|authorization|privilege/i;
    const highPatterns = /session|token|password|credential/i;
    const mediumPatterns = /validation|sanitiz|input/i;

    if (criticalPatterns.test(testTitle)) return 'Critical';
    if (highPatterns.test(testTitle)) return 'High';
    if (mediumPatterns.test(testTitle)) return 'Medium';
    return 'Low';
  }

  calculateSecurityCoverage(results) {
    if (results.coverageMap) {
      // Calculate coverage for security-critical files
      const securityFiles = [
        'authService',
        'authorization',
        'auth.ts',
        'middleware',
        'validation',
        'prisma'
      ];

      let totalSecurityLines = 0;
      let coveredSecurityLines = 0;

      Object.entries(results.coverageMap).forEach(([filePath, coverage]) => {
        if (securityFiles.some(pattern => filePath.includes(pattern))) {
          if (coverage.s) { // Statement coverage
            const statements = Object.values(coverage.s);
            totalSecurityLines += statements.length;
            coveredSecurityLines += statements.filter(count => count > 0).length;
          }
        }
      });

      this.securityMetrics.securityCoverage = totalSecurityLines > 0 
        ? Math.round((coveredSecurityLines / totalSecurityLines) * 100)
        : 0;
    }
  }

  extractCoverageMetrics(coverage) {
    return {
      statements: coverage.statements?.pct || 0,
      branches: coverage.branches?.pct || 0,
      functions: coverage.functions?.pct || 0,
      lines: coverage.lines?.pct || 0
    };
  }

  generateRecommendations() {
    const recommendations = [];

    // Coverage-based recommendations
    if (this.securityMetrics.securityCoverage < 80) {
      recommendations.push({
        priority: 'High',
        category: 'Test Coverage',
        message: `Security test coverage is ${this.securityMetrics.securityCoverage}%. Aim for at least 80% coverage of security-critical code.`
      });
    }

    // Failed test recommendations
    if (this.securityMetrics.failedTests > 0) {
      recommendations.push({
        priority: 'Critical',
        category: 'Failed Tests',
        message: `${this.securityMetrics.failedTests} security tests are failing. Address these immediately.`
      });
    }

    // Vulnerability-based recommendations
    const criticalVulns = this.securityMetrics.vulnerabilitiesFound.filter(v => v.severity === 'Critical');
    if (criticalVulns.length > 0) {
      recommendations.push({
        priority: 'Critical',
        category: 'Vulnerabilities',
        message: `${criticalVulns.length} critical security vulnerabilities detected. Immediate action required.`
      });
    }

    // Category-specific recommendations
    if (this.securityMetrics.categoryAnalysis) {
      Object.entries(this.securityMetrics.categoryAnalysis).forEach(([category, metrics]) => {
        const totalFailed = metrics.reduce((sum, m) => sum + m.failed, 0);
        if (totalFailed > 0) {
          recommendations.push({
            priority: 'High',
            category: `${category} Security`,
            message: `${totalFailed} ${category.toLowerCase()} security tests failed. Review and strengthen ${category.toLowerCase()} security measures.`
          });
        }
      });
    }

    // General security recommendations
    recommendations.push(
      {
        priority: 'Medium',
        category: 'Continuous Security',
        message: 'Schedule regular security test runs as part of CI/CD pipeline.'
      },
      {
        priority: 'Medium',
        category: 'Security Monitoring',
        message: 'Implement automated security scanning and monitoring in production.'
      },
      {
        priority: 'Low',
        category: 'Security Training',
        message: 'Provide security awareness training for development team.'
      }
    );

    this.securityMetrics.recommendations = recommendations;
  }

  generateSecurityReport() {
    const reportDir = 'security-test-results';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, 'security-analysis.json');
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.securityMetrics.totalTests,
        passedTests: this.securityMetrics.passedTests,
        failedTests: this.securityMetrics.failedTests,
        successRate: this.securityMetrics.totalTests > 0 
          ? Math.round((this.securityMetrics.passedTests / this.securityMetrics.totalTests) * 100)
          : 0,
        securityCoverage: this.securityMetrics.securityCoverage
      },
      vulnerabilities: this.securityMetrics.vulnerabilitiesFound,
      recommendations: this.securityMetrics.recommendations,
      categoryAnalysis: this.securityMetrics.categoryAnalysis || {},
      securityScore: this.calculateSecurityScore()
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Security analysis report saved: ${reportPath}`);
  }

  calculateSecurityScore() {
    let score = 100;

    // Deduct points for failed tests
    score -= this.securityMetrics.failedTests * 10;

    // Deduct points for low coverage
    if (this.securityMetrics.securityCoverage < 80) {
      score -= (80 - this.securityMetrics.securityCoverage);
    }

    // Deduct points for vulnerabilities
    this.securityMetrics.vulnerabilitiesFound.forEach(vuln => {
      switch (vuln.severity) {
        case 'Critical':
          score -= 20;
          break;
        case 'High':
          score -= 10;
          break;
        case 'Medium':
          score -= 5;
          break;
        default:
          score -= 2;
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  createSecurityBadge() {
    const score = this.calculateSecurityScore();
    let color = 'red';
    let label = 'Poor';

    if (score >= 90) {
      color = 'brightgreen';
      label = 'Excellent';
    } else if (score >= 80) {
      color = 'green';
      label = 'Good';
    } else if (score >= 70) {
      color = 'yellow';
      label = 'Fair';
    } else if (score >= 60) {
      color = 'orange';
      label = 'Needs Improvement';
    }

    const badgeData = {
      schemaVersion: 1,
      label: 'Security Score',
      message: `${score}/100 (${label})`,
      color: color
    };

    const badgePath = path.join('security-test-results', 'security-badge.json');
    fs.writeFileSync(badgePath, JSON.stringify(badgeData, null, 2));
    
    console.log(`🏆 Security score: ${score}/100 (${label})`);
  }
}

// Export the processor function for Jest
module.exports = (testResults) => {
  const processor = new SecurityTestProcessor();
  return processor.process(testResults);
};