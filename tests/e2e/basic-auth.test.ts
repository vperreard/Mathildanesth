import puppeteer, { Browser, Page } from 'puppeteer';

describe('Test Basique Authentification', () => {
    let browser: Browser;
    let page: Page;
    const baseUrl = 'http://localhost:3000';

    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
        });
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    test('Peut accéder à la page de connexion sans erreur', async () => {
        page = await browser.newPage();
        
        // Ignorer les erreurs de certificat et CORS
        await page.setBypassCSP(true);
        
        // Capturer les logs console
        const consoleLogs: string[] = [];
        page.on('console', msg => {
            const text = msg.text();
            consoleLogs.push(`${msg.type()}: ${text}`);
        });
        
        // Essayer d'accéder à la page
        try {
            const response = await page.goto(`${baseUrl}/auth/connexion`, { 
                waitUntil: 'domcontentloaded',
                timeout: 10000 
            });
            
            console.log('Response status:', response?.status());
            console.log('Response headers:', response?.headers());
            
            // Attendre un peu
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Prendre un screenshot
            await page.screenshot({ 
                path: './tests/e2e/screenshots/basic-auth-test.png',
                fullPage: true 
            });
            
            // Vérifier le contenu HTML
            const html = await page.content();
            console.log('HTML length:', html.length);
            console.log('Contains form:', html.includes('<form'));
            console.log('Contains input:', html.includes('<input'));
            
            // Essayer de trouver le formulaire avec JavaScript
            const hasLoginForm = await page.evaluate(() => {
                return {
                    hasForm: !!document.querySelector('form'),
                    inputCount: document.querySelectorAll('input').length,
                    hasLoginInput: !!document.querySelector('input[name="login"]'),
                    hasPasswordInput: !!document.querySelector('input[type="password"]'),
                    hasSubmitButton: !!document.querySelector('button[type="submit"]'),
                    bodyText: document.body.innerText.substring(0, 500)
                };
            });
            
            console.log('Form check results:', hasLoginForm);
            
            // Afficher les logs console capturés
            if (consoleLogs.length > 0) {
                console.log('\nConsole logs from page:');
                consoleLogs.forEach(log => console.log('  ', log));
            }
            
            // Le test passe si on a réussi à charger la page
            expect(response?.status()).toBeLessThan(500);
            
        } catch (error) {
            console.error('Error during test:', error);
            
            // Prendre un screenshot d'erreur
            await page.screenshot({ 
                path: './tests/e2e/screenshots/basic-auth-error.png',
                fullPage: true 
            });
            
            throw error;
        }
    });
});