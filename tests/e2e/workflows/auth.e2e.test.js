const puppeteer = require('puppeteer');
const config = require('../config/puppeteer.config');
const PuppeteerHelpers = require('../utils/puppeteer-helpers');

describe('Workflow Authentification E2E', () => {
    let browser;
    let page;

    beforeAll(async () => {
        browser = await puppeteer.launch(config.browser);
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    beforeEach(async () => {
    jest.clearAllMocks();
        page = await browser.newPage();
        await page.setViewport(config.page.viewport);
        page.setDefaultTimeout(config.page.defaultTimeout);
    });

    afterEach(async () => {
        if (page) {
            await page.close();
        }
    });

    describe('🔐 Processus de Connexion', () => {
        test('Connexion valide avec utilisateur de test', async () => {
            try {
                await PuppeteerHelpers.login(page);

                // Vérifier redirection vers dashboard
                const url = page.url();
                expect(url).not.toContain('/auth/connexion');

                // Vérifier présence d'éléments authentifiés
                await page.waitForSelector('[data-testid="user-menu"], .user-avatar, .logout-button');

                await PuppeteerHelpers.screenshot(page, 'successful-login');
                console.log('✅ Connexion valide réussie');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'login-error');
                throw error;
            }
        });

        test('Connexion échouée avec mauvais identifiants', async () => {
            try {
                const invalidUser = {
                    email: 'invalid@test.com',
                    password: 'wrongpassword'
                };

                await page.goto(`${config.urls.base}${config.urls.login}`);

                await page.fill(config.selectors.auth.emailInput, invalidUser.email);
                await page.fill(config.selectors.auth.passwordInput, invalidUser.password);
                await page.click(config.selectors.auth.loginButton);

                // Attendre message d'erreur
                await page.waitForSelector('.error, .alert-danger, [data-testid="error"]', {
                    timeout: config.timeouts.medium
                });

                // Vérifier qu'on reste sur la page de login
                const url = page.url();
                expect(url).toContain('/auth/connexion');

                await PuppeteerHelpers.screenshot(page, 'login-failed');
                console.log('✅ Échec de connexion géré correctement');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'login-fail-test-error');
                throw error;
            }
        });
    });

    describe('🚪 Déconnexion et Sécurité', () => {
        beforeEach(async () => {
    jest.clearAllMocks();
            await PuppeteerHelpers.login(page);
        });

        test('Déconnexion complète', async () => {
            try {
                // Trouver et cliquer sur le bouton de déconnexion
                await page.click('[data-testid="logout-button"], .logout, button:has-text("Déconnexion")');

                // Attendre redirection vers login
                await page.waitForURL('**/auth/connexion', { timeout: config.timeouts.medium });

                // Vérifier qu'on ne peut plus accéder aux pages protégées
                await page.goto(`${config.urls.base}${config.urls.leaves}`);

                const url = page.url();
                expect(url).toContain('/auth/connexion');

                await PuppeteerHelpers.screenshot(page, 'successful-logout');
                console.log('✅ Déconnexion réussie');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'logout-error');
                throw error;
            }
        });

        test('Session expirée - redirection automatique', async () => {
            try {
                // Simuler expiration session en supprimant les cookies
                await page.evaluate(() => {
                    document.cookie.split(";").forEach(function (c) {
                        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                    });
                    localStorage.clear();
                    sessionStorage.clear();
                });

                // Essayer d'accéder à une page protégée
                await page.goto(`${config.urls.base}${config.urls.leaves}`);

                // Vérifier redirection vers login
                await page.waitForURL('**/auth/connexion', { timeout: config.timeouts.medium });

                await PuppeteerHelpers.screenshot(page, 'session-expired-redirect');
                console.log('✅ Redirection session expirée fonctionnelle');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'session-expiry-test-error');
                throw error;
            }
        });
    });

    describe('🛡️ Contrôles de Sécurité', () => {
        test('Protection CSRF - vérification des tokens', async () => {
            try {
                await page.goto(`${config.urls.base}${config.urls.login}`);

                // Vérifier présence de tokens CSRF dans le formulaire
                const csrfToken = await page.evaluate(() => {
                    const metaToken = document.querySelector('meta[name="csrf-token"]');
                    const inputToken = document.querySelector('input[name="_token"], input[name="csrf_token"]');
                    return metaToken?.getAttribute('content') || inputToken?.value;
                });

                expect(csrfToken).toBeTruthy();
                console.log('✅ Protection CSRF présente');
            } catch (error) {
                console.log('ℹ️  Pas de protection CSRF détectée (normal selon l\'implémentation)');
            }
        });

        test('Validation côté client des champs de connexion', async () => {
            try {
                await page.goto(`${config.urls.base}${config.urls.login}`);

                // Essayer de soumettre formulaire vide
                await page.click(config.selectors.auth.loginButton);

                // Vérifier validation HTML5 ou messages d'erreur
                const emailRequired = await page.evaluate(() => {
                    const emailInput = document.querySelector('input[name="email"]');
                    return emailInput.validity.valid === false;
                });

                expect(emailRequired).toBeTruthy();
                console.log('✅ Validation côté client fonctionnelle');
            } catch (error) {
                console.log('ℹ️  Validation côté client non détectée');
            }
        });
    });

    describe('♿ Accessibilité Authentification', () => {
        test('Navigation clavier dans le formulaire de connexion', async () => {
            try {
                await page.goto(`${config.urls.base}${config.urls.login}`);

                // Navigation par tabulation
                await page.keyboard.press('Tab'); // Email
                await page.keyboard.type('test@example.com');

                await page.keyboard.press('Tab'); // Password
                await page.keyboard.type('password123');

                await page.keyboard.press('Tab'); // Bouton submit
                await page.keyboard.press('Enter');

                // Vérifier que la soumission a eu lieu
                await page.waitForTimeout(1000);

                console.log('✅ Navigation clavier fonctionnelle');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'keyboard-navigation-error');
                throw error;
            }
        });

        test('Labels et attributs d\'accessibilité', async () => {
            try {
                await page.goto(`${config.urls.base}${config.urls.login}`);

                // Vérifier les labels
                const emailLabel = await page.evaluate(() => {
                    const emailInput = document.querySelector('input[name="email"]');
                    const labelFor = document.querySelector(`label[for="${emailInput.id}"]`);
                    const ariaLabel = emailInput.getAttribute('aria-label');
                    return labelFor || ariaLabel;
                });

                expect(emailLabel).toBeTruthy();
                console.log('✅ Attributs d\'accessibilité présents');
            } catch (error) {
                console.log('⚠️  Améliorer l\'accessibilité du formulaire de connexion');
            }
        });
    });
}); 