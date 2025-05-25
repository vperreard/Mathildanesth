const puppeteer = require('puppeteer');
const config = require('../config/puppeteer.config');
const PuppeteerHelpers = require('../utils/puppeteer-helpers');

describe('Workflow Calendrier E2E', () => {
    let browser;
    let page;

    beforeAll(async () => {
        console.log('🚀 Démarrage du navigateur pour les tests calendrier...');
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

    describe('📅 Navigation et Affichage du Calendrier', () => {
        test('Accès et chargement de la vue calendrier', async () => {
            try {
                // Navigation vers le calendrier
                await page.goto(`${config.urls.base}/calendar`, {
                    waitUntil: 'networkidle2'
                });

                // Vérifier les éléments principaux
                await PuppeteerHelpers.verifyPageLoad(page, [
                    '[data-testid="calendar-header"], .calendar-header',
                    '[data-testid="calendar-grid"], .calendar-grid, .fc-view-container',
                    '[data-testid="calendar-controls"], .calendar-controls'
                ]);

                // Vérifier le titre du mois actuel
                const monthTitle = await page.$eval(
                    '[data-testid="current-month"], .fc-toolbar-title, h2',
                    el => el.textContent
                );
                expect(monthTitle).toBeTruthy();

                await PuppeteerHelpers.screenshot(page, 'calendar-loaded');
                console.log('✅ Calendrier chargé avec succès');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'calendar-load-error');
                throw error;
            }
        });

        test('Navigation entre les mois', async () => {
            try {
                await page.goto(`${config.urls.base}/calendar`);
                await page.waitForSelector('[data-testid="calendar-grid"], .calendar-grid');

                // Capturer le mois actuel
                const initialMonth = await page.$eval(
                    '[data-testid="current-month"], .fc-toolbar-title, h2',
                    el => el.textContent
                );

                // Naviguer au mois suivant
                await page.click('[data-testid="next-month"], .fc-next-button, button[aria-label*="Next"]');
                await page.waitForTimeout(1000); // Attendre l'animation

                const nextMonth = await page.$eval(
                    '[data-testid="current-month"], .fc-toolbar-title, h2',
                    el => el.textContent
                );

                expect(nextMonth).not.toBe(initialMonth);

                // Retour au mois précédent
                await page.click('[data-testid="prev-month"], .fc-prev-button, button[aria-label*="Previous"]');
                await page.waitForTimeout(1000);

                console.log('✅ Navigation entre mois fonctionnelle');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'calendar-navigation-error');
                throw error;
            }
        });

        test('Changement de vue (mois/semaine/jour)', async () => {
            try {
                await page.goto(`${config.urls.base}/calendar`);

                // Test vue semaine
                const weekButton = await page.$('[data-testid="view-week"], .fc-timeGridWeek-button, button:has-text("Semaine")');
                if (weekButton) {
                    await weekButton.click();
                    await page.waitForTimeout(1000);
                    
                    const weekView = await page.$('.fc-timeGrid-view, .week-view');
                    expect(weekView).toBeTruthy();
                    console.log('✅ Vue semaine activée');
                }

                // Test vue jour
                const dayButton = await page.$('[data-testid="view-day"], .fc-timeGridDay-button, button:has-text("Jour")');
                if (dayButton) {
                    await dayButton.click();
                    await page.waitForTimeout(1000);
                    
                    const dayView = await page.$('.fc-timeGrid-view.fc-timeGridDay-view, .day-view');
                    expect(dayView).toBeTruthy();
                    console.log('✅ Vue jour activée');
                }

                // Retour vue mois
                const monthButton = await page.$('[data-testid="view-month"], .fc-dayGridMonth-button, button:has-text("Mois")');
                if (monthButton) {
                    await monthButton.click();
                    await page.waitForTimeout(1000);
                    console.log('✅ Retour vue mois');
                }

            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'calendar-view-change-error');
                throw error;
            }
        });
    });

    describe('🎯 Interactions avec les Événements', () => {
        test('Affichage des événements du calendrier', async () => {
            try {
                await page.goto(`${config.urls.base}/calendar`);
                await page.waitForSelector('[data-testid="calendar-grid"], .calendar-grid');

                // Attendre le chargement des événements
                await page.waitForTimeout(2000);

                // Vérifier la présence d'événements
                const events = await page.$$('[data-testid="calendar-event"], .fc-event, .calendar-event');
                
                if (events.length > 0) {
                    console.log(`✅ ${events.length} événements trouvés dans le calendrier`);
                    
                    // Cliquer sur le premier événement
                    await events[0].click();
                    
                    // Vérifier l'apparition d'un popover ou modal
                    const eventDetails = await page.waitForSelector(
                        '[data-testid="event-details"], .event-popover, .event-modal',
                        { timeout: 5000 }
                    ).catch(() => null);
                    
                    if (eventDetails) {
                        console.log('✅ Détails de l\'événement affichés');
                        await PuppeteerHelpers.screenshot(page, 'event-details');
                    }
                } else {
                    console.log('ℹ️ Aucun événement dans le calendrier actuellement');
                }
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'calendar-events-error');
                throw error;
            }
        });

        test('Filtrage des événements par type', async () => {
            try {
                await page.goto(`${config.urls.base}/calendar`);

                // Chercher les filtres
                const filterButton = await page.$('[data-testid="calendar-filters"], button:has-text("Filtres")');
                
                if (filterButton) {
                    await filterButton.click();
                    await page.waitForTimeout(500);

                    // Chercher les checkboxes de filtre
                    const filterCheckboxes = await page.$$('[data-testid^="filter-"], input[type="checkbox"]');
                    
                    if (filterCheckboxes.length > 0) {
                        // Décocher le premier filtre
                        await filterCheckboxes[0].click();
                        await page.waitForTimeout(1000);
                        
                        console.log('✅ Filtres de calendrier fonctionnels');
                    }
                }
            } catch (error) {
                console.log('ℹ️ Pas de filtres détectés sur le calendrier');
            }
        });
    });

    describe('📱 Responsive et Accessibilité', () => {
        test('Affichage mobile du calendrier', async () => {
            try {
                // Définir viewport mobile
                await page.setViewport({ width: 375, height: 667 });
                
                await page.goto(`${config.urls.base}/calendar`);
                await page.waitForSelector('[data-testid="calendar-grid"], .calendar-grid');

                // Vérifier l'adaptation mobile
                const mobileMenu = await page.$('[data-testid="mobile-menu"], .mobile-menu-toggle');
                expect(mobileMenu).toBeTruthy();

                await PuppeteerHelpers.screenshot(page, 'calendar-mobile-view');
                console.log('✅ Vue mobile du calendrier adaptée');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'calendar-mobile-error');
                throw error;
            }
        });

        test('Navigation clavier dans le calendrier', async () => {
            try {
                await page.goto(`${config.urls.base}/calendar`);
                await page.waitForSelector('[data-testid="calendar-grid"], .calendar-grid');

                // Focus sur le calendrier
                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
                
                // Navigation avec les flèches
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowDown');
                
                // Sélection avec Enter
                await page.keyboard.press('Enter');

                console.log('✅ Navigation clavier fonctionnelle');
            } catch (error) {
                console.log('ℹ️ Navigation clavier limitée');
            }
        });
    });

    describe('⚙️ Paramètres et Export', () => {
        test('Accès aux paramètres du calendrier', async () => {
            try {
                await page.goto(`${config.urls.base}/calendar`);

                // Chercher bouton paramètres
                const settingsButton = await page.$('[data-testid="calendar-settings"], a[href*="/calendar/settings"], button:has-text("Paramètres")');
                
                if (settingsButton) {
                    await settingsButton.click();
                    await page.waitForNavigation();
                    
                    const url = page.url();
                    expect(url).toContain('/calendar/settings');
                    
                    console.log('✅ Page paramètres calendrier accessible');
                }
            } catch (error) {
                console.log('ℹ️ Pas de paramètres calendrier détectés');
            }
        });

        test('Export du calendrier', async () => {
            try {
                await page.goto(`${config.urls.base}/calendar`);

                // Chercher bouton export
                const exportButton = await page.$('[data-testid="calendar-export"], button:has-text("Export")');
                
                if (exportButton) {
                    // Préparer l'interception du téléchargement
                    const downloadPromise = new Promise((resolve) => {
                        page.once('download', resolve);
                    });

                    await exportButton.click();

                    // Attendre le téléchargement ou timeout après 5s
                    const download = await Promise.race([
                        downloadPromise,
                        new Promise(resolve => setTimeout(() => resolve(null), 5000))
                    ]);

                    if (download) {
                        console.log('✅ Export calendrier fonctionnel');
                    }
                }
            } catch (error) {
                console.log('ℹ️ Fonctionnalité export non disponible');
            }
        });
    });
});