describe('Conformité WCAG 2.1 AA Avancée', () => {
    const accessibilityRules = {
        // Niveau AA obligatoires
        critical: [
            'color-contrast',
            'focus-management',
            'keyboard-navigation',
            'aria-labels',
            'heading-order',
            'form-labels',
            'link-purpose',
            'error-identification'
        ],
        // Niveau AAA recommandés pour application médicale
        enhanced: [
            'color-contrast-enhanced',
            'focus-visible',
            'resize-text',
            'low-vision-support',
            'cognitive-load-reduction'
        ]
    };

    beforeEach(() => {
        cy.cleanState();
        
        // Configuration avancée d'axe-core
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        cy.injectAxe();
        
        // Configuration des règles axe pour le médical
        cy.configureAxe({
            rules: {
                // Règles critiques pour applications médicales
                'color-contrast': { enabled: true },
                'keyboard-navigation': { enabled: true },
                'focus-management': { enabled: true },
                'aria-labels': { enabled: true },
                'heading-order': { enabled: true },
                'form-labels': { enabled: true },
                'link-purpose': { enabled: true },
                'landmark-one-main': { enabled: true },
                'region': { enabled: true },
                'bypass': { enabled: true },
                
                // Règles spécifiques aux urgences médicales
                'emergency-access': { enabled: true },
                'critical-action-confirmation': { enabled: true }
            },
            tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
        });
    });

    it('valide la conformité WCAG complète sur toutes les pages critiques', () => {
        cy.log('♿️ Test WCAG complet - Pages critiques');
        
        const criticalPages = [
            { path: '/auth/connexion', name: 'Connexion', priority: 'critical' },
            { path: '/tableau-de-bord', name: 'Tableau de bord', priority: 'critical', requiresAuth: true },
            { path: '/planning', name: 'Planning', priority: 'critical', requiresAuth: true },
            { path: '/conges', name: 'Congés', priority: 'high', requiresAuth: true },
            { path: '/bloc-operatoire', name: 'Bloc opératoire', priority: 'critical', requiresAuth: true }
        ];
        
        criticalPages.forEach((page) => {
            cy.log(`Testing accessibility on ${page.name}`);
            
            if (page.requiresAuth) {
                // Authentification préalable
                cy.visit('/auth/connexion');
                cy.waitForPageLoad();
                cy.safeType('[data-cy=email-input]', 'admin@example.com');
                cy.safeType('[data-cy=password-input]', 'Test123!');
                cy.safeClick('[data-cy=submit-button]');
                cy.url().should('include', '/tableau-de-bord');
            }
            
            // Navigation vers la page à tester
            cy.visit(page.path);
            cy.waitForPageLoad();
            cy.injectAxe();
            
            // Test WCAG AA complet
            cy.checkA11y(null, {
                rules: accessibilityRules.critical.reduce((acc, rule) => {
                    acc[rule] = { enabled: true };
                    return acc;
                }, {})
            }, (violations) => {
                // Logger les violations pour analyse
                cy.task('logAccessibilityViolation', {
                    page: page.name,
                    path: page.path,
                    priority: page.priority,
                    violations: violations.map(v => ({
                        id: v.id,
                        impact: v.impact,
                        description: v.description,
                        nodes: v.nodes.length,
                        help: v.help
                    })),
                    timestamp: Date.now()
                });
            });
            
            // Tests spécifiques par page
            switch (page.name) {
                case 'Connexion':
                    cy.testLoginFormAccessibility();
                    break;
                case 'Planning':
                    cy.testPlanningAccessibility();
                    break;
                case 'Bloc opératoire':
                    cy.testBlocOperatoireAccessibility();
                    break;
            }
        });
    });

    it('teste la navigation complète au clavier pour utilisateurs non-voyants', () => {
        cy.log('⌨️ Navigation clavier complète');
        
        // Test de navigation séquentielle complète
        const keyboardNavigation = {
            currentIndex: 0,
            focusableElements: [],
            navigationPath: []
        };
        
        // Identifier tous les éléments focusables
        cy.get('body').then(($body) => {
            const focusableSelectors = [
                'input:not([disabled]):not([type="hidden"])',
                'button:not([disabled])',
                'select:not([disabled])',
                'textarea:not([disabled])',
                'a[href]',
                '[tabindex]:not([tabindex="-1"])',
                '[contenteditable]'
            ].join(', ');
            
            const focusableElements = $body.find(focusableSelectors).toArray();
            keyboardNavigation.focusableElements = focusableElements;
            
            cy.log(`Found ${focusableElements.length} focusable elements`);
        });
        
        // Test de navigation TAB complète
        cy.get('body').focus();
        
        // Parcourir tous les éléments avec TAB
        for (let i = 0; i < 20; i++) { // Limiter pour les tests
            cy.get('body').tab();
            
            cy.focused().then(($focused) => {
                if ($focused.length > 0) {
                    const elementInfo = {
                        tagName: $focused[0].tagName,
                        type: $focused[0].type,
                        id: $focused[0].id,
                        'data-cy': $focused[0].getAttribute('data-cy'),
                        'aria-label': $focused[0].getAttribute('aria-label'),
                        visible: $focused.is(':visible')
                    };
                    
                    keyboardNavigation.navigationPath.push(elementInfo);
                    
                    // Vérifier que l'élément est visible et a un focus visible
                    cy.wrap($focused)
                        .should('be.visible')
                        .and('satisfy', ($el) => {
                            const styles = window.getComputedStyle($el[0]);
                            const hasOutline = styles.outline !== 'none' && styles.outline !== '';
                            const hasBoxShadow = styles.boxShadow !== 'none';
                            const hasCustomFocus = $el.hasClass('focus-visible') || $el.hasClass('focused');
                            
                            return hasOutline || hasBoxShadow || hasCustomFocus;
                        });
                }
            });
            
            cy.wait(100); // Pause pour stabilité
        }
        
        // Vérifier la logique de navigation
        cy.wrap(keyboardNavigation.navigationPath).should('have.length.at.least', 5);
        
        // Test de navigation inverse (Shift+Tab)
        cy.log('Test navigation inverse Shift+Tab');
        for (let i = 0; i < 5; i++) {
            cy.get('body').type('{shift}{tab}');
            cy.focused().should('be.visible');
            cy.wait(100);
        }
    });

    it('teste l\'accessibilité pour les lecteurs d\'\u00e9cran', () => {
        cy.log('🔊 Test lecteurs d\'\u00e9cran');
        
        // Test de la structure sémantique
        cy.get('main').should('exist').and('have.attr', 'role', 'main');
        cy.get('nav').should('exist').and('have.attr', 'role', 'navigation');
        cy.get('header').should('exist').and('have.attr', 'role', 'banner');
        
        // Test de la hiérarchie des titres
        cy.get('h1').should('have.length', 1); // Un seul h1 par page
        
        // Vérifier l'ordre logique des titres
        cy.get('h1, h2, h3, h4, h5, h6').then(($headings) => {
            const headingLevels = [];
            $headings.each((_, heading) => {
                headingLevels.push(parseInt(heading.tagName.substring(1)));
            });
            
            // Vérifier qu'il n'y a pas de saut de niveau
            for (let i = 1; i < headingLevels.length; i++) {
                const diff = headingLevels[i] - headingLevels[i - 1];
                expect(diff).to.be.at.most(1); // Pas de saut de plus d'un niveau
            }
        });
        
        // Test des landmarks ARIA
        const requiredLandmarks = ['main', 'navigation', 'banner'];
        requiredLandmarks.forEach((landmark) => {
            cy.get(`[role="${landmark}"]`).should('exist');
        });
        
        // Test des labels et descriptions
        cy.get('input, select, textarea').each(($input) => {
            cy.wrap($input).should('satisfy', ($el) => {
                const hasLabel = $el.attr('aria-label') || 
                               $el.attr('aria-labelledby') || 
                               Cypress.$(`label[for="${$el.attr('id')}"]`).length > 0;
                return hasLabel;
            });
        });
        
        // Test des boutons et liens
        cy.get('button, [role="button"], a').each(($element) => {
            cy.wrap($element).should('satisfy', ($el) => {
                const hasAccessibleName = $el.attr('aria-label') || 
                                         $el.text().trim() || 
                                         $el.attr('title') ||
                                         $el.find('img[alt]').length > 0;
                return hasAccessibleName;
            });
        });
    });

    it('teste la conformité pour les utilisateurs à mobilité réduite', () => {
        cy.log('🖱️ Test mobilité réduite');
        
        // Test des zones de clic suffisamment grandes (WCAG 2.5.5)
        cy.get('button, [role="button"], a, input[type="checkbox"], input[type="radio"]')
            .each(($element) => {
                cy.wrap($element).then(($el) => {
                    const rect = $el[0].getBoundingClientRect();
                    const minSize = 44; // Pixels minimum recommandés
                    
                    // Vérifier la taille minimale
                    expect(rect.width).to.be.at.least(minSize, `Element width too small: ${rect.width}px`);
                    expect(rect.height).to.be.at.least(minSize, `Element height too small: ${rect.height}px`);
                });
            });
        
        // Test de l'espacement entre éléments interactifs
        cy.get('button, [role="button"], a').then(($elements) => {
            for (let i = 0; i < $elements.length - 1; i++) {
                const rect1 = $elements[i].getBoundingClientRect();
                const rect2 = $elements[i + 1].getBoundingClientRect();
                
                // Calculer la distance entre éléments
                const distance = Math.min(
                    Math.abs(rect2.left - rect1.right),
                    Math.abs(rect2.top - rect1.bottom)
                );
                
                // Distance minimale recommandée
                if (distance < 100) { // Si les éléments sont proches
                    expect(distance).to.be.at.least(8, 'Elements too close for motor impaired users');
                }
            }
        });
        
        // Test de la persistance du focus
        cy.get('[data-cy=email-input]').focus();
        cy.wait(500);
        cy.focused().should('have.attr', 'data-cy', 'email-input');
        
        // Test du timeout suffisant pour les actions
        const longActionStart = performance.now();
        cy.get('[data-cy=email-input]').type('test@example.com', { delay: 200 }); // Frappe lente
        
        cy.window().then(() => {
            const actionDuration = performance.now() - longActionStart;
            // L'interface doit rester responsive même avec saisie lente
            expect(actionDuration).to.be.lessThan(10000);
        });
    });

    it('teste l\'accessibilité pour les troubles cognitifs', () => {
        cy.log('🧠 Test troubles cognitifs');
        
        // Test de la cohérence de l'interface
        cy.get('[data-cy=submit-button]').then(($submitButtons) => {
            // Vérifier la cohérence des boutons de soumission
            const firstButtonText = $submitButtons.first().text().trim();
            const firstButtonClass = $submitButtons.first().attr('class');
            
            $submitButtons.each((_, button) => {
                const buttonText = Cypress.$(button).text().trim();
                const buttonClass = Cypress.$(button).attr('class');
                
                // Les boutons similaires doivent avoir un style cohérent
                if (buttonText.includes('Valider') || buttonText.includes('Envoyer')) {
                    expect(buttonClass).to.include('primary'); // Style cohérent
                }
            });
        });
        
        // Test des messages d'aide et instructions
        cy.get('form').within(() => {
            // Vérifier la présence d'instructions claires
            cy.get('[data-cy=form-instructions], .help-text, [aria-describedby]')
                .should('exist')
                .and('be.visible');
        });
        
        // Test de la prévention des erreurs
        cy.get('[data-cy=email-input]').type('email-invalide');
        cy.get('[data-cy=password-input]').type('123'); // Mot de passe trop court
        
        // Vérifier la validation en temps réel (aide cognitive)
        cy.get('[data-cy=email-input]').should('have.attr', 'aria-invalid', 'true');
        cy.get('[aria-live="polite"], [role="alert"]').should('exist');
        
        // Test de la simplicité des messages d'erreur
        cy.get('[data-cy=error-message]').should(($error) => {
            const errorText = $error.text();
            expect(errorText).to.not.be.empty;
            expect(errorText.length).to.be.lessThan(100); // Messages concis
            expect(errorText).to.match(/[.!]$/); // Ponctuation correcte
        });
    });

    it('teste l\'accessibilité sur appareils mobiles', () => {
        cy.log('📱 Test accessibilité mobile');
        
        const mobileViewports = [
            { width: 375, height: 667, name: 'iPhone SE' },
            { width: 414, height: 896, name: 'iPhone 11' },
            { width: 360, height: 640, name: 'Android' }
        ];
        
        mobileViewports.forEach((viewport) => {
            cy.viewport(viewport.width, viewport.height);
            cy.reload();
            cy.waitForPageLoad();
            cy.injectAxe();
            
            cy.log(`Testing mobile accessibility on ${viewport.name}`);
            
            // Test WCAG mobile
            cy.checkA11y(null, {
                rules: {
                    'target-size': { enabled: true }, // Taille des cibles tactiles
                    'orientation': { enabled: true },  // Support rotation
                    'reflow': { enabled: true }        // Adaptation contenu
                }
            });
            
            // Test des éléments tactiles
            cy.get('button, [role="button"], a, input').each(($element) => {
                cy.wrap($element).then(($el) => {
                    const rect = $el[0].getBoundingClientRect();
                    
                    // Taille minimale pour tactile (WCAG 2.5.5)
                    expect(rect.width).to.be.at.least(44);
                    expect(rect.height).to.be.at.least(44);
                });
            });
            
            // Test du zoom jusqu'à 200% (WCAG 1.4.4)
            cy.get('meta[name="viewport"]').should('have.attr', 'content')
                .and('not.include', 'maximum-scale=1')
                .and('not.include', 'user-scalable=no');
        });
    });

    afterEach(() => {
        // Générer un rapport d'accessibilité détaillé
        cy.task('generateAccessibilityReport', {
            testName: Cypress.currentTest.title,
            timestamp: Date.now(),
            wcagLevel: 'AA',
            medicalCompliance: true
        });
    });

    after(() => {
        // Générer le rapport consolidé d'accessibilité
        cy.task('generateConsolidatedAccessibilityReport', {
            suite: 'Advanced WCAG Compliance',
            timestamp: Date.now()
        });
    });
});

