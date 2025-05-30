// import { Browser } from 'puppeteer';

// Configuration globale pour les tests E2E
jest.setTimeout(60000); // 60 secondes par défaut

// Variables d'environnement pour les tests
process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
process.env.HEADLESS = process.env.HEADLESS || 'true';
process.env.SLOWMO = process.env.SLOWMO || '0';

// Stockage des instances de navigateur pour cleanup
const browserInstances = [];

// Configuration Puppeteer par défaut avec mode headless et cleanup
const defaultPuppeteerConfig = {
    headless: process.env.HEADLESS === 'true' ? 'new' : false,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--window-size=1400,1200'
    ],
    defaultViewport: {
        width: 1400,
        height: 1200
    }
};

// Helper pour lancer un navigateur avec cleanup automatique
async function launchBrowserWithCleanup(puppeteer, config = {}) {
    const finalConfig = { ...defaultPuppeteerConfig, ...config };
    const browser = await puppeteer.launch(finalConfig);
    browserInstances.push(browser);
    console.log('Navigateur Puppeteer lancé en mode headless avec cleanup automatique configuré');
    return browser;
}

// Helper pour prendre des screenshots en cas d'échec
async function takeScreenshot(page, testName) {
    const screenshotPath = `./tests/e2e/screenshots/${testName}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved: ${screenshotPath}`);
}

// Cleanup automatique de tous les navigateurs
async function cleanupAllBrowsers() {
    console.log('Nettoyage automatique des navigateurs Puppeteer...');
    for (const browser of browserInstances) {
        try {
            await browser.close();
        } catch (error) {
            console.warn('Erreur lors de la fermeture d\'un navigateur:', error);
        }
    }
    browserInstances.length = 0;
    
    // Force cleanup des processus chrome restants
    if (process.platform === 'darwin') {
        // macOS
        require('child_process').exec('pkill -f "Google Chrome for Testing"', (error) => {
            if (!error) console.log('Processus Chrome nettoyés avec succès (macOS)');
        });
    } else if (process.platform === 'linux') {
        // Linux
        require('child_process').exec('pkill -f chrome', (error) => {
            if (!error) console.log('Processus Chrome nettoyés avec succès (Linux)');
        });
    } else if (process.platform === 'win32') {
        // Windows
        require('child_process').exec('taskkill /F /IM chrome.exe /T', (error) => {
            if (!error) console.log('Processus Chrome nettoyés avec succès (Windows)');
        });
    }
}

// Configuration globale pour gérer les erreurs
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Cleanup automatique à la fin des tests
afterAll(async () => {
    await cleanupAllBrowsers();
});

module.exports = {
    defaultPuppeteerConfig,
    launchBrowserWithCleanup,
    takeScreenshot,
    cleanupAllBrowsers
};