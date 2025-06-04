#!/usr/bin/env node

/**
 * Auth Performance Benchmark Script
 * Measures current performance of authentication endpoints
 * Target: < 1s response time for all auth operations
 */

import { performance } from 'perf_hooks';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Test credentials (using test data from seed)
const TEST_CREDENTIALS = {
  login: 'admin',
  password: 'admin'
};

const BENCHMARK_CONFIG = {
  iterations: 3,
  warmupRuns: 1,
  timeout: 5000,
  target: 1000, // 1 second target
  delayBetweenRequests: 15000 // 15 seconds to avoid rate limiting (auth has strict limits)
};

class AuthBenchmark {
  constructor() {
    this.results = {
      login: [],
      verify: [],
      logout: []
    };
    this.sessionToken = null;
  }

  async measureEndpoint(name, fn) {
    const times = [];
    
    // Warmup runs
    for (let i = 0; i < BENCHMARK_CONFIG.warmupRuns; i++) {
      try {
        await fn();
      } catch (error) {
        console.warn(`Warmup ${i + 1} failed for ${name}:`, error.message);
      }
    }

    // Actual benchmark runs
    for (let i = 0; i < BENCHMARK_CONFIG.iterations; i++) {
      const start = performance.now();
      try {
        await fn();
        const end = performance.now();
        const duration = end - start;
        times.push(duration);
        
        process.stdout.write(`${name} run ${i + 1}/${BENCHMARK_CONFIG.iterations}: ${duration.toFixed(2)}ms\r`);
        
        // Add delay between requests to avoid rate limiting
        if (i < BENCHMARK_CONFIG.iterations - 1) {
          await new Promise(resolve => setTimeout(resolve, BENCHMARK_CONFIG.delayBetweenRequests));
        }
      } catch (error) {
        console.error(`\n${name} run ${i + 1} failed:`, error.message);
        times.push(BENCHMARK_CONFIG.timeout); // Count failures as timeout
        
        // Still add delay after failures
        if (i < BENCHMARK_CONFIG.iterations - 1) {
          await new Promise(resolve => setTimeout(resolve, BENCHMARK_CONFIG.delayBetweenRequests));
        }
      }
    }

    console.log(`\n${name} completed`);
    return times;
  }

  async benchmarkLogin() {
    console.log('\n📊 Benchmarking Login Endpoint...');
    
    return await this.measureEndpoint('Login', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(TEST_CREDENTIALS),
        signal: AbortSignal.timeout(BENCHMARK_CONFIG.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Extract session token for subsequent tests
      const cookies = response.headers.get('set-cookie');
      if (cookies) {
        const tokenMatch = cookies.match(/auth_token=([^;]+)/);
        if (tokenMatch) {
          this.sessionToken = tokenMatch[1];
        }
      }

      return data;
    });
  }

