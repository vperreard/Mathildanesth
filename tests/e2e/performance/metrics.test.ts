import { launch, Browser, Page } from 'puppeteer';
import { testConfig } from '../config/test-config';
import { createTestUser, cleanupTestData } from '../helpers/test-helpers';
import { loginAs } from '../helpers/auth-helpers';
import * as fs from 'fs/promises';
import * as path from 'path';

interface PerformanceMetrics {
  FCP: number; // First Contentful Paint
  LCP: number; // Largest Contentful Paint
  TTI: number; // Time to Interactive
  TBT: number; // Total Blocking Time
  CLS: number; // Cumulative Layout Shift
  TTFB: number; // Time to First Byte
  domContentLoaded: number;
  loadComplete: number;
  jsHeapUsed: number;
  jsHeapTotal: number;
}

describe('Performance Metrics Tests', () => {
  let browser: Browser;
  let page: Page;
  const performanceResults: Record<string, PerformanceMetrics[]> = {};
  
  const testUser = {
    email: 'perf@test.com',
    password: 'Test123!',
    role: 'PRACTITIONER'
  };

  beforeAll(async () => {
    browser = await launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });
    
    await createTestUser(testUser);
  });

  afterAll(async () => {
    // Save performance results to file
    const resultsPath = path.join(process.cwd(), 'performance-metrics-results.json');
    await fs.writeFile(resultsPath, JSON.stringify(performanceResults, null, 2));
    console.log(`Performance results saved to: ${resultsPath}`);
    
    // Generate performance report
    generatePerformanceReport(performanceResults);
    
    await cleanupTestData([testUser.email]);
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Enable performance metrics collection
    await page.evaluateOnNewDocument(() => {
      window.performanceMetrics = {
        FCP: 0,
        LCP: 0,
        TTI: 0,
        TBT: 0,
        CLS: 0,
        layoutShifts: []
      };

      // Observe FCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            window.performanceMetrics.FCP = entry.startTime;
          }
        });
      }).observe({ entryTypes: ['paint'] });

      // Observe LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        window.performanceMetrics.LCP = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // Observe layout shifts for CLS
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            window.performanceMetrics.CLS += entry.value;
          }
        });
      }).observe({ entryTypes: ['layout-shift'] });

      // Calculate TTI and TBT
      let ttiResolver: ((value: number) => void) | null = null;
      window.performanceMetrics.ttiPromise = new Promise((resolve) => {
        ttiResolver = resolve;
      });

      // Simple TTI detection (5 seconds of no long tasks)
      let lastLongTask = 0;
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.duration > 50) {
            lastLongTask = entry.startTime + entry.duration;
            window.performanceMetrics.TBT += entry.duration - 50;
          }
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });

      // Check for TTI every second
      const checkTTI = setInterval(() => {
        if (performance.now() - lastLongTask > 5000) {
          window.performanceMetrics.TTI = lastLongTask;
          if (ttiResolver) {
            ttiResolver(lastLongTask);
          }
          clearInterval(checkTTI);
          longTaskObserver.disconnect();
        }
      }, 1000);
    });
  });

  afterEach(async () => {
    await page.close();
  });

  async function measurePageMetrics(pageName: string, url: string, setupFn?: () => Promise<void>): Promise<PerformanceMetrics> {
    if (setupFn) {
      await setupFn();
    }

    const startTime = Date.now();
    
    // Navigate and wait for load
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    // Wait for TTI or timeout
    await page.evaluate(() => {
      return Promise.race([
        window.performanceMetrics.ttiPromise,
        new Promise(resolve => setTimeout(resolve, 30000))
      ]);
    });

    // Get navigation timing
    const navigationTiming = await page.evaluate(() => {
      const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        TTFB: timing.responseStart - timing.fetchStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.fetchStart,
        loadComplete: timing.loadEventEnd - timing.fetchStart
      };
    });

    // Get custom metrics
    const customMetrics = await page.evaluate(() => window.performanceMetrics);
    
    // Get memory metrics
    const jsMetrics = await page.metrics();

    const metrics: PerformanceMetrics = {
      FCP: customMetrics.FCP,
      LCP: customMetrics.LCP,
      TTI: customMetrics.TTI || (Date.now() - startTime),
      TBT: customMetrics.TBT,
      CLS: customMetrics.CLS,
      TTFB: navigationTiming.TTFB,
      domContentLoaded: navigationTiming.domContentLoaded,
      loadComplete: navigationTiming.loadComplete,
      jsHeapUsed: jsMetrics.JSHeapUsedSize / 1024 / 1024, // Convert to MB
      jsHeapTotal: jsMetrics.JSHeapTotalSize / 1024 / 1024
    };

    // Store results
    if (!performanceResults[pageName]) {
      performanceResults[pageName] = [];
    }
    performanceResults[pageName].push(metrics);

    return metrics;
  }

  function assertPerformanceThresholds(metrics: PerformanceMetrics, thresholds: Partial<PerformanceMetrics>) {
    if (thresholds.FCP !== undefined) {
      expect(metrics.FCP).toBeLessThan(thresholds.FCP);
    }
    if (thresholds.LCP !== undefined) {
      expect(metrics.LCP).toBeLessThan(thresholds.LCP);
    }
    if (thresholds.TTI !== undefined) {
      expect(metrics.TTI).toBeLessThan(thresholds.TTI);
    }
    if (thresholds.TBT !== undefined) {
      expect(metrics.TBT).toBeLessThan(thresholds.TBT);
    }
    if (thresholds.CLS !== undefined) {
      expect(metrics.CLS).toBeLessThan(thresholds.CLS);
    }
    if (thresholds.TTFB !== undefined) {
      expect(metrics.TTFB).toBeLessThan(thresholds.TTFB);
    }
  }

  test('Login page performance', async () => {
    const metrics = await measurePageMetrics('login', `${testConfig.baseUrl}/auth/login`);
    
    console.log('Login Page Metrics:', {
      FCP: `${metrics.FCP.toFixed(2)}ms`,
      LCP: `${metrics.LCP.toFixed(2)}ms`,
      TTI: `${metrics.TTI.toFixed(2)}ms`,
      TBT: `${metrics.TBT.toFixed(2)}ms`,
      CLS: metrics.CLS.toFixed(4),
      TTFB: `${metrics.TTFB.toFixed(2)}ms`
    });

    // Performance thresholds for login page
    assertPerformanceThresholds(metrics, {
      FCP: 1500, // First Contentful Paint < 1.5s
      LCP: 2500, // Largest Contentful Paint < 2.5s
      TTI: 3500, // Time to Interactive < 3.5s
      TBT: 300,  // Total Blocking Time < 300ms
      CLS: 0.1,  // Cumulative Layout Shift < 0.1
      TTFB: 600  // Time to First Byte < 600ms
    });
  });

  test('Dashboard performance (authenticated)', async () => {
    const metrics = await measurePageMetrics(
      'dashboard',
      `${testConfig.baseUrl}/`,
      async () => {
        await loginAs(page, testUser);
      }
    );
    
    console.log('Dashboard Metrics:', {
      FCP: `${metrics.FCP.toFixed(2)}ms`,
      LCP: `${metrics.LCP.toFixed(2)}ms`,
      TTI: `${metrics.TTI.toFixed(2)}ms`,
      Memory: `${metrics.jsHeapUsed.toFixed(2)}MB / ${metrics.jsHeapTotal.toFixed(2)}MB`
    });

    assertPerformanceThresholds(metrics, {
      FCP: 2000,
      LCP: 3000,
      TTI: 5000,
      TBT: 500,
      CLS: 0.1
    });
  });

  test('Calendar page performance', async () => {
    const metrics = await measurePageMetrics(
      'calendar',
      `${testConfig.baseUrl}/calendar`,
      async () => {
        await loginAs(page, testUser);
      }
    );
    
    assertPerformanceThresholds(metrics, {
      FCP: 2500,
      LCP: 4000,
      TTI: 6000,
      TBT: 750,
      CLS: 0.25
    });
  });

  test('Planning page performance', async () => {
    const metrics = await measurePageMetrics(
      'planning',
      `${testConfig.baseUrl}/planning`,
      async () => {
        await loginAs(page, testUser);
      }
    );
    
    assertPerformanceThresholds(metrics, {
      FCP: 2500,
      LCP: 4000,
      TTI: 7000, // Planning page is complex
      TBT: 1000,
      CLS: 0.25
    });
  });

  test('Leaves page performance', async () => {
    const metrics = await measurePageMetrics(
      'leaves',
      `${testConfig.baseUrl}/leaves`,
      async () => {
        await loginAs(page, testUser);
      }
    );
    
    assertPerformanceThresholds(metrics, {
      FCP: 2000,
      LCP: 3500,
      TTI: 5000,
      TBT: 500,
      CLS: 0.1
    });
  });

  test('Performance under heavy DOM manipulation', async () => {
    await loginAs(page, testUser);
    await page.goto(`${testConfig.baseUrl}/planning`);
    
    // Start performance measurement
    await page.evaluate(() => {
      window.manipulationMetrics = {
        startTime: performance.now(),
        operations: 0,
        totalTime: 0
      };
    });

    // Perform heavy DOM manipulations
    for (let i = 0; i < 10; i++) {
      const operationTime = await page.evaluate(() => {
        const start = performance.now();
        
        // Simulate adding/removing multiple DOM elements
        const container = document.querySelector('[data-testid="planning-grid"]');
        if (container) {
          // Add 50 elements
          for (let j = 0; j < 50; j++) {
            const div = document.createElement('div');
            div.className = 'test-element';
            div.textContent = `Element ${j}`;
            container.appendChild(div);
          }
          
          // Remove them
          const elements = container.querySelectorAll('.test-element');
          elements.forEach(el => el.remove());
        }
        
        const end = performance.now();
        window.manipulationMetrics.operations++;
        window.manipulationMetrics.totalTime += (end - start);
        return end - start;
      });
      
      // Each operation should be fast
      expect(operationTime).toBeLessThan(100);
    }

    const manipulationStats = await page.evaluate(() => window.manipulationMetrics);
    const avgOperationTime = manipulationStats.totalTime / manipulationStats.operations;
    
    console.log('DOM Manipulation Performance:', {
      totalOperations: manipulationStats.operations,
      totalTime: `${manipulationStats.totalTime.toFixed(2)}ms`,
      averageTime: `${avgOperationTime.toFixed(2)}ms`
    });
    
    expect(avgOperationTime).toBeLessThan(50);
  });

  test('JavaScript execution performance', async () => {
    await loginAs(page, testUser);
    
    const pages = [
      { name: 'dashboard', url: '/' },
      { name: 'calendar', url: '/calendar' },
      { name: 'planning', url: '/planning' }
    ];

    for (const pageInfo of pages) {
      await page.goto(`${testConfig.baseUrl}${pageInfo.url}`);
      await page.waitForLoadState('networkidle');

      // Measure JavaScript execution time
      const jsMetrics = await page.evaluate(() => {
        const measureFunction = (fn: Function, name: string) => {
          const start = performance.now();
          fn();
          const end = performance.now();
          return { name, time: end - start };
        };

        // Test various JavaScript operations
        const results = [];

        // Array operations
        results.push(measureFunction(() => {
          const arr = Array.from({ length: 10000 }, (_, i) => i);
          arr.filter(x => x % 2 === 0).map(x => x * 2).reduce((a, b) => a + b, 0);
        }, 'Array operations'));

        // DOM queries
        results.push(measureFunction(() => {
          for (let i = 0; i < 100; i++) {
            document.querySelectorAll('*').length;
          }
        }, 'DOM queries'));

        // Object operations
        results.push(measureFunction(() => {
          const obj: any = {};
          for (let i = 0; i < 1000; i++) {
            obj[`key${i}`] = { value: i, nested: { data: i * 2 } };
          }
          Object.keys(obj).forEach(key => {
            obj[key].processed = true;
          });
        }, 'Object operations'));

        return results;
      });

      console.log(`JavaScript Performance - ${pageInfo.name}:`, jsMetrics);
      
      // All operations should be reasonably fast
      jsMetrics.forEach(metric => {
        expect(metric.time).toBeLessThan(50);
      });
    }
  });

  function generatePerformanceReport(results: Record<string, PerformanceMetrics[]>) {
    console.log('\n=== PERFORMANCE REPORT ===\n');
    
    for (const [pageName, metrics] of Object.entries(results)) {
      if (metrics.length === 0) continue;
      
      // Calculate averages
      const avgMetrics = metrics.reduce((acc, m) => {
        Object.keys(m).forEach(key => {
          acc[key] = (acc[key] || 0) + m[key as keyof PerformanceMetrics];
        });
        return acc;
      }, {} as Record<string, number>);

      Object.keys(avgMetrics).forEach(key => {
        avgMetrics[key] /= metrics.length;
      });

      console.log(`📄 ${pageName.toUpperCase()}`);
      console.log(`  FCP: ${avgMetrics.FCP.toFixed(2)}ms`);
      console.log(`  LCP: ${avgMetrics.LCP.toFixed(2)}ms`);
      console.log(`  TTI: ${avgMetrics.TTI.toFixed(2)}ms`);
      console.log(`  TBT: ${avgMetrics.TBT.toFixed(2)}ms`);
      console.log(`  CLS: ${avgMetrics.CLS.toFixed(4)}`);
      console.log(`  TTFB: ${avgMetrics.TTFB.toFixed(2)}ms`);
      console.log(`  Memory: ${avgMetrics.jsHeapUsed.toFixed(2)}MB\n`);
    }
  }
});