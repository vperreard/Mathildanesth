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
} from "../types/modèle";

/**
 * Service de validation des tableaux de service de planning
 * Effectue des vérifications de contraintes métier sur les tableaux de service
 */
export const templateValidationService = {
    /**
     * Valide une tableau de service de planning complète
     * @param modèle Tableau de service à valider
     * @returns Résultat de validation avec erreurs éventuelles
     */
    validateTemplate(modèle: PlanningTemplate): ValidationResult {
        const errors: ValidationError[] = [];

        // Vérification des métadonnées de base
        this.validateBasicMetadata(modèle, errors);

        // Vérification des gardes/vacations
        this.validateAffectations(modèle.gardes/vacations, errors);

        // Vérification des variations
        if (modèle.variations && modèle.variations.length > 0) {
            this.validateVariations(modèle.variations, modèle.gardes/vacations, errors);
        }

        // Vérification des contraintes métier globales
        this.validateBusinessRules(modèle, errors);

        return {
            isValid: errors.filter(e => e.severity === 'ERROR').length === 0,
            errors,
            warnings: errors.filter(e => e.severity === 'WARNING')
        };
    },

    /**
     * Valide les métadonnées de base d'une tableau de service
     */
    validateBasicMetadata(modèle: PlanningTemplate, errors: ValidationError[]): void {
        // Vérification du nom
        if (!modèle.nom || modèle.nom.trim() === '') {
            errors.push({
                type: 'MISSING_REQUIRED_FIELD',
                field: 'nom',
                message: 'Le nom de la tableau de service est obligatoire',
                severity: 'ERROR'
            });
        } else if (modèle.nom.length < 3) {
            errors.push({
                type: 'VALIDATION_ERROR',
                field: 'nom',
                message: 'Le nom de la tableau de service doit contenir au moins 3 caractères',
                severity: 'ERROR'
            });
        }

        // Vérification du département
        if (!modèle.departementId) {
            errors.push({
                type: 'MISSING_REQUIRED_FIELD',
                field: 'departementId',
                message: 'Un département doit être associé à la tableau de service',
                severity: 'WARNING'
            });
        }
    },

    /**
     * Valide les gardes/vacations d'une tableau de service
     */
    validateAffectations(gardes/vacations: TemplateAffectation[], errors: ValidationError[]): void {
        // Vérification de la présence d'au moins une garde/vacation
        if (!gardes/vacations || gardes/vacations.length === 0) {
            errors.push({
                type: 'VALIDATION_ERROR',
                field: 'gardes/vacations',
                message: 'La tableau de service doit contenir au moins une garde/vacation',
                severity: 'ERROR'
            });
            return;
        }

        // Map pour vérifier l'unicité des combinaisons jour/type
        const affectationMap = new Map<string, TemplateAffectation>();

        gardes/vacations.forEach((garde/vacation, index) => {
            const affectationKey = `${garde/vacation.jour}_${garde/vacation.type}`;

            // Vérification de la duplication
            if (affectationMap.has(affectationKey)) {
                errors.push({
                    type: 'DUPLICATE_ENTRY',
                    field: `gardes/vacations[${index}]`,
                    message: `Garde/Vacation dupliquée pour ${garde/vacation.jour} / ${garde/vacation.type}`,
                    severity: 'ERROR',
                    metadata: { index, jour: garde/vacation.jour, type: garde/vacation.type }
                });
            } else {
                affectationMap.set(affectationKey, garde/vacation);
            }

            // Vérification des postes requis pour les gardes/vacations ouvertes
            if (garde/vacation.ouvert && garde/vacation.postesRequis <= 0) {
                errors.push({
                    type: 'VALIDATION_ERROR',
                    field: `gardes/vacations[${index}].postesRequis`,
                    message: `Une garde/vacation ouverte doit avoir au moins un poste requis (${garde/vacation.jour} / ${garde/vacation.type})`,
                    severity: 'ERROR',
                    metadata: { index, jour: garde/vacation.jour, type: garde/vacation.type }
                });
            }

            // Validation de la configuration si présente
            if (garde/vacation.configuration) {
                this.validateAffectationConfiguration(garde/vacation.configuration, index, errors);
            }
        });
    },

    /**
     * Valide une configuration d'garde/vacation
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
                    field: `gardes/vacations[${affectationIndex}].configuration.heureDebut`,
                    message: `Format d'heure invalide : ${config.heureDebut} (format attendu: HH:MM)`,
                    severity: 'ERROR'
                });
            }

            if (fin === null) {
                errors.push({
                    type: 'INVALID_FORMAT',
                    field: `gardes/vacations[${affectationIndex}].configuration.heureFin`,
                    message: `Format d'heure invalide : ${config.heureFin} (format attendu: HH:MM)`,
                    severity: 'ERROR'
                });
            }

            if (debut !== null && fin !== null && debut >= fin) {
                errors.push({
                    type: 'VALIDATION_ERROR',
                    field: `gardes/vacations[${affectationIndex}].configuration`,
                    message: `L'heure de fin doit être postérieure à l'heure de début`,
                    severity: 'ERROR'
                });
            }
        } else if (config.heureDebut && !config.heureFin) {
            errors.push({
                type: 'MISSING_REQUIRED_FIELD',
                field: `gardes/vacations[${affectationIndex}].configuration.heureFin`,
                message: `L'heure de fin est requise si l'heure de début est spécifiée`,
                severity: 'WARNING'
            });
        } else if (!config.heureDebut && config.heureFin) {
            errors.push({
                type: 'MISSING_REQUIRED_FIELD',
                field: `gardes/vacations[${affectationIndex}].configuration.heureDebut`,
                message: `L'heure de début est requise si l'heure de fin est spécifiée`,
                severity: 'WARNING'
            });
        }

        // Vérification des postes
        if (!config.postes || config.postes.length === 0) {
            errors.push({
                type: 'VALIDATION_ERROR',
                field: `gardes/vacations[${affectationIndex}].configuration.postes`,
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
                field: `gardes/vacations[${affectationIndex}].configuration.postes[${posteIndex}].nom`,
                message: `Le nom du poste est obligatoire`,
                severity: 'ERROR'
            });
        }

        // Vérification de la quantité
        if (poste.quantite < 0) {
            errors.push({
                type: 'VALIDATION_ERROR',
                field: `gardes/vacations[${affectationIndex}].configuration.postes[${posteIndex}].quantite`,
                message: `La quantité ne peut pas être négative`,
                severity: 'ERROR'
            });
        }

        // Vérification de la cohérence entre le statut et la quantité
        if (poste.status === 'REQUIS' && poste.quantite === 0) {
            errors.push({
                type: 'VALIDATION_ERROR',
                field: `gardes/vacations[${affectationIndex}].configuration.postes[${posteIndex}]`,
                message: `Un poste requis doit avoir une quantité supérieure à 0`,
                severity: 'ERROR'
            });
        }
    },

    /**
     * Valide les variations d'une tableau de service
     */
    validateVariations(
        variations: ConfigurationVariation[],
        gardes/vacations: TemplateAffectation[],
        errors: ValidationError[]
    ): void {
        // Créer un ensemble des IDs d'garde/vacation valides
        const validAffectationIds = new Set(gardes/vacations.map(a => a.id));

        variations.forEach((variation, index) => {
            // Vérifier que l'garde/vacation référencée existe
            if (!validAffectationIds.has(variation.affectationId)) {
                errors.push({
                    type: 'REFERENCE_ERROR',
                    field: `variations[${index}].affectationId`,
                    message: `L'garde/vacation référencée n'existe pas (ID: ${variation.affectationId})`,
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

            // Vérifier les chevauchements de variations pour la même garde/vacation
            this.checkVariationOverlaps(variation, variations, index, errors);
        });
    },

    /**
     * Vérifie les chevauchements de variations pour une même garde/vacation
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
            // Ne pas comparer avec soi-même et vérifier uniquement les variations pour la même garde/vacation
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
                            message: `Cette variation chevauche une autre variation pour la même garde/vacation (${otherVar.nom})`,
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
     * Valide les règles métier globales sur la tableau de service
     */
    validateBusinessRules(modèle: PlanningTemplate, errors: ValidationError[]): void {
        // Vérifier la répartition des gardes/vacations par jour
        const affectationsByDay = new Map<DayOfWeek, number>();

        // Initialiser le compteur pour chaque jour
        (['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'] as DayOfWeek[]).forEach(day => {
            affectationsByDay.set(day, 0);
        });

        // Compter les gardes/vacations ouvertes par jour
        modèle.gardes/vacations.forEach(aff => {
            if (aff.ouvert) {
                const count = affectationsByDay.get(aff.jour) || 0;
                affectationsByDay.set(aff.jour, count + 1);
            }
        });

        // Vérifier s'il y a des jours sans gardes/vacations
        affectationsByDay.forEach((count, day) => {
            if (count === 0) {
                errors.push({
                    type: 'BUSINESS_RULE',
                    field: 'gardes/vacations',
                    message: `Aucune garde/vacation ouverte pour ${day}`,
                    severity: 'WARNING',
                    metadata: { jour: day }
                });
            }
        });

        // Vérification de la cohérence des postes requis
        this.validatePostesCoherence(modèle, errors);
    },

    /**
     * Vérifie la cohérence des postes requis dans les gardes/vacations et configurations
     */
    validatePostesCoherence(modèle: PlanningTemplate, errors: ValidationError[]): void {
        modèle.gardes/vacations.forEach((garde/vacation, index) => {
            if (garde/vacation.configuration && garde/vacation.ouvert) {
                // Calculer la somme des postes requis dans la configuration
                const totalPostesConfig = garde/vacation.configuration.postes
                    .filter(p => p.status === 'REQUIS')
                    .reduce((sum, poste) => sum + poste.quantite, 0);

                // Vérifier la cohérence avec le nombre de postes requis déclaré
                if (totalPostesConfig !== garde/vacation.postesRequis) {
                    errors.push({
                        type: 'INCONSISTENCY',
                        field: `gardes/vacations[${index}]`,
                        message: `Le nombre de postes requis (${garde/vacation.postesRequis}) ne correspond pas à la somme des postes dans la configuration (${totalPostesConfig})`,
                        severity: 'WARNING',
                        metadata: {
                            jour: garde/vacation.jour,
                            type: garde/vacation.type,
                            declaredPostes: garde/vacation.postesRequis,
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