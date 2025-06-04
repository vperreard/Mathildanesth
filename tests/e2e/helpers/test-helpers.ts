import { prisma } from '../../../src/lib/prisma';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/prisma');


export interface TestUser {
  email: string;
  password: string;
  role: string;
  name?: string;
}

export async function createTestUser(user: TestUser) {
  const hashedPassword = await bcrypt.hash(user.password, 10);
  
  return await prisma.user.create({
    data: {
      email: user.email,
      password: hashedPassword,
      name: user.name || user.email.split('@')[0],
      role: user.role as any,
      isActive: true,
      emailVerified: true
    }
  });
}

export async function cleanupTestData(emails: string[]) {
  // Delete in correct order to avoid foreign key constraints
  
  // Delete notifications
  await prisma.notification.deleteMany({
    where: {
      OR: [
        { user: { email: { in: emails } } },
        { createdBy: { email: { in: emails } } }
      ]
    }
  });

  // Delete leave requests
  await prisma.leaveRequest.deleteMany({
    where: {
      user: { email: { in: emails } }
    }
  });

  // Delete assignments
  await prisma.assignment.deleteMany({
    where: {
      user: { email: { in: emails } }
    }
  });

  // Delete user requests
  await prisma.userRequest.deleteMany({
    where: {
      OR: [
        { requestor: { email: { in: emails } } },
        { targetUser: { email: { in: emails } } }
      ]
    }
  });

  // Delete quotas
  await prisma.leaveQuota.deleteMany({
    where: {
      user: { email: { in: emails } }
    }
  });

  // Finally delete users
  await prisma.user.deleteMany({
    where: {
      email: { in: emails }
    }
  });
}

export async function waitForElement(page: any, selector: string, timeout = 10000) {
  return await page.waitForSelector(selector, { timeout });
}

export async function waitForText(page: any, text: string, timeout = 10000) {
  return await page.waitForFunction(
    (searchText: string) => {
      return document.body.textContent?.includes(searchText);
    },
    { timeout },
    text
  );
}

export async function fillForm(page: any, formData: Record<string, string>) {
  for (const [selector, value] of Object.entries(formData)) {
    const element = await page.$(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    
    const tagName = await element.evaluate((el: Element) => el.tagName.toLowerCase());
    
    if (tagName === 'select') {
      await page.select(selector, value);
    } else if (tagName === 'input' || tagName === 'textarea') {
      await page.click(selector, { clickCount: 3 }); // Select all
      await page.type(selector, value);
    }
  }
}

export async function takeScreenshot(page: any, name: string) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  await page.screenshot({
    path: `./tests/e2e/screenshots/${name}-${timestamp}.png`,
    fullPage: true
  });
}

export async function measurePerformance(page: any, actionFn: () => Promise<void>) {
  const startTime = Date.now();
  const startMetrics = await page.metrics();
  
  await actionFn();
  
  const endTime = Date.now();
  const endMetrics = await page.metrics();
  
  return {
    duration: endTime - startTime,
    jsHeapUsedDelta: endMetrics.JSHeapUsedSize - startMetrics.JSHeapUsedSize,
    domNodesDelta: endMetrics.Nodes - startMetrics.Nodes
  };
}

export async function simulateNetworkConditions(page: any, preset: 'slow' | 'fast' | 'offline') {
  const conditions = {
    slow: {
      offline: false,
      downloadThroughput: 50 * 1024 / 8, // 50kb/s
      uploadThroughput: 20 * 1024 / 8,   // 20kb/s
      latency: 2000 // 2s latency
    },
    fast: {
      offline: false,
      downloadThroughput: 10 * 1024 * 1024 / 8, // 10mb/s
      uploadThroughput: 5 * 1024 * 1024 / 8,    // 5mb/s
      latency: 20 // 20ms latency
    },
    offline: {
      offline: true,
      downloadThroughput: 0,
      uploadThroughput: 0,
      latency: 0
    }
  };
  
  const client = await page.target().createCDPSession();
  await client.send('Network.emulateNetworkConditions', conditions[preset]);
}