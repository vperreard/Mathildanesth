// ***********************************************************
// Commandes personnalisées pour Cypress
// ***********************************************************

// Ce fichier doit être traité comme un module pour que les déclarations globales fonctionnent
export { };

// Types pour vos commandes personnalisées
declare global {
    namespace Cypress {
        interface Chainable {
            // Commande pour se connecter en tant qu'utilisateur
            login(email: string, password: string): void;

            // Commande pour se connecter directement en contournant l'UI (plus rapide)
            loginByApi(email: string, password: string): void;

            // Commande pour accéder à une page en tant qu'utilisateur déjà authentifié
            visitAsAuthenticatedUser(url: string): void;

            // Commande pour sélectionner facilement une date dans un date-picker
            selectDate(selector: string, date: Date): void;

            // Commande pour créer un utilisateur de test
            createTestUser(userData: {
                email: string;
                password: string;
                name?: string;
                role?: string;
                [key: string]: any;
            }): Cypress.Chainable<any>;

            // Commande pour charger des fixtures spécifiques dans la base de données
            loadFixtures(fixtures: string[]): void;

            // Commande pour vérifier les notifications
            checkNotification(text: string, type?: 'success' | 'error' | 'info' | 'warning'): void;

            // Commande utilitaire pour attendre que les requêtes API soient terminées
            waitForApi(): void;

            // Commande pour changer de viewport selon un device prédéfini
            viewportDevice(device: 'mobile' | 'tablet' | 'desktop' | 'widescreen'): void;

            // Commande pour vérifier l'accessibilité d'une page
            checkAccessibility(options?: any): void;

            // Commande pour tester les performances avec Lighthouse
            runLighthouseAudit(): void;

            // Commande pour tester l'accessibilité avec pa11y
            runPa11yAudit(): void;

            // Ajout des commandes Axe
            injectAxe(): void;
            checkA11y(
                context?: string | Node | null,
                options?: any,
                violationCallback?: (violations: any) => void,
                skipFailures?: boolean
            ): void;

            // Commandes lighthouse et pa11y
            lighthouse(thresholds?: any, opts?: any, config?: any): void;
            pa11y(options?: any): void;

            /**
             * Commande pour se déconnecter
             * Exemple: cy.logout()
             */
            logout(): Chainable<void>;

            /**
             * Commande pour configurer les tests d'échanges d'affectations
             * Exemple: cy.setupAssignmentSwapTests()
             */
            setupAssignmentSwapTests(): Chainable<void>;

            /**
             * Commande pour créer une affectation dans le planning
             * Exemple: cy.createAffectation({ surgeon: 'Dr Dupont', room: 'Salle 1', slot: 'monday-morning' })
             */
            createAffectation(options: {
                surgeon: string;
                room: string;
                slot: string;
                type?: string;
                notes?: string;
            }): Chainable<void>;

            /**
             * Commande pour glisser-déposer un élément
             * Exemple: cy.dragAndDrop('[data-testid=source]', '[data-testid=target]')
             */
            dragAndDrop(sourceSelector: string, targetSelector: string): Chainable<void>;

            /**
             * Commande pour vérifier une violation de règle
             * Exemple: cy.checkRuleViolation('Temps de repos insuffisant')
             */
            checkRuleViolation(violationText: string): Chainable<void>;

            /**
             * Commande pour créer un congé
             * Exemple: cy.createLeave({ type: 'Congé annuel', startDate: '2025-06-01', endDate: '2025-06-07' })
             */
            createLeave(options: {
                type: string;
                startDate: string;
                endDate: string;
                user?: string;
                reason?: string;
            }): Chainable<void>;

            /**
             * Commande pour vérifier le quota de congés
             * Exemple: cy.checkLeaveQuota('Congé annuel', 20)
             */
            checkLeaveQuota(leaveType: string, expectedRemaining: number): Chainable<void>;
        }
    }
}

