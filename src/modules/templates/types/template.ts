/**
 * Types d'affectations possibles dans une trame.
 * Doit être synchronisé avec les types réels utilisés dans l'application.
 */
export type AffectationType = 'CONSULTATION' | 'BLOC_OPERATOIRE' | 'GARDE_JOUR' | 'GARDE_NUIT' | 'ASTREINTE';

/**
 * Jours de la semaine.
 */
export type DayOfWeek = 'LUNDI' | 'MARDI' | 'MERCREDI' | 'JEUDI' | 'VENDREDI' | 'SAMEDI' | 'DIMANCHE';

/**
 * Niveau de compétence requis pour un poste
 */
export type SkillLevel = 'JUNIOR' | 'INTERMEDIAIRE' | 'SENIOR' | 'EXPERT';

/**
 * Statut d'un poste dans une affectation
 */
export type PosteStatus = 'REQUIS' | 'OPTIONNEL' | 'INDISPONIBLE';

/**
 * Types de période pour les variations d'affectation
 */
export type PeriodeVariation = 'STANDARD' | 'VACANCES' | 'HIVER' | 'ETE' | 'JOURS_FERIES' | 'PERSONNALISEE';

/**
 * Types de contraintes pour les configurations d'affectation
 */
export type ContrainteType = 'HORAIRE' | 'PERSONNEL' | 'COMPETENCE' | 'EQUIPEMENT' | 'PRIORITE';

/**
 * Niveaux de sévérité des erreurs de validation
 */
export type ValidationSeverity = 'ERROR' | 'WARNING' | 'INFO';

/**
 * Types d'erreurs de validation
 */
export type ValidationErrorType =
    | 'MISSING_REQUIRED_FIELD'
    | 'VALIDATION_ERROR'
    | 'INVALID_FORMAT'
    | 'DUPLICATE_ENTRY'
    | 'REFERENCE_ERROR'
    | 'OVERLAP_ERROR'
    | 'BUSINESS_RULE'
    | 'INCONSISTENCY';

/**
 * Structure d'une erreur de validation
 */
export interface ValidationError {
    type: ValidationErrorType;
    field: string;
    message: string;
    severity: ValidationSeverity;
    metadata?: Record<string, any>;
}

/**
 * Résultat d'une validation
 */
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
}

/**
 * Représente une affectation spécifique au sein d'une trame de planning.
 */
export interface TemplateAffectation {
    id: string; // Identifiant unique de l'affectation dans la trame
    type: AffectationType; // Type d'affectation (Consultation, Bloc, etc.)
    jour: DayOfWeek; // Jour de la semaine concerné
    ouvert: boolean; // Indique si ce créneau d'affectation est ouvert par défaut
    postesRequis: number; // Nombre de postes requis pour cette affectation si elle est ouverte
    ordre?: number; // Ordre d'affichage dans la journée
    configuration?: AffectationConfiguration; // Configuration avancée de l'affectation
}

/**
 * Configuration avancée d'une affectation
 */
export interface AffectationConfiguration {
    id: string;
    nom?: string; // Nom spécifique pour cette configuration (ex: "Bloc Ophtalmologie Matin")
    heureDebut?: string; // Format HH:mm
    heureFin?: string; // Format HH:mm
    postes: PosteConfiguration[]; // Configuration détaillée de chaque poste
    parametres?: Record<string, any>; // Paramètres additionnels spécifiques au type d'affectation
    priorite?: number; // Priorité de l'affectation (pour résolution de conflits)
    couleur?: string; // Couleur d'affichage dans le planning
    contraintes?: ContrainteAffectation[]; // Contraintes spécifiques à cette configuration
    notes?: string; // Notes ou commentaires sur cette configuration
    emplacementPhysique?: string; // Emplacement physique de l'affectation (ex: "Salle 3", "Bloc A")
    equipementsRequis?: string[]; // Équipements nécessaires pour cette affectation
    dureePreparation?: number; // Temps de préparation en minutes avant le début
    dureeNettoyage?: number; // Temps de nettoyage en minutes après la fin
}

/**
 * Contrainte spécifique pour une affectation
 */
export interface ContrainteAffectation {
    id: string;
    type: ContrainteType;
    description: string;
    valeur?: any;
    obligatoire: boolean;
    priorite?: number;
}

/**
 * Configuration d'un poste spécifique dans une affectation
 */
export interface PosteConfiguration {
    id: string;
    nom: string; // Nom du poste (ex: "Chirurgien", "Anesthésiste", "Infirmier")
    quantite: number; // Nombre de personnes requises pour ce poste
    status: PosteStatus; // Statut du poste (requis, optionnel, indisponible)
    competencesRequises?: SkillLevel; // Niveau de compétence requis
    rolesAutorises?: string[]; // Liste des rôles autorisés à occuper ce poste
    parametres?: Record<string, any>; // Paramètres additionnels spécifiques au poste
    disponibiliteRequise?: string; // Disponibilité requise (ex: "Journée complète", "Mi-temps")
    remplacable?: boolean; // Indique si ce poste peut être remplacé pendant la période
    tempsTravailMinimum?: number; // Temps de travail minimum en heures
    formationRequise?: string[]; // Formation(s) requise(s) pour ce poste
    superviseur?: boolean; // Indique si ce poste a un rôle de supervision
    ordrePriorite?: number; // Ordre de priorité pour l'affectation du personnel
}

