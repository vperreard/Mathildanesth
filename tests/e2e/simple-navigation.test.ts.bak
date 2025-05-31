import puppeteer, { Browser, Page } from 'puppeteer';

describe('Simple Navigation Test', () => {
    let browser: Browser;
    let page: Page;
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    test('Peut naviguer vers la page de connexion', async () => {
        page = await browser.newPage();
        
        // Intercepter les erreurs de console pour le debug
        page.on('console', msg => console.log('Browser console:', msg.type(), msg.text()));
        page.on('pageerror', err => console.log('Page error:', err.message));
        
        // Aller à la page d'accueil
        const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
        
        console.log('Response status:', response?.status());
        console.log('Response URL:', response?.url());
        
        // Vérifier que la page charge
        expect(response?.status()).toBe(200);
        
        // Attendre un peu
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Prendre un screenshot
        await page.screenshot({ 
            path: './tests/e2e/screenshots/home-page.png',
            fullPage: true 
        });
        
        // Vérifier le titre
        const title = await page.title();
        console.log('Page title:', title);
        expect(title).toBeTruthy();
    });

    test('Peut accéder à la page de connexion directement', async () => {
        page = await browser.newPage();
        
        // Intercepter les erreurs
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('Console error:', msg.text());
            }
        });
        
        // Aller directement à la page de connexion
        const response = await page.goto(`${baseUrl}/auth/connexion`, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
        
        console.log('Login page status:', response?.status());
        
        // Attendre que la page se stabilise
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Prendre un screenshot après le délai
        await page.screenshot({ 
            path: './tests/e2e/screenshots/login-page-after-delay.png',
            fullPage: true 
        });
        
        // Essayer de trouver n'importe quel input
        const inputs = await page.$$('input');
        console.log('Number of inputs found:', inputs.length);
        
        // Essayer de trouver n'importe quel bouton
        const buttons = await page.$$('button');
        console.log('Number of buttons found:', buttons.length);
        
        // Vérifier le contenu HTML
        const bodyHTML = await page.$eval('body', el => el.innerHTML);
        console.log('Body contains "Connexion":', bodyHTML.includes('Connexion'));
        console.log('Body contains "login":', bodyHTML.includes('login'));
        console.log('Body contains "Error":', bodyHTML.includes('Error'));
    });
});