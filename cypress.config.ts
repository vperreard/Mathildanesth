import { defineConfig } from 'cypress';
import { PrismaClient, Role, ProfessionalRole } from '@prisma/client';
import bcrypt from 'bcrypt';
// @ts-ignore - Ignorer l'erreur de module pour pa11y temporairement
// import { pa11y } from '@cypress-audit/pa11y';
import codeCoverageTask from '@cypress/code-coverage/task';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir __filename et __dirname dans ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        async setupNodeEvents(on, config) {
            // Ajout du support pour la couverture de code
            codeCoverageTask(on, config);

            // Configuration pour Lighthouse (audit de performance)
            on('before:browser:launch', (browser, launchOptions) => {
                // @ts-ignore - Ignorer l'erreur de type pour launchOptions si nécessaire
                if (browser.name === 'chrome' && browser.isHeadless) {
                    // fullPage screenshot size is 1400x1200 by default
                    launchOptions.args.push('--window-size=1400,1200');

                    // force screen to be non-retina and just use our given resolution
                    launchOptions.args.push('--force-device-scale-factor=1');
                }
                return launchOptions;
            });

            // Tasks pour audits performance et accessibilité
            on('task', {
                // pa11y: pa11y(), // Commenté temporairement pour débloquer

                // Tâche pour réinitialiser la base de données de test
                async resetTestDatabase() {
                    if (process.env.NODE_ENV === 'production') {
                        console.warn('Tentative de réinitialisation de BD en production bloquée');
                        return null;
                    }

                    const dbUrl = config.env.testDatabaseUrl;
                    if (!dbUrl) {
                        console.error('Variable \'testDatabaseUrl\' non définie dans config.env');
                        return null;
                    }

                    const prisma = new PrismaClient({
                        datasources: {
                            db: {
                                url: dbUrl,
                            },
                        },
                    });

                    try {
                        await prisma.$transaction([
                            prisma.$executeRaw`TRUNCATE TABLE \"users\" CASCADE;`,
                            // prisma.$executeRaw`TRUNCATE TABLE \"leaves\" CASCADE;`,
                            // prisma.$executeRaw`TRUNCATE TABLE \"surgeons\" CASCADE;`,
                            // prisma.$executeRaw`TRUNCATE TABLE \"operating_rooms\" CASCADE;`,
                            // prisma.$executeRaw`TRUNCATE TABLE \"specialties\" CASCADE;`,
                            // prisma.$executeRaw`TRUNCATE TABLE \"assignments\" CASCADE;`,
                        ]);
                        await prisma.$disconnect();
                        console.log('Base de données de test réinitialisée avec succès');
                        return null;
                    } catch (error) {
                        console.error('Erreur lors de la réinitialisation de la BD:', error);
                        await prisma.$disconnect();
                        return error; // Renvoyer l'erreur
                    }
                },

                async seedTestData() {
                    const dbUrl = config.env.testDatabaseUrl;
                    if (!dbUrl) {
                        console.error('Variable \'testDatabaseUrl\' non définie dans config.env pour seed');
                        return null;
                    }
                    const prisma = new PrismaClient({
                        datasources: {
                            db: {
                                url: dbUrl,
                            },
                        },
                    });

                    const usersFixturePath = path.join(__dirname, 'cypress/fixtures/users.json');

                    try {
                        const usersJson = fs.readFileSync(usersFixturePath, 'utf-8');
                        const usersData = JSON.parse(usersJson);
                        const saltRounds = 10;

                        // Utiliser une boucle for...of séquentielle pour plus de robustesse et un meilleur logging
                        for (const user of usersData) {
                            try {
                                const hashedPassword = await bcrypt.hash(user.password, saltRounds);
                                const userData = {
                                    ...user,
                                    password: hashedPassword,
                                    // Assurer que les rôles sont correctement typés si nécessaire
                                    role: user.role as Role, // Cast explicite
                                    professionalRole: user.professionalRole as ProfessionalRole // Cast explicite
                                };
                                console.log(`Tentative de création utilisateur séquentielle: ${userData.email}`);
                                await prisma.user.create({ data: userData });
                                console.log(`Utilisateur ${userData.email} créé avec succès.`);
                            } catch (creationError) {
                                console.error(`Erreur lors de la création de l'utilisateur ${user.email}:`, creationError);
                                // Optionnel: décider si on doit arrêter tout le seed ou juste logger et continuer
                                // throw creationError; // Pour arrêter complètement si une création échoue
                            }
                        }

                        console.log('Chargement des données utilisateur terminé.');
                        await prisma.$disconnect();
                        return null;
                    } catch (error) {
                        console.error('Erreur générale lors du chargement des données:', error);
                        await prisma.$disconnect();
                        return error;
                    }
                },

                // Nouvelle tâche pour vérifier l'existence d'un utilisateur
                async checkUserExists(email: string) {
                    if (process.env.NODE_ENV === 'production') {
                        console.warn('Tentative de lecture BD en production bloquée depuis Cypress');
                        return false;
                    }
                    const dbUrl = config.env.testDatabaseUrl;
                    if (!dbUrl) {
                        console.error('Variable \'testDatabaseUrl\' non définie pour checkUserExists');
                        return false;
                    }
                    const prisma = new PrismaClient({
                        datasources: {
                            db: {
                                url: dbUrl,
                            },
                        },
                    });
                    try {
                        const user = await prisma.user.findUnique({ where: { email } });
                        await prisma.$disconnect();
                        console.log(`Vérification existence pour ${email}: ${!!user}`);
                        return !!user;
                    } catch (error) {
                        console.error(`Erreur lors de la vérification de l'utilisateur ${email}:`, error);
                        await prisma.$disconnect();
                        return false;
                    }
                }
            });

            return config;
        },
    },

    // Commenter temporairement la section component
    // component: {
    //     specPattern: 'cypress/component/**/*.{js,jsx,ts,tsx}',
    //     supportFile: 'cypress/support/component.ts',
    //     devServer: {
    //         framework: 'next',
    //         bundler: 'webpack',
    //     },
    // },

    env: {
        apiUrl: 'http://localhost:3000/api',
        testMode: 'e2e',
        testDatabaseUrl: process.env.TEST_DATABASE_URL || 'postgresql://mathildanesth_user:mathildanesth_password@localhost:5433/mathildanesth_test',
        viewports: {
            mobile: { width: 375, height: 667 },
            tablet: { width: 768, height: 1024 },
            desktop: { width: 1280, height: 800 },
            widescreen: { width: 1920, height: 1080 }
        },
        lighthouse: {
            performance: 70,
            accessibility: 90,
            'best-practices': 85,
            seo: 80,
            pwa: 50
        }
    },

    // projectId: 'votre-project-id', // À configurer après inscription sur Cypress Dashboard
});