/**
 * Variation d'une configuration d'affectation pour des périodes spécifiques
 */
export interface ConfigurationVariation {
    id: string;
    affectationId: string; // Référence à l'affectation concernée
    nom: string; // Nom de la variation (ex: "Configuration été", "Configuration période de garde")
    dateDebut?: string; // Date de début de la période de validité (format YYYY-MM-DD)
    dateFin?: string; // Date de fin de la période de validité (format YYYY-MM-DD)
    joursSpecifiques?: DayOfWeek[]; // Jours spécifiques auxquels s'applique cette variation
    configuration: AffectationConfiguration; // Configuration spécifique pour cette variation
    priorite: number; // Priorité de la variation (les plus hautes priorités remplacent les plus basses)
    typeVariation?: PeriodeVariation; // Type de période pour cette variation
    estRecurrent?: boolean; // Indique si cette variation est récurrente annuellement
    actif?: boolean; // Indique si cette variation est active
    raisonVariation?: string; // Raison de cette variation (ex: "Effectif réduit", "Demande accrue")
}

/**
 * Props pour le composant éditeur de trames.
 */
export interface BlocPlanningTemplateEditorProps {
    initialTemplate?: PlanningTemplate; // Trame existante à éditer (optionnel)
    selectedTemplateId?: string;      // ID de la trame sélectionnée à charger (si initialTemplate n'est pas fourni pour cet ID)
    onSave: (template: PlanningTemplate) => Promise<void>; // Fonction appelée lors de la sauvegarde
    onCancel?: () => void; // Fonction appelée lors de l'annulation ou de la fermeture
    availableAffectationTypes: AffectationType[]; // Liste des types d'affectations pouvant être ajoutés
    templates?: PlanningTemplate[]; // Liste de toutes les trames (pour la recherche par ID dans loadTrames)
    isLoading?: boolean; // Indicateur de chargement pour la sauvegarde/initialisation
    availablePostes?: string[]; // Liste des postes disponibles
    readOnly?: boolean; // Mode lecture seule
}

/**
 * Props pour le panneau de configuration d'affectation
 */
export interface AssignmentConfigPanelProps {
    affectation: TemplateAffectation;
    onChange: (updatedAffectation: TemplateAffectation) => void;
    availablePostes: string[];
    isLoading?: boolean;
}

/**
 * Props pour le composant de poste dans le panneau de configuration
 */
export interface PosteItemProps {
    poste: PosteConfiguration;
    onUpdate: (updatedPoste: PosteConfiguration) => void;
    onDelete: () => void;
    availablePostes: string[];
    availableSkills: SkillLevel[];
    isLoading?: boolean;
}

/**
 * Props pour le panneau de variation de configuration
 */
export interface VariationConfigPanelProps {
    variation: ConfigurationVariation;
    onChange: (updatedVariation: ConfigurationVariation) => void;
    onDelete: () => void;
    availablePostes: string[];
    isLoading?: boolean;
}

/**
 * Props pour le gestionnaire de trames
 */
export interface TemplateManagerProps {
    departementId?: string; // Filtrer par département
    onSelectTemplate?: (template: PlanningTemplate) => void;
    onCreateTemplate?: () => void;
    readOnly?: boolean;
    showArchived?: boolean;
}

/**
 * Options pour la recherche de trames
 */
export interface TemplateSearchOptions {
    departementId?: string;
    includeArchived?: boolean;
    searchTerm?: string;
    sortBy?: 'nom' | 'createdAt' | 'updatedAt';
    sortDirection?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
}

/**
 * Résultat paginé de recherche de trames
 */
export interface PaginatedTemplateResult {
    templates: PlanningTemplate[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

/**
 * Structure pour les filtres de recherche avancée
 */
export interface TemplateAdvancedFilter {
    departementIds?: string[];
    types?: AffectationType[];
    jours?: DayOfWeek[];
    dateCreationDebut?: Date;
    dateCreationFin?: Date;
    createdBy?: string[];
    estModele?: boolean;
    tags?: string[];
}

// Définition de RoleType ici, une seule fois.
export enum RoleType {
    MAR = 'MAR',
    IADE = 'IADE',
    CHIRURGIEN = 'CHIRURGIEN',
    TOUS = 'TOUS'
}

/**
 * Représente une trame de planning complète.
 */
export interface PlanningTemplate {
    id: string | number;
    nom: string;
    description?: string;
    affectations: TemplateAffectation[];
    variations?: ConfigurationVariation[];
    siteId?: string | null;
    isActive?: boolean;
    dateDebutEffet?: string | Date;
    dateFinEffet?: string | Date | null;
    recurrenceType?: string;
    joursSemaineActifs?: number[];
    typeSemaine?: string;
    roles?: RoleType[];
    createdAt?: string | Date;
    updatedAt?: string | Date;
    createdBy?: string;
    departementId?: string;
    estActif?: boolean;
    versionId?: string;
    estModele?: boolean;
    dateValiditeDebut?: Date;
    dateValiditeFin?: Date;
    referenceTrame?: string;
    tags?: string[];
} 