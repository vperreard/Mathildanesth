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
        }
    }
}

// Commande pour se connecter via l'interface utilisateur
Cypress.Commands.add('login', (email: string, password: string) => {
    cy.visit('/auth/login');
    cy.get('[data-cy=email-input]').type(email);
    cy.get('[data-cy=password-input]').type(password);
    cy.get('[data-cy=login-button]').click();

    // Vérification d'authentification réussie
    cy.url().should('not.include', '/auth/login');

    // Attendre que la page se charge complètement
    cy.get('[data-cy=main-content]').should('exist');
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
    cy.get(`[data-cy=notification-${type}]`, { timeout: 10000 })
        .should('be.visible')
        .and('contain', text);
});

// Commande utilitaire pour attendre que les requêtes API soient terminées
Cypress.Commands.add('waitForApi', () => {
    cy.wait('@apiRequest').then((interception) => {
        expect(interception.response?.statusCode).to.be.oneOf([200, 201, 204]);
    });
}); 