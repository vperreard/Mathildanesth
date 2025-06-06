const { defineConfig } = require('cypress');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
// const { pa11y } = require('@cypress-audit/pa11y'); // Toujours commenté pour l'instant
const codeCoverageTask = require('@cypress/code-coverage/task');
const fs = require('fs');
const path = require('path');

module.exports = defineConfig({
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',

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

    e2e: {
        baseUrl: 'http://localhost:3000',
        specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
        supportFile: 'cypress/support/e2e.ts',
        // Configuration pour mode headless par défaut avec cleanup automatique
        defaultCommandTimeout: 15000,
        requestTimeout: 10000,
        responseTimeout: 10000,
        pageLoadTimeout: 20000,
        video: false, // Désactiver vidéos pour accélérer
        screenshotOnRunFailure: true,
        // Force headless mode par défaut
        browser: 'chrome',
        chromeWebSecurity: false,
        // Retry strategy for flaky tests
        retries: {
            runMode: 2,
            openMode: 0
        },
        setupNodeEvents(on, config) {
            codeCoverageTask(on, config);

            // Configuration du navigateur avec fermeture automatique
            on('before:browser:launch', (browser, launchOptions) => {
                if (browser.name === 'chrome') {
                    // Arguments pour mode headless et performance
                    launchOptions.args.push('--headless=new');
                    launchOptions.args.push('--no-sandbox');
                    launchOptions.args.push('--disable-dev-shm-usage');
                    launchOptions.args.push('--disable-gpu');
                    launchOptions.args.push('--window-size=1400,1200');
                    launchOptions.args.push('--force-device-scale-factor=1');
                    launchOptions.args.push('--disable-web-security');
                    launchOptions.args.push('--disable-features=VizDisplayCompositor');
                    
                    console.log('Chrome lancé en mode headless avec cleanup automatique configuré');
                }
                return launchOptions;
            });

            // Cleanup automatique après les tests
            on('after:run', (results) => {
                console.log('Tests terminés, cleanup automatique des processus navigateur...');
                if (process.platform === 'darwin') {
                    // macOS
                    require('child_process').exec('pkill -f "Google Chrome for Testing"', (error) => {
                        if (!error) console.log('Processus Chrome nettoyés avec succès');
                    });
                } else if (process.platform === 'linux') {
                    // Linux
                    require('child_process').exec('pkill -f chrome', (error) => {
                        if (!error) console.log('Processus Chrome nettoyés avec succès');
                    });
                } else if (process.platform === 'win32') {
                    // Windows
                    require('child_process').exec('taskkill /F /IM chrome.exe /T', (error) => {
                        if (!error) console.log('Processus Chrome nettoyés avec succès');
                    });
                }
                return results;
            });

            // Définir les tâches dans on('task', {...})
            const tasks = {
                resetTestDatabase() {
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
                    // Retourner une promesse pour exécuter la requête asynchrone
                    return prisma.$executeRawUnsafe(`TRUNCATE TABLE "users" CASCADE;`)
                        .then(() => {
                            console.log('Base de données de test réinitialisée avec succès');
                            prisma.$disconnect();
                            return null;
                        })
                        .catch(error => {
                            console.error('Erreur lors de la réinitialisation de la BD:', error);
                            prisma.$disconnect();
                            return null; // Retourner null en cas d'erreur pour éviter le blocage de Cypress
                        });
                },

                seedTestData(fixtures) {
                    const dbUrl = config.env.testDatabaseUrl;
                    if (!dbUrl) {
                        console.error('Variable \'testDatabaseUrl\' non définie pour seed');
                        return null;
                    }
                    const prisma = new PrismaClient({
                        datasources: {
                            db: {
                                url: dbUrl,
                            },
                        },
                    });

                    console.log(`Chargement des fixtures demandées: ${fixtures ? JSON.stringify(fixtures) : 'users (par défaut)'}`);

                    // Par défaut, toujours charger les utilisateurs
                    const usersFixturePath = path.join(__dirname, 'cypress/fixtures/utilisateurs.json');
                    try {
                        const usersJson = fs.readFileSync(usersFixturePath, 'utf-8');
                        const usersData = JSON.parse(usersJson).users || JSON.parse(usersJson);
                        const saltRounds = 10;

                        // Retourner une promesse pour créer tous les utilisateurs de manière asynchrone
                        return Promise.all(usersData.map(async (user) => {
                            try {
                                const hashedPassword = await bcrypt.hash(user.password, saltRounds);
                                const userData = {
                                    email: user.email,
                                    password: hashedPassword,
                                    role: user.role,
                                    professionalRole: user.professionalRole,
                                    prenom: user.prenom,
                                    nom: user.nom,
                                    login: user.email.split('@')[0],
                                    actif: user.actif
                                };

                                // Vérifier d'abord si l'utilisateur existe
                                const existingUser = await prisma.user.findUnique({
                                    where: {
                                        email: user.email
                                    }
                                });

                                if (existingUser) {
                                    console.log(`L'utilisateur ${user.email} existe déjà, ignoré.`);
                                } else {
                                    await prisma.user.create({
                                        data: userData
                                    });
                                    console.log(`Utilisateur ${user.email} créé avec succès.`);
                                }
                                return null;
                            } catch (creationError) {
                                console.error(`Erreur lors de la création de l\'utilisateur ${user.email}:`, creationError);
                                return null;
                            }
                        }))
                            .then(() => {
                                console.log('Chargement des données utilisateur terminé.');
                                prisma.$disconnect();
                                return null;
                            })
                            .catch(error => {
                                console.error('Erreur générale lors du chargement des données:', error);
                                prisma.$disconnect();
                                return null; // Retourner null en cas d'erreur pour éviter le blocage de Cypress
                            });
                    } catch (error) {
                        console.error('Erreur lors de la lecture du fichier fixtures/utilisateurs.json:', error);
                        prisma.$disconnect();
                        return null; // Retourner null en cas d'erreur pour éviter le blocage de Cypress
                    }
                },

                checkUserExists(email) {
                    if (process.env.NODE_ENV === 'production') {
                        console.warn('Tentative de lecture BD en production bloquée');
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
                    // Retourner une promesse pour faire la vérification asynchrone
                    return prisma.user.findUnique({ where: { email } })
                        .then(user => {
                            console.log(`Vérification existence pour ${email}: ${!!user}`);
                            prisma.$disconnect();
                            return !!user;
                        })
                        .catch(error => {
                            console.error(`Erreur lors de la vérification de l\'utilisateur ${email}:`, error);
                            prisma.$disconnect();
                            return false;
                        });
                }
            };

            // Enregistrer toutes les tâches
            on('task', tasks);

            // Créer un dossier pour les résultats s'il n'existe pas
            const resultsDir = path.join(__dirname, 'results');
            if (!fs.existsSync(resultsDir)) {
                fs.mkdirSync(resultsDir, { recursive: true });
            }

            // Tâche pour enregistrer les métriques de performance
            on('task', {
                logPerformance({ type, name, duration, timestamp, status }) {
                    const resultsFile = path.join(resultsDir, 'performance.json');

                    // Lire les résultats existants ou créer un nouvel array
                    let results = [];
                    if (fs.existsSync(resultsFile)) {
                        try {
                            results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
                        } catch (error) {
                            console.error('Erreur de lecture du fichier de résultats:', error);
                        }
                    }

                    // Ajouter la nouvelle métrique
                    results.push({
                        type,
                        name,
                        duration,
                        timestamp,
                        status,
                        run: new Date().toISOString()
                    });

                    // Écrire les résultats mis à jour
                    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

                    // Afficher un message dans la console
                    console.log(`Performance enregistrée: ${type} ${name} - ${duration}ms`);

                    return null; // Les tâches Cypress doivent retourner quelque chose
                }
            });

            return config;
        },
    },

    component: {
        devServer: {
            framework: 'next',
            bundler: 'webpack',
        },
    },

    env: {
        apiUrl: 'http://localhost:3000/api',
        testMode: 'e2e',
        testDatabaseUrl: process.env.TEST_DATABASE_URL || 'postgresql://mathildanesth_user:mathildanesth_password@localhost:5433/mathildanesth_test',
        CYPRESS: 'true',
        NODE_ENV: 'test',
    },
}); 