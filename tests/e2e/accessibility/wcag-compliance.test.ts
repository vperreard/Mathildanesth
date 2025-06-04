import { launch, Browser, Page } from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';
import { testConfig } from '../config/test-config';
import { createTestUser, cleanupTestData } from '../helpers/test-helpers';
import { loginAs } from '../helpers/auth-helpers';
import * as fs from 'fs/promises';
import * as path from 'path';

interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
  }>;
}

interface AccessibilityReport {
  page: string;
  url: string;
  timestamp: string;
  violations: AccessibilityViolation[];
  passes: number;
  inapplicable: number;
  incomplete: number;
}

describe('WCAG 2.1 Accessibility Compliance Tests', () => {
  let browser: Browser;
  let page: Page;
  const accessibilityReports: AccessibilityReport[] = [];
  
  const testUser = {
    email: 'a11y@test.com',
    password: 'Test123!',
    role: 'PRACTITIONER'
  };

  const adminUser = {
    email: 'a11y-admin@test.com',
    password: 'Admin123!',
    role: 'ADMIN'
  };

  beforeAll(async () => {
    browser = await launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    await createTestUser(testUser);
    await createTestUser(adminUser);
  });

  afterAll(async () => {
    // Save accessibility reports
    const reportsPath = path.join(process.cwd(), 'accessibility-reports.json');
    await fs.writeFile(reportsPath, JSON.stringify(accessibilityReports, null, 2));
    console.log(`Accessibility reports saved to: ${reportsPath}`);
    
    // Generate summary report
    generateAccessibilitySummary(accessibilityReports);
    
    await cleanupTestData([testUser.email, adminUser.email]);
    await browser.close();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
  });

  afterEach(async () => {
    await page.close();
  });

  async function runAccessibilityTest(
    pageName: string,
    url: string,
    options?: {
      authenticate?: boolean;
      isAdmin?: boolean;
      interactions?: () => Promise<void>;
      context?: string;
    }
  ): Promise<AccessibilityReport> {
    if (options?.authenticate) {
      await loginAs(page, options.isAdmin ? adminUser : testUser);
    }

    await page.goto(url, { waitUntil: 'networkidle0' });

    if (options?.interactions) {
      await options.interactions();
    }

    // Run axe accessibility tests
    const results = await new AxePuppeteer(page)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const report: AccessibilityReport = {
      page: pageName,
      url: url,
      timestamp: new Date().toISOString(),
      violations: results.violations as AccessibilityViolation[],
      passes: results.passes.length,
      inapplicable: results.inapplicable.length,
      incomplete: results.incomplete.length
    };

    accessibilityReports.push(report);

    return report;
  }

  test('Public pages accessibility', async () => {
    const publicPages = [
      { name: 'Login', url: `${testConfig.baseUrl}/auth/connexion` },
      { name: 'Home', url: `${testConfig.baseUrl}/` }
    ];

    for (const pageInfo of publicPages) {
      const report = await runAccessibilityTest(pageInfo.name, pageInfo.url);
      
      console.log(`\n${pageInfo.name} accessibility results:`);
      console.log(`- Violations: ${report.violations.length}`);
      console.log(`- Passes: ${report.passes}`);
      
      // No critical violations allowed
      const criticalViolations = report.violations.filter(v => v.impact === 'critical');
      expect(criticalViolations.length).toBe(0);
      
      // Limited serious violations
      const seriousViolations = report.violations.filter(v => v.impact === 'serious');
      expect(seriousViolations.length).toBeLessThanOrEqual(2);
    }
  });

  test('Authenticated pages accessibility', async () => {
    const authenticatedPages = [
      { name: 'Dashboard', url: `${testConfig.baseUrl}/` },
      { name: 'Calendar', url: `${testConfig.baseUrl}/calendrier` },
      { name: 'Leaves', url: `${testConfig.baseUrl}/conges` },
      { name: 'Planning', url: `${testConfig.baseUrl}/planning` },
      { name: 'Notifications', url: `${testConfig.baseUrl}/notifications` }
    ];

    for (const pageInfo of authenticatedPages) {
      const report = await runAccessibilityTest(
        pageInfo.name,
        pageInfo.url,
        { authenticate: true }
      );
      
      // No critical or serious violations for main pages
      const criticalOrSerious = report.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalOrSerious.length).toBe(0);
    }
  });

  test('Form accessibility', async () => {
    // Test leave request form
    const report = await runAccessibilityTest(
      'Leave Request Form',
      `${testConfig.baseUrl}/conges`,
      {
        authenticate: true,
        interactions: async () => {
          await page.click('[data-testid="create-leave-request"]');
          await page.waitForSelector('[data-testid="leave-form"]');
        }
      }
    );

    // Check for form-specific issues
    const formViolations = report.violations.filter(v => 
      v.id.includes('label') || 
      v.id.includes('form') || 
      v.id.includes('input')
    );
    
    expect(formViolations.length).toBe(0);
  });

  test('Keyboard navigation', async () => {
    await loginAs(page, testUser);
    await page.goto(`${testConfig.baseUrl}/calendrier`);

    // Test tab navigation
    const tabbableElements = await page.evaluate(() => {
      const elements = [];
      let currentElement = document.activeElement;
      
      // Tab through all focusable elements
      for (let i = 0; i < 100; i++) {
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
        const newElement = document.activeElement;
        
        if (newElement === currentElement || newElement === document.body) {
          break;
        }
        
        elements.push({
          tagName: newElement?.tagName,
          role: newElement?.getAttribute('role'),
          ariaLabel: newElement?.getAttribute('aria-label'),
          text: newElement?.textContent?.substring(0, 50)
        });
        
        currentElement = newElement;
      }
      
      return elements;
    });

    // Verify tab order makes sense
    expect(tabbableElements.length).toBeGreaterThan(5);
    
    // Test escape key closes modals
    await page.click('[data-testid="create-event-button"]');
    await page.waitForSelector('[data-testid="event-modal"]');
    await page.keyboard.press('Escape');
    
    const modalClosed = await page.$('[data-testid="event-modal"]') === null;
    expect(modalClosed).toBe(true);
  });

  test('Screen reader compatibility', async () => {
    await loginAs(page, testUser);
    
    const pagesToTest = [
      `${testConfig.baseUrl}/calendrier`,
      `${testConfig.baseUrl}/conges`,
      `${testConfig.baseUrl}/planning`
    ];

    for (const url of pagesToTest) {
      await page.goto(url);
      
      // Check for ARIA landmarks
      const landmarks = await page.evaluate(() => {
        const landmarkRoles = ['banner', 'navigation', 'main', 'contentinfo'];
        const found: Record<string, number> = {};
        
        landmarkRoles.forEach(role => {
          const elements = document.querySelectorAll(`[role="${role}"]`);
          const tagElements = role === 'banner' ? document.querySelectorAll('header') :
                            role === 'navigation' ? document.querySelectorAll('nav') :
                            role === 'main' ? document.querySelectorAll('main') :
                            role === 'contentinfo' ? document.querySelectorAll('footer') : [];
          
          found[role] = elements.length + tagElements.length;
        });
        
        return found;
      });

      // Verify essential landmarks exist
      expect(landmarks.banner).toBeGreaterThanOrEqual(1);
      expect(landmarks.navigation).toBeGreaterThanOrEqual(1);
      expect(landmarks.main).toBe(1);
      
      // Check for proper heading hierarchy
      const headingStructure = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        return headings.map(h => ({
          level: parseInt(h.tagName[1]),
          text: h.textContent,
          visible: window.getComputedStyle(h).display !== 'none'
        }));
      });

      // Verify there's exactly one H1
      const h1s = headingStructure.filter(h => h.level === 1 && h.visible);
      expect(h1s.length).toBe(1);

      // Verify heading hierarchy (no skipping levels)
      let previousLevel = 0;
      headingStructure.filter(h => h.visible).forEach(heading => {
        expect(heading.level).toBeLessThanOrEqual(previousLevel + 1);
        previousLevel = heading.level;
      });
    }
  });

  test('Color contrast', async () => {
    await loginAs(page, testUser);
    
    const pages = [
      `${testConfig.baseUrl}/`,
      `${testConfig.baseUrl}/calendrier`,
      `${testConfig.baseUrl}/conges`
    ];

    for (const url of pages) {
      await page.goto(url);
      
      const results = await new AxePuppeteer(page)
        .withTags(['wcag2aa'])
        .withRules(['color-contrast'])
        .analyze();

      const contrastViolations = results.violations.filter(v => v.id === 'color-contrast');
      
      // Log violations for debugging
      if (contrastViolations.length > 0) {
        console.log(`Color contrast violations on ${url}:`);
        contrastViolations.forEach(violation => {
          violation.nodes.forEach(node => {
            console.log(`- ${node.html.substring(0, 100)}...`);
          });
        });
      }
      
      expect(contrastViolations.length).toBe(0);
    }
  });

  test('Focus indicators', async () => {
    await loginAs(page, testUser);
    await page.goto(`${testConfig.baseUrl}/calendrier`);

    // Check if focus indicators are visible
    const focusIndicatorTest = await page.evaluate(() => {
      const testElements = [
        'button',
        'a',
        'input',
        'select',
        'textarea',
        '[tabindex="0"]'
      ];

      const results: Array<{ selector: string; hasFocusStyle: boolean }> = [];

      testElements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element && element instanceof HTMLElement) {
          element.focus();
          const styles = window.getComputedStyle(element);
          const focusStyles = window.getComputedStyle(element, ':focus');
          
          // Check if element has focus styling (outline, border change, etc.)
          const hasFocusStyle = 
            styles.outline !== 'none' ||
            styles.outlineWidth !== '0px' ||
            styles.boxShadow !== 'none' ||
            styles.border !== focusStyles.border;
          
          results.push({ selector, hasFocusStyle });
        }
      });

      return results;
    });

    // All interactive elements should have focus indicators
    const elementsWithoutFocus = focusIndicatorTest.filter(r => !r.hasFocusStyle);
    expect(elementsWithoutFocus.length).toBe(0);
  });

  test('Alternative text for images', async () => {
    await loginAs(page, testUser);
    
    const pages = [
      `${testConfig.baseUrl}/`,
      `${testConfig.baseUrl}/profil`
    ];

    for (const url of pages) {
      await page.goto(url);
      
      const imageAccessibility = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.map(img => ({
          src: img.src,
          alt: img.alt,
          decorative: img.getAttribute('role') === 'presentation' || img.alt === '',
          ariaLabel: img.getAttribute('aria-label'),
          ariaLabelledBy: img.getAttribute('aria-labelledby')
        }));
      });

      imageAccessibility.forEach(img => {
        // Images must have alt text or be marked as decorative
        if (!img.decorative) {
          expect(img.alt || img.ariaLabel || img.ariaLabelledBy).toBeTruthy();
        }
      });
    }
  });

  test('Responsive design accessibility', async () => {
    const viewports = [
      { width: 320, height: 568, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    await loginAs(page, testUser);

    for (const viewport of viewports) {
      await page.setViewport({ width: viewport.width, height: viewport.height });
      await page.goto(`${testConfig.baseUrl}/calendrier`);
      
      const report = await runAccessibilityTest(
        `Calendar - ${viewport.name}`,
        `${testConfig.baseUrl}/calendrier`,
        { authenticate: false } // Already authenticated
      );

      // No critical violations at any viewport
      const criticalViolations = report.violations.filter(v => v.impact === 'critical');
      expect(criticalViolations.length).toBe(0);
    }
  });

  test('Admin pages accessibility', async () => {
    const adminPages = [
      { name: 'Admin Dashboard', url: `${testConfig.baseUrl}/admin` },
      { name: 'User Management', url: `${testConfig.baseUrl}/admin/utilisateurs` },
      { name: 'System Settings', url: `${testConfig.baseUrl}/admin/parametres` }
    ];

    for (const pageInfo of adminPages) {
      const report = await runAccessibilityTest(
        pageInfo.name,
        pageInfo.url,
        { authenticate: true, isAdmin: true }
      );
      
      // Admin pages should also be accessible
      const criticalOrSerious = report.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalOrSerious.length).toBe(0);
    }
  });

  function generateAccessibilitySummary(reports: AccessibilityReport[]) {
    console.log('\n=== ACCESSIBILITY COMPLIANCE SUMMARY ===\n');
    
    let totalViolations = 0;
    let criticalCount = 0;
    let seriousCount = 0;
    let moderateCount = 0;
    let minorCount = 0;

    const violationsByType: Record<string, number> = {};

    reports.forEach(report => {
      totalViolations += report.violations.length;
      
      report.violations.forEach(violation => {
        switch (violation.impact) {
          case 'critical': criticalCount++; break;
          case 'serious': seriousCount++; break;
          case 'moderate': moderateCount++; break;
          case 'minor': minorCount++; break;
        }
        
        violationsByType[violation.id] = (violationsByType[violation.id] || 0) + 1;
      });
    });

    console.log('📊 Overall Statistics:');
    console.log(`  Total pages tested: ${reports.length}`);
    console.log(`  Total violations: ${totalViolations}`);
    console.log(`  - Critical: ${criticalCount}`);
    console.log(`  - Serious: ${seriousCount}`);
    console.log(`  - Moderate: ${moderateCount}`);
    console.log(`  - Minor: ${minorCount}\n`);

    console.log('🔝 Most common violations:');
    Object.entries(violationsByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([type, count]) => {
        console.log(`  - ${type}: ${count} occurrences`);
      });

    console.log('\n📄 Page-by-page summary:');
    reports.forEach(report => {
      const critical = report.violations.filter(v => v.impact === 'critical').length;
      const serious = report.violations.filter(v => v.impact === 'serious').length;
      
      console.log(`  ${report.page}:`);
      console.log(`    Violations: ${report.violations.length} (${critical} critical, ${serious} serious)`);
      console.log(`    Passes: ${report.passes}`);
    });

    // WCAG compliance level
    const level = criticalCount === 0 && seriousCount === 0 ? 'AA' :
                  criticalCount === 0 ? 'A' : 'Non-compliant';
    
    console.log(`\n✅ WCAG 2.1 Compliance Level: ${level}`);
  }
});