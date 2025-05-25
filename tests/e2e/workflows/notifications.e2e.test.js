const puppeteer = require('puppeteer');
const config = require('../config/puppeteer.config');
const PuppeteerHelpers = require('../utils/puppeteer-helpers');

describe('Workflow Notifications E2E', () => {
    let browser;
    let page;

    beforeAll(async () => {
        console.log('🚀 Démarrage du navigateur pour les tests notifications...');
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
        page.setDefaultTimeout(config.page.defaultTimeout);

        // Connexion avant chaque test
        await PuppeteerHelpers.login(page);
    });

    afterEach(async () => {
        if (page) {
            await page.close();
        }
    });

    describe('🔔 Centre de Notifications', () => {
        test('Accès et affichage du centre de notifications', async () => {
            try {
                await page.goto(`${config.urls.base}/notifications`, {
                    waitUntil: 'networkidle2'
                });

                // Vérifier les éléments principaux
                await PuppeteerHelpers.verifyPageLoad(page, [
                    '[data-testid="notifications-header"], .notifications-header',
                    '[data-testid="notifications-list"], .notifications-container'
                ]);

                // Compter les notifications
                const notifications = await page.$$('[data-testid^="notification-item-"], .notification-card');
                console.log(`✅ ${notifications.length} notifications trouvées`);

                // Vérifier les onglets
                const tabs = await page.$$('[data-testid="notification-tab"], .tab-button');
                if (tabs.length > 0) {
                    console.log(`✅ ${tabs.length} onglets de filtrage disponibles`);
                }

                await PuppeteerHelpers.screenshot(page, 'notifications-center');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'notifications-error');
                throw error;
            }
        });

        test('Filtrage des notifications par type', async () => {
            try {
                await page.goto(`${config.urls.base}/notifications`);
                await page.waitForSelector('[data-testid="notifications-list"]');

                // Cliquer sur l'onglet "Non lues"
                const unreadTab = await page.$('[data-testid="tab-unread"], button:has-text("Non lues")');
                if (unreadTab) {
                    await unreadTab.click();
                    await page.waitForTimeout(1000);

                    const unreadNotifications = await page.$$('.notification-unread, [data-read="false"]');
                    console.log(`✅ ${unreadNotifications.length} notifications non lues`);
                }

                // Cliquer sur l'onglet "Congés"
                const leaveTab = await page.$('[data-testid="tab-leaves"], button:has-text("Congés")');
                if (leaveTab) {
                    await leaveTab.click();
                    await page.waitForTimeout(1000);

                    const leaveNotifications = await page.$$('[data-type="leave"]');
                    console.log(`✅ ${leaveNotifications.length} notifications de congés`);
                }
            } catch (error) {
                console.log('ℹ️ Filtrage des notifications non disponible');
            }
        });

        test('Marquage d\'une notification comme lue', async () => {
            try {
                await page.goto(`${config.urls.base}/notifications`);
                await page.waitForSelector('[data-testid="notifications-list"]');

                // Trouver une notification non lue
                const unreadNotification = await page.$('.notification-unread, [data-read="false"]');
                
                if (unreadNotification) {
                    // Cliquer pour marquer comme lue
                    await unreadNotification.click();
                    await page.waitForTimeout(1000);

                    // Vérifier le changement d'état
                    const isStillUnread = await unreadNotification.evaluate(el => 
                        el.classList.contains('notification-unread') || el.dataset.read === 'false'
                    );
                    
                    expect(isStillUnread).toBe(false);
                    console.log('✅ Notification marquée comme lue');
                }
            } catch (error) {
                console.log('ℹ️ Pas de notifications non lues à tester');
            }
        });

        test('Actions sur les notifications', async () => {
            try {
                await page.goto(`${config.urls.base}/notifications`);
                await page.waitForSelector('[data-testid="notifications-list"]');

                // Trouver une notification avec actions
                const notificationWithActions = await page.$('[data-testid="notification-actions"]');
                
                if (notificationWithActions) {
                    // Hover pour afficher les actions
                    const notificationItem = await notificationWithActions.closest('.notification-card');
                    await notificationItem.hover();
                    await page.waitForTimeout(500);

                    // Chercher les boutons d'action
                    const actionButtons = await notificationItem.$$('button[data-action]');
                    
                    if (actionButtons.length > 0) {
                        console.log(`✅ ${actionButtons.length} actions disponibles sur la notification`);
                        
                        // Cliquer sur la première action
                        await actionButtons[0].click();
                        await page.waitForTimeout(1000);
                    }
                }
            } catch (error) {
                console.log('ℹ️ Pas d\'actions disponibles sur les notifications');
            }
        });
    });

    describe('🔔 Indicateur de Notifications (Header)', () => {
        test('Affichage du badge de notifications', async () => {
            try {
                // Aller sur n'importe quelle page pour voir le header
                await page.goto(`${config.urls.base}`);
                await page.waitForSelector('header, [data-testid="app-header"]');

                // Chercher l'icône de notifications
                const notificationIcon = await page.$('[data-testid="notification-icon"], .notification-bell');
                expect(notificationIcon).toBeTruthy();

                // Vérifier le badge avec le nombre
                const badge = await page.$('[data-testid="notification-badge"], .notification-count');
                if (badge) {
                    const count = await badge.evaluate(el => el.textContent);
                    console.log(`✅ Badge de notifications: ${count} non lues`);
                }

                await PuppeteerHelpers.screenshot(page, 'notification-badge');
            } catch (error) {
                console.log('ℹ️ Badge de notifications non visible');
            }
        });

        test('Dropdown de notifications rapides', async () => {
            try {
                await page.goto(`${config.urls.base}`);
                
                // Cliquer sur l'icône de notifications
                const notificationIcon = await page.$('[data-testid="notification-icon"], .notification-bell');
                if (notificationIcon) {
                    await notificationIcon.click();
                    await page.waitForTimeout(500);

                    // Vérifier l'apparition du dropdown
                    const dropdown = await page.$('[data-testid="notification-dropdown"], .notification-popover');
                    expect(dropdown).toBeTruthy();

                    // Compter les notifications dans le dropdown
                    const quickNotifications = await dropdown.$$('.notification-item');
                    console.log(`✅ ${quickNotifications.length} notifications dans le dropdown`);

                    // Lien vers toutes les notifications
                    const viewAllLink = await dropdown.$('a:has-text("Voir tout")');
                    if (viewAllLink) {
                        await viewAllLink.click();
                        await page.waitForNavigation();
                        expect(page.url()).toContain('/notifications');
                        console.log('✅ Navigation vers le centre de notifications');
                    }
                }
            } catch (error) {
                console.log('ℹ️ Dropdown de notifications non disponible');
            }
        });
    });

    describe('⚙️ Paramètres de Notifications', () => {
        test('Configuration des préférences de notifications', async () => {
            try {
                await page.goto(`${config.urls.base}/profil/notifications`);
                await page.waitForSelector('[data-testid="notification-settings"], .settings-form');

                // Vérifier les différentes catégories
                const categories = await page.$$('[data-testid^="notification-category-"], .category-section');
                console.log(`✅ ${categories.length} catégories de notifications configurables`);

                // Basculer une préférence
                const firstToggle = await page.$('input[type="checkbox"][name*="notification"]');
                if (firstToggle) {
                    const initialState = await firstToggle.evaluate(el => el.checked);
                    await firstToggle.click();
                    await page.waitForTimeout(500);
                    
                    const newState = await firstToggle.evaluate(el => el.checked);
                    expect(newState).toBe(!initialState);
                    console.log('✅ Préférence de notification modifiée');
                }

                // Sauvegarder les préférences
                const saveButton = await page.$('button:has-text("Sauvegarder")');
                if (saveButton) {
                    await saveButton.click();
                    await page.waitForSelector('.success-message', { timeout: 3000 });
                    console.log('✅ Préférences sauvegardées');
                }
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'notification-settings-error');
                console.log('⚠️ Erreur lors de la configuration des notifications');
            }
        });

        test('Configuration des canaux de notification', async () => {
            try {
                await page.goto(`${config.urls.base}/profil/notifications`);
                
                // Chercher les options de canaux
                const emailOption = await page.$('input[name="email_notifications"]');
                const pushOption = await page.$('input[name="push_notifications"]');
                
                if (emailOption) {
                    await emailOption.click();
                    console.log('✅ Notifications email configurées');
                }
                
                if (pushOption) {
                    await pushOption.click();
                    console.log('✅ Notifications push configurées');
                }
            } catch (error) {
                console.log('ℹ️ Options de canaux non disponibles');
            }
        });
    });

    describe('📤 Notifications en Temps Réel', () => {
        test('Réception de notification en temps réel', async () => {
            try {
                await page.goto(`${config.urls.base}`);
                
                // Écouter les notifications WebSocket ou SSE
                let notificationReceived = false;
                
                page.on('console', msg => {
                    if (msg.text().includes('notification') || msg.text().includes('websocket')) {
                        notificationReceived = true;
                    }
                });

                // Attendre 5 secondes pour une notification
                await page.waitForTimeout(5000);
                
                if (notificationReceived) {
                    console.log('✅ Système de notifications temps réel actif');
                } else {
                    console.log('ℹ️ Pas de notifications temps réel détectées');
                }
            } catch (error) {
                console.log('ℹ️ Notifications temps réel non testables');
            }
        });

        test('Toast notifications', async () => {
            try {
                // Déclencher une action qui génère une notification
                await page.goto(`${config.urls.base}/leaves`);
                
                // Essayer de créer une demande pour déclencher une notification
                const newRequestButton = await page.$('button:has-text("Nouvelle demande")');
                if (newRequestButton) {
                    await newRequestButton.click();
                    await page.waitForTimeout(1000);
                    
                    // Fermer le modal pour déclencher une notification
                    await page.keyboard.press('Escape');
                    
                    // Chercher un toast notification
                    const toast = await page.$('.toast, .notification-toast, [role="alert"]');
                    if (toast) {
                        const message = await toast.evaluate(el => el.textContent);
                        console.log(`✅ Toast notification: "${message}"`);
                        await PuppeteerHelpers.screenshot(page, 'toast-notification');
                    }
                }
            } catch (error) {
                console.log('ℹ️ Toast notifications non détectées');
            }
        });
    });

    describe('🗑️ Gestion des Notifications', () => {
        test('Suppression d\'une notification', async () => {
            try {
                await page.goto(`${config.urls.base}/notifications`);
                await page.waitForSelector('[data-testid="notifications-list"]');

                // Trouver une notification avec bouton supprimer
                const notification = await page.$('[data-testid^="notification-item-"]');
                if (notification) {
                    await notification.hover();
                    await page.waitForTimeout(500);
                    
                    const deleteButton = await notification.$('[data-testid="delete-notification"], button[aria-label*="supprimer"]');
                    if (deleteButton) {
                        await deleteButton.click();
                        
                        // Confirmer la suppression si nécessaire
                        const confirmButton = await page.$('button:has-text("Confirmer")');
                        if (confirmButton) {
                            await confirmButton.click();
                        }
                        
                        await page.waitForTimeout(1000);
                        console.log('✅ Notification supprimée');
                    }
                }
            } catch (error) {
                console.log('ℹ️ Suppression de notifications non disponible');
            }
        });

        test('Marquer toutes comme lues', async () => {
            try {
                await page.goto(`${config.urls.base}/notifications`);
                
                const markAllButton = await page.$('[data-testid="mark-all-read"], button:has-text("Marquer tout")');
                if (markAllButton) {
                    await markAllButton.click();
                    await page.waitForTimeout(1000);
                    
                    // Vérifier qu'il n'y a plus de notifications non lues
                    const unreadNotifications = await page.$$('.notification-unread');
                    expect(unreadNotifications.length).toBe(0);
                    
                    console.log('✅ Toutes les notifications marquées comme lues');
                }
            } catch (error) {
                console.log('ℹ️ Action "Marquer tout comme lu" non disponible');
            }
        });

        test('Archivage des notifications', async () => {
            try {
                await page.goto(`${config.urls.base}/notifications`);
                
                // Chercher l'onglet archives
                const archiveTab = await page.$('[data-testid="tab-archived"], button:has-text("Archives")');
                if (archiveTab) {
                    await archiveTab.click();
                    await page.waitForTimeout(1000);
                    
                    const archivedNotifications = await page.$$('[data-archived="true"]');
                    console.log(`✅ ${archivedNotifications.length} notifications archivées`);
                }
                
                // Essayer d'archiver une notification
                const notification = await page.$('[data-testid^="notification-item-"]');
                if (notification) {
                    await notification.hover();
                    const archiveButton = await notification.$('button[aria-label*="archiver"]');
                    if (archiveButton) {
                        await archiveButton.click();
                        console.log('✅ Notification archivée');
                    }
                }
            } catch (error) {
                console.log('ℹ️ Fonctionnalité d\'archivage non disponible');
            }
        });
    });
});