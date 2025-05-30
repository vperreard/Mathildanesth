// Test rapide de la configuration headless
const puppeteer = require('puppeteer');

const defaultPuppeteerConfig = {
    headless: process.env.HEADLESS === 'true' ? 'new' : 'new', // Force headless pour ce test
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

async function testHeadlessConfig() {
    console.log('🧪 Test de la configuration headless...');
    
    // Test 1: Configuration par défaut
    console.log('📋 Configuration par défaut:', JSON.stringify(defaultPuppeteerConfig, null, 2));
    
    try {
        // Test 2: Lancement du navigateur
        console.log('🚀 Lancement du navigateur en mode headless...');
        const browser = await puppeteer.launch(defaultPuppeteerConfig);
        
        // Test 3: Création d'une page de test
        const page = await browser.newPage();
        await page.goto('https://google.com', { waitUntil: 'networkidle2', timeout: 10000 });
        
        console.log('✅ Navigateur lancé avec succès en mode headless');
        console.log('🏁 Fermeture du navigateur...');
        
        await browser.close();
        console.log('✅ Navigateur fermé avec succès');
        
        // Test 4: Vérifier qu'aucun processus ne reste
        setTimeout(() => {
            const { exec } = require('child_process');
            exec('ps aux | grep -i chrome | grep -v grep', (error, stdout) => {
                if (stdout.trim()) {
                    console.log('⚠️  Processus Chrome détectés après fermeture:');
                    console.log(stdout);
                    
                    // Force cleanup pour macOS
                    console.log('🧹 Force cleanup des processus Chrome...');
                    exec('pkill -f "Google Chrome for Testing"', (killError) => {
                        if (!killError) {
                            console.log('✅ Processus Chrome nettoyés avec succès');
                        }
                    });
                } else {
                    console.log('✅ Aucun processus Chrome restant');
                }
                console.log('🎉 Test terminé');
            });
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
    }
}

testHeadlessConfig();