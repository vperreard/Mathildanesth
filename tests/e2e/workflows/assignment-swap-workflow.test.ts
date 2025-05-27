import { launch, Browser, Page } from 'puppeteer';
import { testConfig } from '../config/test-config';
import { createTestUser, cleanupTestData } from '../helpers/test-helpers';
import { waitForNotification, loginAs } from '../helpers/auth-helpers';

describe('Assignment Swap Workflow - Multi-User E2E', () => {
  let browser: Browser;
  let requestorPage: Page;
  let targetPage: Page;
  let adminPage: Page;
  
  const users = {
    requestor: { email: 'requestor@test.com', password: 'Test123!', role: 'PRACTITIONER' },
    target: { email: 'target@test.com', password: 'Test123!', role: 'PRACTITIONER' },
    admin: { email: 'admin@test.com', password: 'Admin123!', role: 'ADMIN' }
  };

  beforeAll(async () => {
    browser = await launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0
    });

    // Create test users
    await Promise.all([
      createTestUser(users.requestor),
      createTestUser(users.target),
      createTestUser(users.admin)
    ]);
  });

  afterAll(async () => {
    await cleanupTestData([users.requestor.email, users.target.email, users.admin.email]);
    await browser.close();
  });

  beforeEach(async () => {
    const context = await browser.createIncognitoBrowserContext();
    requestorPage = await context.newPage();
    targetPage = await context.newPage();
    adminPage = await context.newPage();
    
    // Set viewport for all pages
    const pages = [requestorPage, targetPage, adminPage];
    await Promise.all(pages.map(page => 
      page.setViewport({ width: 1280, height: 720 })
    ));
  });

  afterEach(async () => {
    const pages = await browser.pages();
    await Promise.all(pages.slice(1).map(page => page.close()));
  });

  test('Complete assignment swap workflow with notifications', async () => {
    // Step 1: Login all users
    await Promise.all([
      loginAs(requestorPage, users.requestor),
      loginAs(targetPage, users.target),
      loginAs(adminPage, users.admin)
    ]);

    // Step 2: Requestor creates swap request
    await requestorPage.goto(`${testConfig.baseUrl}/requetes`);
    await requestorPage.waitForSelector('[data-testid="create-swap-request"]');
    await requestorPage.click('[data-testid="create-swap-request"]');
    
    // Fill swap request form
    await requestorPage.waitForSelector('[data-testid="swap-date-input"]');
    await requestorPage.type('[data-testid="swap-date-input"]', '2025-02-15');
    await requestorPage.select('[data-testid="target-user-select"]', users.target.email);
    await requestorPage.type('[data-testid="reason-textarea"]', 'Family emergency');
    await requestorPage.click('[data-testid="submit-swap-request"]');

    // Wait for success notification
    await waitForNotification(requestorPage, 'Demande d\'échange créée avec succès');

    // Step 3: Target user receives notification in real-time
    await targetPage.waitForSelector('[data-testid="notification-bell"]', { timeout: 10000 });
    const notificationCount = await targetPage.$eval(
      '[data-testid="notification-count"]',
      el => el.textContent
    );
    expect(parseInt(notificationCount || '0')).toBeGreaterThan(0);

    // Target opens notification
    await targetPage.click('[data-testid="notification-bell"]');
    await targetPage.waitForSelector('[data-testid="swap-notification"]');
    
    // Step 4: Target accepts the swap
    await targetPage.click('[data-testid="view-swap-details"]');
    await targetPage.waitForSelector('[data-testid="accept-swap-button"]');
    await targetPage.click('[data-testid="accept-swap-button"]');
    
    // Confirm acceptance
    await targetPage.waitForSelector('[data-testid="confirm-dialog"]');
    await targetPage.click('[data-testid="confirm-accept"]');
    
    await waitForNotification(targetPage, 'Échange accepté');

    // Step 5: Admin receives notification for validation
    await adminPage.waitForSelector('[data-testid="notification-bell"]', { timeout: 10000 });
    await adminPage.click('[data-testid="notification-bell"]');
    await adminPage.waitForSelector('[data-testid="pending-swap-notification"]');
    
    // Admin validates the swap
    await adminPage.click('[data-testid="view-pending-swap"]');
    await adminPage.waitForSelector('[data-testid="validate-swap-button"]');
    await adminPage.click('[data-testid="validate-swap-button"]');
    
    await waitForNotification(adminPage, 'Échange validé');

    // Step 6: Both users receive confirmation notifications
    await Promise.all([
      waitForNotification(requestorPage, 'Votre échange a été validé'),
      waitForNotification(targetPage, 'L\'échange a été validé')
    ]);

    // Step 7: Verify calendar updates
    await requestorPage.goto(`${testConfig.baseUrl}/calendar`);
    await requestorPage.waitForSelector('[data-date="2025-02-15"]');
    
    const requestorAssignment = await requestorPage.$eval(
      '[data-date="2025-02-15"] [data-testid="assignment-status"]',
      el => el.textContent
    );
    expect(requestorAssignment).toContain('Échangé');

    await targetPage.goto(`${testConfig.baseUrl}/calendar`);
    await targetPage.waitForSelector('[data-date="2025-02-15"]');
    
    const targetAssignment = await targetPage.$eval(
      '[data-date="2025-02-15"] [data-testid="assignment-status"]',
      el => el.textContent
    );
    expect(targetAssignment).toContain('Échangé');
  });

  test('Swap request rejection workflow', async () => {
    await Promise.all([
      loginAs(requestorPage, users.requestor),
      loginAs(targetPage, users.target)
    ]);

    // Create swap request
    await requestorPage.goto(`${testConfig.baseUrl}/requetes`);
    await requestorPage.click('[data-testid="create-swap-request"]');
    await requestorPage.type('[data-testid="swap-date-input"]', '2025-02-20');
    await requestorPage.select('[data-testid="target-user-select"]', users.target.email);
    await requestorPage.type('[data-testid="reason-textarea"]', 'Personal request');
    await requestorPage.click('[data-testid="submit-swap-request"]');

    // Target rejects the swap
    await targetPage.waitForSelector('[data-testid="notification-bell"]', { timeout: 10000 });
    await targetPage.click('[data-testid="notification-bell"]');
    await targetPage.click('[data-testid="view-swap-details"]');
    await targetPage.click('[data-testid="reject-swap-button"]');
    await targetPage.type('[data-testid="rejection-reason"]', 'Already have plans');
    await targetPage.click('[data-testid="confirm-reject"]');

    // Requestor receives rejection notification
    await waitForNotification(requestorPage, 'Votre demande d\'échange a été refusée');
    
    // Verify request status
    await requestorPage.goto(`${testConfig.baseUrl}/requetes`);
    await requestorPage.waitForSelector('[data-testid="swap-request-list"]');
    
    const requestStatus = await requestorPage.$eval(
      '[data-request-date="2025-02-20"] [data-testid="request-status"]',
      el => el.textContent
    );
    expect(requestStatus).toBe('Refusée');
  });

  test('Concurrent swap requests handling', async () => {
    // Create a third practitioner
    const practitioner3 = { 
      email: 'practitioner3@test.com', 
      password: 'Test123!', 
      role: 'PRACTITIONER' 
    };
    await createTestUser(practitioner3);
    
    const practitioner3Page = await browser.newPage();
    await practitioner3Page.setViewport({ width: 1280, height: 720 });
    
    await Promise.all([
      loginAs(requestorPage, users.requestor),
      loginAs(targetPage, users.target),
      loginAs(practitioner3Page, practitioner3)
    ]);

    // Both requestor and practitioner3 try to swap with target for the same date
    const swapDate = '2025-02-25';
    
    // Requestor creates first swap request
    await requestorPage.goto(`${testConfig.baseUrl}/requetes`);
    await requestorPage.click('[data-testid="create-swap-request"]');
    await requestorPage.type('[data-testid="swap-date-input"]', swapDate);
    await requestorPage.select('[data-testid="target-user-select"]', users.target.email);
    await requestorPage.click('[data-testid="submit-swap-request"]');

    // Practitioner3 creates conflicting swap request
    await practitioner3Page.goto(`${testConfig.baseUrl}/requetes`);
    await practitioner3Page.click('[data-testid="create-swap-request"]');
    await practitioner3Page.type('[data-testid="swap-date-input"]', swapDate);
    await practitioner3Page.select('[data-testid="target-user-select"]', users.target.email);
    await practitioner3Page.click('[data-testid="submit-swap-request"]');

    // Target should see both requests
    await targetPage.waitForSelector('[data-testid="notification-bell"]', { timeout: 10000 });
    await targetPage.click('[data-testid="notification-bell"]');
    
    const swapNotifications = await targetPage.$$('[data-testid="swap-notification"]');
    expect(swapNotifications.length).toBe(2);

    // Target accepts first request
    await targetPage.click('[data-testid="swap-notification"]:first-child [data-testid="view-swap-details"]');
    await targetPage.click('[data-testid="accept-swap-button"]');
    await targetPage.click('[data-testid="confirm-accept"]');

    // Second request should be automatically cancelled
    await practitioner3Page.waitForSelector('[data-testid="notification-bell"]', { timeout: 10000 });
    await waitForNotification(
      practitioner3Page, 
      'Votre demande d\'échange a été annulée car la cible a accepté une autre demande'
    );

    // Cleanup
    await practitioner3Page.close();
    await cleanupTestData([practitioner3.email]);
  });
});