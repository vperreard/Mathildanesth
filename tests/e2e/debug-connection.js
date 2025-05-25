const puppeteer = require('puppeteer');

async function testConnection() {
    console.log('🔍 Test de connexion Puppeteer...\n');
    
    let browser;
    try {
        // 1. Vérifier que le serveur est accessible
        console.log('1. Vérification du serveur...');
        try {
            const response = await fetch('http://localhost:3000');
            console.log(`   ✅ Serveur accessible - Status: ${response.status}`);
        } catch (error) {
            console.log('   ❌ Serveur non accessible!');
            console.log('   Lancez le serveur avec: npm run dev');
            return;
        }

        // 2. Lancer le navigateur
        console.log('\n2. Lancement de Puppeteer...');
        browser = await puppeteer.launch({
            headless: false,
            slowMo: 100,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ],
            // Timeout plus long pour le lancement
            timeout: 30000
        });
        console.log('   ✅ Browser lancé');

        // 3. Créer une page
        console.log('\n3. Création d\'une nouvelle page...');
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        console.log('   ✅ Page créée');

        // 4. Définir un user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        // 5. Naviguer vers la page d'accueil
        console.log('\n4. Navigation vers localhost:3000...');
        try {
            const response = await page.goto('http://localhost:3000', {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            console.log(`   ✅ Page chargée - Status: ${response.status()}`);
            console.log(`   URL actuelle: ${page.url()}`);
        } catch (error) {
            console.log('   ❌ Erreur de navigation:', error.message);
        }

        // 6. Attendre un peu pour voir
        console.log('\n5. Attente de 3 secondes...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 7. Prendre un screenshot
        console.log('\n6. Capture d\'écran...');
        await page.screenshot({ 
            path: './tests/e2e/screenshots/debug-home.png',
            fullPage: true 
        });
        console.log('   ✅ Screenshot sauvegardé: ./tests/e2e/screenshots/debug-home.png');

        // 8. Essayer de naviguer vers /auth/login
        console.log('\n7. Navigation vers /auth/login...');
        try {
            await page.goto('http://localhost:3000/auth/login', {
                waitUntil: 'networkidle0',
                timeout: 30000
            });
            console.log(`   ✅ Page login chargée`);
            console.log(`   URL actuelle: ${page.url()}`);
            
            // Vérifier la présence du formulaire
            console.log('\n8. Recherche du formulaire de login...');
            const loginInput = await page.$('input[name="login"]');
            const passwordInput = await page.$('input[name="password"]');
            const submitButton = await page.$('button[type="submit"]');
            
            console.log(`   Login input trouvé: ${loginInput !== null ? '✅' : '❌'}`);
            console.log(`   Password input trouvé: ${passwordInput !== null ? '✅' : '❌'}`);
            console.log(`   Submit button trouvé: ${submitButton !== null ? '✅' : '❌'}`);
            
            if (loginInput && passwordInput && submitButton) {
                console.log('\n9. Test de remplissage du formulaire...');
                await loginInput.type('admin');
                await passwordInput.type('admin');
                console.log('   ✅ Formulaire rempli');
                
                await page.screenshot({ 
                    path: './tests/e2e/screenshots/debug-login-filled.png',
                    fullPage: true 
                });
                console.log('   ✅ Screenshot du formulaire rempli sauvegardé');
            }
            
        } catch (error) {
            console.log('   ❌ Erreur navigation login:', error.message);
        }

        console.log('\n✅ Test terminé! Le navigateur reste ouvert 10 secondes...');
        await new Promise(resolve => setTimeout(resolve, 10000));

    } catch (error) {
        console.error('\n❌ Erreur globale:', error);
    } finally {
        if (browser) {
            await browser.close();
            console.log('\n🔒 Browser fermé');
        }
    }
}

// Lancer le test
testConnection().catch(console.error);