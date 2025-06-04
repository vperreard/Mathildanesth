describe('Real User Monitoring (RUM)', () => {
    // Métriques RUM basées sur les vrais utilisateurs de l'application médicale
    const RUM_THRESHOLDS = {
        // Métriques d'expérience utilisateur réelle
        timeToInteractive: 3000,    // Temps avant interaction < 3s
        firstMeaningfulPaint: 1500, // Premier contenu utile < 1.5s
        userEngagement: 5000,       // Durée d'engagement minimum
        taskCompletion: 30000,      // Temps max pour compléter une tâche
        
        // Métriques spécifiques au médical
        emergencyResponse: 500,     // Réponse aux urgences < 500ms
        criticalDataLoad: 800,      // Données critiques < 800ms
        formSubmission: 2000,       // Soumission formulaires < 2s
        searchResponse: 600,        // Réponse recherche < 600ms
        
        // Tolérance d'erreur
        errorRate: 0.01,           // Taux d'erreur < 1%
        bounceRate: 0.05           // Taux d'abandon < 5%
    };

    let userSession = {
        startTime: 0,
        interactions: [],
        errors: [],
        completedTasks: [],
        abandonedTasks: []
    };

    beforeEach(() => {
        cy.cleanState();
        
        // Initialiser la session utilisateur
        userSession = {
            startTime: Date.now(),
            interactions: [],
            errors: [],
            completedTasks: [],
            abandonedTasks: []
        };
        
        // Intercepter et traquer toutes les interactions
        cy.window().then((win) => {
            // Traquer les clics
            win.addEventListener('click', (event) => {
                userSession.interactions.push({
                    type: 'click',
                    target: event.target.tagName,
                    timestamp: Date.now(),
                    coordinates: { x: event.clientX, y: event.clientY }
                });
            });
            
            // Traquer les erreurs
            win.addEventListener('error', (event) => {
                userSession.errors.push({
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    timestamp: Date.now()
                });
            });
        });
    });

    it('mesure l\'expérience réelle d\'un médecin utilisateur', () => {
        cy.log('👨‍⚕️ Simulation d\'un médecin réel');
        
        const realUserScenario = {
            role: 'MAR', // Médecin Anésthésiste Réanimateur
            urgency: 'normal',
            sessionType: 'daily_planning_check'
        };
        
        // ÉTAPE 1: Arrivée sur l'application (matin 7h30)
        const sessionStartTime = performance.now();
        cy.visit('/auth/connexion');
        
        // Simuler le comportement humain réel (hésitation, lecture)
        cy.wait(800); // Temps de lecture de l'écran
        cy.waitForPageLoad();
        
        // Mesurer Time to Interactive
        cy.get('[data-cy=email-input]').should('be.visible').then(() => {
            const timeToInteractive = performance.now() - sessionStartTime;
            
            cy.task('logRUMMetric', {
                metric: 'time_to_interactive',
                value: timeToInteractive,
                userContext: realUserScenario,
                threshold: RUM_THRESHOLDS.timeToInteractive,
                status: timeToInteractive < RUM_THRESHOLDS.timeToInteractive ? 'EXCELLENT' : 'POOR',
                timestamp: Date.now()
            });
            
            expect(timeToInteractive).to.be.lessThan(RUM_THRESHOLDS.timeToInteractive);
        });
        
        // ÉTAPE 2: Connexion (comportement réel avec possibles erreurs)
        const loginStartTime = performance.now();
        
        // Simuler une erreur de frappe réaliste
        cy.safeType('[data-cy=email-input]', 'medecin@exmaple.com'); // Typo volontaire
        cy.wait(500); // Temps de réflexion
        cy.get('[data-cy=email-input]').clear();
        cy.safeType('[data-cy=email-input]', 'medecin@example.com'); // Correction
        
        // Mot de passe avec hésitation
        cy.safeType('[data-cy=password-input]', 'Test');
        cy.wait(300);
        cy.safeType('[data-cy=password-input]', '123!');
        
        cy.safeClick('[data-cy=submit-button]');
        
        cy.url({ timeout: 10000 }).should('include', '/tableau-de-bord').then(() => {
            const loginDuration = performance.now() - loginStartTime;
            
            userSession.completedTasks.push({
                task: 'authentication',
                duration: loginDuration,
                timestamp: Date.now()
            });
            
            cy.task('logRUMMetric', {
                metric: 'task_completion_login',
                value: loginDuration,
                userBehavior: 'realistic_with_correction',
                threshold: RUM_THRESHOLDS.formSubmission,
                status: loginDuration < RUM_THRESHOLDS.formSubmission ? 'SMOOTH' : 'FRUSTRATING',
                timestamp: Date.now()
            });
        });
        
        // ÉTAPE 3: Consultation planning (tâche critique quotidienne)
        cy.log('📅 Vérification du planning du jour');
        const planningCheckStart = performance.now();
        
        cy.get('[data-cy=nav-planning]').click();
        cy.url().should('include', '/planning');
        
        // Simuler la lecture du planning (balayage visuel)
        cy.get('[data-cy=planning-grid]').should('be.visible');
        cy.wait(2000); // Temps de lecture réaliste
        
        // Vérifier une affectation spécifique
        cy.get('[data-cy=today-assignments]').should('be.visible').then(() => {
            const planningCheckDuration = performance.now() - planningCheckStart;
            
            userSession.completedTasks.push({
                task: 'daily_planning_check',
                duration: planningCheckDuration,
                timestamp: Date.now()
            });
            
            cy.task('logRUMMetric', {
                metric: 'critical_data_access',
                value: planningCheckDuration,
                taskType: 'daily_planning_review',
                threshold: RUM_THRESHOLDS.criticalDataLoad,
                userSatisfaction: planningCheckDuration < 3000 ? 'high' : 'low',
                timestamp: Date.now()
            });
        });
        
        // ÉTAPE 4: Recherche d'information (comportement exploratoire)
        cy.log('🔍 Recherche d\'informations spécifiques');
        const searchStartTime = performance.now();
        
        // Simuler une recherche réaliste
        cy.get('[data-cy=search-input]').should('be.visible');
        cy.safeType('[data-cy=search-input]', 'garde');
        cy.wait(300); // Pause réaliste
        cy.safeType('[data-cy=search-input]', ' nuit');
        
        cy.get('[data-cy=search-results]').should('be.visible').then(() => {
            const searchDuration = performance.now() - searchStartTime;
            
            cy.task('logRUMMetric', {
                metric: 'search_response_time',
                value: searchDuration,
                query: 'garde nuit',
                resultCount: Cypress.$('[data-cy=search-result-item]').length,
                threshold: RUM_THRESHOLDS.searchResponse,
                timestamp: Date.now()
            });
            
            expect(searchDuration).to.be.lessThan(RUM_THRESHOLDS.searchResponse);
        });
    });

    it('simule une situation d\'urgence médicale', () => {
        cy.log('🚨 Simulation urgence médicale - temps de réponse critique');
        
        const emergencyScenario = {
            type: 'urgence_bloc',
            severity: 'high',
            responseRequired: 'immediate'
        };
        
        // Connexion rapide en situation d'urgence
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        const emergencyResponseStart = performance.now();
        
        // Connexion ultra-rapide (utilisateur stressé/urgent)
        cy.safeType('[data-cy=email-input]', 'urgence@example.com');
        cy.safeType('[data-cy=password-input]', 'Test123!');
        cy.safeClick('[data-cy=submit-button]');
        
        cy.url({ timeout: 5000 }).should('include', '/tableau-de-bord');
        
        // Accès immédiat au bloc opératoire
        cy.get('[data-cy=nav-bloc-operatoire]').click();
        cy.url().should('include', '/bloc-operatoire');
        
        // Gestion de l'urgence
        cy.get('[data-cy=emergency-button]').click();
        cy.waitForElement('[data-cy=emergency-panel]');
        
        cy.get('[data-cy=emergency-panel]').within(() => {
            cy.get('[data-cy=urgence-salle-1]').click();
            cy.safeClick('[data-cy=assign-emergency-team]');
        });
        
        cy.waitForElement('[data-cy=emergency-confirmed]').then(() => {
            const emergencyResponseTime = performance.now() - emergencyResponseStart;
            
            cy.task('logRUMMetric', {
                metric: 'emergency_response_time',
                value: emergencyResponseTime,
                scenario: emergencyScenario,
                threshold: RUM_THRESHOLDS.emergencyResponse * 10, // 5s pour urgence complète
                criticality: 'life_threatening',
                status: emergencyResponseTime < 5000 ? 'ACCEPTABLE' : 'CRITICAL_DELAY',
                timestamp: Date.now()
            });
            
            // En urgence, réponse doit être < 5s
            expect(emergencyResponseTime).to.be.lessThan(5000);
        });
        
        userSession.completedTasks.push({
            task: 'emergency_response',
            duration: performance.now() - emergencyResponseStart,
            criticality: 'high',
            timestamp: Date.now()
        });
    });

    it('mesure la frustration utilisateur et les abandons', () => {
        cy.log('😡 Mesure de la frustration utilisateur');
        
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        // Simuler des tentatives de connexion échouées (frustration réelle)
        const frustrationScenario = {
            attempts: 0,
            maxAttempts: 3,
            frustrationType: 'authentication_failure'
        };
        
        // Tentative 1: mot de passe incorrect
        frustrationScenario.attempts++;
        const attempt1Start = performance.now();
        
        cy.safeType('[data-cy=email-input]', 'user@example.com');
        cy.safeType('[data-cy=password-input]', 'WrongPassword!');
        cy.safeClick('[data-cy=submit-button]');
        
        // Vérifier l'affichage d'erreur
        cy.get('[data-cy=error-message]', { timeout: 5000 }).should('be.visible').then(() => {
            const attempt1Duration = performance.now() - attempt1Start;
            
            userSession.errors.push({
                type: 'authentication_failure',
                attempt: frustrationScenario.attempts,
                duration: attempt1Duration,
                timestamp: Date.now()
            });
            
            cy.task('logRUMMetric', {
                metric: 'user_frustration_event',
                event: 'failed_login_attempt',
                attemptNumber: frustrationScenario.attempts,
                duration: attempt1Duration,
                emotionalImpact: 'mild_frustration',
                timestamp: Date.now()
            });
        });
        
        // Tentative 2: encore échouée (frustration croissante)
        cy.get('[data-cy=password-input]').clear();
        cy.wait(1000); // Pause de réflexion (frustration)
        
        frustrationScenario.attempts++;
        const attempt2Start = performance.now();
        
        cy.safeType('[data-cy=password-input]', 'AnotherWrongPassword!');
        cy.safeClick('[data-cy=submit-button]');
        
        cy.get('[data-cy=error-message]', { timeout: 5000 }).should('be.visible').then(() => {
            const attempt2Duration = performance.now() - attempt2Start;
            
            cy.task('logRUMMetric', {
                metric: 'user_frustration_event',
                event: 'repeated_failure',
                attemptNumber: frustrationScenario.attempts,
                duration: attempt2Duration,
                emotionalImpact: 'high_frustration',
                abandonmentRisk: 'elevated',
                timestamp: Date.now()
            });
        });
        
        // Tentative 3: succès (soulagement)
        cy.get('[data-cy=password-input]').clear();
        cy.wait(2000); // Pause plus longue (utilisateur stressé)
        
        frustrationScenario.attempts++;
        const attempt3Start = performance.now();
        
        cy.safeType('[data-cy=password-input]', 'Test123!');
        cy.safeClick('[data-cy=submit-button]');
        
        cy.url({ timeout: 10000 }).should('include', '/tableau-de-bord').then(() => {
            const attempt3Duration = performance.now() - attempt3Start;
            const totalAuthDuration = performance.now() - attempt1Start;
            
            userSession.completedTasks.push({
                task: 'authentication_after_failures',
                totalDuration: totalAuthDuration,
                attempts: frustrationScenario.attempts,
                userExperience: 'negative_then_relief',
                timestamp: Date.now()
            });
            
            cy.task('logRUMMetric', {
                metric: 'task_completion_with_friction',
                task: 'authentication',
                totalDuration: totalAuthDuration,
                attempts: frustrationScenario.attempts,
                finalOutcome: 'success',
                userSatisfaction: 'low_due_to_friction',
                abandonmentPrevented: true,
                timestamp: Date.now()
            });
        });
    });

    it('mesure l\'engagement utilisateur à long terme', () => {
        cy.log('🔄 Mesure d\'engagement à long terme');
        
        const engagementSession = {
            startTime: performance.now(),
            pagesVisited: 0,
            timeSpentPerPage: [],
            interactionDepth: 0
        };
        
        cy.visit('/auth/connexion');
        cy.waitForPageLoad();
        
        cy.safeType('[data-cy=email-input]', 'user@example.com');
        cy.safeType('[data-cy=password-input]', 'Test123!');
        cy.safeClick('[data-cy=submit-button]');
        
        cy.url().should('include', '/tableau-de-bord');
        
        // Parcours d'engagement réaliste
        const pages = [
            { nav: '[data-cy=nav-planning]', url: '/planning', expectedTime: 30000 },
            { nav: '[data-cy=nav-conges]', url: '/conges', expectedTime: 20000 },
            { nav: '[data-cy=nav-parametres]', url: '/parametres', expectedTime: 15000 }
        ];
        
        pages.forEach((page, index) => {
            const pageStartTime = performance.now();
            
            cy.get(page.nav).click();
            cy.url().should('include', page.url);
            
            engagementSession.pagesVisited++;
            
            // Simuler un engagement réaliste sur la page
            cy.wait(Math.min(page.expectedTime / 10, 3000)); // Version accélérée pour les tests
            
            const pageTime = performance.now() - pageStartTime;
            engagementSession.timeSpentPerPage.push(pageTime);
            
            // Interaction sur la page
            cy.get('body').click(100, 100); // Clic d'exploration
            cy.wait(500);
            cy.get('body').click(200, 200); // Autre interaction
            
            engagementSession.interactionDepth += 2;
            
            cy.task('logRUMMetric', {
                metric: 'page_engagement',
                page: page.url,
                timeSpent: pageTime,
                expectedTime: page.expectedTime,
                engagementLevel: pageTime > page.expectedTime * 0.5 ? 'high' : 'low',
                interactionCount: engagementSession.interactionDepth,
                timestamp: Date.now()
            });
        });
        
        // Calculer l'engagement global
        cy.wrap(null).then(() => {
            const totalSessionTime = performance.now() - engagementSession.startTime;
            const averagePageTime = engagementSession.timeSpentPerPage.reduce((a, b) => a + b, 0) / engagementSession.timeSpentPerPage.length;
            
            cy.task('logRUMMetric', {
                metric: 'session_engagement_summary',
                totalDuration: totalSessionTime,
                pagesVisited: engagementSession.pagesVisited,
                averagePageTime: averagePageTime,
                totalInteractions: engagementSession.interactionDepth,
                engagementScore: (engagementSession.interactionDepth / totalSessionTime) * 1000,
                userType: 'engaged_professional',
                timestamp: Date.now()
            });
            
            // Vérifier que l'utilisateur est resté engagé
            expect(totalSessionTime).to.be.greaterThan(RUM_THRESHOLDS.userEngagement);
        });
    });

    afterEach(() => {
        // Analyser la session utilisateur
        const sessionDuration = Date.now() - userSession.startTime;
        const errorRate = userSession.errors.length / (userSession.interactions.length + userSession.errors.length);
        const taskCompletionRate = userSession.completedTasks.length / (userSession.completedTasks.length + userSession.abandonedTasks.length);
        
        cy.task('logRUMSessionSummary', {
            sessionId: userSession.startTime,
            duration: sessionDuration,
            interactionCount: userSession.interactions.length,
            errorCount: userSession.errors.length,
            errorRate: errorRate,
            completedTasks: userSession.completedTasks.length,
            abandonedTasks: userSession.abandonedTasks.length,
            taskCompletionRate: taskCompletionRate,
            overallExperience: errorRate < 0.05 && taskCompletionRate > 0.9 ? 'excellent' : 'poor',
            timestamp: Date.now()
        });
        
        // Vérifier les seuils RUM
        expect(errorRate).to.be.lessThan(RUM_THRESHOLDS.errorRate);
        expect(taskCompletionRate).to.be.greaterThan(1 - RUM_THRESHOLDS.bounceRate);
    });

    after(() => {
        // Générer le rapport RUM final
        cy.task('generateRUMReport', {
            testSuite: 'Real User Monitoring',
            timestamp: Date.now()
        });
    });
});