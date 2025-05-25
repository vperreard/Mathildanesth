module.exports = async () => {
    console.log('🧹 Nettoyage de l\'environnement de test E2E...');

    // Fermer toutes les connexions ouvertes
    if (global.browser) {
        await global.browser.close();
        console.log('✅ Navigateur fermé');
    }

    // Nettoyer les variables d'environnement temporaires
    delete process.env.PUPPETEER_HEADLESS;
    delete process.env.PUPPETEER_SLOWMO;

    // Optionnel: nettoyer les données de test créées
    // (non implémenté pour éviter de supprimer des données importantes)

    console.log('✅ Nettoyage terminé !');
}; 