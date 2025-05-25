// Setup global pour les tests E2E Puppeteer
const { execSync } = require('child_process');
const puppeteer = require('puppeteer');

// Configuration globale des timeouts
jest.setTimeout(60000);

// Variables globales pour Puppeteer
global.puppeteer = puppeteer;

// Helper pour créer un utilisateur de test
global.createTestUser = async () => {
    try {
        execSync('node create-test-user.js', { stdio: 'pipe' });
        return {
            email: 'test@mathildanesth.fr',
            password: 'test123',
            userId: 59,
            role: 'ADMIN_TOTAL'
        };
    } catch (error) {
        console.error('Erreur création utilisateur test:', error);
        throw error;
    }
};

// Helper pour démarrer l'application en mode test
global.startTestServer = async () => {
    // L'application doit être démarrée manuellement ou via CI
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    return baseUrl;
};

// Helper pour attendre qu'un élément soit présent
global.waitForElement = async (page, selector, timeout = 10000) => {
    await page.waitForSelector(selector, { timeout });
};

// Helper pour remplir un formulaire
global.fillForm = async (page, formData) => {
    for (const [selector, value] of Object.entries(formData)) {
        await page.type(selector, value);
    }
};

// Helper pour capturer des screenshots en cas d'erreur
global.captureScreenshotOnError = async (page, testName) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `error-${testName}-${timestamp}.png`;
    await page.screenshot({
        path: `tests/e2e/screenshots/${filename}`,
        fullPage: true
    });
    console.log(`Screenshot capturé: ${filename}`);
}; 