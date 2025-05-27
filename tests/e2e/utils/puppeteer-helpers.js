const config = require('../config/puppeteer.config');

/**
 * Helpers Puppeteer pour les tests E2E Mathildanesth
 */
class PuppeteerHelpers {

    /**
     * Authentification complète d'un utilisateur
     * @param {Page} page - Instance de page Puppeteer
     * @param {Object} user - Utilisateur à connecter {email, password}
     */
    static async login(page, user = config.testUser) {
        console.log(`🔐 Connexion de l'utilisateur: ${user.email}`);

        // Aller à la page de connexion
        await page.goto(`${config.urls.base}${config.urls.login}`, {
            waitUntil: 'networkidle2'
        });

        // Attendre que le formulaire soit présent
        await page.waitForSelector(config.selectors.auth.loginForm, {
            timeout: config.timeouts.medium
        });

        // Remplir les champs
        await page.type(config.selectors.auth.emailInput, user.email);
        await page.type(config.selectors.auth.passwordInput, user.password);

        // Cliquer sur le bouton de connexion
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: config.timeouts.slow }),
            page.click(config.selectors.auth.loginButton)
        ]);

        // Vérifier que la connexion a réussi (redirection vers la page d'accueil)
        const currentUrl = page.url();
        if (currentUrl.includes('/auth/connexion')) {
            throw new Error('Échec de l\'authentification - toujours sur la page de connexion');
        }

        console.log('✅ Connexion réussie');
        return true;
    }

    /**
     * Navigation vers une section avec gestion des menus déroulants
     * @param {Page} page - Instance de page Puppeteer
     * @param {string} section - Section à atteindre ('leaves', 'planning', 'admin')
     */
    static async navigateToSection(page, section) {
        console.log(`🧭 Navigation vers la section: ${section}`);

        switch (section) {
            case 'leaves':
                // Ouvrir le menu Planning
                await page.click(config.selectors.navigation.planningDropdown);
                await page.waitForSelector(config.selectors.navigation.leavesLink, {
                    timeout: config.timeouts.fast
                });

                // Cliquer sur Congés
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'networkidle2' }),
                    page.click(config.selectors.navigation.leavesLink)
                ]);
                break;

            case 'planning':
                await page.goto(`${config.urls.base}${config.urls.planning}`, {
                    waitUntil: 'networkidle2'
                });
                break;

            case 'admin':
                await page.goto(`${config.urls.base}${config.urls.admin}`, {
                    waitUntil: 'networkidle2'
                });
                break;

            default:
                throw new Error(`Section inconnue: ${section}`);
        }

        console.log(`✅ Navigation vers ${section} terminée`);
    }

    /**
     * Attendre qu'un élément soit visible et cliquable
     * @param {Page} page - Instance de page Puppeteer
     * @param {string} selector - Sélecteur CSS
     * @param {number} timeout - Timeout en millisecondes
     */
    static async waitForClickable(page, selector, timeout = config.timeouts.medium) {
        await page.waitForSelector(selector, {
            visible: true,
            timeout
        });

        // S'assurer que l'élément est cliquable (pas disabled)
        await page.waitForFunction(
            (sel) => {
                const element = document.querySelector(sel);
                return element && !element.disabled && !element.classList.contains('disabled');
            },
            { timeout },
            selector
        );
    }

    /**
     * Remplir un formulaire avec gestion des erreurs
     * @param {Page} page - Instance de page Puppeteer
     * @param {Object} formData - Données du formulaire {selector: value}
     * @param {Object} options - Options {clearFields: boolean}
     */
    static async fillForm(page, formData, options = { clearFields: true }) {
        console.log('📝 Remplissage du formulaire...');

        for (const [selector, value] of Object.entries(formData)) {
            try {
                await page.waitForSelector(selector, { timeout: config.timeouts.fast });

                if (options.clearFields) {
                    // Triple-clic pour sélectionner tout le texte puis remplacer
                    await page.click(selector, { clickCount: 3 });
                }

                await page.type(selector, value.toString(), { delay: 50 });
                console.log(`  ✓ ${selector}: "${value}"`);
            } catch (error) {
                console.error(`  ❌ Erreur pour ${selector}:`, error.message);
                throw error;
            }
        }

        console.log('✅ Formulaire rempli');
    }

    /**
     * Gérer les modales (ouvrir, fermer, interagir)
     * @param {Page} page - Instance de page Puppeteer
     * @param {string} action - Action à effectuer ('open', 'close', 'submit')
     * @param {string} modalSelector - Sélecteur de la modale
     * @param {string} triggerSelector - Sélecteur du déclencheur (pour 'open')
     */
    static async handleModal(page, action, modalSelector, triggerSelector = null) {
        console.log(`🪟 Gestion de la modale: ${action}`);

        switch (action) {
            case 'open':
                if (!triggerSelector) throw new Error('triggerSelector requis pour ouvrir une modale');

                await this.waitForClickable(page, triggerSelector);
                await page.click(triggerSelector);
                await page.waitForSelector(modalSelector, {
                    visible: true,
                    timeout: config.timeouts.medium
                });
                break;

            case 'close':
                // Chercher le bouton fermer ou ESC
                try {
                    await page.click(`${modalSelector} [data-testid="close-button"], ${modalSelector} .close`);
                } catch {
                    await page.keyboard.press('Escape');
                }
                await page.waitForSelector(modalSelector, {
                    hidden: true,
                    timeout: config.timeouts.fast
                });
                break;

            case 'submit':
                await page.click(`${modalSelector} button[type="submit"]`);
                // Attendre que la modale se ferme ou qu'une réponse arrive
                await page.waitForFunction(
                    (sel) => !document.querySelector(sel) || document.querySelector('.success, .error'),
                    { timeout: config.timeouts.veryLong },
                    modalSelector
                );
                break;

            default:
                throw new Error(`Action modale inconnue: ${action}`);
        }

        console.log(`✅ Modale ${action} terminée`);
    }

    /**
     * Capturer un screenshot avec timestamp
     * @param {Page} page - Instance de page Puppeteer
     * @param {string} name - Nom du screenshot
     * @param {boolean} fullPage - Capture pleine page
     */
    static async screenshot(page, name, fullPage = false) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${name}-${timestamp}.png`;
        const path = `tests/e2e/screenshots/${filename}`;

        await page.screenshot({
            path,
            fullPage
        });

        console.log(`📸 Screenshot capturé: ${filename}`);
        return filename;
    }

    /**
     * Vérifier qu'une page est complètement chargée
     * @param {Page} page - Instance de page Puppeteer
     * @param {Array} expectedElements - Sélecteurs des éléments attendus
     */
    static async verifyPageLoad(page, expectedElements = []) {
        console.log('⏳ Vérification du chargement de la page...');

        // Attendre que le DOM soit stable (en utilisant waitForLoadState si disponible ou networkidle2)
        try {
            await page.waitForLoadState('networkidle');
        } catch {
            // Fallback si waitForLoadState n'est pas disponible
            await page.waitForTimeout(2000);
        }

        // Vérifier l'absence de spinners de chargement
        try {
            await page.waitForSelector(config.selectors.common.loadingSpinner, {
                hidden: true,
                timeout: config.timeouts.fast
            });
        } catch {
            // Pas de spinner trouvé, c'est normal
        }

        // Vérifier la présence des éléments attendus
        for (const selector of expectedElements) {
            await page.waitForSelector(selector, {
                visible: true,
                timeout: config.timeouts.medium
            });
            console.log(`  ✓ Élément présent: ${selector}`);
        }

        console.log('✅ Page complètement chargée');
    }

    /**
     * Gérer les alertes et confirmations
     * @param {Page} page - Instance de page Puppeteer
     * @param {string} action - 'accept' ou 'dismiss'
     */
    static async handleAlert(page, action = 'accept') {
        return new Promise((resolve) => {
            page.once('dialog', async (dialog) => {
                console.log(`🚨 Alert détectée: "${dialog.message()}"`);

                if (action === 'accept') {
                    await dialog.accept();
                } else {
                    await dialog.dismiss();
                }

                console.log(`✅ Alert ${action}ée`);
                resolve(dialog.message());
            });
        });
    }
}

module.exports = PuppeteerHelpers; 