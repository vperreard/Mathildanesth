import { Page } from 'puppeteer';
import { testConfig } from '../config/test-config';

export async function loginAs(page: Page, user: { email: string; password: string }) {
  await page.goto(`${testConfig.baseUrl}/auth/connexion`);
  await page.waitForSelector('[data-testid="email-input"]');
  
  await page.type('[data-testid="email-input"]', user.email);
  await page.type('[data-testid="password-input"]', user.password);
  await page.click('[data-testid="login-button"]');
  
  // Wait for navigation to complete
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  
  // Verify login succeeded
  const url = page.url();
  if (url.includes('/auth/connexion')) {
    throw new Error(`Login failed for user: ${user.email}`);
  }
}

export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.waitForSelector('[data-testid="logout-button"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForNavigation();
}

export async function waitForNotification(page: Page, text: string, timeout = 5000) {
  await page.waitForFunction(
    (notificationText: string) => {
      const notifications = document.querySelectorAll('[role="alert"], .notification, .toast');
      return Array.from(notifications).some(el => el.textContent?.includes(notificationText));
    },
    { timeout },
    text
  );
}

export async function getAuthToken(page: Page): Promise<string | undefined> {
  const cookies = await page.cookies();
  const authCookie = cookies.find(c => c.name === 'auth-token');
  return authCookie?.value;
}

export async function setAuthToken(page: Page, token: string) {
  await page.setCookie({
    name: 'auth-token',
    value: token,
    domain: new URL(testConfig.baseUrl).hostname,
    path: '/',
    httpOnly: true,
    secure: false
  });
}