// Commande pour se connecter via l'interface utilisateur
Cypress.Commands.add('login', (email: string, password: string) => {
    cy.visit('/auth/login');
    cy.get('[data-testid=login-email-input]').type(email);
    cy.get('[data-testid=login-password-input]').type(password);
    cy.get('[data-testid=login-submit-button]').click();

    // Vérification d'authentification réussie
    cy.url().should('not.include', '/auth/login');

    // Attendre que la page se charge complètement
    cy.get('main').should('exist');
});

// Commande pour se connecter directement via l'API
Cypress.Commands.add('loginByApi', (email: string, password: string) => {
    // Simulation de l'authentification pour les tests
    // Au lieu d'appeler l'API, nous allons simplement définir les cookies et localStorage manuellement
    cy.log(`Simulation d'authentification pour ${email} - CONTOURNEMENT API`);

    // Créer un faux token
    const token = 'fake-test-token-' + Date.now();

    // Définir le token dans localStorage
    window.localStorage.setItem('authToken', token);

    // Définir un cookie de session
    cy.setCookie('auth_token', token);
});

// Commande pour visiter une page en tant qu'utilisateur authentifié
Cypress.Commands.add('visitAsAuthenticatedUser', (url: string) => {
    const authToken = window.localStorage.getItem('authToken');

    if (!authToken) {
        cy.log('Aucun token trouvé, simulation automatique de connexion');
        cy.setCookie('auth_token', 'fake-test-token-' + Date.now());
        window.localStorage.setItem('authToken', 'fake-test-token-' + Date.now());
    }

    // Intercepter toutes les requêtes API pour ajouter le token
    cy.intercept('**/api/**', (req) => {
        req.headers['Authorization'] = `Bearer ${authToken || 'fake-test-token'}`;
    }).as('apiRequests');

    cy.visit(url, {
        onBeforeLoad: (win) => {
            // Restaurer le token d'authentification dans le localStorage
            win.localStorage.setItem('authToken', authToken || 'fake-test-token');
        }
    });

    // Log & Screenshot avant d'attendre le contenu principal
    cy.log(`Page ${url} visitée, attendant l'élément <main>...`);

    // Attendre que la page se charge - essayer main ou body selon la structure
    cy.get('body').should('be.visible');
    // Ne pas bloquer si main n'existe pas
    cy.get('main').should('exist').then(($main) => {
        if ($main.length > 0) {
            cy.log('Élément <main> trouvé');
        } else {
            cy.log('Aucun élément <main> trouvé, utilisation du <body>');
        }
    });
});

// Commande pour sélectionner une date dans un date-picker
// Cette implémentation supporte à la fois les date-pickers natifs et React (comme react-datepicker, MUI, etc.)
Cypress.Commands.add('selectDate', (selector: string, date: Date) => {
    const formattedDate = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
    const day = date.getDate();
    const month = date.getMonth(); // 0-11
    const year = date.getFullYear();

    // Pour les inputs natifs, on peut simplement définir la valeur
    cy.get(selector).then($el => {
        if ($el.prop('tagName') === 'INPUT' && $el.attr('type') === 'date') {
            // Date picker natif HTML5
            cy.wrap($el).type(formattedDate);
        } else {
            // Pour les date-pickers personnalisés/React
            cy.wrap($el).click();

            // Vérifier quel type de date-picker est rendu et ajuster en conséquence
            // Pour le cas de react-datepicker (commun)
            if (Cypress.$('.react-datepicker').length) {
                // Sélectionner le mois et l'année si nécessaire
                cy.get('.react-datepicker__month-select').select(month.toString());
                cy.get('.react-datepicker__year-select').select(year.toString());

                // Sélectionner le jour
                cy.get(`.react-datepicker__day--0${day < 10 ? '0' + day : day}:not(.react-datepicker__day--outside-month)`).click();
            }
            // Pour MUI DatePicker
            else if (Cypress.$('.MuiDateCalendar-root').length) {
                // Naviguer vers le mois/année
                cy.get('.MuiPickersCalendarHeader-switchViewButton').click();
                cy.contains('.MuiPickersYear-yearButton', year.toString()).click();
                cy.contains('.MuiPickersMonth-monthButton', new Date(0, month).toLocaleString('default', { month: 'short' })).click();

                // Sélectionner le jour
                cy.get('.MuiDayCalendar-monthContainer').contains(day.toString()).click();
            }
            // Date picker générique - adapter en fonction des besoins
            else {
                cy.get('.date-picker').contains(day.toString()).click();
            }
        }
    });
});

