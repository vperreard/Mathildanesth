import puppeteer, { Browser, Page } from 'puppeteer';
import { login, testUsers, waitForPageLoad } from './helpers/auth';

describe('Gestion des Sites, Secteurs et Salles', () => {
    let browser: Browser;
    let page: Page;
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    // Données de test
    const testSite = {
        name: `Site Test ${Date.now()}`,
        description: 'Site créé pour les tests automatisés'
    };
    
    const testSector = {
        name: `Secteur Test ${Date.now()}`,
        description: 'Secteur de test',
        category: 'SURGERY' // Ajout d'une catégorie par défaut
    };
    
    const testRoom = {
        name: `Salle Test ${Date.now()}`,
        code: `ST${Date.now().toString().slice(-6)}`,
        capacity: 4,
        type: 'OPERATING' // Ajout d'un type par défaut
    };

    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: process.env.HEADLESS !== 'false',
            slowMo: process.env.SLOWMO ? parseInt(process.env.SLOWMO) : 0,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    beforeEach(async () => {
    jest.clearAllMocks();
        page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Se connecter comme admin
        await login(page, testUsers.admin, baseUrl);
        await waitForPageLoad(page);
    });

    afterEach(async () => {
        // Prendre un screenshot en cas d'échec
        if (page && page.constructor.name === 'Page') {
            const testName = expect.getState().currentTestName;
            if (expect.getState().assertionCalls > 0 && expect.getState().numFailingTests > 0) {
                await page.screenshot({ 
                    path: `./tests/e2e/screenshots/failure-${testName}-${Date.now()}.png`,
                    fullPage: true 
                });
            }
        }
        
        if (page) {
            await page.close();
        }
    });

    describe('1. Gestion des Sites', () => {
        test('Créer un nouveau site', async () => {
            // Naviguer vers la page de configuration
            await page.goto(`${baseUrl}/parametres/configuration`);
            await waitForPageLoad(page);
            
            // Attendre que la page soit chargée
            await page.waitForSelector('h1, h2', { timeout: 10000 });
            
            // Chercher et cliquer sur l'onglet Sites avec plusieurs stratégies
            let sitesTabFound = false;
            
            // Stratégie 1: data-testid
            let sitesTab = await page.$('[data-testid="sites-tab"]');
            if (!sitesTab) {
                // Stratégie 2: texte exact
                sitesTab = await page.$('button:text("Sites")');
            }
            if (!sitesTab) {
                // Stratégie 3: texte partiel
                sitesTab = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    return buttons.find(btn => btn.textContent?.includes('Sites'));
                });
            }
            
            if (sitesTab) {
                await page.evaluate(el => el.click(), sitesTab);
                sitesTabFound = true;
            } else {
                // Si pas d'onglets, on est peut-être déjà sur la bonne section
                const hasSitesContent = await page.evaluate(() => 
                    document.body.textContent?.includes('Gestion des sites') ||
                    document.body.textContent?.includes('Sites')
                );
                if (hasSitesContent) {
                    sitesTabFound = true;
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Chercher le bouton d'ajout
            const addBtn = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.find(btn => 
                    btn.textContent?.includes('Ajouter') && 
                    (btn.textContent?.includes('site') || btn.textContent?.includes('Site'))
                );
            });
            
            if (addBtn) {
                await page.evaluate(el => el.click(), addBtn);
            } else {
                // Alternative: chercher un bouton "+" ou une icône
                const plusBtn = await page.$('button:has-text("+")');
                if (plusBtn) await plusBtn.click();
            }
            
            // Attendre le formulaire
            await page.waitForSelector('input[name="name"], input[placeholder*="Nom"]', { timeout: 5000 });
            
            // Remplir le formulaire
            const nameInput = await page.$('input[name="name"]') || await page.$('input[placeholder*="Nom"]');
            if (nameInput) {
                await nameInput.click({ clickCount: 3 });
                await nameInput.type(testSite.name);
            }
            
            const descInput = await page.$('textarea[name="description"], textarea[placeholder*="Description"], input[name="description"]');
            if (descInput) {
                await descInput.click({ clickCount: 3 });
                await descInput.type(testSite.description);
            }
            
            // Soumettre
            const submitBtn = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.find(btn => 
                    btn.type === 'submit' || 
                    btn.textContent?.includes('Créer') || 
                    btn.textContent?.includes('Ajouter') ||
                    btn.textContent?.includes('Enregistrer')
                );
            });
            
            if (submitBtn) {
                await page.evaluate(el => el.click(), submitBtn);
            }
            
            // Attendre la confirmation
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Vérifier que le site a été créé
            const siteCreated = await page.evaluate((siteName) => 
                document.body.textContent?.includes(siteName),
                testSite.name
            );
            
            expect(siteCreated).toBeTruthy();
        }, 30000);

        test('Modifier un site existant', async () => {
            await page.goto(`${baseUrl}/parametres/configuration`);
            await waitForPageLoad(page);
            
            // Aller sur l'onglet Sites si nécessaire
            const sitesTab = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.find(btn => btn.textContent?.includes('Sites'));
            });
            if (sitesTab) {
                await page.evaluate(el => el.click(), sitesTab);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Trouver et cliquer sur le bouton modifier pour notre site
            const edited = await page.evaluate((siteName) => {
                const rows = Array.from(document.querySelectorAll('tr, div[class*="card"], div[class*="item"]'));
                for (const row of rows) {
                    if (row.textContent?.includes(siteName)) {
                        // Chercher un bouton modifier dans cette ligne
                        const editBtn = row.querySelector('button[title*="Modifier"], button[aria-label*="Modifier"], button:has-text("Modifier"), button svg[class*="edit"], button svg[class*="pencil"]');
                        if (editBtn) {
                            (editBtn as HTMLElement).click();
                            return true;
                        }
                    }
                }
                return false;
            }, testSite.name);
            
            if (edited) {
                // Attendre le formulaire de modification
                await page.waitForSelector('input[name="name"], input[value*="Site Test"]', { timeout: 5000 });
                
                // Modifier la description
                const descInput = await page.$('textarea[name="description"], input[name="description"]');
                if (descInput) {
                    await descInput.click({ clickCount: 3 });
                    await descInput.type('Description modifiée - Test automatisé');
                }
                
                // Sauvegarder
                const saveBtn = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    return buttons.find(btn => 
                        btn.type === 'submit' || 
                        btn.textContent?.includes('Sauvegarder') || 
                        btn.textContent?.includes('Enregistrer') ||
                        btn.textContent?.includes('Mettre à jour')
                    );
                });
                
                if (saveBtn) {
                    await page.evaluate(el => el.click(), saveBtn);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
                // Vérifier la modification
                const hasModification = await page.evaluate(() => 
                    document.body.textContent?.includes('Description modifiée')
                );
                expect(hasModification).toBeTruthy();
            }
        }, 30000);
    });

    describe('2. Gestion des Secteurs', () => {
        test('Créer un secteur dans un site', async () => {
            await page.goto(`${baseUrl}/parametres/configuration`);
            await waitForPageLoad(page);
            
            // Aller sur l'onglet Secteurs
            const sectorsTab = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.find(btn => btn.textContent?.includes('Secteurs'));
            });
            if (sectorsTab) {
                await page.evaluate(el => el.click(), sectorsTab);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Ajouter un secteur
            const addBtn = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.find(btn => 
                    btn.textContent?.includes('Ajouter') && 
                    btn.textContent?.includes('secteur')
                );
            });
            
            if (addBtn) {
                await page.evaluate(el => el.click(), addBtn);
                
                // Attendre le formulaire
                await page.waitForSelector('input[name="name"]', { timeout: 5000 });
                
                // Remplir le formulaire
                await page.type('input[name="name"]', testSector.name);
                
                // Description
                const descInput = await page.$('textarea[name="description"], input[name="description"]');
                if (descInput) {
                    await descInput.type(testSector.description);
                }
                
                // Sélectionner le site
                const siteSelect = await page.$('select[name="siteId"]');
                if (siteSelect) {
                    // Sélectionner le site de test créé précédemment
                    await page.evaluate((select, siteName) => {
                        const options = select.querySelectorAll('option');
                        for (const option of options) {
                            if (option.textContent?.includes(siteName)) {
                                (select as HTMLSelectElement).value = option.value;
                                const event = new Event('change', { bubbles: true });
                                select.dispatchEvent(event);
                                break;
                            }
                        }
                    }, siteSelect, testSite.name);
                }
                
                // Catégorie
                const categorySelect = await page.$('select[name="category"]');
                if (categorySelect) {
                    await page.select('select[name="category"]', testSector.category);
                }
                
                // Soumettre
                const submitBtn = await page.$('button[type="submit"]');
                if (submitBtn) {
                    await submitBtn.click();
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
                // Vérifier
                const sectorCreated = await page.evaluate((sectorName) => 
                    document.body.textContent?.includes(sectorName),
                    testSector.name
                );
                expect(sectorCreated).toBeTruthy();
            }
        }, 30000);
    });

    describe('3. Gestion des Salles', () => {
        test('Créer une salle dans un secteur', async () => {
            await page.goto(`${baseUrl}/parametres/configuration`);
            await waitForPageLoad(page);
            
            // Aller sur l'onglet Salles
            const roomsTab = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.find(btn => 
                    btn.textContent?.includes('Salles') || 
                    btn.textContent?.includes('salles')
                );
            });
            if (roomsTab) {
                await page.evaluate(el => el.click(), roomsTab);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Ajouter une salle
            const addBtn = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.find(btn => 
                    btn.textContent?.includes('Ajouter') && 
                    btn.textContent?.includes('salle')
                );
            });
            
            if (addBtn) {
                await page.evaluate(el => el.click(), addBtn);
                
                // Attendre le formulaire
                await page.waitForSelector('input[name="name"]', { timeout: 5000 });
                
                // Remplir le formulaire
                await page.type('input[name="name"]', testRoom.name);
                
                const codeInput = await page.$('input[name="code"]');
                if (codeInput) {
                    await codeInput.type(testRoom.code);
                }
                
                const capacityInput = await page.$('input[name="capacity"], input[type="number"][name="capacity"]');
                if (capacityInput) {
                    await capacityInput.type(testRoom.capacity.toString());
                }
                
                // Type de salle
                const typeSelect = await page.$('select[name="type"]');
                if (typeSelect) {
                    await page.select('select[name="type"]', testRoom.type);
                }
                
                // Sélectionner le secteur
                const sectorSelect = await page.$('select[name="operatingSectorId"], select[name="sectorId"]');
                if (sectorSelect) {
                    await page.evaluate((select, sectorName) => {
                        const options = select.querySelectorAll('option');
                        for (const option of options) {
                            if (option.textContent?.includes(sectorName)) {
                                (select as HTMLSelectElement).value = option.value;
                                const event = new Event('change', { bubbles: true });
                                select.dispatchEvent(event);
                                break;
                            }
                        }
                    }, sectorSelect, testSector.name);
                }
                
                // Soumettre
                const submitBtn = await page.$('button[type="submit"]');
                if (submitBtn) {
                    await submitBtn.click();
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
                // Vérifier
                const roomCreated = await page.evaluate((roomName) => 
                    document.body.textContent?.includes(roomName),
                    testRoom.name
                );
                expect(roomCreated).toBeTruthy();
            }
        }, 30000);
    });

    describe('4. Nettoyage', () => {
        test('Supprimer les données de test', async () => {
            await page.goto(`${baseUrl}/parametres/configuration`);
            await waitForPageLoad(page);
            
            // Note: L'ordre de suppression est important : Salles -> Secteurs -> Sites
            
            // 1. Supprimer les salles
            let roomsTab = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.find(btn => btn.textContent?.includes('Salles'));
            });
            if (roomsTab) {
                await page.evaluate(el => el.click(), roomsTab);
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Supprimer la salle de test
                await deleteItem(page, testRoom.name);
            }
            
            // 2. Supprimer les secteurs
            const sectorsTab = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.find(btn => btn.textContent?.includes('Secteurs'));
            });
            if (sectorsTab) {
                await page.evaluate(el => el.click(), sectorsTab);
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Supprimer le secteur de test
                await deleteItem(page, testSector.name);
            }
            
            // 3. Supprimer les sites
            const sitesTab = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.find(btn => btn.textContent?.includes('Sites'));
            });
            if (sitesTab) {
                await page.evaluate(el => el.click(), sitesTab);
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Supprimer le site de test
                await deleteItem(page, testSite.name);
            }
            
            // Vérifier que tout a été supprimé
            const hasTestData = await page.evaluate((site, sector, room) => {
                const content = document.body.textContent || '';
                return content.includes(site) || content.includes(sector) || content.includes(room);
            }, testSite.name, testSector.name, testRoom.name);
            
            expect(hasTestData).toBeFalsy();
        }, 30000);
    });
});

