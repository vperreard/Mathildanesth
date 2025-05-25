const puppeteer = require('puppeteer');
const config = require('../config/puppeteer.config');
const PuppeteerHelpers = require('../utils/puppeteer-helpers');

describe('Workflow Congés E2E', () => {
    let browser;
    let page;

    beforeAll(async () => {
        console.log('🚀 Démarrage du navigateur pour les tests congés...');
        browser = await puppeteer.launch(config.browser);
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
            console.log('🛑 Navigateur fermé');
        }
    });

    beforeEach(async () => {
        page = await browser.newPage();
        await page.setViewport(config.page.viewport);

        // Configuration des timeouts
        page.setDefaultTimeout(config.page.defaultTimeout);
        page.setDefaultNavigationTimeout(config.page.defaultNavigationTimeout);

        // Intercepter les erreurs de la console pour debug
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                console.log('❌ Erreur Console:', msg.text());
            }
        });

        // Capturer les erreurs de page
        page.on('pageerror', (error) => {
            console.error('💥 Erreur Page:', error.message);
        });
    });

    afterEach(async () => {
        if (page) {
            await page.close();
        }
    });

    describe('🔐 Authentification et Accès', () => {
        test('Connexion utilisateur et accès à la section congés', async () => {
            try {
                // 1. Authentification
                await PuppeteerHelpers.login(page);

                // 2. Navigation vers la section congés
                await PuppeteerHelpers.navigateToSection(page, 'leaves');

                // 3. Vérification que la page congés est chargée
                await PuppeteerHelpers.verifyPageLoad(page, [
                    'h1:has-text("Mes Congés")',
                    '[data-testid="leave-balance"], .solde-conges',
                    'button:has-text("Nouvelle demande")'
                ]);

                // 4. Screenshot de validation
                await PuppeteerHelpers.screenshot(page, 'leaves-page-loaded');

                // 5. Vérifications spécifiques
                const pageTitle = await page.textContent('h1');
                expect(pageTitle).toContain('Congés');

                const newRequestButton = await page.isVisible('button:has-text("Nouvelle demande")');
                expect(newRequestButton).toBeTruthy();

                console.log('✅ Test authentification et accès réussi');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'auth-access-error', true);
                throw error;
            }
        });

        test('Gestion des permissions - accès refusé pour utilisateur non connecté', async () => {
            try {
                // Aller directement à la page congés sans connexion
                await page.goto(`${config.urls.base}${config.urls.leaves}`);

                // Vérifier redirection vers login ou message d'erreur
                await page.waitForSelector('text="Accès refusé", text="Connexion requise", form[action*="login"]', {
                    timeout: config.timeouts.medium
                });

                await PuppeteerHelpers.screenshot(page, 'access-denied');
                console.log('✅ Test permissions - accès refusé confirmé');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'permission-test-error');
                throw error;
            }
        });
    });

    describe('📝 Création de Demande de Congé', () => {
        beforeEach(async () => {
            // Setup : connexion et navigation
            await PuppeteerHelpers.login(page);
            await PuppeteerHelpers.navigateToSection(page, 'leaves');
        });

        test('Ouverture et fermeture du formulaire de demande', async () => {
            try {
                // 1. Ouvrir la modale de création
                await PuppeteerHelpers.handleModal(
                    page,
                    'open',
                    '[data-testid="leave-modal"], .modal, dialog',
                    'button:has-text("Nouvelle demande")'
                );

                // 2. Vérifier que le formulaire est présent
                await page.waitForSelector('form[data-testid="leave-form"], form:has(input[name="startDate"])', {
                    timeout: config.timeouts.medium
                });

                await PuppeteerHelpers.screenshot(page, 'leave-form-opened');

                // 3. Fermer la modale
                await PuppeteerHelpers.handleModal(page, 'close', '[data-testid="leave-modal"], .modal, dialog');

                console.log('✅ Test ouverture/fermeture formulaire réussi');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'form-modal-error');
                throw error;
            }
        });

        test('Remplissage complet du formulaire de congé', async () => {
            try {
                // 1. Ouvrir le formulaire
                await PuppeteerHelpers.handleModal(
                    page,
                    'open',
                    '[data-testid="leave-modal"], .modal, dialog',
                    'button:has-text("Nouvelle demande")'
                );

                // 2. Remplir le formulaire avec des données valides
                const formData = {
                    'input[name="startDate"], input[placeholder*="Début"]': '26/05/2025',
                    'input[name="endDate"], input[placeholder*="Fin"]': '30/05/2025',
                    'textarea[name="reason"], textarea[placeholder*="Motif"]': 'Congés annuels - Test E2E'
                };

                await PuppeteerHelpers.fillForm(page, formData);

                // 3. Sélectionner le type de congé si présent
                try {
                    await page.waitForSelector('select[name="leaveType"], select[name="type"]', { timeout: 5000 });
                    await page.selectOption('select[name="leaveType"], select[name="type"]', 'CP');
                } catch {
                    console.log('ℹ️  Pas de sélecteur de type de congé trouvé');
                }

                // 4. Screenshot du formulaire rempli
                await PuppeteerHelpers.screenshot(page, 'leave-form-filled');

                // 5. Vérifier que le bouton submit est activé
                const submitButton = await page.locator('button[type="submit"], button:has-text("Soumettre")').first();
                const isEnabled = await submitButton.isEnabled();
                expect(isEnabled).toBeTruthy();

                console.log('✅ Test remplissage formulaire réussi');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'form-fill-error');
                throw error;
            }
        });

        test('Validation des champs obligatoires', async () => {
            try {
                // 1. Ouvrir le formulaire
                await PuppeteerHelpers.handleModal(
                    page,
                    'open',
                    '[data-testid="leave-modal"], .modal, dialog',
                    'button:has-text("Nouvelle demande")'
                );

                // 2. Essayer de soumettre sans remplir les champs
                await page.click('button[type="submit"], button:has-text("Soumettre")');

                // 3. Vérifier qu'il y a des messages d'erreur
                await page.waitForSelector('.error, [data-testid="error"], .text-red-500, .invalid-feedback', {
                    timeout: config.timeouts.fast
                });

                await PuppeteerHelpers.screenshot(page, 'form-validation-errors');

                // 4. Vérifier que la modale reste ouverte (pas de soumission)
                const modalVisible = await page.isVisible('[data-testid="leave-modal"], .modal, dialog');
                expect(modalVisible).toBeTruthy();

                console.log('✅ Test validation champs obligatoires réussi');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'validation-test-error');
                throw error;
            }
        });
    });

    describe('📊 Interface et Navigation', () => {
        beforeEach(async () => {
            await PuppeteerHelpers.login(page);
            await PuppeteerHelpers.navigateToSection(page, 'leaves');
        });

        test('Affichage du solde de congés', async () => {
            try {
                // Attendre que les données de solde soient chargées
                await page.waitForSelector('[data-testid="leave-balance"], .solde-conges, .balance', {
                    timeout: config.timeouts.slow
                });

                // Vérifier que les informations de solde sont présentes
                const balanceElements = await page.locator('.solde, .balance, [data-testid*="balance"]').count();
                expect(balanceElements).toBeGreaterThan(0);

                await PuppeteerHelpers.screenshot(page, 'leave-balance-display');
                console.log('✅ Test affichage solde congés réussi');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'balance-display-error');
                throw error;
            }
        });

        test('Filtres et recherche', async () => {
            try {
                // Chercher les éléments de filtre
                const filterElements = [
                    'input[type="search"], input[placeholder*="Recherche"]',
                    'select[name*="filter"], select[name*="status"]',
                    'button:has-text("Filtrer")'
                ];

                for (const selector of filterElements) {
                    try {
                        await page.waitForSelector(selector, { timeout: 3000 });
                        console.log(`  ✓ Filtre trouvé: ${selector}`);
                    } catch {
                        console.log(`  ℹ️  Filtre optionnel non trouvé: ${selector}`);
                    }
                }

                await PuppeteerHelpers.screenshot(page, 'leave-filters');
                console.log('✅ Test filtres et recherche réussi');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'filters-test-error');
                throw error;
            }
        });
    });

    describe('🐛 Gestion d\'Erreurs', () => {
        beforeEach(async () => {
            await PuppeteerHelpers.login(page);
            await PuppeteerHelpers.navigateToSection(page, 'leaves');
        });

        test('Gestion des erreurs réseau', async () => {
            try {
                // Simuler une perte de connexion
                await page.setOfflineMode(true);

                // Essayer d'ouvrir le formulaire ou rafraîchir
                await page.reload();

                // Vérifier qu'un message d'erreur approprié apparaît
                // (ou que l'application gère gracieusement la déconnexion)
                await page.waitForSelector('.error, .offline, [data-testid="network-error"]', {
                    timeout: config.timeouts.medium
                });

                await PuppeteerHelpers.screenshot(page, 'network-error-handling');

                // Remettre en ligne
                await page.setOfflineMode(false);

                console.log('✅ Test gestion erreurs réseau réussi');
            } catch (error) {
                await page.setOfflineMode(false); // Cleanup
                await PuppeteerHelpers.screenshot(page, 'network-error-test-failed');
                throw error;
            }
        });
    });
}); 