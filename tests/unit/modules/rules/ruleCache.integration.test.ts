import { Rule, RuleType, RuleSeverity, RuleScope, RuleEvaluationContext } from '@/modules/rules/types/rule';
import { RuleEngine, RuleValidator } from '@/modules/rules/engine/rule-engine';
import { ruleCache } from '@/modules/rules/services/ruleCache';

// Tests d'intégration réels (sans mock) entre RuleEngine et RuleCacheService
describe('Intégration RuleEngine et RuleCacheService', () => {
    // Réinitialiser le cache avant chaque test
    beforeEach(() => {
        ruleCache.clearCache();
    });

    // Règle de test
    const testRule: Rule = {
        id: 'rule-int-1',
        name: 'Règle d\'intégration',
        description: 'Règle pour tests d\'intégration',
        type: RuleType.MIN_REST_PERIOD,
        severity: RuleSeverity.ERROR,
        scope: RuleScope.GLOBAL,
        enabled: true,
        parameters: { minHours: 11 },
        priority: 1,
        configuration: {},
        createdAt: new Date(2023, 0, 1),
        updatedAt: new Date(2023, 0, 1)
    };

    // Contexte d'évaluation
    const testContext: RuleEvaluationContext = {
        doctor: {
            id: 'doctor-int-1',
            firstName: 'Jane',
            lastName: 'Smith',
            department: 'Neurology',
            speciality: 'Neurologist',
            qualifications: ['brain_surgery']
        },
        currentDate: new Date(2023, 5, 15).toISOString()
    };

    // Validateur simple qui renvoie toujours "passed: true"
    const simpleValidator: RuleValidator = {
        validate: async (rule, context) => {
            // Ajouter un délai artificiel pour simuler un traitement
            await new Promise(resolve => setTimeout(resolve, 10));
            return {
                ruleId: rule.id,
                passed: true,
                severity: rule.severity,
                message: 'Règle respectée',
                details: null
            };
        }
    };

    it('devrait mettre en cache et réutiliser les résultats d\'évaluation', async () => {
        // Créer un moteur avec cache activé et une règle
        const engine = new RuleEngine({
            defaultRules: [testRule],
            enableCache: true
        });

        // Enregistrer le validateur
        engine.registerValidator(RuleType.MIN_REST_PERIOD, simpleValidator);

        // Espionner la méthode de validation pour compter les appels
        const validateSpy = jest.spyOn(simpleValidator, 'validate');

        // Première évaluation (sans cache)
        const result1 = await engine.evaluate(testContext);
        expect(result1.isValid).toBe(true);
        expect(result1.fromCache).toBe(false);
        expect(validateSpy).toHaveBeenCalledTimes(1);

        // Réinitialiser l'espion
        validateSpy.mockClear();

        // Deuxième évaluation (devrait utiliser le cache)
        const result2 = await engine.evaluate(testContext);
        expect(result2.isValid).toBe(true);
        expect(result2.fromCache).toBe(true);
        expect(validateSpy).not.toHaveBeenCalled(); // Le validateur ne devrait pas être appelé

        // Vérifier que les résultats sont identiques (sauf fromCache)
        const { fromCache: _, ...resultWithoutFromCache1 } = result1;
        const { fromCache: __, ...resultWithoutFromCache2 } = result2;
        expect(resultWithoutFromCache2).toEqual(resultWithoutFromCache1);
    });

    it('devrait invalider le cache lors de l\'ajout d\'une règle', async () => {
        // Créer un moteur avec cache activé
        const engine = new RuleEngine({
            enableCache: true
        });

        // Enregistrer le validateur
        engine.registerValidator(RuleType.MIN_REST_PERIOD, simpleValidator);

        // Ajouter une règle
        engine.addRule(testRule);

        // Première évaluation
        const result1 = await engine.evaluate(testContext);
        expect(result1.fromCache).toBe(false);

        // Deuxième évaluation (devrait utiliser le cache)
        const result2 = await engine.evaluate(testContext);
        expect(result2.fromCache).toBe(true);

        // Ajouter une nouvelle règle (devrait invalider le cache)
        const newRule = { ...testRule, id: 'rule-int-2', name: 'Nouvelle règle' };
        engine.addRule(newRule);

        // Troisième évaluation (le cache devrait être invalidé)
        const result3 = await engine.evaluate(testContext);
        expect(result3.fromCache).toBe(false);
    });

    it('devrait fonctionner correctement lorsque le cache est désactivé', async () => {
        // Créer un moteur avec cache désactivé
        const engine = new RuleEngine({
            defaultRules: [testRule],
            enableCache: false
        });

        // Enregistrer le validateur
        engine.registerValidator(RuleType.MIN_REST_PERIOD, simpleValidator);

        // Espionner directement la méthode validate du validateur
        // au lieu d'utiliser le spy de Jest
        const originalValidate = simpleValidator.validate;
        let validateCallCount = 0;

        simpleValidator.validate = async (...args) => {
            validateCallCount++;
            return originalValidate.apply(simpleValidator, args);
        };

        try {
            // Première évaluation
            const result1 = await engine.evaluate(testContext);
            expect(result1.fromCache).toBe(false);
            expect(validateCallCount).toBe(1);

            // Réinitialiser le compteur
            validateCallCount = 0;

            // Deuxième évaluation (ne devrait pas utiliser le cache)
            const result2 = await engine.evaluate(testContext);
            expect(result2.fromCache).toBe(false);
            expect(validateCallCount).toBe(1); // Le validateur devrait être appelé à nouveau
        } finally {
            // Restaurer la méthode originale
            simpleValidator.validate = originalValidate;
        }
    });

    it('devrait appliquer l\'expiration du cache correctement', async () => {
        // Créer un moteur avec cache activé
        const engine = new RuleEngine({
            defaultRules: [testRule],
            enableCache: true
        });

        // Enregistrer le validateur
        engine.registerValidator(RuleType.MIN_REST_PERIOD, simpleValidator);

        // Espionner la méthode getCachedEvaluation pour vérifier l'expiration
        const getCachedEvaluationSpy = jest.spyOn(ruleCache, 'getCachedEvaluation');

        // Utiliser la fonction cacheEvaluation directement avec un TTL court
        // (contourner le RuleEngine pour contrôler le TTL)
        const mockSummary = {
            isValid: true,
            violations: [],
            warnings: [],
            score: 0
        };

        // Mettre en cache avec un TTL très court (50ms)
        ruleCache.cacheEvaluation(mockSummary, testContext, { ttl: 50 });

        // Vérifier que le cache existe immédiatement
        expect(ruleCache.getCachedEvaluation(testContext)).toEqual(mockSummary);

        // Attendre que le cache expire
        await new Promise(resolve => setTimeout(resolve, 60));

        // Vérifier que le cache a expiré
        expect(ruleCache.getCachedEvaluation(testContext)).toBeNull();

        // Faire une évaluation après l'expiration (ne devrait pas utiliser le cache)
        const result = await engine.evaluate(testContext);
        expect(result.fromCache).toBe(false);
    });

    it('devrait gérer correctement l\'invalidation pour un médecin spécifique', async () => {
        // Créer un moteur avec cache activé
        const engine = new RuleEngine({
            defaultRules: [testRule],
            enableCache: true
        });

        // Enregistrer le validateur
        engine.registerValidator(RuleType.MIN_REST_PERIOD, simpleValidator);

        // Créer deux contextes pour deux médecins différents
        const doctor1Context = testContext;
        const doctor2Context = {
            ...testContext,
            doctor: {
                ...testContext.doctor!,
                id: 'doctor-int-2'
            }
        };

        // Évaluer pour les deux médecins
        await engine.evaluate(doctor1Context);
        await engine.evaluate(doctor2Context);

        // Invalider le cache pour le premier médecin uniquement
        engine.invalidateCacheForDoctor(doctor1Context.doctor!.id);

        // Vérifier que le cache est invalidé pour le premier médecin
        const result1 = await engine.evaluate(doctor1Context);
        expect(result1.fromCache).toBe(false);

        // Vérifier que le cache est toujours valide pour le second médecin
        const result2 = await engine.evaluate(doctor2Context);
        expect(result2.fromCache).toBe(true);
    });

    it('devrait tester les performances avec un grand nombre de règles', async () => {
        // Créer 100 règles de test
        const manyRules: Rule[] = Array.from({ length: 100 }, (_, i) => ({
            ...testRule,
            id: `perf-rule-${i}`,
            name: `Règle de performance ${i}`
        }));

        // Créer un moteur avec les nombreuses règles
        const engine = new RuleEngine({
            defaultRules: manyRules,
            enableCache: true
        });

        // Enregistrer le validateur
        engine.registerValidator(RuleType.MIN_REST_PERIOD, simpleValidator);

        // Mesurer le temps pour l'évaluation sans cache
        const startWithoutCache = performance.now();
        const result1 = await engine.evaluate(testContext);
        const endWithoutCache = performance.now();
        const timeWithoutCache = endWithoutCache - startWithoutCache;

        // S'assurer que le résultat n'est pas du cache
        expect(result1.fromCache).toBe(false);

        // Mesurer le temps pour l'évaluation avec cache
        const startWithCache = performance.now();
        const result2 = await engine.evaluate(testContext);
        const endWithCache = performance.now();
        const timeWithCache = endWithCache - startWithCache;

        // S'assurer que le résultat est du cache
        expect(result2.fromCache).toBe(true);

        // Vérifier l'amélioration des performances
        expect(timeWithCache).toBeLessThan(timeWithoutCache * 0.2); // Au moins 5 fois plus rapide

        // Valeurs de référence pour le débogage/analyse
        console.log(`Sans cache: ${timeWithoutCache}ms, Avec cache: ${timeWithCache}ms, Ratio: ${timeWithoutCache / timeWithCache}x`);
    });
}); 