const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = async () => {
    console.log('🚀 Initialisation de l\'environnement de test E2E...');

    // Créer le dossier screenshots si inexistant
    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // S'assurer que l'utilisateur de test existe
    try {
        console.log('👤 Création de l\'utilisateur de test...');
        execSync('node create-test-user.js', { stdio: 'pipe' });
        console.log('✅ Utilisateur de test créé/mis à jour');
    } catch (error) {
        console.warn('⚠️  Attention: Erreur lors de la création de l\'utilisateur de test:', error.message);
    }

    // Vérifier que l'application est accessible
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    console.log(`🌐 Vérification de l'accessibilité de l'application sur ${baseUrl}...`);

    try {
        const { default: fetch } = await import('node-fetch');
        const response = await fetch(baseUrl);
        if (response.ok) {
            console.log('✅ Application accessible et prête pour les tests');
        } else {
            console.warn('⚠️  L\'application répond mais avec un code d\'erreur:', response.status);
        }
    } catch (error) {
        console.error('❌ Impossible d\'accéder à l\'application. Assurez-vous qu\'elle est démarrée:', error.message);
        throw new Error('L\'application doit être démarrée avant de lancer les tests E2E');
    }

    // Configuration des variables d'environnement globales pour les tests
    process.env.PUPPETEER_HEADLESS = process.env.CI ? 'true' : 'false';
    process.env.PUPPETEER_SLOWMO = process.env.CI ? '0' : '100';

    console.log('✅ Environnement de test E2E initialisé avec succès !');
}; 