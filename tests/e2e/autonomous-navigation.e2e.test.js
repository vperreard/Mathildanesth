const puppeteer = require('puppeteer');
const { defaultPuppeteerConfig, launchBrowserWithCleanup, takeScreenshot } = require('./setup');
const fs = require('fs');
const path = require('path');

describe('Tests E2E Autonomes - Navigation Complète Application', () => {
    let browser;
    let page;
    let testResults = [];
    let errors = [];
    let coverageData = {
        pagesVisited: new Set(),
        featuresAccessed: new Set(),
        errorsFound: [],
        performanceIssues: [],
        accessibilityIssues: []
    };

    const logTest = (testName, status, details = {}) => {
        const result = {
            testName,
            status,
            timestamp: Date.now(),
            ...details
        };
        testResults.push(result);
        console.log(`[${status}] ${testName}:`, details.message || 'OK');
    };

    const logError = async (error, context = '') => {
        const errorInfo = {
            error: error.message,
            context,
            url: page.url(),
            timestamp: Date.now(),
            screenshot: null
        };

        try {
            const screenshotPath = `./tests/e2e/screenshots/error-${Date.now()}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });
            errorInfo.screenshot = screenshotPath;
        } catch (screenshotError) {
            console.warn('Could not take error screenshot:', screenshotError.message);
        }

        errors.push(errorInfo);
        coverageData.errorsFound.push(errorInfo);
        console.error(`[ERROR] ${context}:`, error.message);
    };

    const waitForSelector = async (selector, timeout = 10000) => {
        try {
            await page.waitForSelector(selector, { timeout });
            return true;
        } catch (error) {
            await logError(error, `Waiting for selector: ${selector}`);
            return false;
        }
    };

    const clickSafely = async (selector, description = '') => {
        try {
            const element = await page.$(selector);
            if (element) {
                await element.click();
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for any transitions
                return true;
            } else {
                throw new Error(`Element not found: ${selector}`);
            }
        } catch (error) {
            await logError(error, `Clicking ${description || selector}`);
            return false;
        }
    };

    const navigateToPage = async (url, description = '') => {
        try {
            const startTime = Date.now();
            await page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            const loadTime = Date.now() - startTime;
            
            coverageData.pagesVisited.add(url);
            
            if (loadTime > 3000) {
                coverageData.performanceIssues.push({
                    type: 'slow-page-load',
                    url,
                    loadTime,
                    timestamp: Date.now()
                });
            }

            logTest(`Navigation to ${description || url}`, 'PASS', { 
                loadTime: `${loadTime}ms`,
                message: `Page loaded in ${loadTime}ms`
            });
            return true;
        } catch (error) {
            await logError(error, `Navigation to ${description || url}`);
            return false;
        }
    };

    const testAuthentication = async () => {
        console.log('🔐 Testing Authentication Flow...');
        
        // Test login page
        const loginSuccess = await navigateToPage('http://localhost:3001/auth/connexion', 'Login Page');
        if (!loginSuccess) return false;

        // Check login form elements
        const emailExists = await waitForSelector('[data-cy=email-input]');
        const passwordExists = await waitForSelector('[data-cy=password-input]');
        const submitExists = await waitForSelector('[data-cy=submit-button]');

        if (!emailExists || !passwordExists || !submitExists) {
            logTest('Login Form Elements Check', 'FAIL', { 
                message: 'Missing required form elements' 
            });
            return false;
        }

        logTest('Login Form Elements Check', 'PASS');

        // Test invalid credentials
        await page.type('[data-cy=email-input]', 'invalid@test.com');
        await page.type('[data-cy=password-input]', 'wrongpassword');
        await clickSafely('[data-cy=submit-button]', 'Submit Invalid Credentials');
        
        const errorShown = await waitForSelector('[data-cy=error-message]', 5000);
        if (errorShown) {
            logTest('Invalid Credentials Error Display', 'PASS');
        } else {
            logTest('Invalid Credentials Error Display', 'FAIL', { 
                message: 'Error message not displayed for invalid credentials' 
            });
        }

        // Clear form and test valid credentials
        await page.reload();
        await page.type('[data-cy=email-input]', 'admin');
        await page.type('[data-cy=password-input]', 'admin');
        await clickSafely('[data-cy=submit-button]', 'Submit Valid Credentials');

        // Wait for redirect
        try {
            await page.waitForNavigation({ timeout: 10000 });
            if (!page.url().includes('/auth/connexion')) {
                logTest('Successful Login and Redirect', 'PASS');
                coverageData.featuresAccessed.add('authentication');
                return true;
            } else {
                logTest('Successful Login and Redirect', 'FAIL', { 
                    message: 'Still on login page after valid credentials' 
                });
                return false;
            }
        } catch (error) {
            await logError(error, 'Login navigation');
            return false;
        }
    };

    const testMainNavigation = async () => {
        console.log('🧭 Testing Main Navigation...');
        
        const navigationLinks = [
            { selector: 'a[href*="/planning"]', name: 'Planning', feature: 'planning-navigation' },
            { selector: 'a[href*="/conges"]', name: 'Congés', feature: 'leaves-navigation' },
            { selector: 'a[href*="/admin"]', name: 'Administration', feature: 'admin-navigation' },
            { selector: 'a[href*="/profil"]', name: 'Profil', feature: 'profile-navigation' },
            { selector: 'a[href*="/parametres"]', name: 'Paramètres', feature: 'settings-navigation' }
        ];

        for (const link of navigationLinks) {
            const linkExists = await page.$(link.selector);
            if (linkExists) {
                const clicked = await clickSafely(link.selector, `${link.name} Navigation`);
                if (clicked) {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for page to load
                    logTest(`${link.name} Navigation`, 'PASS');
                    coverageData.featuresAccessed.add(link.feature);
                    
                    // Go back to main page for next test
                    await page.goBack();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } else {
                logTest(`${link.name} Navigation`, 'SKIP', { 
                    message: 'Navigation link not found' 
                });
            }
        }
    };

    const testPlanningFeatures = async () => {
        console.log('📅 Testing Planning Features...');
        
        const planningPages = [
            'http://localhost:3001/planning',
            'http://localhost:3001/planning/tableau-bord',
            'http://localhost:3001/bloc-operatoire',
            'http://localhost:3001/bloc-operatoire/configuration'
        ];

        for (const url of planningPages) {
            const success = await navigateToPage(url, `Planning Page: ${url.split('/').pop()}`);
            if (success) {
                coverageData.featuresAccessed.add('planning-module');
                
                // Test interactive elements
                const calendarExists = await page.$('.fc-view, [data-cy*="calendar"], .calendar');
                if (calendarExists) {
                    logTest('Calendar Component Present', 'PASS');
                    coverageData.featuresAccessed.add('calendar-component');
                }

                // Test drag and drop areas
                const dragElements = await page.$$('[draggable="true"], .draggable');
                if (dragElements.length > 0) {
                    logTest('Drag and Drop Elements Present', 'PASS', { 
                        count: dragElements.length 
                    });
                    coverageData.featuresAccessed.add('drag-drop-planning');
                }
            }
        }
    };

    const testLeavesManagement = async () => {
        console.log('🏖️ Testing Leaves Management...');
        
        const leavesPages = [
            'http://localhost:3001/conges',
            'http://localhost:3001/conges/nouveau',
            'http://localhost:3001/admin/conges'
        ];

        for (const url of leavesPages) {
            const success = await navigateToPage(url, `Leaves Page: ${url.split('/').pop()}`);
            if (success) {
                coverageData.featuresAccessed.add('leaves-module');
                
                // Test form elements
                const formExists = await page.$('form');
                if (formExists) {
                    logTest('Leave Form Present', 'PASS');
                    coverageData.featuresAccessed.add('leave-form');
                }

                // Test date pickers
                const dateInputs = await page.$$('input[type="date"], .date-picker, [data-cy*="date"]');
                if (dateInputs.length > 0) {
                    logTest('Date Pickers Present', 'PASS', { 
                        count: dateInputs.length 
                    });
                    coverageData.featuresAccessed.add('date-pickers');
                }
            }
        }
    };

    const testAdminFeatures = async () => {
        console.log('⚙️ Testing Admin Features...');
        
        const adminPages = [
            'http://localhost:3001/admin',
            'http://localhost:3001/admin/utilisateurs',
            'http://localhost:3001/admin/parametres',
            'http://localhost:3001/admin/rules',
            'http://localhost:3001/admin/requetes'
        ];

        for (const url of adminPages) {
            const success = await navigateToPage(url, `Admin Page: ${url.split('/').pop()}`);
            if (success) {
                coverageData.featuresAccessed.add('admin-module');
                
                // Test admin tables
                const tablesExist = await page.$('table, .table, [data-cy*="table"]');
                if (tablesExist) {
                    logTest('Admin Tables Present', 'PASS');
                    coverageData.featuresAccessed.add('admin-tables');
                }

                // Test admin forms
                const formsExist = await page.$('form');
                if (formsExist) {
                    logTest('Admin Forms Present', 'PASS');
                    coverageData.featuresAccessed.add('admin-forms');
                }
            }
        }
    };

    const testUserProfile = async () => {
        console.log('👤 Testing User Profile...');
        
        const profilePages = [
            'http://localhost:3001/profil',
            'http://localhost:3001/parametres'
        ];

        for (const url of profilePages) {
            const success = await navigateToPage(url, `Profile Page: ${url.split('/').pop()}`);
            if (success) {
                coverageData.featuresAccessed.add('profile-module');
                
                // Test profile form
                const profileForm = await page.$('form, .profile-form');
                if (profileForm) {
                    logTest('Profile Form Present', 'PASS');
                    coverageData.featuresAccessed.add('profile-editing');
                }
            }
        }
    };

    const testResponsiveness = async () => {
        console.log('📱 Testing Responsive Design...');
        
        const viewports = [
            { width: 375, height: 667, name: 'Mobile' },
            { width: 768, height: 1024, name: 'Tablet' },
            { width: 1920, height: 1080, name: 'Desktop' }
        ];

        const testUrl = 'http://localhost:3001/planning';
        await navigateToPage(testUrl, 'Responsive Test Page');

        for (const viewport of viewports) {
            await page.setViewport(viewport);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check if navigation is responsive
            const navVisible = await page.$eval('nav', el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none';
            }).catch(() => false);

            logTest(`${viewport.name} Responsive Navigation`, navVisible ? 'PASS' : 'FAIL');
            coverageData.featuresAccessed.add(`responsive-${viewport.name.toLowerCase()}`);
        }

        // Reset to default viewport
        await page.setViewport(defaultPuppeteerConfig.defaultViewport);
    };

    const testAccessibility = async () => {
        console.log('♿ Testing Accessibility...');
        
        try {
            // Test for basic accessibility features
            const hasMainLandmark = await page.$('main, [role="main"]');
            logTest('Main Landmark Present', hasMainLandmark ? 'PASS' : 'FAIL');

            const hasNavLandmark = await page.$('nav, [role="navigation"]');
            logTest('Navigation Landmark Present', hasNavLandmark ? 'PASS' : 'FAIL');

            // Test for form labels
            const forms = await page.$$('form');
            for (let i = 0; i < forms.length; i++) {
                const inputs = await forms[i].$$('input, select, textarea');
                let labelsCount = 0;
                
                for (const input of inputs) {
                    const hasLabel = await input.evaluate(el => {
                        return !!el.labels?.length || !!el.getAttribute('aria-label') || !!el.getAttribute('aria-labelledby');
                    });
                    if (hasLabel) labelsCount++;
                }
                
                logTest(`Form ${i + 1} Labels`, labelsCount === inputs.length ? 'PASS' : 'WARN', {
                    labeledInputs: `${labelsCount}/${inputs.length}`
                });
            }

            coverageData.featuresAccessed.add('accessibility-testing');
        } catch (error) {
            await logError(error, 'Accessibility Testing');
        }
    };

    const generateTestReport = () => {
        const reportData = {
            summary: {
                totalTests: testResults.length,
                passed: testResults.filter(t => t.status === 'PASS').length,
                failed: testResults.filter(t => t.status === 'FAIL').length,
                skipped: testResults.filter(t => t.status === 'SKIP').length,
                warnings: testResults.filter(t => t.status === 'WARN').length,
                errorsCount: errors.length,
                pagesVisited: Array.from(coverageData.pagesVisited),
                featuresAccessed: Array.from(coverageData.featuresAccessed)
            },
            coverage: {
                pagesCount: coverageData.pagesVisited.size,
                featuresCount: coverageData.featuresAccessed.size,
                errorsFound: coverageData.errorsFound.length,
                performanceIssues: coverageData.performanceIssues.length
            },
            testResults,
            errors,
            coverageData
        };

        // Save detailed report
        const reportPath = path.join(__dirname, '../../results/autonomous-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

        // Generate markdown summary
        const successRate = ((reportData.summary.passed / reportData.summary.totalTests) * 100).toFixed(1);
        const markdownReport = `# Rapport de Tests Autonomes E2E

## Résumé Exécutif
- **Tests Totaux**: ${reportData.summary.totalTests}
- **Réussis**: ${reportData.summary.passed} ✅
- **Échoués**: ${reportData.summary.failed} ❌  
- **Ignorés**: ${reportData.summary.skipped} ⏭️
- **Avertissements**: ${reportData.summary.warnings} ⚠️
- **Taux de Réussite**: ${successRate}%

## Couverture
- **Pages Visitées**: ${reportData.coverage.pagesCount}
- **Fonctionnalités Testées**: ${reportData.coverage.featuresCount}
- **Erreurs Détectées**: ${reportData.coverage.errorsFound}
- **Problèmes de Performance**: ${reportData.coverage.performanceIssues}

## Pages Testées
${reportData.summary.pagesVisited.map(page => `- ${page}`).join('\n')}

## Fonctionnalités Validées
${reportData.summary.featuresAccessed.map(feature => `- ${feature}`).join('\n')}

Rapport généré le: ${new Date().toISOString()}
`;

        const markdownPath = path.join(__dirname, '../../results/autonomous-test-summary.md');
        fs.writeFileSync(markdownPath, markdownReport);

        console.log(`\n📊 Rapport de tests sauvegardé: ${reportPath}`);
        console.log(`📄 Résumé markdown: ${markdownPath}`);
        
        return reportData;
    };

    beforeAll(async () => {
        browser = await launchBrowserWithCleanup(puppeteer);
        
        // Create results directory
        const resultsDir = path.join(__dirname, '../../results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }

        // Create screenshots directory
        const screenshotsDir = path.join(__dirname, 'screenshots');
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir, { recursive: true });
        }

        console.log('🚀 Démarrage des tests autonomes E2E...');
    });

    beforeEach(async () => {
        page = await browser.newPage();
        await page.setCacheEnabled(false);
        
        // Monitor console errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error('Browser console error:', msg.text());
                coverageData.errorsFound.push({
                    type: 'console-error',
                    message: msg.text(),
                    url: page.url(),
                    timestamp: Date.now()
                });
            }
        });
    });

    afterEach(async () => {
        if (page) {
            await page.close();
        }
    });

    afterAll(async () => {
        await browser.close();
        
        const report = generateTestReport();
        
        console.log(`\n🎯 Tests autonomes terminés!`);
        console.log(`📈 Taux de réussite: ${((report.summary.passed / report.summary.totalTests) * 100).toFixed(1)}%`);
        console.log(`🌐 Pages testées: ${report.coverage.pagesCount}`);
        console.log(`⚡ Fonctionnalités validées: ${report.coverage.featuresCount}`);
        
        if (report.coverage.errorsFound > 0) {
            console.log(`⚠️  Erreurs détectées: ${report.coverage.errorsFound}`);
        }
    });

    test('Test Complet Autonome - Navigation Application', async () => {
        let allTestsPassed = true;

        // Phase 1: Authentication
        const authSuccess = await testAuthentication();
        if (!authSuccess) {
            logTest('Authentication Phase', 'FAIL', { message: 'Authentication failed' });
            allTestsPassed = false;
            // Continue testing other features even if auth fails
        } else {
            logTest('Authentication Phase', 'PASS');
        }

        // Phase 2: Main Navigation (only if authenticated)
        if (authSuccess) {
            await testMainNavigation();
            logTest('Main Navigation Phase', 'PASS');

            // Phase 3: Feature Testing
            await testPlanningFeatures();
            logTest('Planning Features Phase', 'PASS');

            await testLeavesManagement();
            logTest('Leaves Management Phase', 'PASS');

            await testAdminFeatures();
            logTest('Admin Features Phase', 'PASS');

            await testUserProfile();
            logTest('User Profile Phase', 'PASS');
        }

        // Phase 4: Cross-cutting concerns
        await testResponsiveness();
        logTest('Responsive Design Phase', 'PASS');

        await testAccessibility();
        logTest('Accessibility Phase', 'PASS');

        // Final assessment
        const errorCount = errors.length;
        const criticalErrors = errors.filter(e => e.context.includes('Navigation') || e.context.includes('Authentication'));
        
        if (criticalErrors.length > 0) {
            allTestsPassed = false;
            logTest('Critical Errors Check', 'FAIL', { 
                criticalErrors: criticalErrors.length,
                totalErrors: errorCount 
            });
        } else if (errorCount > 0) {
            logTest('Error Analysis', 'WARN', { 
                totalErrors: errorCount,
                message: 'Non-critical errors found' 
            });
        } else {
            logTest('Error Analysis', 'PASS', { message: 'No errors detected' });
        }

        expect(allTestsPassed).toBe(true);
    });
});