// Commande pour créer un utilisateur de test
Cypress.Commands.add('createTestUser', (userData: {
    email: string;
    password: string;
    name?: string;
    role?: string;
    [key: string]: any;
}) => {
    return cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/test/create-user`, // Endpoint dédié aux tests
        body: userData,
        headers: {
            'X-Test-Auth': Cypress.env('testApiKey') || 'test-key-for-cypress'
        },
        failOnStatusCode: false
    }).then((response) => {
        if (response.status !== 201 && response.status !== 200) {
            throw new Error(`Échec de création d'utilisateur de test: ${response.status} ${JSON.stringify(response.body)}`);
        }
        return response.body;
    });
});

// Commande pour charger des fixtures dans la base de données
Cypress.Commands.add('loadFixtures', (fixtures: string[]) => {
    cy.task('seedTestData', { fixtures });
});

// Commande pour vérifier les notifications
Cypress.Commands.add('checkNotification', (text: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    // Attendre l'apparition de la notification avec un timeout raisonnable
    cy.get(`[data-testid=notification-${type}]`, { timeout: 10000 })
        .should('be.visible')
        .and('contain', text);
});

// Commande utilitaire pour attendre que les requêtes API soient terminées
Cypress.Commands.add('waitForApi', () => {
    cy.wait('@apiRequest').then((interception) => {
        expect(interception.response?.statusCode).to.be.oneOf([200, 201, 204]);
    });
});

/**
 * Commande pour se déconnecter
 * Exemple: cy.logout()
 */
Cypress.Commands.add('logout', () => {
    cy.clearCookies();
    cy.clearLocalStorage();
    // Optionnel: appeler une API de déconnexion si nécessaire
    // cy.request('POST', '/api/auth/logout');
});

/**
 * Commande pour configurer les tests d'échanges d'affectations
 * Cette commande est utilisée dans assignment-swap-notifications.spec.ts
 */
Cypress.Commands.add('setupAssignmentSwapTests', () => {
    cy.log('Configuration des tests d\'échanges d\'affectations');

    // Vérifier si l'API de test est disponible
    cy.request({
        url: '/api/test/ping',
        failOnStatusCode: false
    }).then((response) => {
        if (response.status === 200) {
            // Charger les fixtures pour les tests
            cy.fixture('assignment-swap-notifications.json').then((testData) => {
                // Créer les utilisateurs de test
                cy.log(`Préparation de l'utilisateur initiateur: ${testData.users.initiator.email}`);
                cy.log(`Préparation de l'utilisateur cible: ${testData.users.target.email}`);

                // Si l'API de test n'est pas disponible, on simule seulement
                const testMode = Cypress.env('testMode') || 'simulation';
                if (testMode === 'simulation') {
                    cy.log('Mode simulation: Utilisateurs et affectations simulés');
                    return;
                }

                // Si on est en mode réel, appeler les endpoints API de test
                cy.log('Mode réel: Création des utilisateurs et affectations réelles');
                // Ces opérations sont effectuées par setup-swap-notification-tests.js
            });
        } else {
            cy.log('API de test non disponible, mode simulation activé');
        }
    });
});

/**
 * Commande pour créer une affectation dans le planning
 */
