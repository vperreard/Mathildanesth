import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 100,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
        console.log('Navigation vers la page de login...');
        await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle0' });
        
        console.log('Attente du formulaire...');
        await page.waitForSelector('input[name="login"]', { timeout: 10000 });
        
        console.log('Remplissage des champs...');
        await page.type('input[name="login"]', 'admin');
        await page.type('input[name="password"]', 'admin');
        
        console.log('Soumission du formulaire...');
        await page.click('button[type="submit"]');
        
        console.log('Attente de la redirection...');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        
        console.log('URL après login:', page.url());
        
        // Vérifier qu'on est bien connecté
        const isHomePage = page.url().includes('localhost:3000') && !page.url().includes('/auth/login');
        console.log('Login réussi:', isHomePage);
        
        if (isHomePage) {
            console.log('✅ Login fonctionne correctement avec admin/admin');
            
            // Aller sur la page de configuration
            await page.goto('http://localhost:3000/parametres/configuration', { waitUntil: 'networkidle0' });
            console.log('✅ Navigation vers la page de configuration réussie');
            
            // Prendre un screenshot
            await page.screenshot({ path: './tests/e2e/screenshots/config-page.png', fullPage: true });
            console.log('✅ Screenshot pris');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        await page.screenshot({ path: './tests/e2e/screenshots/error.png', fullPage: true });
    } finally {
        await browser.close();
    }
})();