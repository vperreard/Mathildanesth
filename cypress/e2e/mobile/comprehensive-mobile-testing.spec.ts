describe('Tests Mobile et Responsive Complets', () => {
    // Profils d'appareils pour tests complets
    const deviceProfiles = {
        mobile: [
            { name: 'iPhone SE', width: 375, height: 667, pixelRatio: 2, touch: true },
            { name: 'iPhone 12', width: 390, height: 844, pixelRatio: 3, touch: true },
            { name: 'Samsung Galaxy S21', width: 384, height: 854, pixelRatio: 2.75, touch: true },
            { name: 'iPhone 12 Pro Max', width: 428, height: 926, pixelRatio: 3, touch: true }
        ],
        tablet: [
            { name: 'iPad', width: 768, height: 1024, pixelRatio: 2, touch: true },
            { name: 'iPad Pro', width: 1024, height: 1366, pixelRatio: 2, touch: true },
            { name: 'Surface Pro', width: 912, height: 1368, pixelRatio: 2, touch: true }
        ],
        desktop: [
            { name: 'Desktop Small', width: 1024, height: 768, pixelRatio: 1, touch: false },
            { name: 'Desktop Medium', width: 1366, height: 768, pixelRatio: 1, touch: false },
            { name: 'Desktop Large', width: 1920, height: 1080, pixelRatio: 1, touch: false }
        ]
    };

    beforeEach(() => {
        cy.cleanState();
    });

    it('teste la responsivité sur tous les appareils mobiles', () => {
        cy.log('📱 Test responsivité mobile complet');
        
        deviceProfiles.mobile.forEach((device) => {
            cy.log(`Testing on ${device.name} (${device.width}x${device.height})`);
            
            // Configurer le viewport
            cy.viewport(device.width, device.height);
            
            // Simuler les caractéristiques de l'appareil
            cy.window().then((win) => {
                // Simuler le pixel ratio
                Object.defineProperty(win, 'devicePixelRatio', {
                    writable: true,
                    value: device.pixelRatio
                });
                
                // Simuler les événements tactiles
                if (device.touch) {
                    Object.defineProperty(win.navigator, 'maxTouchPoints', {
                        writable: true,
                        value: 10
                    });
                }
            });
            
            // Tester la page de connexion
            cy.visit('/auth/connexion');
            cy.waitForPageLoad();
            
            // Vérifier l'adaptation mobile
            cy.get('body').should('have.css', 'overflow-x', 'hidden'); // Pas de scroll horizontal
            
            // Vérifier que les éléments principaux sont visibles
            cy.get('[data-cy=email-input]').should('be.visible').and(($el) => {
                const rect = $el[0].getBoundingClientRect();
                expect(rect.width).to.be.lessThan(device.width - 40); // Marges respectées
            });
            
            cy.get('[data-cy=password-input]').should('be.visible');
            cy.get('[data-cy=submit-button]').should('be.visible');
            
            // Test de la taille des zones tactiles
            cy.get('[data-cy=submit-button]').then(($btn) => {
                const rect = $btn[0].getBoundingClientRect();
                expect(rect.height).to.be.at.least(44); // Taille minimale tactile
                expect(rect.width).to.be.at.least(44);
            });
            
            // Test du workflow mobile
            cy.safeType('[data-cy=email-input]', 'mobile@example.com');
            cy.safeType('[data-cy=password-input]', 'Test123!');
            cy.safeClick('[data-cy=submit-button]');
            
            // Vérifier la navigation post-connexion
            cy.url({ timeout: 10000 }).should('include', '/tableau-de-bord');
            
            // Vérifier l'adaptation du tableau de bord mobile
            cy.get('[data-cy=mobile-nav]').should('be.visible'); // Navigation mobile
            cy.get('[data-cy=desktop-nav]').should('not.be.visible'); // Navigation desktop cachée
            
            // Tester la navigation mobile
            cy.get('[data-cy=mobile-menu-button]').click();
            cy.get('[data-cy=mobile-menu]').should('be.visible');
            
            cy.get('[data-cy=mobile-nav-planning]').click();
            cy.url().should('include', '/planning');
            
            // Vérifier l'adaptation du planning mobile
            cy.get('[data-cy=planning-mobile-view]').should('be.visible');
            cy.get('[data-cy=planning-desktop-view]').should('not.be.visible');
            
            cy.task('logMobileTest', {
                device: device.name,
                viewport: { width: device.width, height: device.height },
                pixelRatio: device.pixelRatio,
                testsPassed: true,
                timestamp: Date.now()
            });
        });
    });

    it('teste les gestes tactiles et interactions mobiles', () => {
        cy.log('👆 Test gestes tactiles');
        
        // Tester sur un appareil mobile spécifique
        const testDevice = deviceProfiles.mobile[1]; // iPhone 12
        cy.viewport(testDevice.width, testDevice.height);
        
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.safeType('[data-cy=email-input]', 'mobile@example.com');
        cy.safeType('[data-cy=password-input]', 'Test123!');
        cy.safeClick('[data-cy=submit-button]');
        
        cy.url().should('include', '/tableau-de-bord');
        cy.get('[data-cy=nav-planning]').click();
        cy.url().should('include', '/planning');
        
        // Test de swipe (simulation)
        cy.get('[data-cy=planning-container]').then(($container) => {
            const container = $container[0];
            
            // Simuler un swipe horizontal
            cy.wrap($container)
                .trigger('touchstart', { touches: [{ clientX: 200, clientY: 300 }] })
                .trigger('touchmove', { touches: [{ clientX: 100, clientY: 300 }] })
                .trigger('touchend');
            
            cy.wait(500);
            
            // Vérifier que le swipe a eu un effet
            cy.get('[data-cy=planning-week-view]').should('be.visible');
        });
        
        // Test de pinch-to-zoom (si supporté)
        cy.get('[data-cy=planning-calendar]').then(($calendar) => {
            // Simuler un pinch
            cy.wrap($calendar)
                .trigger('touchstart', { 
                    touches: [
                        { clientX: 150, clientY: 200 },
                        { clientX: 250, clientY: 300 }
                    ] 
                })
                .trigger('touchmove', { 
                    touches: [
                        { clientX: 100, clientY: 150 },
                        { clientX: 300, clientY: 350 }
                    ] 
                })
                .trigger('touchend');
        });
        
        // Test de scroll tactile
        cy.get('[data-cy=planning-list]').scrollTo('bottom', { duration: 1000 });
        cy.get('[data-cy=planning-list]').scrollTo('top', { duration: 1000 });
        
        // Test de tap vs long press
        cy.get('[data-cy=planning-item]').first().then(($item) => {
            // Tap simple
            cy.wrap($item).trigger('touchstart').trigger('touchend');
            cy.wait(100);
            
            // Long press (simulation)
            cy.wrap($item)
                .trigger('touchstart')
                .wait(800) // Long press duration
                .trigger('touchend');
            
            // Vérifier que le menu contextuel s'affiche
            cy.get('[data-cy=context-menu]').should('be.visible');
        });
    });

    it('teste l\'orientation portrait/paysage', () => {
        cy.log('🔄 Test rotation d\'\u00e9cran');
        
        const testDevice = deviceProfiles.mobile[0]; // iPhone SE
        
        // Test en mode portrait
        cy.viewport(testDevice.width, testDevice.height);
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.safeType('[data-cy=email-input]', 'mobile@example.com');
        cy.safeType('[data-cy=password-input]', 'Test123!');
        cy.safeClick('[data-cy=submit-button]');
        
        cy.url().should('include', '/tableau-de-bord');
        
        // Vérifier l'affichage en portrait
        cy.get('[data-cy=mobile-layout]').should('have.class', 'portrait-mode');
        cy.get('[data-cy=navigation-stack]').should('be.visible'); // Navigation verticale
        
        // Basculer en mode paysage
        cy.viewport(testDevice.height, testDevice.width); // Inversion dimensions
        cy.reload();
        cy.waitForPageLoad();
        
        // Vérifier l'adaptation au mode paysage
        cy.get('[data-cy=mobile-layout]').should('have.class', 'landscape-mode');
        cy.get('[data-cy=navigation-horizontal]').should('be.visible'); // Navigation horizontale
        
        // Vérifier que les éléments restent utilisables
        cy.get('[data-cy=nav-planning]').should('be.visible').click();
        cy.url().should('include', '/planning');
        
        // Vérifier l'adaptation du planning en paysage
        cy.get('[data-cy=planning-landscape-view]').should('be.visible');
        cy.get('[data-cy=sidebar-landscape]').should('be.visible');
        
        // Retour en portrait
        cy.viewport(testDevice.width, testDevice.height);
        cy.reload();
        cy.waitForPageLoad();
        
        // Vérifier le retour au mode portrait
        cy.get('[data-cy=mobile-layout]').should('have.class', 'portrait-mode');
    });

    it('teste les performances mobiles et la vitesse de chargement', () => {
        cy.log('⚡ Test performances mobile');
        
        const slowDevice = deviceProfiles.mobile[0]; // iPhone SE (plus lent)
        cy.viewport(slowDevice.width, slowDevice.height);
        
        // Simuler une connexion mobile lente
        cy.intercept('**/api/**', (req) => {
            req.reply((res) => {
                res.delay(200); // Simuler latence mobile
                res.send();
            });
        });
        
        const mobileLoadStart = performance.now();
        
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.window().then(() => {
            const loadTime = performance.now() - mobileLoadStart;
            
            cy.task('logMobilePerformance', {
                metric: 'initial_page_load',
                device: slowDevice.name,
                duration: loadTime,
                threshold: 4000, // 4s max pour mobile
                status: loadTime < 4000 ? 'GOOD' : 'SLOW',
                timestamp: Date.now()
            });
            
            expect(loadTime).to.be.lessThan(4000); // Seuil mobile
        });
        
        // Test de la rapidité de connexion mobile
        const authStartTime = performance.now();
        
        cy.safeType('[data-cy=email-input]', 'mobile@example.com');
        cy.safeType('[data-cy=password-input]', 'Test123!');
        cy.safeClick('[data-cy=submit-button]');
        
        cy.url({ timeout: 8000 }).should('include', '/tableau-de-bord').then(() => {
            const authTime = performance.now() - authStartTime;
            
            cy.task('logMobilePerformance', {
                metric: 'mobile_authentication',
                device: slowDevice.name,
                duration: authTime,
                threshold: 3000,
                status: authTime < 3000 ? 'ACCEPTABLE' : 'TOO_SLOW',
                timestamp: Date.now()
            });
            
            expect(authTime).to.be.lessThan(3000);
        });
        
        // Test de navigation mobile
        const navStartTime = performance.now();
        
        cy.get('[data-cy=nav-planning]').click();
        cy.url().should('include', '/planning').then(() => {
            const navTime = performance.now() - navStartTime;
            
            cy.task('logMobilePerformance', {
                metric: 'mobile_navigation',
                device: slowDevice.name,
                duration: navTime,
                threshold: 1500,
                status: navTime < 1500 ? 'SMOOTH' : 'LAGGY',
                timestamp: Date.now()
            });
            
            expect(navTime).to.be.lessThan(1500);
        });
    });

    it('teste l\'accessibilité mobile et les zones tactiles', () => {
        cy.log('♿️ Test accessibilité mobile');
        
        const testDevice = deviceProfiles.mobile[1]; // iPhone 12
        cy.viewport(testDevice.width, testDevice.height);
        
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        // Vérifier les tailles minimales tactiles (44px)
        cy.get('button, [role="button"], a, input[type="checkbox"], input[type="radio"]')
            .each(($element) => {
                cy.wrap($element).then(($el) => {
                    const rect = $el[0].getBoundingClientRect();
                    
                    if ($el.is(':visible')) {
                        expect(rect.width).to.be.at.least(44, `Element too small: ${rect.width}px width`);
                        expect(rect.height).to.be.at.least(44, `Element too small: ${rect.height}px height`);
                    }
                });
            });
        
        // Vérifier l'espacement entre éléments tactiles
        cy.get('button, [role="button"], a').then(($elements) => {
            const visibleElements = $elements.filter(':visible');
            
            for (let i = 0; i < visibleElements.length - 1; i++) {
                const rect1 = visibleElements[i].getBoundingClientRect();
                const rect2 = visibleElements[i + 1].getBoundingClientRect();
                
                // Calculer la distance minimale
                const horizontalGap = Math.max(0, Math.min(
                    rect2.left - rect1.right,
                    rect1.left - rect2.right
                ));
                
                const verticalGap = Math.max(0, Math.min(
                    rect2.top - rect1.bottom,
                    rect1.top - rect2.bottom
                ));
                
                const minGap = Math.max(horizontalGap, verticalGap);
                
                // Espacement minimal pour éviter les erreurs tactiles
                if (minGap < 20) {
                    expect(minGap).to.be.at.least(8, 'Touch targets too close');
                }
            }
        });
        
        // Test de la lisibilité du texte mobile
        cy.get('body').should('have.css', 'font-size').then((fontSize) => {
            const size = parseInt(fontSize);
            expect(size).to.be.at.least(16); // Taille minimale pour mobile
        });
        
        // Test du contraste sur mobile
        cy.get('[data-cy=submit-button]').should(($btn) => {
            const styles = window.getComputedStyle($btn[0]);
            const bgColor = styles.backgroundColor;
            const textColor = styles.color;
            
            // Vérifier que les couleurs ne sont pas transparentes
            expect(bgColor).to.not.equal('rgba(0, 0, 0, 0)');
            expect(textColor).to.not.equal('rgba(0, 0, 0, 0)');
        });
    });

    it('teste la compatibilité avec les PWA et fonctionnalités mobiles', () => {
        cy.log('📦 Test PWA et fonctionnalités mobiles');
        
        const testDevice = deviceProfiles.mobile[2]; // Samsung Galaxy
        cy.viewport(testDevice.width, testDevice.height);
        
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        // Vérifier le manifest PWA
        cy.get('link[rel="manifest"]').should('exist');
        
        // Vérifier les meta tags mobiles
        cy.get('meta[name="viewport"]')
            .should('have.attr', 'content')
            .and('include', 'width=device-width')
            .and('include', 'initial-scale=1');
        
        // Vérifier le support du theme-color
        cy.get('meta[name="theme-color"]').should('exist');
        
        // Vérifier les icônes pour mobile
        cy.get('link[rel="apple-touch-icon"]').should('exist');
        cy.get('link[rel="icon"]').should('exist');
        
        // Tester le service worker (si disponible)
        cy.window().then((win) => {
            if ('serviceWorker' in win.navigator) {
                cy.wrap(win.navigator.serviceWorker.getRegistrations())
                    .then((registrations) => {
                        expect(registrations.length).to.be.greaterThan(0);
                    });
            }
        });
        
        // Test de la navigation mobile PWA
        cy.safeType('[data-cy=email-input]', 'pwa@example.com');
        cy.safeType('[data-cy=password-input]', 'Test123!');
        cy.safeClick('[data-cy=submit-button]');
        
        cy.url().should('include', '/tableau-de-bord');
        
        // Vérifier que l'application fonctionne en mode standalone
        cy.window().then((win) => {
            // Simuler le mode standalone PWA
            Object.defineProperty(win.navigator, 'standalone', {
                writable: true,
                value: true
            });
            
            // Vérifier l'adaptation de l'UI
            cy.get('[data-cy=pwa-header]').should('be.visible');
        });
    });

    afterEach(() => {
        // Reset viewport
        cy.viewport(1280, 720);
    });

    after(() => {
        // Générer le rapport mobile complet
        cy.task('generateMobileTestReport', {
            testSuite: 'Comprehensive Mobile Testing',
            devicesTestedCount: Object.values(deviceProfiles).flat().length,
            timestamp: Date.now()
        });
    });
});