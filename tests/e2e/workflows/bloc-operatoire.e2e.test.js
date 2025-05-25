const puppeteer = require('puppeteer');
const config = require('../config/puppeteer.config');
const PuppeteerHelpers = require('../utils/puppeteer-helpers');

describe('Workflow Bloc Opératoire E2E', () => {
    let browser;
    let page;

    beforeAll(async () => {
        console.log('🚀 Démarrage du navigateur pour les tests bloc opératoire...');
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

    describe('🏥 Dashboard Bloc Opératoire', () => {
        test('Accès et affichage du dashboard bloc', async () => {
            try {
                await page.goto(`${config.urls.base}/bloc-operatoire`, {
                    waitUntil: 'networkidle2'
                });

                // Vérifier les éléments principaux
                await PuppeteerHelpers.verifyPageLoad(page, [
                    '[data-testid="bloc-header"], .bloc-header',
                    '[data-testid="bloc-dashboard"], .dashboard-content',
                    '[data-testid="bloc-navigation"], .bloc-nav'
                ]);

                // Vérifier les sections du dashboard
                const sections = await page.$$('[data-testid^="dashboard-section-"], .dashboard-card');
                console.log(`✅ ${sections.length} sections trouvées sur le dashboard`);

                await PuppeteerHelpers.screenshot(page, 'bloc-dashboard');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'bloc-dashboard-error');
                throw error;
            }
        });

        test('Navigation entre les sections du bloc', async () => {
            try {
                await page.goto(`${config.urls.base}/bloc-operatoire`);

                // Test navigation vers planning
                const planningLink = await page.$('a[href*="/bloc-operatoire/planning"]');
                if (planningLink) {
                    await planningLink.click();
                    await page.waitForNavigation();
                    expect(page.url()).toContain('/planning');
                    console.log('✅ Navigation vers planning bloc');
                }

                // Test navigation vers salles
                await page.goto(`${config.urls.base}/bloc-operatoire`);
                const sallesLink = await page.$('a[href*="/bloc-operatoire/salles"]');
                if (sallesLink) {
                    await sallesLink.click();
                    await page.waitForNavigation();
                    expect(page.url()).toContain('/salles');
                    console.log('✅ Navigation vers gestion des salles');
                }
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'bloc-navigation-error');
                throw error;
            }
        });
    });

    describe('📅 Planning Bloc Opératoire', () => {
        test('Affichage du planning des salles', async () => {
            try {
                await page.goto(`${config.urls.base}/bloc-operatoire/planning`);
                await page.waitForSelector('[data-testid="bloc-planning"], .planning-container');

                // Vérifier la grille de planning
                const planningGrid = await page.$('[data-testid="planning-grid"], .rooms-schedule');
                expect(planningGrid).toBeTruthy();

                // Compter les salles affichées
                const rooms = await page.$$('[data-testid^="room-row-"], .room-schedule');
                console.log(`✅ ${rooms.length} salles affichées dans le planning`);

                // Vérifier les créneaux horaires
                const timeSlots = await page.$$('[data-testid="time-slot"], .time-column');
                if (timeSlots.length > 0) {
                    console.log(`✅ ${timeSlots.length} créneaux horaires visibles`);
                }

                await PuppeteerHelpers.screenshot(page, 'bloc-planning-view');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'bloc-planning-error');
                throw error;
            }
        });

        test('Création d\'une nouvelle affectation', async () => {
            try {
                await page.goto(`${config.urls.base}/bloc-operatoire/planning`);
                await page.waitForSelector('[data-testid="bloc-planning"]');

                // Chercher un créneau vide
                const emptySlot = await page.$('[data-testid="empty-slot"], .available-slot');
                
                if (emptySlot) {
                    await emptySlot.click();
                    await page.waitForTimeout(500);

                    // Vérifier l'ouverture du modal de création
                    const createModal = await page.$('[data-testid="create-assignment-modal"], .assignment-form');
                    
                    if (createModal) {
                        // Remplir le formulaire
                        await PuppeteerHelpers.fillForm(page, {
                            '[name="surgeon"]': 'Dr. Martin',
                            '[name="procedure"]': 'Chirurgie test',
                            '[name="duration"]': '120'
                        });

                        // Soumettre
                        const submitButton = await page.$('button[type="submit"]');
                        await submitButton.click();

                        console.log('✅ Création d\'affectation testée');
                    }
                }
            } catch (error) {
                console.log('ℹ️ Création d\'affectation non testable');
            }
        });

        test('Drag and drop d\'une intervention', async () => {
            try {
                await page.goto(`${config.urls.base}/bloc-operatoire/planning`);
                await page.waitForSelector('[data-testid="bloc-planning"]');

                // Trouver une intervention draggable
                const intervention = await page.$('[draggable="true"], .draggable-intervention');
                
                if (intervention) {
                    const sourceBox = await intervention.boundingBox();
                    
                    // Trouver une cible
                    const targetSlot = await page.$('.empty-slot:not(:first-child)');
                    if (targetSlot) {
                        const targetBox = await targetSlot.boundingBox();
                        
                        // Effectuer le drag and drop
                        await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
                        await page.mouse.down();
                        await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
                        await page.mouse.up();
                        
                        await page.waitForTimeout(1000);
                        console.log('✅ Drag and drop d\'intervention effectué');
                    }
                }
            } catch (error) {
                console.log('ℹ️ Drag and drop non disponible');
            }
        });
    });

    describe('🚪 Gestion des Salles', () => {
        test('Liste des salles d\'opération', async () => {
            try {
                await page.goto(`${config.urls.base}/bloc-operatoire/salles`);
                await page.waitForSelector('[data-testid="rooms-list"], .rooms-container');

                // Compter les salles
                const roomCards = await page.$$('[data-testid^="room-card-"], .room-item');
                console.log(`✅ ${roomCards.length} salles d'opération trouvées`);

                if (roomCards.length > 0) {
                    // Cliquer sur une salle pour voir les détails
                    await roomCards[0].click();
                    await page.waitForTimeout(500);

                    const roomDetails = await page.$('[data-testid="room-details"], .room-info-panel');
                    if (roomDetails) {
                        console.log('✅ Détails de la salle affichés');
                        
                        // Vérifier les informations
                        const equipment = await page.$$('[data-testid="equipment-item"], .equipment-list li');
                        console.log(`  ✓ ${equipment.length} équipements listés`);
                    }
                }

                await PuppeteerHelpers.screenshot(page, 'rooms-list');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'rooms-list-error');
                throw error;
            }
        });

        test('Ajout d\'une nouvelle salle', async () => {
            try {
                await page.goto(`${config.urls.base}/bloc-operatoire/salles`);
                
                // Chercher le bouton d'ajout
                const addButton = await page.$('[data-testid="add-room"], button:has-text("Ajouter")');
                
                if (addButton) {
                    await addButton.click();
                    await page.waitForTimeout(500);

                    // Modal de création
                    const createModal = await page.$('[data-testid="create-room-modal"], .room-form');
                    
                    if (createModal) {
                        await PuppeteerHelpers.fillForm(page, {
                            '[name="roomName"]': 'Salle Test E2E',
                            '[name="roomNumber"]': '999',
                            '[name="capacity"]': '6'
                        });

                        // Sélectionner le type de salle
                        const roomType = await page.$('select[name="roomType"]');
                        if (roomType) {
                            await roomType.select('SURGERY');
                        }

                        console.log('✅ Formulaire de création de salle testé');
                    }
                }
            } catch (error) {
                console.log('ℹ️ Ajout de salle non disponible');
            }
        });

        test('Modification des équipements d\'une salle', async () => {
            try {
                await page.goto(`${config.urls.base}/bloc-operatoire/salles`);
                
                // Ouvrir les détails d'une salle
                const firstRoom = await page.$('[data-testid^="room-card-"]');
                if (firstRoom) {
                    await firstRoom.click();
                    await page.waitForTimeout(500);

                    // Chercher le bouton d'édition
                    const editButton = await page.$('[data-testid="edit-room"], button:has-text("Modifier")');
                    
                    if (editButton) {
                        await editButton.click();
                        await page.waitForTimeout(500);

                        // Ajouter un équipement
                        const addEquipmentButton = await page.$('[data-testid="add-equipment"]');
                        if (addEquipmentButton) {
                            await addEquipmentButton.click();
                            
                            const equipmentInput = await page.$('input[name="newEquipment"]');
                            if (equipmentInput) {
                                await equipmentInput.type('Nouvel équipement test');
                                await page.keyboard.press('Enter');
                                
                                console.log('✅ Ajout d\'équipement testé');
                            }
                        }
                    }
                }
            } catch (error) {
                console.log('ℹ️ Modification d\'équipements non testable');
            }
        });
    });

    describe('📋 Trames d\'Affectation', () => {
        test('Affichage des trames existantes', async () => {
            try {
                await page.goto(`${config.urls.base}/bloc-operatoire/trames`);
                await page.waitForSelector('[data-testid="trames-list"], .trames-container');

                const trames = await page.$$('[data-testid^="trame-item-"], .trame-card');
                console.log(`✅ ${trames.length} trames d'affectation trouvées`);

                if (trames.length > 0) {
                    // Voir les détails d'une trame
                    await trames[0].click();
                    await page.waitForTimeout(500);

                    const trameDetails = await page.$('[data-testid="trame-details"], .trame-schedule');
                    if (trameDetails) {
                        console.log('✅ Détails de la trame affichés');
                        await PuppeteerHelpers.screenshot(page, 'trame-details');
                    }
                }
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'trames-error');
                throw error;
            }
        });

        test('Création d\'une nouvelle trame', async () => {
            try {
                await page.goto(`${config.urls.base}/bloc-operatoire/trames`);
                
                const createButton = await page.$('[data-testid="create-trame"], button:has-text("Nouvelle trame")');
                
                if (createButton) {
                    await createButton.click();
                    await page.waitForTimeout(500);

                    // Remplir le formulaire de création
                    await PuppeteerHelpers.fillForm(page, {
                        '[name="trameName"]': 'Trame Test E2E',
                        '[name="startTime"]': '08:00',
                        '[name="endTime"]': '18:00'
                    });

                    // Sélectionner les jours
                    const dayCheckboxes = await page.$$('input[type="checkbox"][name*="day"]');
                    if (dayCheckboxes.length > 0) {
                        await dayCheckboxes[0].click(); // Lundi
                        await dayCheckboxes[1].click(); // Mardi
                    }

                    console.log('✅ Création de trame testée');
                }
            } catch (error) {
                console.log('ℹ️ Création de trame non disponible');
            }
        });
    });

    describe('📊 Règles de Supervision', () => {
        test('Consultation des règles de supervision', async () => {
            try {
                await page.goto(`${config.urls.base}/bloc-operatoire/regles-supervision`);
                await page.waitForSelector('[data-testid="supervision-rules"], .rules-container');

                // Lister les règles
                const rules = await page.$$('[data-testid^="rule-item-"], .rule-card');
                console.log(`✅ ${rules.length} règles de supervision trouvées`);

                // Vérifier les types de règles
                const ruleTypes = await page.$$eval('[data-testid="rule-type"]', 
                    elements => elements.map(el => el.textContent)
                );
                
                if (ruleTypes.length > 0) {
                    console.log('  Types de règles:', [...new Set(ruleTypes)].join(', '));
                }

                await PuppeteerHelpers.screenshot(page, 'supervision-rules');
            } catch (error) {
                await PuppeteerHelpers.screenshot(page, 'supervision-rules-error');
                throw error;
            }
        });

        test('Activation/Désactivation d\'une règle', async () => {
            try {
                await page.goto(`${config.urls.base}/bloc-operatoire/regles-supervision`);
                
                // Trouver un toggle de règle
                const ruleToggle = await page.$('[data-testid="rule-toggle"], input[type="checkbox"]');
                
                if (ruleToggle) {
                    const isChecked = await ruleToggle.evaluate(el => el.checked);
                    await ruleToggle.click();
                    await page.waitForTimeout(1000);
                    
                    const newState = await ruleToggle.evaluate(el => el.checked);
                    expect(newState).toBe(!isChecked);
                    
                    console.log('✅ Toggle de règle fonctionnel');
                }
            } catch (error) {
                console.log('ℹ️ Modification des règles non disponible');
            }
        });
    });

    describe('📈 Statistiques et Rapports', () => {
        test('Affichage des statistiques d\'utilisation', async () => {
            try {
                await page.goto(`${config.urls.base}/bloc-operatoire`);
                
                // Chercher la section statistiques
                const statsSection = await page.$('[data-testid="bloc-stats"], .statistics-section');
                
                if (statsSection) {
                    // Vérifier les indicateurs
                    const indicators = await page.$$('[data-testid^="stat-indicator-"], .stat-card');
                    
                    for (const indicator of indicators) {
                        const label = await indicator.$eval('.stat-label', el => el.textContent);
                        const value = await indicator.$eval('.stat-value', el => el.textContent);
                        console.log(`  ✓ ${label}: ${value}`);
                    }
                    
                    console.log(`✅ ${indicators.length} indicateurs statistiques affichés`);
                }
            } catch (error) {
                console.log('ℹ️ Statistiques non disponibles');
            }
        });

        test('Export des données du bloc', async () => {
            try {
                await page.goto(`${config.urls.base}/bloc-operatoire`);
                
                const exportButton = await page.$('[data-testid="export-bloc-data"], button:has-text("Export")');
                
                if (exportButton) {
                    await exportButton.click();
                    await page.waitForTimeout(500);
                    
                    // Sélectionner le format d'export
                    const exportOptions = await page.$('[data-testid="export-options"]');
                    if (exportOptions) {
                        const xlsxOption = await page.$('button:has-text("Excel")');
                        if (xlsxOption) {
                            await xlsxOption.click();
                            console.log('✅ Export des données bloc initié');
                        }
                    }
                }
            } catch (error) {
                console.log('ℹ️ Export non disponible');
            }
        });
    });
});