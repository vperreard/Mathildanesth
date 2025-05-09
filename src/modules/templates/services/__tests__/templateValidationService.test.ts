import { templateValidationService } from '../templateValidationService';
import { PlanningTemplate, DayOfWeek, AffectationType } from '../../types/template';

describe('templateValidationService', () => {
    // Template de base pour les tests
    const createValidTemplate = (): PlanningTemplate => ({
        id: 'tmpl_test',
        nom: 'Trame Test',
        departementId: 'dept_1',
        affectations: [
            {
                id: 'aff_1',
                jour: 'LUNDI' as DayOfWeek,
                type: 'CONSULTATION' as AffectationType,
                ouvert: true,
                postesRequis: 2,
                configuration: {
                    id: 'conf_1',
                    nom: 'Configuration Test',
                    heureDebut: '08:00',
                    heureFin: '12:00',
                    postes: [
                        {
                            id: 'poste_1',
                            nom: 'Médecin',
                            quantite: 1,
                            status: 'REQUIS'
                        },
                        {
                            id: 'poste_2',
                            nom: 'Infirmier',
                            quantite: 1,
                            status: 'REQUIS'
                        }
                    ]
                }
            }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        estActif: true
    });

    test('devrait valider une trame correcte sans erreurs', () => {
        const template = createValidTemplate();
        const result = templateValidationService.validateTemplate(template);

        // Vérifier qu'il n'y a pas d'erreurs bloquantes
        expect(result.isValid).toBe(true);
        expect(result.errors.filter(e => e.severity === 'ERROR').length).toBe(0);

        // Vérifier qu'il y a bien 6 avertissements (pour les jours sans affectation ouverte)
        expect(result.warnings.length).toBe(6);
        expect(result.warnings.every(w => w.severity === 'WARNING' && w.type === 'BUSINESS_RULE')).toBe(true);
    });

    test('devrait détecter un nom de trame manquant', () => {
        const template = createValidTemplate();
        template.nom = '';

        const result = templateValidationService.validateTemplate(template);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].type).toBe('MISSING_REQUIRED_FIELD');
        expect(result.errors[0].field).toBe('nom');
    });

    test('devrait détecter un nom de trame trop court', () => {
        const template = createValidTemplate();
        template.nom = 'AB';

        const result = templateValidationService.validateTemplate(template);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].type).toBe('VALIDATION_ERROR');
        expect(result.errors[0].field).toBe('nom');
    });

    test('devrait avertir si département manquant', () => {
        const template = createValidTemplate();
        template.departementId = undefined;

        const result = templateValidationService.validateTemplate(template);

        expect(result.isValid).toBe(true); // Avertissement, pas une erreur
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings[0].type).toBe('MISSING_REQUIRED_FIELD');
        expect(result.warnings[0].field).toBe('departementId');
    });

    test('devrait détecter une affectation sans postes requis mais ouverte', () => {
        const template = createValidTemplate();
        template.affectations.push({
            id: 'aff_invalid',
            jour: 'MARDI',
            type: 'CONSULTATION',
            ouvert: true,
            postesRequis: 0
        });

        const result = templateValidationService.validateTemplate(template);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e =>
            e.field.includes('postesRequis') &&
            e.message.includes('au moins un poste requis')
        )).toBe(true);
    });

    test('devrait détecter une affectation dupliquée', () => {
        const template = createValidTemplate();
        template.affectations.push({
            id: 'aff_duplicate',
            jour: 'LUNDI',
            type: 'CONSULTATION',
            ouvert: true,
            postesRequis: 1
        });

        const result = templateValidationService.validateTemplate(template);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e =>
            e.type === 'DUPLICATE_ENTRY' &&
            e.message.includes('LUNDI') &&
            e.message.includes('CONSULTATION')
        )).toBe(true);
    });

    test('devrait détecter un format d\'heure invalide', () => {
        const template = createValidTemplate();
        template.affectations[0].configuration!.heureDebut = '8h30';

        const result = templateValidationService.validateTemplate(template);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e =>
            e.type === 'INVALID_FORMAT' &&
            e.field.includes('heureDebut')
        )).toBe(true);
    });

    test('devrait détecter une heure de fin antérieure à l\'heure de début', () => {
        const template = createValidTemplate();
        template.affectations[0].configuration!.heureDebut = '14:00';
        template.affectations[0].configuration!.heureFin = '12:00';

        const result = templateValidationService.validateTemplate(template);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e =>
            e.message.includes('heure de fin') &&
            e.message.includes('postérieure')
        )).toBe(true);
    });

    test('devrait détecter un poste sans nom', () => {
        const template = createValidTemplate();
        template.affectations[0].configuration!.postes[0].nom = '';

        const result = templateValidationService.validateTemplate(template);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e =>
            e.type === 'MISSING_REQUIRED_FIELD' &&
            e.field.includes('nom') &&
            e.field.includes('postes')
        )).toBe(true);
    });

    test('devrait détecter un poste requis avec quantité 0', () => {
        const template = createValidTemplate();
        template.affectations[0].configuration!.postes[0].quantite = 0;

        const result = templateValidationService.validateTemplate(template);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e =>
            e.message.includes('poste requis') &&
            e.message.includes('quantité supérieure')
        )).toBe(true);
    });

    test('devrait détecter une incohérence entre postes requis et configuration', () => {
        const template = createValidTemplate();
        // La configuration a 2 postes avec quantité 1 chacun (total: 2)
        // Mais l'affectation déclare 3 postes requis
        template.affectations[0].postesRequis = 3;

        const result = templateValidationService.validateTemplate(template);

        expect(result.warnings.some(w =>
            w.type === 'INCONSISTENCY' &&
            w.message.includes('ne correspond pas')
        )).toBe(true);
    });

    test('devrait détecter un jour sans affectations ouvertes', () => {
        const template = createValidTemplate();
        // Assurer que seul le lundi a une affectation ouverte
        // Les autres jours n'en ont pas

        const result = templateValidationService.validateTemplate(template);

        expect(result.warnings.some(w =>
            w.type === 'BUSINESS_RULE' &&
            w.message.includes('Aucune affectation ouverte')
        )).toBe(true);

        // Il devrait y avoir 6 jours sans affectations (tous sauf lundi)
        const daysWithoutAffectations = result.warnings.filter(w =>
            w.type === 'BUSINESS_RULE' &&
            w.message.includes('Aucune affectation ouverte')
        );

        expect(daysWithoutAffectations.length).toBe(6);
    });
}); 