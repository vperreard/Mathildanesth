import { launch, Browser, Page } from 'puppeteer';
import { testConfig } from '../config/test-config';
import { createTestUser, cleanupTestData } from '../helpers/test-helpers';
import { loginAs } from '../helpers/auth-helpers';

describe('Load Testing - 50+ Concurrent Users', () => {
  let browser: Browser;
  const testUsers: Array<{ email: string; password: string; role: string }> = [];
  const concurrentUsers = 50;
  const baseEmail = 'loadtest';

  beforeAll(async () => {
    browser = await launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    // Create test users
    console.log(`Creating ${concurrentUsers} test users...`);
    const userCreationPromises = [];
    
    for (let i = 0; i < concurrentUsers; i++) {
      const user = {
        email: `${baseEmail}${i}@test.com`,
        password: 'Test123!',
        role: i % 10 === 0 ? 'ADMIN' : 'PRACTITIONER' // 10% admins
      };
      testUsers.push(user);
      userCreationPromises.push(createTestUser(user));
    }

    await Promise.all(userCreationPromises);
    console.log('Test users created successfully');
  });

  afterAll(async () => {
    console.log('Cleaning up test data...');
    await cleanupTestData(testUsers.map(u => u.email));
    await browser.close();
  });

  test('Concurrent login stress test', async () => {
    const startTime = Date.now();
    const contexts = [];
    const pages: Page[] = [];
    const loginTimes: number[] = [];

    // Create browser contexts and pages
    for (let i = 0; i < concurrentUsers; i++) {
      const context = await browser.createIncognitoBrowserContext();
      contexts.push(context);
      const page = await context.newPage();
      await page.setViewport({ width: 1280, height: 720 });
      pages.push(page);
    }

    console.log(`Starting concurrent login test with ${concurrentUsers} users...`);

    // Perform concurrent logins
    const loginPromises = pages.map(async (page, index) => {
      const loginStart = Date.now();
      try {
        await page.goto(`${testConfig.baseUrl}/auth/login`);
        await page.waitForSelector('[data-testid="email-input"]', { timeout: 30000 });
        await page.type('[data-testid="email-input"]', testUsers[index].email);
        await page.type('[data-testid="password-input"]', testUsers[index].password);
        await page.click('[data-testid="login-button"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
        
        const loginEnd = Date.now();
        const loginTime = loginEnd - loginStart;
        loginTimes.push(loginTime);
        
        return { success: true, time: loginTime, index };
      } catch (error) {
        return { success: false, error: error.message, index };
      }
    });

    const results = await Promise.all(loginPromises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Analyze results
    const successfulLogins = results.filter(r => r.success).length;
    const failedLogins = results.filter(r => !r.success).length;
    const avgLoginTime = loginTimes.reduce((a, b) => a + b, 0) / loginTimes.length;
    const maxLoginTime = Math.max(...loginTimes);
    const minLoginTime = Math.min(...loginTimes);

    console.log('Load Test Results:');
    console.log(`- Total time: ${totalTime}ms`);
    console.log(`- Successful logins: ${successfulLogins}/${concurrentUsers}`);
    console.log(`- Failed logins: ${failedLogins}`);
    console.log(`- Average login time: ${avgLoginTime.toFixed(2)}ms`);
    console.log(`- Min login time: ${minLoginTime}ms`);
    console.log(`- Max login time: ${maxLoginTime}ms`);

    // Performance assertions
    expect(successfulLogins).toBeGreaterThanOrEqual(concurrentUsers * 0.95); // 95% success rate
    expect(avgLoginTime).toBeLessThan(5000); // Average login under 5 seconds
    expect(maxLoginTime).toBeLessThan(10000); // No login takes more than 10 seconds

    // Cleanup
    await Promise.all(contexts.map(ctx => ctx.close()));
  });

  test('Concurrent calendar access test', async () => {
    const contexts = [];
    const pages: Page[] = [];
    const loadTimes: number[] = [];

    // Create browser contexts and login
    for (let i = 0; i < Math.min(20, concurrentUsers); i++) { // Test with 20 users for calendar
      const context = await browser.createIncognitoBrowserContext();
      contexts.push(context);
      const page = await context.newPage();
      await page.setViewport({ width: 1280, height: 720 });
      await loginAs(page, testUsers[i]);
      pages.push(page);
    }

    console.log('Starting concurrent calendar access test...');

    // Concurrent calendar access
    const calendarPromises = pages.map(async (page, index) => {
      const startTime = Date.now();
      try {
        await page.goto(`${testConfig.baseUrl}/calendar`);
        await page.waitForSelector('[data-testid="calendar-container"]', { timeout: 30000 });
        await page.waitForLoadState('networkidle');
        
        // Simulate user interactions
        await page.click('[data-testid="next-month-button"]');
        await page.waitForTimeout(500);
        await page.click('[data-testid="previous-month-button"]');
        await page.waitForTimeout(500);
        
        const endTime = Date.now();
        const loadTime = endTime - startTime;
        loadTimes.push(loadTime);
        
        return { success: true, time: loadTime };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    const results = await Promise.all(calendarPromises);
    
    // Analyze results
    const successfulLoads = results.filter(r => r.success).length;
    const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;

    console.log('Calendar Load Test Results:');
    console.log(`- Successful loads: ${successfulLoads}/20`);
    console.log(`- Average load time: ${avgLoadTime.toFixed(2)}ms`);

    expect(successfulLoads).toBeGreaterThanOrEqual(19); // 95% success rate
    expect(avgLoadTime).toBeLessThan(3000); // Average load under 3 seconds

    // Cleanup
    await Promise.all(contexts.map(ctx => ctx.close()));
  });

  test('Concurrent API requests stress test', async () => {
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    
    // Login as admin
    await loginAs(page, testUsers.find(u => u.role === 'ADMIN')!);
    
    // Get auth token from cookies
    const cookies = await page.cookies();
    const authToken = cookies.find(c => c.name === 'auth-token')?.value;
    
    console.log('Starting concurrent API requests test...');
    
    // Simulate 100 concurrent API requests
    const apiRequests = [];
    const requestCount = 100;
    const requestTimes: number[] = [];
    
    for (let i = 0; i < requestCount; i++) {
      const requestPromise = page.evaluate(async (token) => {
        const startTime = performance.now();
        try {
          const response = await fetch('/api/users/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          const endTime = performance.now();
          return {
            success: response.ok,
            status: response.status,
            time: endTime - startTime
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      }, authToken);
      
      apiRequests.push(requestPromise);
    }
    
    const results = await Promise.all(apiRequests);
    
    // Analyze results
    const successfulRequests = results.filter(r => r.success).length;
    const avgRequestTime = results
      .filter(r => r.time)
      .reduce((sum, r) => sum + r.time!, 0) / successfulRequests;
    
    console.log('API Stress Test Results:');
    console.log(`- Successful requests: ${successfulRequests}/${requestCount}`);
    console.log(`- Average request time: ${avgRequestTime.toFixed(2)}ms`);
    
    expect(successfulRequests).toBeGreaterThanOrEqual(requestCount * 0.99); // 99% success rate
    expect(avgRequestTime).toBeLessThan(100); // Average request under 100ms
    
    await context.close();
  });

  test('Memory leak detection during extended usage', async () => {
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    
    await loginAs(page, testUsers[0]);
    
    console.log('Starting memory leak detection test...');
    
    const memorySnapshots: number[] = [];
    const duration = 60000; // 1 minute test
    const interval = 5000; // Check every 5 seconds
    const startTime = Date.now();
    
    // Initial memory snapshot
    let metrics = await page.metrics();
    memorySnapshots.push(metrics.JSHeapUsedSize);
    
    // Simulate user activity
    const activityInterval = setInterval(async () => {
      try {
        // Navigate between pages
        await page.goto(`${testConfig.baseUrl}/calendar`);
        await page.waitForSelector('[data-testid="calendar-container"]');
        
        await page.goto(`${testConfig.baseUrl}/leaves`);
        await page.waitForSelector('[data-testid="leaves-container"]');
        
        await page.goto(`${testConfig.baseUrl}/planning`);
        await page.waitForSelector('[data-testid="planning-container"]');
      } catch (error) {
        console.error('Activity error:', error);
      }
    }, 10000);
    
    // Memory monitoring
    const memoryInterval = setInterval(async () => {
      metrics = await page.metrics();
      memorySnapshots.push(metrics.JSHeapUsedSize);
    }, interval);
    
    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, duration));
    
    // Stop intervals
    clearInterval(activityInterval);
    clearInterval(memoryInterval);
    
    // Analyze memory usage
    const initialMemory = memorySnapshots[0];
    const finalMemory = memorySnapshots[memorySnapshots.length - 1];
    const memoryIncrease = ((finalMemory - initialMemory) / initialMemory) * 100;
    
    console.log('Memory Leak Test Results:');
    console.log(`- Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- Final memory: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- Memory increase: ${memoryIncrease.toFixed(2)}%`);
    
    // Check for memory leaks
    expect(memoryIncrease).toBeLessThan(50); // Memory should not increase by more than 50%
    
    await context.close();
  });
});