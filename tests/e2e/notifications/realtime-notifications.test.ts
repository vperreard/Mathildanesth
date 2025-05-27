import { launch, Browser, Page } from 'puppeteer';
import { testConfig } from '../config/test-config';
import { createTestUser, cleanupTestData } from '../helpers/test-helpers';
import { loginAs } from '../helpers/auth-helpers';
import { io, Socket } from 'socket.io-client';

describe('Real-time Notifications E2E Tests', () => {
  let browser: Browser;
  let senderPage: Page;
  let receiverPage: Page;
  let adminPage: Page;
  let websocketClient: Socket;
  
  const users = {
    sender: { email: 'sender@test.com', password: 'Test123!', role: 'PRACTITIONER' },
    receiver: { email: 'receiver@test.com', password: 'Test123!', role: 'PRACTITIONER' },
    admin: { email: 'admin.notif@test.com', password: 'Admin123!', role: 'ADMIN' }
  };

  beforeAll(async () => {
    browser = await launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Create test users
    await Promise.all([
      createTestUser(users.sender),
      createTestUser(users.receiver),
      createTestUser(users.admin)
    ]);

    // Initialize WebSocket client for testing
    websocketClient = io(testConfig.websocketUrl, {
      transports: ['websocket'],
      autoConnect: false
    });
  });

  afterAll(async () => {
    websocketClient.disconnect();
    await cleanupTestData([users.sender.email, users.receiver.email, users.admin.email]);
    await browser.close();
  });

  beforeEach(async () => {
    const context = await browser.createIncognitoBrowserContext();
    senderPage = await context.newPage();
    receiverPage = await context.newPage();
    adminPage = await context.newPage();
    
    await Promise.all([
      senderPage.setViewport({ width: 1280, height: 720 }),
      receiverPage.setViewport({ width: 1280, height: 720 }),
      adminPage.setViewport({ width: 1280, height: 720 })
    ]);
  });

  afterEach(async () => {
    const pages = await browser.pages();
    await Promise.all(pages.slice(1).map(page => page.close()));
  });

  test('Real-time notification delivery for leave requests', async () => {
    // Login all users
    await Promise.all([
      loginAs(senderPage, users.sender),
      loginAs(adminPage, users.admin)
    ]);

    // Admin should start with no notifications
    await adminPage.goto(`${testConfig.baseUrl}/notifications`);
    const initialCount = await adminPage.$eval(
      '[data-testid="notification-count"]',
      el => el.textContent || '0'
    );
    expect(parseInt(initialCount)).toBe(0);

    // Listen for WebSocket events on admin page
    await adminPage.evaluate(() => {
      window.notificationReceived = false;
      // @ts-ignore
      window.socket.on('notification', () => {
        window.notificationReceived = true;
      });
    });

    // Sender creates a leave request
    await senderPage.goto(`${testConfig.baseUrl}/leaves`);
    await senderPage.click('[data-testid="create-leave-request"]');
    await senderPage.waitForSelector('[data-testid="leave-type-select"]');
    await senderPage.select('[data-testid="leave-type-select"]', 'ANNUAL_LEAVE');
    await senderPage.type('[data-testid="start-date-input"]', '2025-03-01');
    await senderPage.type('[data-testid="end-date-input"]', '2025-03-05');
    await senderPage.type('[data-testid="reason-textarea"]', 'Vacation');
    await senderPage.click('[data-testid="submit-leave-request"]');

    // Wait for notification to be received via WebSocket
    await adminPage.waitForFunction(
      () => window.notificationReceived === true,
      { timeout: 10000 }
    );

    // Verify notification appears in real-time
    await adminPage.waitForSelector('[data-testid="notification-bell-badge"]', { timeout: 5000 });
    const newCount = await adminPage.$eval(
      '[data-testid="notification-count"]',
      el => el.textContent || '0'
    );
    expect(parseInt(newCount)).toBeGreaterThan(0);

    // Click notification bell and verify content
    await adminPage.click('[data-testid="notification-bell"]');
    await adminPage.waitForSelector('[data-testid="notification-item"]');
    
    const notificationText = await adminPage.$eval(
      '[data-testid="notification-item"]:first-child',
      el => el.textContent
    );
    expect(notificationText).toContain('Nouvelle demande de congé');
    expect(notificationText).toContain(users.sender.email);
  });

  test('Broadcast notifications for system announcements', async () => {
    const userPages: Page[] = [];
    const userCount = 5;

    // Create and login multiple users
    for (let i = 0; i < userCount; i++) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });
      const user = { 
        email: `broadcast${i}@test.com`, 
        password: 'Test123!', 
        role: 'PRACTITIONER' 
      };
      await createTestUser(user);
      await loginAs(page, user);
      userPages.push(page);

      // Setup WebSocket listener
      await page.evaluate(() => {
        window.broadcastReceived = false;
        // @ts-ignore
        window.socket.on('broadcast', () => {
          window.broadcastReceived = true;
        });
      });
    }

    // Admin sends broadcast
    await loginAs(adminPage, users.admin);
    await adminPage.goto(`${testConfig.baseUrl}/admin/notifications`);
    await adminPage.click('[data-testid="send-broadcast"]');
    await adminPage.type('[data-testid="broadcast-title"]', 'System Maintenance');
    await adminPage.type('[data-testid="broadcast-message"]', 'The system will be under maintenance tonight');
    await adminPage.click('[data-testid="send-broadcast-button"]');

    // Verify all users receive the broadcast
    const broadcastResults = await Promise.all(
      userPages.map(page => 
        page.waitForFunction(
          () => window.broadcastReceived === true,
          { timeout: 10000 }
        ).then(() => true).catch(() => false)
      )
    );

    expect(broadcastResults.every(result => result)).toBe(true);

    // Verify broadcast appears in notification center
    for (const page of userPages) {
      await page.click('[data-testid="notification-bell"]');
      await page.waitForSelector('[data-testid="broadcast-notification"]');
      const broadcastText = await page.$eval(
        '[data-testid="broadcast-notification"]',
        el => el.textContent
      );
      expect(broadcastText).toContain('System Maintenance');
    }

    // Cleanup
    await Promise.all(userPages.map(page => page.close()));
    await cleanupTestData(Array.from({ length: userCount }, (_, i) => `broadcast${i}@test.com`));
  });

  test('Notification persistence and read status', async () => {
    await Promise.all([
      loginAs(senderPage, users.sender),
      loginAs(receiverPage, users.receiver)
    ]);

    // Create multiple notifications
    const notificationPromises = [];
    for (let i = 0; i < 3; i++) {
      notificationPromises.push(
        senderPage.evaluate(async (receiverEmail, index) => {
          const response = await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'MESSAGE',
              recipientEmail: receiverEmail,
              title: `Test Message ${index}`,
              content: `This is test message number ${index}`,
              priority: index === 0 ? 'HIGH' : 'NORMAL'
            })
          });
          return response.ok;
        }, users.receiver.email, i)
      );
    }

    await Promise.all(notificationPromises);

    // Receiver checks notifications
    await receiverPage.goto(`${testConfig.baseUrl}/notifications`);
    await receiverPage.waitForSelector('[data-testid="notification-list"]');

    // Verify all notifications are present
    const notificationItems = await receiverPage.$$('[data-testid="notification-item"]');
    expect(notificationItems.length).toBe(3);

    // Verify unread status
    const unreadCount = await receiverPage.$$eval(
      '[data-testid="notification-item"].unread',
      items => items.length
    );
    expect(unreadCount).toBe(3);

    // Mark first notification as read
    await receiverPage.click('[data-testid="notification-item"]:first-child');
    await receiverPage.waitForTimeout(500);

    // Verify read status updated
    const newUnreadCount = await receiverPage.$$eval(
      '[data-testid="notification-item"].unread',
      items => items.length
    );
    expect(newUnreadCount).toBe(2);

    // Refresh page and verify persistence
    await receiverPage.reload();
    await receiverPage.waitForSelector('[data-testid="notification-list"]');

    const persistedUnreadCount = await receiverPage.$$eval(
      '[data-testid="notification-item"].unread',
      items => items.length
    );
    expect(persistedUnreadCount).toBe(2);

    // Verify high priority notification styling
    const highPriorityNotification = await receiverPage.$('[data-testid="notification-item"].high-priority');
    expect(highPriorityNotification).toBeTruthy();
  });

  test('Notification preferences and filtering', async () => {
    await loginAs(receiverPage, users.receiver);

    // Navigate to notification preferences
    await receiverPage.goto(`${testConfig.baseUrl}/parametres/notifications`);
    await receiverPage.waitForSelector('[data-testid="notification-preferences"]');

    // Disable email notifications for messages
    await receiverPage.click('[data-testid="email-messages-toggle"]');
    await receiverPage.waitForTimeout(500);

    // Enable push notifications for leave requests
    await receiverPage.click('[data-testid="push-leaves-toggle"]');
    await receiverPage.waitForTimeout(500);

    // Save preferences
    await receiverPage.click('[data-testid="save-preferences"]');
    await receiverPage.waitForSelector('[data-testid="success-message"]');

    // Verify preferences are saved
    await receiverPage.reload();
    await receiverPage.waitForSelector('[data-testid="notification-preferences"]');

    const emailMessagesEnabled = await receiverPage.$eval(
      '[data-testid="email-messages-toggle"]',
      el => el.getAttribute('aria-checked') === 'true'
    );
    expect(emailMessagesEnabled).toBe(false);

    const pushLeavesEnabled = await receiverPage.$eval(
      '[data-testid="push-leaves-toggle"]',
      el => el.getAttribute('aria-checked') === 'true'
    );
    expect(pushLeavesEnabled).toBe(true);
  });

  test('WebSocket reconnection handling', async () => {
    await loginAs(receiverPage, users.receiver);

    // Monitor WebSocket connection status
    await receiverPage.evaluate(() => {
      window.connectionStates = [];
      // @ts-ignore
      window.socket.on('connect', () => {
        window.connectionStates.push('connected');
      });
      // @ts-ignore
      window.socket.on('disconnect', () => {
        window.connectionStates.push('disconnected');
      });
      // @ts-ignore
      window.socket.on('reconnect', () => {
        window.connectionStates.push('reconnected');
      });
    });

    // Simulate connection loss
    await receiverPage.evaluate(() => {
      // @ts-ignore
      window.socket.disconnect();
    });

    await receiverPage.waitForTimeout(1000);

    // Simulate reconnection
    await receiverPage.evaluate(() => {
      // @ts-ignore
      window.socket.connect();
    });

    await receiverPage.waitForTimeout(2000);

    // Verify connection states
    const connectionStates = await receiverPage.evaluate(() => window.connectionStates);
    expect(connectionStates).toContain('disconnected');
    expect(connectionStates[connectionStates.length - 1]).toBe('connected');

    // Verify notifications still work after reconnection
    await senderPage.evaluate(async (receiverEmail) => {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'MESSAGE',
          recipientEmail: receiverEmail,
          title: 'Post-reconnection test',
          content: 'This should be received after reconnection'
        })
      });
      return response.ok;
    }, users.receiver.email);

    // Verify notification received
    await receiverPage.waitForSelector('[data-testid="notification-bell-badge"]', { timeout: 5000 });
  });
});