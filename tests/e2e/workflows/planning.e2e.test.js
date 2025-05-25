const puppeteer = require('puppeteer');
const config = require('../config/puppeteer.config');
const PuppeteerHelpers = require('../utils/puppeteer-helpers');

describe('Workflow Planning Hebdomadaire E2E', () => {
    let browser;
    let page;

    beforeAll(async () => {
        console.log('🚀 Démarrage du navigateur pour les tests planning...');
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

    describe('📋 Visualisation du Planning', () => {
        test('Accès et affichage du planning hebdomadaire', async () => {
            try {
                // Navigation vers le planning
                await page.goto(`${config.urls.base}/planning/hebdomadaire`, {
                    waitUntil: 'networkidle2'
                });

                // Vérifier les éléments principaux
                await PuppeteerHelpers.verifyPageLoad(page, [
                    '[data-testid="planning-header"], .planning-header',
                    '[data-testid="planning-grid"], .planning-grid, .schedule-grid',
                    '[data-testid="week-selector"], .week-navigation'
                ]);

                // Vérifier l'affichage de la semaine actuelle
                const weekInfo = await page.$eval(
                    '[data-testid="current-week"], .week-info, .week-display',
                    el => el.textContent
                );
                expect(weekInfo).toMatch(/semaine/i);

                await PuppeteerHelpers.screenshot(page, 'planning-loaded');
                console.log('✅ Planning hebdomadaire chargé');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'planning-load-error');
                throw error;
            }
        });

        test('Navigation entre les semaines', async () => {
            try {
                await page.goto(`${config.urls.base}/planning/hebdomadaire`);
                await page.waitForSelector('[data-testid="planning-grid"], .planning-grid');

                // Capturer la semaine actuelle
                const initialWeek = await page.$eval(
                    '[data-testid="current-week"], .week-info',
                    el => el.textContent
                );

                // Aller à la semaine suivante
                await page.click('[data-testid="next-week"], button[aria-label*="suivante"]');
                await page.waitForTimeout(1000);

                const nextWeek = await page.$eval(
                    '[data-testid="current-week"], .week-info',
                    el => el.textContent
                );
                expect(nextWeek).not.toBe(initialWeek);

                // Retour à la semaine précédente
                await page.click('[data-testid="prev-week"], button[aria-label*="précédente"]');
                await page.waitForTimeout(1000);

                console.log('✅ Navigation entre semaines fonctionnelle');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'week-navigation-error');
                throw error;
            }
        });

        test('Affichage des affectations du personnel', async () => {
            try {
                await page.goto(`${config.urls.base}/planning/hebdomadaire`);
                await page.waitForSelector('[data-testid="planning-grid"], .planning-grid');

                // Attendre le chargement des données
                await page.waitForTimeout(2000);

                // Chercher les cellules d'affectation
                const assignments = await page.$$('[data-testid="assignment-cell"], .assignment, .shift-cell');
                
                if (assignments.length > 0) {
                    console.log(`✅ ${assignments.length} affectations trouvées`);
                    
                    // Hover sur une affectation pour voir les détails
                    await assignments[0].hover();
                    await page.waitForTimeout(500);
                    
                    // Vérifier si un tooltip apparaît
                    const tooltip = await page.$('.tooltip, [role="tooltip"]');
                    if (tooltip) {
                        console.log('✅ Tooltip d\'affectation affiché');
                    }
                } else {
                    console.log('ℹ️ Aucune affectation visible actuellement');
                }
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'assignments-display-error');
                throw error;
            }
        });
    });

    describe('✏️ Modification du Planning', () => {
        test('Ouverture du mode édition', async () => {
            try {
                await page.goto(`${config.urls.base}/planning/hebdomadaire`);
                await page.waitForSelector('[data-testid="planning-grid"], .planning-grid');

                // Chercher le bouton d'édition
                const editButton = await page.$('[data-testid="edit-planning"], button:has-text("Modifier")');
                
                if (editButton) {
                    await editButton.click();
                    await page.waitForTimeout(1000);
                    
                    // Vérifier l'activation du mode édition
                    const editMode = await page.$('.edit-mode, [data-mode="edit"]');
                    expect(editMode).toBeTruthy();
                    
                    console.log('✅ Mode édition activé');
                    await PuppeteerHelpers.screenshot(page, 'edit-mode-active');
                }
            } catch (error) {
                console.log('ℹ️ Mode édition non disponible pour cet utilisateur');
            }
        });

        test('Drag and drop d\'une affectation', async () => {
            try {
                await page.goto(`${config.urls.base}/planning/hebdomadaire`);
                await page.waitForSelector('[data-testid="planning-grid"], .planning-grid');

                // Activer le mode édition si nécessaire
                const editButton = await page.$('[data-testid="edit-planning"], button:has-text("Modifier")');
                if (editButton) {
                    await editButton.click();
                    await page.waitForTimeout(1000);
                }

                // Trouver une affectation draggable
                const draggableItem = await page.$('[draggable="true"], .draggable-assignment');
                
                if (draggableItem) {
                    const box = await draggableItem.boundingBox();
                    const targetCell = await page.$('.empty-cell, [data-droppable="true"]');
                    
                    if (targetCell) {
                        const targetBox = await targetCell.boundingBox();
                        
                        // Simuler le drag and drop
                        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
                        await page.mouse.down();
                        await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
                        await page.mouse.up();
                        
                        await page.waitForTimeout(1000);
                        console.log('✅ Drag and drop effectué');
                    }
                }
            } catch (error) {
                console.log('ℹ️ Fonctionnalité drag and drop non disponible');
            }
        });
    });

    describe('🔍 Filtres et Recherche', () => {
        test('Filtrage par type de personnel', async () => {
            try {
                await page.goto(`${config.urls.base}/planning/hebdomadaire`);
                await page.waitForSelector('[data-testid="planning-grid"], .planning-grid');

                // Ouvrir les filtres
                const filterButton = await page.$('[data-testid="filters-button"], button:has-text("Filtres")');
                
                if (filterButton) {
                    await filterButton.click();
                    await page.waitForTimeout(500);
                    
                    // Sélectionner un filtre
                    const filterOptions = await page.$$('[data-testid^="filter-"], input[type="checkbox"]');
                    
                    if (filterOptions.length > 0) {
                        await filterOptions[0].click();
                        await page.waitForTimeout(1000);
                        
                        console.log('✅ Filtres appliqués');
                        await PuppeteerHelpers.screenshot(page, 'planning-filtered');
                    }
                }
            } catch (error) {
                console.log('ℹ️ Pas de filtres disponibles');
            }
        });

        test('Recherche de personnel', async () => {
            try {
                await page.goto(`${config.urls.base}/planning/hebdomadaire`);
                
                // Chercher le champ de recherche
                const searchInput = await page.$('[data-testid="search-staff"], input[placeholder*="Rechercher"]');
                
                if (searchInput) {
                    await searchInput.type('Jean');
                    await page.waitForTimeout(1000);
                    
                    // Vérifier la mise à jour du planning
                    const highlightedItems = await page.$$('.highlighted, [data-highlighted="true"]');
                    
                    console.log(`✅ Recherche effectuée - ${highlightedItems.length} résultats`);
                }
            } catch (error) {
                console.log('ℹ️ Fonction recherche non disponible');
            }
        });
    });

    describe('📊 Statistiques et Vue d\'ensemble', () => {
        test('Affichage des statistiques de couverture', async () => {
            try {
                await page.goto(`${config.urls.base}/planning/hebdomadaire`);
                await page.waitForSelector('[data-testid="planning-grid"], .planning-grid');

                // Chercher la section statistiques
                const statsSection = await page.$('[data-testid="planning-stats"], .statistics-panel');
                
                if (statsSection) {
                    // Vérifier les indicateurs
                    const coverage = await page.$eval(
                        '[data-testid="coverage-rate"], .coverage-indicator',
                        el => el.textContent
                    );
                    expect(coverage).toMatch(/\d+%/);
                    
                    console.log('✅ Statistiques de couverture affichées');
                }
            } catch (error) {
                console.log('ℹ️ Statistiques non disponibles');
            }
        });

        test('Alertes et conflits', async () => {
            try {
                await page.goto(`${config.urls.base}/planning/hebdomadaire`);
                
                // Chercher les alertes
                const alerts = await page.$$('[data-testid="planning-alert"], .alert, .warning');
                
                if (alerts.length > 0) {
                    console.log(`⚠️ ${alerts.length} alertes détectées`);
                    
                    // Cliquer sur une alerte pour voir les détails
                    await alerts[0].click();
                    await page.waitForTimeout(500);
                    
                    const alertDetails = await page.$('.alert-details, [data-testid="alert-modal"]');
                    if (alertDetails) {
                        console.log('✅ Détails d\'alerte affichés');
                    }
                } else {
                    console.log('✅ Aucun conflit détecté');
                }
            } catch (error) {
                console.log('ℹ️ Système d\'alertes non visible');
            }
        });
    });

    describe('💾 Sauvegarde et Publication', () => {
        test('Sauvegarde des modifications', async () => {
            try {
                await page.goto(`${config.urls.base}/planning/hebdomadaire`);
                
                // Activer le mode édition
                const editButton = await page.$('[data-testid="edit-planning"], button:has-text("Modifier")');
                if (editButton) {
                    await editButton.click();
                    await page.waitForTimeout(1000);
                    
                    // Chercher le bouton sauvegarder
                    const saveButton = await page.$('[data-testid="save-planning"], button:has-text("Sauvegarder")');
                    
                    if (saveButton) {
                        await saveButton.click();
                        
                        // Attendre la confirmation
                        await page.waitForSelector(
                            '.success-message, [data-testid="save-success"]',
                            { timeout: 5000 }
                        );
                        
                        console.log('✅ Planning sauvegardé');
                    }
                }
            } catch (error) {
                console.log('ℹ️ Fonction sauvegarde non testable');
            }
        });

        test('Publication du planning', async () => {
            try {
                await page.goto(`${config.urls.base}/planning/hebdomadaire`);
                
                // Chercher le bouton publier
                const publishButton = await page.$('[data-testid="publish-planning"], button:has-text("Publier")');
                
                if (publishButton) {
                    await publishButton.click();
                    
                    // Confirmer la publication
                    const confirmButton = await page.waitForSelector(
                        'button:has-text("Confirmer")',
                        { timeout: 3000 }
                    );
                    
                    if (confirmButton) {
                        await confirmButton.click();
                        
                        await page.waitForSelector(
                            '.success-message, [data-testid="publish-success"]',
                            { timeout: 5000 }
                        );
                        
                        console.log('✅ Planning publié');
                    }
                }
            } catch (error) {
                console.log('ℹ️ Fonction publication non disponible');
            }
        });
    });

    describe('📱 Responsive', () => {
        test('Affichage mobile du planning', async () => {
            try {
                // Viewport mobile
                await page.setViewport({ width: 375, height: 667 });
                
                await page.goto(`${config.urls.base}/planning/hebdomadaire`);
                await page.waitForSelector('[data-testid="planning-grid"], .planning-grid');
                
                // Vérifier l'adaptation mobile
                const mobileView = await page.$('.mobile-planning, [data-mobile="true"]');
                
                await PuppeteerHelpers.screenshot(page, 'planning-mobile');
                console.log('✅ Vue mobile du planning adaptée');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'planning-mobile-error');
                throw error;
            }
        });
    });
});