/**
 * Fonction helper pour supprimer un élément
 */
async function deleteItem(page: Page, itemName: string): Promise<void> {
    const deleted = await page.evaluate((name) => {
        const rows = Array.from(document.querySelectorAll('tr, div[class*="card"], div[class*="item"]'));
        for (const row of rows) {
            if (row.textContent?.includes(name)) {
                // Chercher un bouton supprimer
                const deleteBtn = row.querySelector(
                    'button[title*="Supprimer"], ' +
                    'button[aria-label*="Supprimer"], ' +
                    'button:has-text("Supprimer"), ' +
                    'button svg[class*="trash"], ' +
                    'button svg[class*="delete"]'
                );
                if (deleteBtn) {
                    (deleteBtn as HTMLElement).click();
                    return true;
                }
            }
        }
        return false;
    }, itemName);
    
    if (deleted) {
        // Attendre et confirmer la suppression si nécessaire
        try {
            await page.waitForSelector('button:has-text("Confirmer"), button:has-text("Oui"), button:has-text("Supprimer")', { timeout: 2000 });
            const confirmBtn = await page.$('button:has-text("Confirmer")') || 
                              await page.$('button:has-text("Oui")') ||
                              await page.$('button:has-text("Supprimer")');
            if (confirmBtn) {
                await confirmBtn.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (e) {
            // Pas de confirmation nécessaire
        }
    }
}