  async benchmarkVerify() {
    if (!this.sessionToken) {
      console.log('⚠️  Skipping verify benchmark - no session token available');
      return [];
    }

    console.log('\n📊 Benchmarking Token Verification...');
    
    return await this.measureEndpoint('Verify', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Cookie': `auth_token=${this.sessionToken}`,
        },
        signal: AbortSignal.timeout(BENCHMARK_CONFIG.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    });
  }

  async benchmarkLogout() {
    if (!this.sessionToken) {
      console.log('⚠️  Skipping logout benchmark - no session token available');
      return [];
    }

    console.log('\n📊 Benchmarking Logout Endpoint...');
    
    return await this.measureEndpoint('Logout', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Cookie': `auth_token=${this.sessionToken}`,
        },
        signal: AbortSignal.timeout(BENCHMARK_CONFIG.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    });
  }

  calculateStats(times) {
    if (times.length === 0) return null;

    const sorted = [...times].sort((a, b) => a - b);
    const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      avg: avg.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      median: median.toFixed(2),
      p95: p95.toFixed(2),
      p99: p99.toFixed(2),
      target: BENCHMARK_CONFIG.target,
      passesTarget: avg < BENCHMARK_CONFIG.target
    };
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📈 AUTH PERFORMANCE BENCHMARK REPORT');
    console.log('='.repeat(60));
    console.log(`Target: < ${BENCHMARK_CONFIG.target}ms`);
    console.log(`Iterations: ${BENCHMARK_CONFIG.iterations} (after ${BENCHMARK_CONFIG.warmupRuns} warmup runs)`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('');

    const endpoints = ['login', 'verify', 'logout'];
    let totalIssues = 0;

    endpoints.forEach(endpoint => {
      const times = this.results[endpoint];
      const stats = this.calculateStats(times);

      if (!stats) {
        console.log(`❌ ${endpoint.toUpperCase()}: No data available`);
        totalIssues++;
        return;
      }

      const status = stats.passesTarget ? '✅' : '🚨';
      if (!stats.passesTarget) totalIssues++;

      console.log(`${status} ${endpoint.toUpperCase()}:`);
      console.log(`   Average: ${stats.avg}ms`);
      console.log(`   Median:  ${stats.median}ms`);
      console.log(`   Min/Max: ${stats.min}ms / ${stats.max}ms`);
      console.log(`   P95/P99: ${stats.p95}ms / ${stats.p99}ms`);
      console.log('');
    });

    console.log('='.repeat(60));
    if (totalIssues === 0) {
      console.log('🎉 ALL ENDPOINTS MEET PERFORMANCE TARGET!');
    } else {
      console.log(`⚠️  ${totalIssues} ENDPOINT(S) NEED OPTIMIZATION`);
      console.log('\nRecommended optimizations:');
      
      endpoints.forEach(endpoint => {
        const stats = this.calculateStats(this.results[endpoint]);
        if (stats && !stats.passesTarget) {
          console.log(`- ${endpoint}: ${stats.avg}ms avg (target: ${BENCHMARK_CONFIG.target}ms)`);
        }
      });
    }
    console.log('='.repeat(60));

    return {
      timestamp: new Date().toISOString(),
      target: BENCHMARK_CONFIG.target,
      results: endpoints.reduce((acc, endpoint) => {
        acc[endpoint] = this.calculateStats(this.results[endpoint]);
        return acc;
      }, {}),
      summary: {
        totalEndpoints: endpoints.length,
        passingEndpoints: endpoints.filter(endpoint => {
          const stats = this.calculateStats(this.results[endpoint]);
          return stats && stats.passesTarget;
        }).length,
        totalIssues
      }
    };
  }

  async run() {
    console.log('🚀 Starting Auth Performance Benchmark...');
    console.log(`Target: < ${BENCHMARK_CONFIG.target}ms per endpoint`);
    console.log(`Server: ${BASE_URL}`);

    try {
      // Test server availability
      const healthCheck = await fetch(`${BASE_URL}`, { signal: AbortSignal.timeout(2000) }).catch(() => null);
      if (!healthCheck) {
        console.error('❌ Server not reachable. Make sure the development server is running.');
        console.log('Run: npm run dev');
        process.exit(1);
      }
      
      // Accept any response (even 500) as long as server is responding
      console.log(`✅ Server responding with status ${healthCheck.status}`);

      // Run benchmarks
      this.results.login = await this.benchmarkLogin();
      this.results.verify = await this.benchmarkVerify();
      this.results.logout = await this.benchmarkLogout();

      // Generate and save report
      const report = this.generateReport();
      
      // Save detailed results to file
      const fs = await import('fs');
      const path = await import('path');
      const resultsDir = path.join(process.cwd(), 'results');
      
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }
      
      const resultsFile = path.join(resultsDir, `auth-benchmark-${Date.now()}.json`);
      fs.writeFileSync(resultsFile, JSON.stringify({
        config: BENCHMARK_CONFIG,
        rawResults: this.results,
        report
      }, null, 2));

      console.log(`\n💾 Detailed results saved to: ${resultsFile}`);

    } catch (error) {
      console.error('❌ Benchmark failed:', error.message);
      process.exit(1);
    }
  }
}

// Run benchmark if script is executed directly
const benchmark = new AuthBenchmark();
benchmark.run().catch(console.error);