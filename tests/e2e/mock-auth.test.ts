import puppeteer, { Browser, Page } from 'puppeteer';

describe('Tests avec authentification mockée', () => {
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

    beforeEach(async () => {
        page = await browser.newPage();
        
        // Intercepter les requêtes pour mocker l'authentification
        await page.setRequestInterception(true);
        
        page.on('request', (request) => {
            const url = request.url();
            
            // Mocker les appels d'authentification
            if (url.includes('/api/auth/session')) {
                request.respond({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        user: {
                            id: 1,
                            email: 'admin@mathildanesth.com',
                            name: 'Admin Test',
                            role: 'ADMIN'
                        },
                        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                    })
                });
            }
            // Mocker le CSRF token
            else if (url.includes('/api/auth/csrf')) {
                request.respond({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        csrfToken: 'mock-csrf-token'
                    })
                });
            }
            // Laisser passer les autres requêtes
            else {
                request.continue();
            }
        });
        
        // Ajouter un cookie d'authentification mocké
        await page.setCookie({
            name: 'auth_token',
            value: 'mock-auth-token',
            domain: 'localhost',
            path: '/',
            httpOnly: true
        });
    });

    afterEach(async () => {
        if (page) {
            await page.close();
        }
    });

    test('Peut accéder au tableau de bord avec auth mockée', async () => {
        // Aller directement au tableau de bord
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });
        
        // Attendre que la page se charge
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Prendre un screenshot
        await page.screenshot({ 
            path: './tests/e2e/screenshots/dashboard-mocked.png',
            fullPage: true 
        });
        
        // Vérifier qu'on est sur le tableau de bord
        const title = await page.title();
        console.log('Dashboard title:', title);
        
        // Chercher des éléments du tableau de bord
        const dashboardElements = await page.$$('[data-testid*="dashboard"]');
        console.log('Dashboard elements found:', dashboardElements.length);
        
        // Chercher le menu utilisateur (indique qu'on est connecté)
        const userMenu = await page.$('[data-testid="user-menu"], .user-menu, button[aria-label*="profil"]');
        console.log('User menu found:', !!userMenu);
    });

    test('Peut naviguer vers la gestion des sites', async () => {
        // Aller au tableau de bord d'abord
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });
        
        // Attendre un peu
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Essayer de naviguer vers les paramètres
        const response = await page.goto(`${baseUrl}/parametres/hopitaux`, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        console.log('Sites page status:', response?.status());
        
        // Attendre que la page se charge
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Prendre un screenshot
        await page.screenshot({ 
            path: './tests/e2e/screenshots/sites-page-mocked.png',
            fullPage: true 
        });
        
        // Chercher des éléments de la page des sites
        const pageTitle = await page.$('h1, h2');
        if (pageTitle) {
            const titleText = await pageTitle.evaluate(el => el.textContent);
            console.log('Page title text:', titleText);
        }
        
        // Chercher des boutons d'action
        const addButton = await page.$('button[data-testid*="add"], button:has-text("Ajouter"), button:has-text("Nouveau")');
        console.log('Add button found:', !!addButton);
    });
});