import puppeteer, { Browser, Page } from 'puppeteer';

describe('Debug Login', () => {
    let browser: Browser;
    let page: Page;
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: false, // Voir le navigateur
            slowMo: 100, // Ralentir les actions
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    test('Vérifier la page de login', async () => {
        page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        console.log('Navigating to:', `${baseUrl}/auth/connexion`);
        
        // Aller à la page de login
        await page.goto(`${baseUrl}/auth/connexion`, { waitUntil: 'networkidle0' });
        
        // Prendre un screenshot
        await page.screenshot({ 
            path: './tests/e2e/screenshots/login-page-debug.png',
            fullPage: true 
        });
        
        // Attendre un peu plus longtemps
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Vérifier s'il y a des erreurs sur la page
        const pageContent = await page.content();
        console.log('Page title:', await page.title());
        console.log('Page URL:', page.url());
        
        // Chercher les inputs avec des sélecteurs plus larges
        console.log('Searching for login input...');
        
        const loginInput = await page.$('input[name="login"]');
        const passwordInput = await page.$('input[name="password"]');
        const submitButton = await page.$('button[type="submit"]');
        
        console.log('Login input found:', !!loginInput);
        console.log('Password input found:', !!passwordInput);
        console.log('Submit button found:', !!submitButton);
        
        // Si on trouve les éléments, essayer de se connecter
        if (loginInput && passwordInput && submitButton) {
            console.log('Typing credentials...');
            await loginInput.type('admin');
            await passwordInput.type('admin');
            
            console.log('Clicking submit...');
            await submitButton.click();
            
            // Attendre la navigation
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
            
            console.log('Current URL after login:', page.url());
            
            // Prendre un screenshot après login
            await page.screenshot({ 
                path: './tests/e2e/screenshots/after-login-debug.png',
                fullPage: true 
            });
        }
    });
});