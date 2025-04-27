import { Rule, RuleType, RuleSeverity, RuleScope, RuleEvaluationContext, RuleEvaluationResult } from '@/modules/rules/types/rule';
import { RuleEngine, RuleValidator } from '@/modules/rules/engine/rule-engine';
import { ruleCache } from '@/modules/rules/services/ruleCache';

// Mock du service de cache
jest.mock('@/modules/rules/services/ruleCache', () => {
    const originalModule = jest.requireActual('@/modules/rules/services/ruleCache');
    return {
        ...originalModule,
        ruleCache: {
            clearCache: jest.fn(),
            getCachedEvaluation: jest.fn(),
            cacheEvaluation: jest.fn(),
            invalidateForDoctor: jest.fn()
        }
    };
});

describe('RuleEngine - Intégration du cache', () => {
    // Réinitialisation des mocks avant chaque test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Créer une règle pour les tests
    const createTestRule = (id: string): Rule => ({
        id,
        name: `Règle test ${id}`,
        description: 'Une règle de test',
        type: RuleType.MIN_REST_PERIOD,
        severity: RuleSeverity.ERROR,
        scope: RuleScope.GLOBAL,
        enabled: true,
        parameters: { minHours: 11 },
        priority: 1,
        createdAt: new Date(2023, 0, 1).toISOString(),
        updatedAt: new Date(2023, 0, 1).toISOString()
    });

    // Créer un contexte d'évaluation pour les tests
    const createTestContext = (): RuleEvaluationContext => ({
        doctor: {
            id: 'doctor-1',
            firstName: 'John',
            lastName: 'Doe',
            department: 'Cardiology',
            speciality: 'Cardiologist',
            qualifications: ['surgery']
        },
        currentDate: new Date(2023, 5, 15).toISOString()
    });

    // Créer un validateur mock
    const createMockValidator = (shouldPass: boolean): RuleValidator => ({
        validate: jest.fn().mockResolvedValue({
            ruleId: 'rule-1',
            passed: shouldPass,
            severity: RuleSeverity.ERROR,
            message: shouldPass ? 'Règle respectée' : 'Règle violée',
            details: null
        })
    });

    describe('Gestion du cache lors de la construction', () => {
        it('devrait activer le cache par défaut', () => {
            const engine = new RuleEngine();
            expect((engine as any).enableCache).toBe(true);
        });

        it('devrait permettre de désactiver le cache à la construction', () => {
            const engine = new RuleEngine({ enableCache: false });
            expect((engine as any).enableCache).toBe(false);
        });
    });

    describe('Invalidation du cache lors de modifications des règles', () => {
        it('devrait vider le cache lors de l\'ajout d\'une règle', () => {
            const engine = new RuleEngine();
            const rule = createTestRule('rule-1');

            engine.addRule(rule);

            expect(ruleCache.clearCache).toHaveBeenCalledTimes(1);
        });

        it('devrait vider le cache lors de la suppression d\'une règle', () => {
            const engine = new RuleEngine({ defaultRules: [createTestRule('rule-1')] });

            engine.removeRule('rule-1');

            expect(ruleCache.clearCache).toHaveBeenCalledTimes(1);
        });

        it('ne devrait pas vider le cache si le cache est désactivé', () => {
            const engine = new RuleEngine({ enableCache: false });
            const rule = createTestRule('rule-1');

            engine.addRule(rule);
            engine.removeRule('rule-1');

            expect(ruleCache.clearCache).not.toHaveBeenCalled();
        });
    });

    describe('Activation et désactivation du cache', () => {
        it('devrait permettre d\'activer/désactiver le cache', () => {
            const engine = new RuleEngine({ enableCache: false });

            // Activer le cache
            engine.setEnableCache(true);
            expect((engine as any).enableCache).toBe(true);

            // Désactiver le cache
            engine.setEnableCache(false);
            expect((engine as any).enableCache).toBe(false);
            expect(ruleCache.clearCache).toHaveBeenCalledTimes(1);
        });

        it('devrait vider le cache uniquement lorsqu\'on le désactive', () => {
            const engine = new RuleEngine({ enableCache: true });

            // Activer alors qu'il est déjà actif
            engine.setEnableCache(true);
            expect(ruleCache.clearCache).not.toHaveBeenCalled();

            // Désactiver
            engine.setEnableCache(false);
            expect(ruleCache.clearCache).toHaveBeenCalledTimes(1);
        });

        it('devrait permettre de vider explicitement le cache', () => {
            const engine = new RuleEngine();

            engine.clearCache();

            expect(ruleCache.clearCache).toHaveBeenCalledTimes(1);
        });

        it('ne devrait pas vider le cache si désactivé', () => {
            const engine = new RuleEngine({ enableCache: false });

            engine.clearCache();

            expect(ruleCache.clearCache).not.toHaveBeenCalled();
        });
    });

    describe('Utilisation du cache lors de l\'évaluation des règles', () => {
        it('devrait vérifier le cache lors de l\'évaluation', async () => {
            const engine = new RuleEngine();
            const context = createTestContext();

            // Configurer le mock pour renvoyer null (pas d'entrée en cache)
            (ruleCache.getCachedEvaluation as jest.Mock).mockReturnValue(null);

            await engine.evaluate(context);

            expect(ruleCache.getCachedEvaluation).toHaveBeenCalledWith(context);
        });

        it('devrait retourner les résultats du cache s\'ils existent', async () => {
            const engine = new RuleEngine();
            const context = createTestContext();

            // Créer un résultat de cache simulé
            const cachedResult = {
                isValid: true,
                violations: [],
                warnings: [],
                score: 0
            };

            // Configurer le mock pour renvoyer un résultat en cache
            (ruleCache.getCachedEvaluation as jest.Mock).mockReturnValue(cachedResult);

            const result = await engine.evaluate(context);

            expect(result).toEqual({
                ...cachedResult,
                fromCache: true
            });

            // Vérifier que l'évaluation réelle n'a pas eu lieu
            expect(ruleCache.cacheEvaluation).not.toHaveBeenCalled();
        });

        it('devrait évaluer les règles et stocker le résultat en cache si pas de cache', async () => {
            const engine = new RuleEngine({
                defaultRules: [createTestRule('rule-1')]
            });
            const context = createTestContext();
            const mockValidator = createMockValidator(true);

            // Enregistrer le validateur
            engine.registerValidator(RuleType.MIN_REST_PERIOD, mockValidator);

            // Configurer le mock pour renvoyer null (pas d'entrée en cache)
            (ruleCache.getCachedEvaluation as jest.Mock).mockReturnValue(null);

            // Évaluer les règles
            const result = await engine.evaluate(context);

            // Vérifier que le validateur a été appelé
            expect(mockValidator.validate).toHaveBeenCalled();

            // Vérifier que le résultat a été mis en cache
            expect(ruleCache.cacheEvaluation).toHaveBeenCalledWith(
                expect.objectContaining({
                    isValid: true,
                    violations: [],
                    warnings: [],
                    score: expect.any(Number),
                    fromCache: false
                }),
                context
            );

            // Vérifier que le fromCache est false
            expect(result.fromCache).toBe(false);
        });

        it('ne devrait pas utiliser le cache si désactivé', async () => {
            const engine = new RuleEngine({
                enableCache: false,
                defaultRules: [createTestRule('rule-1')]
            });
            const context = createTestContext();
            const mockValidator = createMockValidator(true);

            // Enregistrer le validateur
            engine.registerValidator(RuleType.MIN_REST_PERIOD, mockValidator);

            // Évaluer les règles
            await engine.evaluate(context);

            // Vérifier que le cache n'a pas été consulté
            expect(ruleCache.getCachedEvaluation).not.toHaveBeenCalled();

            // Vérifier que le résultat n'a pas été mis en cache
            expect(ruleCache.cacheEvaluation).not.toHaveBeenCalled();
        });
    });

    describe('Tests d\'invalidation ciblée', () => {
        it('devrait invalider le cache pour un médecin spécifique', () => {
            const engine = new RuleEngine();
            const doctorId = 'doctor-1';

            engine.invalidateCacheForDoctor(doctorId);

            expect(ruleCache.invalidateForDoctor).toHaveBeenCalledWith(doctorId);
        });

        it('ne devrait pas invalider le cache pour un médecin si le cache est désactivé', () => {
            const engine = new RuleEngine({ enableCache: false });
            const doctorId = 'doctor-1';

            engine.invalidateCacheForDoctor(doctorId);

            expect(ruleCache.invalidateForDoctor).not.toHaveBeenCalled();
        });
    });

    describe('Tests de performance', () => {
        it('devrait améliorer les performances pour les évaluations répétées', async () => {
            const engine = new RuleEngine({
                defaultRules: Array.from({ length: 100 }, (_, i) => createTestRule(`rule-${i}`))
            });
            const context = createTestContext();
            const mockValidator = createMockValidator(true);

            // Enregistrer le validateur pour tous les types de règles
            engine.registerValidator(RuleType.MIN_REST_PERIOD, mockValidator);

            // Première évaluation (sans cache)
            (ruleCache.getCachedEvaluation as jest.Mock).mockReturnValue(null);
            const startFirstEval = performance.now();
            await engine.evaluate(context);
            const endFirstEval = performance.now();

            // Le résultat devrait maintenant être en cache
            // Configurer le mock pour simuler un hit de cache
            const cachedResult = {
                isValid: true,
                violations: [],
                warnings: [],
                score: 0
            };
            (ruleCache.getCachedEvaluation as jest.Mock).mockReturnValue(cachedResult);

            // Deuxième évaluation (avec cache)
            const startSecondEval = performance.now();
            await engine.evaluate(context);
            const endSecondEval = performance.now();

            // Vérifier que la deuxième évaluation est plus rapide
            const firstEvalTime = endFirstEval - startFirstEval;
            const secondEvalTime = endSecondEval - startSecondEval;

            // La seconde évaluation devrait être plus rapide car elle utilise le cache
            expect(secondEvalTime).toBeLessThan(firstEvalTime);

            // Vérifier que le validateur n'a pas été appelé lors de la seconde évaluation
            expect(mockValidator.validate).toHaveBeenCalledTimes(100); // Une fois par règle lors de la première évaluation seulement
        });
    });
}); 