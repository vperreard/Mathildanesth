const puppeteer = require('puppeteer');
const { defaultPuppeteerConfig, launchBrowserWithCleanup } = require('./setup');
const fs = require('fs');
const path = require('path');

describe('Tests E2E Puppeteer - Authentification Renforcée', () => {
    let browser;
    let page;
    let performanceMetrics = [];

    const logPerformance = (metric) => {
        performanceMetrics.push({
            ...metric,
            timestamp: Date.now(),
            test: expect.getState().currentTestName
        });
    };

    beforeAll(async () => {
        browser = await launchBrowserWithCleanup(puppeteer);
        
        // Create performance results directory
        const resultsDir = path.join(__dirname, '../../results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }
    });

    beforeEach(async () => {
        page = await browser.newPage();
        
        // Enable performance monitoring
        await page.setCacheEnabled(false);
        
        // Monitor console errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error('Browser console error:', msg.text());
            }
        });
        
        const startTime = Date.now();
        await page.goto('http://localhost:3001/auth/connexion', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        const loadTime = Date.now() - startTime;
        logPerformance({
            type: 'page-load',
            name: 'login-page-load',
            duration: loadTime,
            status: loadTime < 3000 ? 'PASS' : 'SLOW'
        });
    });

    afterEach(async () => {
        await page.close();
    });

    afterEach(async () => {
        // Save performance metrics for this test
        const testMetrics = performanceMetrics.filter(m => m.test === expect.getState().currentTestName);
        if (testMetrics.length > 0) {
            const resultsFile = path.join(__dirname, '../../results/puppeteer-performance.json');
            let allMetrics = [];
            
            if (fs.existsSync(resultsFile)) {
                try {
                    allMetrics = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
                } catch (error) {
                    console.warn('Could not read existing metrics file:', error.message);
                }
            }
            
            allMetrics.push(...testMetrics);
            fs.writeFileSync(resultsFile, JSON.stringify(allMetrics, null, 2));
        }
    });

    afterAll(async () => {
        // Generate performance report
        const reportPath = path.join(__dirname, '../../results/puppeteer-performance-report.md');
        const passedTests = performanceMetrics.filter(m => m.status === 'PASS').length;
        const slowTests = performanceMetrics.filter(m => m.status === 'SLOW').length;
        
        const report = `# Puppeteer Performance Report\n\nGenerated: ${new Date().toISOString()}\n\n## Summary\n- Total Metrics: ${performanceMetrics.length}\n- Passed: ${passedTests}\n- Slow: ${slowTests}\n- Success Rate: ${((passedTests / performanceMetrics.length) * 100).toFixed(1)}%`;
        
        fs.writeFileSync(reportPath, report);
        console.log(`Performance report saved to: ${reportPath}`);
        
        await browser.close();
    });

    test('affiche la page de connexion', async () => {
        const title = await page.$eval('h1', el => el.textContent);
        expect(title).toBe('Connexion');

        const emailInput = await page.$('[data-cy=email-input]');
        const passwordInput = await page.$('[data-cy=password-input]');
        const submitButton = await page.$('[data-cy=submit-button]');

        expect(emailInput).toBeTruthy();
        expect(passwordInput).toBeTruthy();
        expect(submitButton).toBeTruthy();
    });

    test('affiche une erreur pour des identifiants invalides', async () => {
        await page.type('[data-cy=email-input]', 'invalid@test.com');
        await page.type('[data-cy=password-input]', 'wrongpassword');
        await page.click('[data-cy=submit-button]');

        // Attendre que l'erreur apparaisse
        await page.waitForSelector('[data-cy=error-message]', { timeout: 10000 });
        
        const errorMessage = await page.$eval('[data-cy=error-message]', el => el.textContent);
        expect(errorMessage).toContain('Identifiants invalides');
    });

    test('permet la connexion avec des identifiants valides', async () => {
        await page.type('[data-cy=email-input]', 'admin');
        await page.type('[data-cy=password-input]', 'admin');
        await page.click('[data-cy=submit-button]');

        // Attendre la redirection
        await page.waitForNavigation({ timeout: 10000 });
        
        const url = page.url();
        expect(url).not.toContain('/auth/connexion');
    });
});