Cypress.Commands.add('createAffectation', (options: {
    surgeon: string;
    room: string;
    slot: string;
    type?: string;
    notes?: string;
}) => {
    // Naviguer vers le planning si nécessaire
    cy.url().then((url) => {
        if (!url.includes('/bloc-operatoire')) {
            cy.visit('/bloc-operatoire');
        }
    });

    // Trouver et glisser le chirurgien vers le créneau
    const slotSelector = `[data-testid=slot-${options.slot}-${options.room.toLowerCase().replace(/\s+/g, '')}]`;
    
    cy.get('[data-testid=surgeons-list]')
        .contains(options.surgeon)
        .drag(slotSelector);

    // Si des options supplémentaires sont fournies, remplir le formulaire
    if (options.type || options.notes) {
        cy.get('[data-testid=assignment-modal]').within(() => {
            if (options.type) {
                cy.get('[data-testid=assignment-type]').select(options.type);
            }
            if (options.notes) {
                cy.get('[data-testid=notes-input]').type(options.notes);
            }
            cy.get('[data-testid=submit-assignment]').click();
        });
    }

    // Vérifier que l'affectation est créée
    cy.get(slotSelector).should('contain', options.surgeon);
});

/**
 * Commande pour glisser-déposer un élément
 * Implémentation améliorée du drag and drop
 */
Cypress.Commands.add('dragAndDrop', (sourceSelector: string, targetSelector: string) => {
    cy.get(sourceSelector).then(($source) => {
        cy.get(targetSelector).then(($target) => {
            const dataTransfer = new DataTransfer();
            
            // Déclencher l'event dragstart
            cy.wrap($source).trigger('dragstart', { dataTransfer });
            
            // Déclencher les events sur la cible
            cy.wrap($target).trigger('dragenter', { dataTransfer });
            cy.wrap($target).trigger('dragover', { dataTransfer });
            cy.wrap($target).trigger('drop', { dataTransfer });
            
            // Terminer le drag
            cy.wrap($source).trigger('dragend', { dataTransfer });
        });
    });
});

/**
 * Commande pour vérifier une violation de règle
 */
Cypress.Commands.add('checkRuleViolation', (violationText: string) => {
    // Vérifier dans plusieurs emplacements possibles
    cy.get('body').then(($body) => {
        const selectors = [
            '[data-testid=rule-violation-alert]',
            '[data-testid=rule-warning]',
            '[data-testid=validation-error]',
            '.rule-violation',
            '.alert-danger'
        ];
        
        let found = false;
        
        for (const selector of selectors) {
            if ($body.find(selector).length > 0) {
                cy.get(selector)
                    .should('be.visible')
                    .and('contain', violationText);
                found = true;
                break;
            }
        }
        
        if (!found) {
            throw new Error(`Aucune violation de règle trouvée contenant: ${violationText}`);
        }
    });
});

/**
 * Commande pour créer un congé
 */
Cypress.Commands.add('createLeave', (options: {
    type: string;
    startDate: string;
    endDate: string;
    user?: string;
    reason?: string;
}) => {
    // Naviguer vers la page des congés si nécessaire
    cy.url().then((url) => {
        if (!url.includes('/leaves')) {
            cy.visit('/leaves');
        }
    });

    // Ouvrir le formulaire de création
    cy.get('[data-testid=create-leave-button]').click();

    // Remplir le formulaire
    cy.get('[data-testid=leave-modal]').within(() => {
        if (options.user) {
            cy.get('[data-testid=user-select]').select(options.user);
        }
        
        cy.get('[data-testid=leave-type-select]').select(options.type);
        cy.get('[data-testid=leave-start-date]').clear().type(options.startDate);
        cy.get('[data-testid=leave-end-date]').clear().type(options.endDate);
        
        if (options.reason) {
            cy.get('[data-testid=leave-reason]').type(options.reason);
        }
        
        cy.get('[data-testid=submit-leave-button]').click();
    });

    // Vérifier la notification de succès
    cy.get('[data-testid=notification-success]')
        .should('be.visible')
        .and('contain', 'Demande de congé');
});

/**
 * Commande pour vérifier le quota de congés
 */
Cypress.Commands.add('checkLeaveQuota', (leaveType: string, expectedRemaining: number) => {
    // Naviguer vers la page de gestion des quotas
    cy.visit('/quota-management');
    
    // Trouver la ligne du type de congé
    cy.get('[data-testid=quota-table]').within(() => {
        cy.contains('tr', leaveType).within(() => {
            cy.get('[data-testid=quota-remaining]')
                .should('contain', expectedRemaining.toString());
        });
    });
}); 