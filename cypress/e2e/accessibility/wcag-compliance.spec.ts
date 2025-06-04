describe('Tests d\'accessibilité WCAG 2.1 AA', () => {
    beforeEach(() => {
        cy.cleanState();
        
        // Injecter axe-core pour les tests d'accessibilité
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        cy.injectAxe();
    });

    it('respecte les critères WCAG 2.1 AA sur la page de connexion', () => {
        // Vérifier l'accessibilité générale
        cy.checkA11y(null, {
            rules: {
                // Règles critiques WCAG 2.1 AA
                'color-contrast': { enabled: true },
                'keyboard-navigation': { enabled: true },
                'focus-management': { enabled: true },
                'aria-labels': { enabled: true },
                'heading-order': { enabled: true },
                'link-purpose': { enabled: true },
                'form-labels': { enabled: true }
            }
        });

        // Tests spécifiques aux éléments de formulaire
        cy.get('[data-cy=email-input]').should('have.attr', 'aria-label').or('have.attr', 'aria-labelledby');
        cy.get('[data-cy=password-input]').should('have.attr', 'aria-label').or('have.attr', 'aria-labelledby');
        cy.get('[data-cy=submit-button]').should('have.attr', 'aria-label').or('contain.text');

        // Vérifier la navigation au clavier
        cy.get('[data-cy=email-input]').focus().should('be.focused');
        cy.get('[data-cy=email-input]').tab();
        cy.get('[data-cy=password-input]').should('be.focused');
        cy.get('[data-cy=password-input]').tab();
        cy.get('[data-cy=submit-button]').should('be.focused');

        // Contraste des couleurs (vérification visuelle)
        cy.get('[data-cy=submit-button]').should('have.css', 'background-color');
        cy.get('[data-cy=submit-button]').should('have.css', 'color');
    });

    it('respecte l\'accessibilité sur le tableau de bord', () => {
        // Se connecter d'abord
        cy.safeType('[data-cy=email-input]', 'admin@example.com');
        cy.safeType('[data-cy=password-input]', 'Test123!');
        cy.safeClick('[data-cy=submit-button]');
        
        cy.url().should('include', '/tableau-de-bord');
        cy.waitForPageLoad();
        cy.injectAxe();

        // Vérifier l'accessibilité du tableau de bord
        cy.checkA11y();

        // Tests de navigation
        cy.get('[data-cy=nav-planning]').should('have.attr', 'role', 'button').or('have.attr', 'role', 'link');
        cy.get('[data-cy=nav-conges]').should('have.attr', 'role', 'button').or('have.attr', 'role', 'link');

        // Vérifier les landmarks ARIA
        cy.get('main').should('exist');
        cy.get('nav').should('exist');
        cy.get('header').should('exist');

        // Test de skip link
        cy.get('body').type('{tab}');
        cy.focused().should('contain.text', 'Aller au contenu').or('have.attr', 'aria-label', 'Skip to main content');
    });

    it('teste la navigation complète au clavier', () => {
        // Test complet de navigation au clavier
        cy.get('body').tab(); // Premier élément focusable
        
        // Vérifier que tous les éléments interactifs sont accessibles au clavier
        const interactiveElements = [
            '[data-cy=email-input]',
            '[data-cy=password-input]',
            '[data-cy=submit-button]',
            '[data-cy=forgot-password-link]'
        ];

        interactiveElements.forEach((selector) => {
            cy.get(selector).focus().should('be.focused');
            
            // Vérifier que l'élément est visible quand il a le focus
            cy.get(selector).should('be.visible');
            
            // Vérifier qu'il y a un indicateur visuel de focus
            cy.get(selector).should('have.css', 'outline').or('have.css', 'box-shadow');
        });
    });

    it('teste les annonces aux lecteurs d\'écran', () => {
        // Test des messages d'erreur pour les lecteurs d'écran
        cy.safeType('[data-cy=email-input]', 'invalid-email');
        cy.safeType('[data-cy=password-input]', 'wrong-password');
        cy.safeClick('[data-cy=submit-button]');

        // Vérifier que les messages d'erreur ont les attributs ARIA appropriés
        cy.get('[data-cy=error-message]', { timeout: 10000 }).should('exist').then(($error) => {
            // Le message d'erreur doit être annoncé
            cy.wrap($error).should('have.attr', 'role', 'alert')
                .or('have.attr', 'aria-live', 'polite')
                .or('have.attr', 'aria-live', 'assertive');
            
            // Le message doit être lié au champ en erreur
            cy.wrap($error).should('have.attr', 'id').then((errorId) => {
                cy.get('[data-cy=email-input]').should('have.attr', 'aria-describedby', errorId);
            });
        });
    });

    it('respecte les critères de contraste des couleurs', () => {
        // Vérifier le contraste des éléments principaux
        const elementsToCheck = [
            { selector: '[data-cy=submit-button]', name: 'bouton de soumission' },
            { selector: '[data-cy=email-input]', name: 'champ email' },
            { selector: '[data-cy=password-input]', name: 'champ mot de passe' },
            { selector: '[data-cy=forgot-password-link]', name: 'lien mot de passe oublié' }
        ];

        elementsToCheck.forEach(({ selector, name }) => {
            cy.get(selector).then(($el) => {
                const styles = window.getComputedStyle($el[0]);
                const backgroundColor = styles.backgroundColor;
                const color = styles.color;
                
                // Log des couleurs pour vérification manuelle
                cy.log(`${name}: background=${backgroundColor}, color=${color}`);
                
                // Vérifier que les couleurs ne sont pas transparentes
                expect(backgroundColor).to.not.equal('rgba(0, 0, 0, 0)');
                expect(color).to.not.equal('rgba(0, 0, 0, 0)');
            });
        });

        // Utiliser axe-core pour vérification automatique du contraste
        cy.checkA11y(null, {
            rules: {
                'color-contrast': { enabled: true }
            }
        });
    });

    it('teste la compatibilité avec les lecteurs d\'écran', () => {
        // Vérifier les attributs ARIA essentiels
        cy.get('h1').should('exist').and('be.visible');
        
        // Vérifier la structure de titre
        cy.get('h1').should('have.length', 1); // Un seul h1 par page
        
        // Vérifier les labels des formulaires
        cy.get('[data-cy=email-input]').should('have.attr', 'id').then((inputId) => {
            cy.get(`label[for="${inputId}"]`).should('exist')
                .or(() => {
                    cy.get('[data-cy=email-input]').should('have.attr', 'aria-label');
                });
        });

        cy.get('[data-cy=password-input]').should('have.attr', 'id').then((inputId) => {
            cy.get(`label[for="${inputId}"]`).should('exist')
                .or(() => {
                    cy.get('[data-cy=password-input]').should('have.attr', 'aria-label');
                });
        });

        // Vérifier les états des éléments interactifs
        cy.get('[data-cy=submit-button]').should('not.have.attr', 'disabled').then(() => {
            cy.get('[data-cy=submit-button]').should('not.have.attr', 'aria-disabled', 'true');
        });
    });

    it('teste la responsivité et l\'accessibilité mobile', () => {
        // Test sur différentes tailles d'écran
        const viewports = [
            { width: 375, height: 667, name: 'iPhone SE' },
            { width: 768, height: 1024, name: 'iPad' },
            { width: 1024, height: 768, name: 'Desktop small' }
        ];

        viewports.forEach(({ width, height, name }) => {
            cy.viewport(width, height);
            cy.reload();
            cy.waitForPageLoad();
            cy.injectAxe();

            cy.log(`Testing accessibility on ${name} (${width}x${height})`);

            // Vérifier que tous les éléments restent accessibles
            cy.checkA11y();

            // Vérifier que les éléments sont toujours focusables
            cy.get('[data-cy=email-input]').should('be.visible').focus().should('be.focused');
            cy.get('[data-cy=password-input]').should('be.visible').focus().should('be.focused');
            cy.get('[data-cy=submit-button]').should('be.visible').focus().should('be.focused');

            // Vérifier que le texte reste lisible (pas de débordement)
            cy.get('[data-cy=submit-button]').should('have.css', 'overflow', 'visible').or('have.css', 'overflow', 'hidden');
        });
    });

    it('teste la gestion des erreurs avec accessibilité', () => {
        // Provoquer une erreur de validation
        cy.safeClick('[data-cy=submit-button]'); // Soumission sans données

        // Vérifier que les erreurs sont accessibles
        cy.get('[data-cy=email-input]').should('have.attr', 'aria-invalid', 'true');
        cy.get('[data-cy=password-input]').should('have.attr', 'aria-invalid', 'true');

        // Vérifier les messages d'erreur
        cy.get('[role="alert"]').should('exist').and('be.visible');
        
        // Vérifier que le focus va sur le premier champ en erreur
        cy.get('[data-cy=email-input]').should('be.focused');

        // Corriger l'erreur et vérifier la mise à jour
        cy.safeType('[data-cy=email-input]', 'test@example.com');
        cy.get('[data-cy=email-input]').should('not.have.attr', 'aria-invalid', 'true');
    });

    afterEach(() => {
        // Générer un rapport d'accessibilité
        cy.task('log', 'Test d\'accessibilité terminé');
    });
});