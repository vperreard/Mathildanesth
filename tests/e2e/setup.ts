// Configuration globale pour les tests E2E
jest.setTimeout(60000); // 60 secondes par défaut

// Variables d'environnement pour les tests
process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
process.env.HEADLESS = process.env.HEADLESS || 'true';
process.env.SLOWMO = process.env.SLOWMO || '0';

// Helper pour prendre des screenshots en cas d'échec
export async function takeScreenshot(page: any, testName: string) {
    const screenshotPath = `./tests/e2e/screenshots/${testName}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved: ${screenshotPath}`);
}

// Configuration globale pour gérer les erreurs
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});