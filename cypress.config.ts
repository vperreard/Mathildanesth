import { defineConfig } from 'cypress';
import { PrismaClient } from '@prisma/client';
import { lighthouse, prepareAudit } from '@cypress-audit/lighthouse';
import { pa11y } from '@cypress-audit/pa11y';

export default defineConfig({
    // Chemin vers le dossier contenant les fixtures et les commandes personnalisées
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',

    // Utilisation de rapports Mochawesome
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
        reporterEnabled: 'mochawesome',
        mochawesomeReporterOptions: {
            reportDir: 'cypress/reports/mocha',
            quite: true,
            overwrite: false,
            html: false,
            json: true
        }
    },

    // Configuration spécifique pour les tests e2e
    e2e: {
        baseUrl: 'http://localhost:3000',
        specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
        supportFile: 'cypress/support/e2e.ts',
        setupNodeEvents(on, config) {
            // Ajout du support pour la couverture de code
            require('@cypress/code-coverage/task')(on, config);

            // Configuration pour Lighthouse (audit de performance)
            on('before:browser:launch', (browser, launchOptions) => {
                prepareAudit(launchOptions);
                return launchOptions;
            });

            // Tasks pour audits performance et accessibilité
            on('task', {
                lighthouse: lighthouse((lighthouseReport) => {
                    // Sauvegarder le rapport JSON dans un dossier dédié
                    const fs = require('fs');
                    const path = require('path');
                    const reportsDir = path.join(__dirname, 'cypress/reports/lighthouse');

                    if (!fs.existsSync(reportsDir)) {
                        fs.mkdirSync(reportsDir, { recursive: true });
                    }

                    const reportPath = path.join(reportsDir, `lighthouse-${Date.now()}.json`);
                    fs.writeFileSync(reportPath, JSON.stringify(lighthouseReport, null, 2));

                    return lighthouseReport;
                }),

                pa11y: pa11y((pa11yReport) => {
                    // Sauvegarder le rapport JSON dans un dossier dédié
                    const fs = require('fs');
                    const path = require('path');
                    const reportsDir = path.join(__dirname, 'cypress/reports/pa11y');

                    if (!fs.existsSync(reportsDir)) {
                        fs.mkdirSync(reportsDir, { recursive: true });
                    }

                    const reportPath = path.join(reportsDir, `pa11y-${Date.now()}.json`);
                    fs.writeFileSync(reportPath, JSON.stringify(pa11yReport, null, 2));

                    return pa11yReport;
                }),

                // Tâche pour réinitialiser la base de données de test
                async resetTestDatabase() {
                    if (process.env.NODE_ENV === 'production') {
                        console.warn('Tentative de réinitialisation de BD en production bloquée');
                        return null;
                    }

                    if (!process.env.TEST_DATABASE_URL) {
                        console.error('Variable TEST_DATABASE_URL non définie');
                        return null;
                    }

                    try {
                        const prisma = new PrismaClient({
                            datasources: {
                                db: {
                                    url: process.env.TEST_DATABASE_URL,
                                },
                            },
                        });

                        // Réinitialisation des tables principales
                        // Ajustez en fonction de votre modèle de données
                        await prisma.$transaction([
                            prisma.$executeRaw`TRUNCATE TABLE "Leaves" CASCADE;`,
                            prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE;`,
                            prisma.$executeRaw`TRUNCATE TABLE "Surgeon" CASCADE;`,
                            prisma.$executeRaw`TRUNCATE TABLE "OperatingRoom" CASCADE;`,
                            prisma.$executeRaw`TRUNCATE TABLE "Specialty" CASCADE;`,
                            prisma.$executeRaw`TRUNCATE TABLE "Assignment" CASCADE;`,
                        ]);

                        await prisma.$disconnect();
                        console.log('Base de données de test réinitialisée avec succès');
                        return true;
                    } catch (error) {
                        console.error('Erreur lors de la réinitialisation de la BD:', error);
                        return null;
                    }
                },

                // Tâche pour charger des données de test
                async seedTestData(data) {
                    if (process.env.NODE_ENV === 'production') {
                        console.warn('Tentative de chargement de données en production bloquée');
                        return null;
                    }

                    if (!process.env.TEST_DATABASE_URL) {
                        console.error('Variable TEST_DATABASE_URL non définie');
                        return null;
                    }

                    try {
                        const prisma = new PrismaClient({
                            datasources: {
                                db: {
                                    url: process.env.TEST_DATABASE_URL,
                                },
                            },
                        });

                        // Charger les fixtures spécifiées
                        if (data.fixtures && Array.isArray(data.fixtures)) {
                            for (const fixtureName of data.fixtures) {
                                const fixtures = require(`./cypress/fixtures/${fixtureName}.json`);

                                switch (fixtureName) {
                                    case 'users':
                                        await Promise.all(fixtures.map((user: any) =>
                                            prisma.user.create({ data: user })
                                        ));
                                        break;
                                    case 'leaves':
                                        await Promise.all(fixtures.map((leave: any) =>
                                            prisma.leaves.create({ data: leave })
                                        ));
                                        break;
                                    case 'surgeons':
                                        await Promise.all(fixtures.map((surgeon: any) =>
                                            prisma.surgeon.create({ data: surgeon })
                                        ));
                                        break;
                                    case 'operatingRooms':
                                        await Promise.all(fixtures.map((room: any) =>
                                            prisma.operatingRoom.create({ data: room })
                                        ));
                                        break;
                                    case 'specialties':
                                        await Promise.all(fixtures.map((specialty: any) =>
                                            prisma.specialty.create({ data: specialty })
                                        ));
                                        break;
                                    case 'events':
                                        await Promise.all(fixtures.map((event: any) =>
                                            prisma.event.create({ data: event })
                                        ));
                                        break;
                                    case 'quotas':
                                        await Promise.all(fixtures.map((quota: any) =>
                                            prisma.quota.create({ data: quota })
                                        ));
                                        break;
                                    // Autres types selon vos besoins
                                }
                            }
                        }

                        await prisma.$disconnect();
                        console.log('Données de test chargées avec succès');
                        return true;
                    } catch (error) {
                        console.error('Erreur lors du chargement des données:', error);
                        return null;
                    }
                }
            });

            return config;
        },
    },

    // Configuration spécifique pour les tests de composants
    component: {
        specPattern: 'cypress/component/**/*.{js,jsx,ts,tsx}',
        supportFile: 'cypress/support/component.ts',
        devServer: {
            framework: 'next',
            bundler: 'webpack',
        },
    },

    // Variables d'environnement
    env: {
        // URL de l'API pour les tests
        apiUrl: 'http://localhost:3000/api',
        // Mode de test (integration ou e2e)
        testMode: 'e2e',
        // Base de données isolée pour les tests
        testDatabaseUrl: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mathildanesth_test',
        // Configuration des viewports pour tests de responsivité
        viewports: {
            mobile: {
                width: 375,
                height: 667
            },
            tablet: {
                width: 768,
                height: 1024
            },
            desktop: {
                width: 1280,
                height: 800
            },
            widescreen: {
                width: 1920,
                height: 1080
            }
        },
        // Seuils de performance pour Lighthouse
        lighthouse: {
            performance: 70,
            accessibility: 90,
            'best-practices': 85,
            seo: 80,
            pwa: 50
        }
    },

    // Configuration Cypress Dashboard si utilisé
    // projectId: 'votre-project-id', // À configurer après inscription sur Cypress Dashboard
}); 