// Commandes personnalisées pour les tests d'accessibilité
Cypress.Commands.add('testLoginFormAccessibility', () => {
    // Test spécifique du formulaire de connexion
    cy.get('[data-cy=email-input]')
        .should('have.attr', 'type', 'email')
        .and('have.attr', 'required')
        .and('have.attr', 'aria-label')
        .or('have.attr', 'aria-labelledby');
    
    cy.get('[data-cy=password-input]')
        .should('have.attr', 'type', 'password')
        .and('have.attr', 'required')
        .and('have.attr', 'aria-label')
        .or('have.attr', 'aria-labelledby');
    
    cy.get('[data-cy=submit-button]')
        .should('have.attr', 'type', 'submit')
        .and('not.have.attr', 'disabled');
});

Cypress.Commands.add('testPlanningAccessibility', () => {
    // Test spécifique du planning
    cy.get('[data-cy=planning-calendar]')
        .should('have.attr', 'role', 'grid')
        .or('have.attr', 'role', 'table');
    
    cy.get('[data-cy=calendar-cell]')
        .should('have.attr', 'role', 'gridcell')
        .or('have.attr', 'role', 'cell');
});

Cypress.Commands.add('testBlocOperatoireAccessibility', () => {
    // Test spécifique du bloc opératoire
    cy.get('[data-cy=operating-room-list]')
        .should('have.attr', 'role', 'list')
        .or('have.attr', 'role', 'grid');
    
    cy.get('[data-cy=drag-drop-area]')
        .should('have.attr', 'aria-label')
        .and('have.attr', 'role', 'application');
});