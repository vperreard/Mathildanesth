import { launch, Browser, Page } from 'puppeteer';
import { testConfig } from '../config/test-config';
import { createTestUser, cleanupTestData } from '../helpers/test-helpers';
import { loginAs } from '../helpers/auth-helpers';

describe('Regression Tests - Critical Bugs', () => {
  let browser: Browser;
  let page: Page;
  
  const testUser = {
    email: 'regression@test.com',
    password: 'Test123!',
    role: 'PRACTITIONER'
  };

  beforeAll(async () => {
    browser = await launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    await createTestUser(testUser);
  });

  afterAll(async () => {
    await cleanupTestData([testUser.email]);
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await loginAs(page, testUser);
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Bug #301 - Calendar date selection issues', () => {
    test('Should correctly handle month transitions', async () => {
      await page.goto(`${testConfig.baseUrl}/calendar`);
      await page.waitForSelector('[data-testid="calendar-container"]');

      // Get current month/year
      const currentMonthYear = await page.$eval(
        '[data-testid="current-month-display"]',
        el => el.textContent
      );

      // Navigate to next month
      await page.click('[data-testid="next-month-button"]');
      await page.waitForTimeout(500);

      const nextMonthYear = await page.$eval(
        '[data-testid="current-month-display"]',
        el => el.textContent
      );

      expect(nextMonthYear).not.toBe(currentMonthYear);

      // Navigate back
      await page.click('[data-testid="previous-month-button"]');
      await page.waitForTimeout(500);

      const backMonthYear = await page.$eval(
        '[data-testid="current-month-display"]',
        el => el.textContent
      );

      expect(backMonthYear).toBe(currentMonthYear);
    });

    test('Should maintain selected date when switching views', async () => {
      await page.goto(`${testConfig.baseUrl}/calendar`);
      await page.waitForSelector('[data-testid="calendar-container"]');

      // Select a specific date
      const targetDate = '15';
      await page.click(`[data-testid="calendar-day-${targetDate}"]`);
      await page.waitForTimeout(300);

      // Switch to week view
      await page.click('[data-testid="view-week"]');
      await page.waitForTimeout(500);

      // Switch back to month view
      await page.click('[data-testid="view-month"]');
      await page.waitForTimeout(500);

      // Verify date is still selected
      const selectedDate = await page.$eval(
        '[data-testid="calendar-day"].selected',
        el => el.getAttribute('data-date')
      );

      expect(selectedDate).toContain(targetDate);
    });
  });

  describe('Bug #245 - Leave request quota validation', () => {
    test('Should prevent negative quota balances', async () => {
      await page.goto(`${testConfig.baseUrl}/leaves`);
      await page.waitForSelector('[data-testid="leave-quota-display"]');

      // Get current quota
      const currentQuota = await page.$eval(
        '[data-testid="annual-leave-quota"]',
        el => parseInt(el.textContent || '0')
      );

      // Try to request more days than available
      await page.click('[data-testid="create-leave-request"]');
      await page.waitForSelector('[data-testid="leave-form"]');
      
      await page.select('[data-testid="leave-type-select"]', 'ANNUAL_LEAVE');
      
      // Calculate dates for more days than quota
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + currentQuota + 5);

      await page.type('[data-testid="start-date-input"]', startDate.toISOString().split('T')[0]);
      await page.type('[data-testid="end-date-input"]', endDate.toISOString().split('T')[0]);
      
      await page.click('[data-testid="submit-leave-request"]');

      // Should show error message
      await page.waitForSelector('[data-testid="quota-error-message"]');
      const errorMessage = await page.$eval(
        '[data-testid="quota-error-message"]',
        el => el.textContent
      );

      expect(errorMessage).toContain('quota insuffisant');
      
      // Verify form was not submitted
      const currentUrl = page.url();
      expect(currentUrl).toContain('/leaves');
    });

    test('Should correctly calculate business days excluding weekends', async () => {
      await page.goto(`${testConfig.baseUrl}/leaves`);
      await page.click('[data-testid="create-leave-request"]');
      
      // Select a date range that includes a weekend
      const friday = new Date('2025-02-07'); // Friday
      const nextMonday = new Date('2025-02-10'); // Monday
      
      await page.type('[data-testid="start-date-input"]', friday.toISOString().split('T')[0]);
      await page.type('[data-testid="end-date-input"]', nextMonday.toISOString().split('T')[0]);
      
      // Wait for calculation
      await page.waitForTimeout(500);
      
      const calculatedDays = await page.$eval(
        '[data-testid="calculated-days"]',
        el => parseInt(el.textContent || '0')
      );
      
      // Should be 2 days (Friday and Monday, excluding weekend)
      expect(calculatedDays).toBe(2);
    });
  });

  describe('Bug #189 - Planning drag and drop persistence', () => {
    test('Should persist drag and drop changes after page refresh', async () => {
      await page.goto(`${testConfig.baseUrl}/planning`);
      await page.waitForSelector('[data-testid="planning-grid"]');

      // Find a draggable assignment
      const assignment = await page.$('[data-testid="draggable-assignment"]');
      if (!assignment) {
        console.log('No draggable assignments found, skipping test');
        return;
      }

      // Get initial position
      const initialSlot = await page.evaluate(el => {
        const parent = el.parentElement;
        return parent?.getAttribute('data-slot-id');
      }, assignment);

      // Perform drag and drop
      const targetSlot = await page.$('[data-testid="droppable-slot"]:not(:has([data-testid="draggable-assignment"]))');
      if (!targetSlot) {
        console.log('No empty slots found, skipping test');
        return;
      }

      const targetSlotId = await targetSlot.evaluate(el => el.getAttribute('data-slot-id'));

      // Drag and drop
      const assignmentBox = await assignment.boundingBox();
      const targetBox = await targetSlot.boundingBox();

      if (assignmentBox && targetBox) {
        await page.mouse.move(assignmentBox.x + assignmentBox.width / 2, assignmentBox.y + assignmentBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
        await page.mouse.up();

        // Wait for save
        await page.waitForTimeout(1000);

        // Refresh page
        await page.reload();
        await page.waitForSelector('[data-testid="planning-grid"]');

        // Verify assignment is in new position
        const movedAssignment = await page.$(`[data-slot-id="${targetSlotId}"] [data-testid="draggable-assignment"]`);
        expect(movedAssignment).toBeTruthy();
      }
    });
  });

  describe('Bug #156 - Concurrent modification conflicts', () => {
    test('Should handle concurrent leave request modifications', async () => {
      // Create two browser pages for the same user
      const page2 = await browser.newPage();
      await page2.setViewport({ width: 1280, height: 720 });
      await loginAs(page2, testUser);

      // Both pages navigate to leaves
      await Promise.all([
        page.goto(`${testConfig.baseUrl}/leaves`),
        page2.goto(`${testConfig.baseUrl}/leaves`)
      ]);

      // Create a leave request on page 1
      await page.click('[data-testid="create-leave-request"]');
      await page.select('[data-testid="leave-type-select"]', 'ANNUAL_LEAVE');
      await page.type('[data-testid="start-date-input"]', '2025-03-15');
      await page.type('[data-testid="end-date-input"]', '2025-03-16');
      await page.click('[data-testid="submit-leave-request"]');
      
      await page.waitForSelector('[data-testid="leave-request-item"]');

      // Refresh page 2 to see the new request
      await page2.reload();
      await page2.waitForSelector('[data-testid="leave-request-item"]');

      // Try to edit the same request from both pages
      await page.click('[data-testid="edit-leave-request"]');
      await page2.click('[data-testid="edit-leave-request"]');

      // Make different changes
      await page.waitForSelector('[data-testid="end-date-input"]');
      await page.evaluate(() => {
        const input = document.querySelector('[data-testid="end-date-input"]') as HTMLInputElement;
        input.value = '2025-03-17';
      });

      await page2.waitForSelector('[data-testid="end-date-input"]');
      await page2.evaluate(() => {
        const input = document.querySelector('[data-testid="end-date-input"]') as HTMLInputElement;
        input.value = '2025-03-18';
      });

      // Submit both changes
      await page.click('[data-testid="save-changes"]');
      await page.waitForTimeout(500);
      await page2.click('[data-testid="save-changes"]');

      // Second save should show conflict error
      await page2.waitForSelector('[data-testid="conflict-error"]');
      const errorMessage = await page2.$eval(
        '[data-testid="conflict-error"]',
        el => el.textContent
      );

      expect(errorMessage).toContain('modifié par un autre utilisateur');

      await page2.close();
    });
  });

  describe('Bug #134 - Session timeout handling', () => {
    test('Should redirect to login on session expiry', async () => {
      await page.goto(`${testConfig.baseUrl}/calendar`);
      await page.waitForSelector('[data-testid="calendar-container"]');

      // Simulate session expiry by clearing auth cookie
      await page.deleteCookie({ name: 'auth-token' });

      // Try to perform an authenticated action
      await page.click('[data-testid="create-event-button"]');
      
      // Should redirect to login
      await page.waitForNavigation();
      expect(page.url()).toContain('/auth/login');

      // Should show session expired message
      const message = await page.$eval(
        '[data-testid="session-expired-message"]',
        el => el.textContent
      );
      expect(message).toContain('session a expiré');
    });
  });

  describe('Bug #112 - Form validation edge cases', () => {
    test('Should validate special characters in form inputs', async () => {
      await page.goto(`${testConfig.baseUrl}/leaves`);
      await page.click('[data-testid="create-leave-request"]');

      // Test XSS attempt in reason field
      const xssPayload = '<script>alert("XSS")</script>';
      await page.type('[data-testid="reason-textarea"]', xssPayload);
      
      await page.select('[data-testid="leave-type-select"]', 'ANNUAL_LEAVE');
      await page.type('[data-testid="start-date-input"]', '2025-04-01');
      await page.type('[data-testid="end-date-input"]', '2025-04-02');
      
      await page.click('[data-testid="submit-leave-request"]');
      
      // Wait for success and navigate to list
      await page.waitForSelector('[data-testid="success-message"]');
      await page.goto(`${testConfig.baseUrl}/leaves`);
      
      // Verify the text is escaped properly
      const savedReason = await page.$eval(
        '[data-testid="leave-request-item"]:last-child [data-testid="request-reason"]',
        el => el.innerHTML
      );
      
      expect(savedReason).not.toContain('<script>');
      expect(savedReason).toContain('&lt;script&gt;');
    });

    test('Should handle very long input gracefully', async () => {
      await page.goto(`${testConfig.baseUrl}/leaves`);
      await page.click('[data-testid="create-leave-request"]');

      // Generate very long string
      const longString = 'A'.repeat(5000);
      await page.type('[data-testid="reason-textarea"]', longString);
      
      // Fill other required fields
      await page.select('[data-testid="leave-type-select"]', 'ANNUAL_LEAVE');
      await page.type('[data-testid="start-date-input"]', '2025-04-10');
      await page.type('[data-testid="end-date-input"]', '2025-04-11');
      
      await page.click('[data-testid="submit-leave-request"]');
      
      // Should show validation error for exceeded length
      await page.waitForSelector('[data-testid="validation-error"]');
      const error = await page.$eval(
        '[data-testid="validation-error"]',
        el => el.textContent
      );
      
      expect(error).toContain('trop long');
    });
  });
});