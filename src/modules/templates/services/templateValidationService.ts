import {
    PlanningTemplate,
    TemplateAffectation,
    AffectationConfiguration,
    PosteConfiguration,
    ConfigurationVariation,
    ValidationResult,
    ValidationError,
    ValidationSeverity,
    ValidationErrorType,
    DayOfWeek
} from "../types/template";

/**
 * Service de validation des trames de planning
 * Effectue des vérifications de contraintes métier sur les trames
 */
export const templateValidationService = {
    /**
     * Valide une trame de planning complète
     * @param template Trame à valider
     * @returns Résultat de validation avec erreurs éventuelles
     */
    validateTemplate(template: PlanningTemplate): ValidationResult {
        const errors: ValidationError[] = [];

        // Vérification des métadonnées de base
        this.validateBasicMetadata(template, errors);

        // Vérification des affectations
        this.validateAffectations(template.affectations, errors);

        // Vérification des variations
        if (template.variations && template.variations.length > 0) {
            this.validateVariations(template.variations, template.affectations, errors);
        }

        // Vérification des contraintes métier globales
        this.validateBusinessRules(template, errors);

        return {
            isValid: errors.filter(e => e.severity === 'ERROR').length === 0,
            errors,
            warnings: errors.filter(e => e.severity === 'WARNING')
        };
    },

    /**
     * Valide les métadonnées de base d'une trame
     */
    validateBasicMetadata(template: PlanningTemplate, errors: ValidationError[]): void {
        // Vérification du nom
        if (!template.nom || template.nom.trim() === '') {
            errors.push({
                type: 'MISSING_REQUIRED_FIELD',
                field: 'nom',
                message: 'Le nom de la trame est obligatoire',
                severity: 'ERROR'
            });
        } else if (template.nom.length < 3) {
            errors.push({
                type: 'VALIDATION_ERROR',
                field: 'nom',
                message: 'Le nom de la trame doit contenir au moins 3 caractères',
                severity: 'ERROR'
            });
        }

        // Vérification du département
        if (!template.departementId) {
            errors.push({
                type: 'MISSING_REQUIRED_FIELD',
                field: 'departementId',
                message: 'Un département doit être associé à la trame',
                severity: 'WARNING'
            });
        }
    },

    /**
     * Valide les affectations d'une trame
     */
    validateAffectations(affectations: TemplateAffectation[], errors: ValidationError[]): void {
        // Vérification de la présence d'au moins une affectation
        if (!affectations || affectations.length === 0) {
            errors.push({
                type: 'VALIDATION_ERROR',
                field: 'affectations',
                message: 'La trame doit contenir au moins une affectation',
                severity: 'ERROR'
            });
            return;
        }

        // Map pour vérifier l'unicité des combinaisons jour/type
        const affectationMap = new Map<string, TemplateAffectation>();

        affectations.forEach((affectation, index) => {
            const affectationKey = `${affectation.jour}_${affectation.type}`;

            // Vérification de la duplication
            if (affectationMap.has(affectationKey)) {
                errors.push({
                    type: 'DUPLICATE_ENTRY',
                    field: `affectations[${index}]`,
                    message: `Affectation dupliquée pour ${affectation.jour} / ${affectation.type}`,
                    severity: 'ERROR',
                    metadata: { index, jour: affectation.jour, type: affectation.type }
                });
            } else {
                affectationMap.set(affectationKey, affectation);
            }

            // Vérification des postes requis pour les affectations ouvertes
            if (affectation.ouvert && affectation.postesRequis <= 0) {
                errors.push({
                    type: 'VALIDATION_ERROR',
                    field: `affectations[${index}].postesRequis`,
                    message: `Une affectation ouverte doit avoir au moins un poste requis (${affectation.jour} / ${affectation.type})`,
                    severity: 'ERROR',
                    metadata: { index, jour: affectation.jour, type: affectation.type }
                });
            }

            // Validation de la configuration si présente
            if (affectation.configuration) {
                this.validateAffectationConfiguration(affectation.configuration, index, errors);
            }
        });
    },

    /**
     * Valide une configuration d'affectation
     */
    validateAffectationConfiguration(
        config: AffectationConfiguration,
        affectationIndex: number,
        errors: ValidationError[]
    ): void {
        // Vérification des heures
        if (config.heureDebut && config.heureFin) {
            const debut = this.parseHeure(config.heureDebut);
            const fin = this.parseHeure(config.heureFin);

            if (debut === null) {
                errors.push({
                    type: 'INVALID_FORMAT',
                    field: `affectations[${affectationIndex}].configuration.heureDebut`,
                    message: `Format d'heure invalide : ${config.heureDebut} (format attendu: HH:MM)`,
                    severity: 'ERROR'
                });
            }

            if (fin === null) {
                errors.push({
                    type: 'INVALID_FORMAT',
                    field: `affectations[${affectationIndex}].configuration.heureFin`,
                    message: `Format d'heure invalide : ${config.heureFin} (format attendu: HH:MM)`,
                    severity: 'ERROR'
                });
            }

            if (debut !== null && fin !== null && debut >= fin) {
                errors.push({
                    type: 'VALIDATION_ERROR',
                    field: `affectations[${affectationIndex}].configuration`,
                    message: `L'heure de fin doit être postérieure à l'heure de début`,
                    severity: 'ERROR'
                });
            }
        } else if (config.heureDebut && !config.heureFin) {
            errors.push({
                type: 'MISSING_REQUIRED_FIELD',
                field: `affectations[${affectationIndex}].configuration.heureFin`,
                message: `L'heure de fin est requise si l'heure de début est spécifiée`,
                severity: 'WARNING'
            });
        } else if (!config.heureDebut && config.heureFin) {
            errors.push({
                type: 'MISSING_REQUIRED_FIELD',
                field: `affectations[${affectationIndex}].configuration.heureDebut`,
                message: `L'heure de début est requise si l'heure de fin est spécifiée`,
                severity: 'WARNING'
            });
        }

        // Vérification des postes
        if (!config.postes || config.postes.length === 0) {
            errors.push({
                type: 'VALIDATION_ERROR',
                field: `affectations[${affectationIndex}].configuration.postes`,
                message: `Une configuration doit avoir au moins un poste défini`,
                severity: 'ERROR'
            });
        } else {
            // Validation de chaque poste
            config.postes.forEach((poste, posteIndex) => {
                this.validatePosteConfiguration(poste, affectationIndex, posteIndex, errors);
            });
        }
    },

    /**
     * Valide la configuration d'un poste
     */
    validatePosteConfiguration(
        poste: PosteConfiguration,
        affectationIndex: number,
        posteIndex: number,
        errors: ValidationError[]
    ): void {
        // Vérification du nom
        if (!poste.nom || poste.nom.trim() === '') {
            errors.push({
                type: 'MISSING_REQUIRED_FIELD',
                field: `affectations[${affectationIndex}].configuration.postes[${posteIndex}].nom`,
                message: `Le nom du poste est obligatoire`,
                severity: 'ERROR'
            });
        }

        // Vérification de la quantité
        if (poste.quantite < 0) {
            errors.push({
                type: 'VALIDATION_ERROR',
                field: `affectations[${affectationIndex}].configuration.postes[${posteIndex}].quantite`,
                message: `La quantité ne peut pas être négative`,
                severity: 'ERROR'
            });
        }

        // Vérification de la cohérence entre le statut et la quantité
        if (poste.status === 'REQUIS' && poste.quantite === 0) {
            errors.push({
                type: 'VALIDATION_ERROR',
                field: `affectations[${affectationIndex}].configuration.postes[${posteIndex}]`,
                message: `Un poste requis doit avoir une quantité supérieure à 0`,
                severity: 'ERROR'
            });
        }
    },

    /**
     * Valide les variations d'une trame
     */
    validateVariations(
        variations: ConfigurationVariation[],
        affectations: TemplateAffectation[],
        errors: ValidationError[]
    ): void {
        // Créer un ensemble des IDs d'affectation valides
        const validAffectationIds = new Set(affectations.map(a => a.id));

        variations.forEach((variation, index) => {
            // Vérifier que l'affectation référencée existe
            if (!validAffectationIds.has(variation.affectationId)) {
                errors.push({
                    type: 'REFERENCE_ERROR',
                    field: `variations[${index}].affectationId`,
                    message: `L'affectation référencée n'existe pas (ID: ${variation.affectationId})`,
                    severity: 'ERROR'
                });
            }

            // Vérifier les dates si c'est une période personnalisée
            if (variation.typeVariation === 'PERSONNALISEE') {
                if (!variation.dateDebut) {
                    errors.push({
                        type: 'MISSING_REQUIRED_FIELD',
                        field: `variations[${index}].dateDebut`,
                        message: `La date de début est obligatoire pour une variation personnalisée`,
                        severity: 'ERROR'
                    });
                }

                if (!variation.dateFin) {
                    errors.push({
                        type: 'MISSING_REQUIRED_FIELD',
                        field: `variations[${index}].dateFin`,
                        message: `La date de fin est obligatoire pour une variation personnalisée`,
                        severity: 'ERROR'
                    });
                }

                if (variation.dateDebut && variation.dateFin) {
                    const debut = new Date(variation.dateDebut);
                    const fin = new Date(variation.dateFin);

                    if (isNaN(debut.getTime())) {
                        errors.push({
                            type: 'INVALID_FORMAT',
                            field: `variations[${index}].dateDebut`,
                            message: `Format de date invalide : ${variation.dateDebut}`,
                            severity: 'ERROR'
                        });
                    }

                    if (isNaN(fin.getTime())) {
                        errors.push({
                            type: 'INVALID_FORMAT',
                            field: `variations[${index}].dateFin`,
                            message: `Format de date invalide : ${variation.dateFin}`,
                            severity: 'ERROR'
                        });
                    }

                    if (!isNaN(debut.getTime()) && !isNaN(fin.getTime()) && debut > fin) {
                        errors.push({
                            type: 'VALIDATION_ERROR',
                            field: `variations[${index}]`,
                            message: `La date de fin doit être postérieure à la date de début`,
                            severity: 'ERROR'
                        });
                    }
                }
            }

            // Valider la configuration de la variation
            this.validateAffectationConfiguration(variation.configuration, -1 * (index + 1), errors);

            // Vérifier les chevauchements de variations pour la même affectation
            this.checkVariationOverlaps(variation, variations, index, errors);
        });
    },

    /**
     * Vérifie les chevauchements de variations pour une même affectation
     */
    checkVariationOverlaps(
        variation: ConfigurationVariation,
        allVariations: ConfigurationVariation[],
        currentIndex: number,
        errors: ValidationError[]
    ): void {
        // Ne vérifier les chevauchements que pour les variations personnalisées avec dates
        if (variation.typeVariation !== 'PERSONNALISEE' || !variation.dateDebut || !variation.dateFin) {
            return;
        }

        const debut = new Date(variation.dateDebut);
        const fin = new Date(variation.dateFin);

        if (isNaN(debut.getTime()) || isNaN(fin.getTime())) {
            return; // Déjà validé ailleurs
        }

        allVariations.forEach((otherVar, otherIndex) => {
            // Ne pas comparer avec soi-même et vérifier uniquement les variations pour la même affectation
            if (otherIndex !== currentIndex && otherVar.affectationId === variation.affectationId &&
                otherVar.typeVariation === 'PERSONNALISEE' && otherVar.dateDebut && otherVar.dateFin) {

                const otherDebut = new Date(otherVar.dateDebut);
                const otherFin = new Date(otherVar.dateFin);

                if (!isNaN(otherDebut.getTime()) && !isNaN(otherFin.getTime())) {
                    // Vérifier le chevauchement
                    if ((debut <= otherFin && fin >= otherDebut)) {
                        errors.push({
                            type: 'OVERLAP_ERROR',
                            field: `variations[${currentIndex}]`,
                            message: `Cette variation chevauche une autre variation pour la même affectation (${otherVar.nom})`,
                            severity: 'ERROR',
                            metadata: {
                                affectationId: variation.affectationId,
                                overlapWithVariationId: otherVar.id
                            }
                        });
                    }
                }
            }
        });
    },

    /**
     * Valide les règles métier globales sur la trame
     */
    validateBusinessRules(template: PlanningTemplate, errors: ValidationError[]): void {
        // Vérifier la répartition des affectations par jour
        const affectationsByDay = new Map<DayOfWeek, number>();

        // Initialiser le compteur pour chaque jour
        (['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'] as DayOfWeek[]).forEach(day => {
            affectationsByDay.set(day, 0);
        });

        // Compter les affectations ouvertes par jour
        template.affectations.forEach(aff => {
            if (aff.ouvert) {
                const count = affectationsByDay.get(aff.jour) || 0;
                affectationsByDay.set(aff.jour, count + 1);
            }
        });

        // Vérifier s'il y a des jours sans affectations
        affectationsByDay.forEach((count, day) => {
            if (count === 0) {
                errors.push({
                    type: 'BUSINESS_RULE',
                    field: 'affectations',
                    message: `Aucune affectation ouverte pour ${day}`,
                    severity: 'WARNING',
                    metadata: { jour: day }
                });
            }
        });

        // Vérification de la cohérence des postes requis
        this.validatePostesCoherence(template, errors);
    },

    /**
     * Vérifie la cohérence des postes requis dans les affectations et configurations
     */
    validatePostesCoherence(template: PlanningTemplate, errors: ValidationError[]): void {
        template.affectations.forEach((affectation, index) => {
            if (affectation.configuration && affectation.ouvert) {
                // Calculer la somme des postes requis dans la configuration
                const totalPostesConfig = affectation.configuration.postes
                    .filter(p => p.status === 'REQUIS')
                    .reduce((sum, poste) => sum + poste.quantite, 0);

                // Vérifier la cohérence avec le nombre de postes requis déclaré
                if (totalPostesConfig !== affectation.postesRequis) {
                    errors.push({
                        type: 'INCONSISTENCY',
                        field: `affectations[${index}]`,
                        message: `Le nombre de postes requis (${affectation.postesRequis}) ne correspond pas à la somme des postes dans la configuration (${totalPostesConfig})`,
                        severity: 'WARNING',
                        metadata: {
                            jour: affectation.jour,
                            type: affectation.type,
                            declaredPostes: affectation.postesRequis,
                            configPostes: totalPostesConfig
                        }
                    });
                }
            }
        });
    },

    /**
     * Utilitaire pour analyser une chaîne d'heure au format HH:MM
     * @returns Minutes totales depuis minuit ou null si format invalide
     */
    parseHeure(heure: string): number | null {
        const match = /^(\d{1,2}):(\d{2})$/.exec(heure);
        if (!match) return null;

        const heures = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);

        if (heures < 0 || heures > 23 || minutes < 0 || minutes > 59) return null;

        return heures * 60 + minutes;
    }
}; 