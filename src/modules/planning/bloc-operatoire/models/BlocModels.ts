import { z } from 'zod';

// Importons les constantes des catégories de secteur et des types de salle
import { SECTOR_CATEGORY_TYPES } from '../constants/sectorCategoryTypes';
import { ROOM_TYPES } from '../constants/roomTypes';

// Enum pour les périodes de la journée
export enum BlocPeriod {
    MORNING = 'MORNING',
    AFTERNOON = 'AFTERNOON',
    ALL_DAY = 'ALL_DAY',
    FULL_DAY = 'FULL_DAY', // Backward compatibility
}

// Enum pour le statut du planning
export enum BlocPlanningStatus {
    DRAFT = 'DRAFT',
    PROPOSED = 'PROPOSED',
    VALIDATED = 'VALIDATED',
    PUBLISHED = 'PUBLISHED',
}

// Enum pour les types de règles de supervision
export enum SupervisionRuleType {
    MAX_ROOMS_PER_SUPERVISOR = 'MAX_ROOMS_PER_SUPERVISOR',
    REQUIRED_COMPETENCE = 'REQUIRED_COMPETENCE',
    SECTOR_RESTRICTION = 'SECTOR_RESTRICTION',
    SPECIALTY_REQUIREMENT = 'SPECIALTY_REQUIREMENT',
}

// Enum pour les rôles du personnel dans une vacation
export enum BlocStaffRole {
    SURGEON = 'SURGEON', // Chirurgien
    MAR = 'MAR',        // Médecin Anesthésiste-Réanimateur
    IADE = 'IADE',      // Infirmier Anesthésiste
}

// Enum pour le statut de la vacation
export enum VacationStatus {
    OPEN = 'OPEN',      // Vacation ouverte
    CLOSED = 'CLOSED',  // Vacation fermée
}

/**
 * Schéma de validation pour une salle d'opération
 */
export const OperatingRoomSchema = z.object({
    id: z.number().optional(), // Optional pour création
    name: z.string().min(1, "Le nom de la salle est obligatoire"),
    number: z.string().min(1, "Le numéro de la salle est obligatoire"),
    // Rendre sectorId et sector optionnels, et supprimer le .refine qui les rendait obligatoires
    sectorId: z.number().optional().nullable(), // Peut être null en DB, donc nullable ici aussi
    sector: z.string().optional().nullable(), // Nom du secteur, peut être null si non assigné
    colorCode: z.string().nullable().optional(),
    isActive: z.boolean().optional().default(true),
    supervisionRules: z.record(z.any()).optional().default({}),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    displayOrder: z.number().int().default(0).optional(),
    type: z.enum(Object.values(ROOM_TYPES) as [string, ...string[]]).default(ROOM_TYPES.STANDARD), // Utilisation des constantes
})/* .refine(data => { // Suppression de cette section
    // Au moins l'un des deux (sectorId ou sector) doit être présent
    return data.sectorId !== undefined || data.sector !== undefined;
}, {
    message: "Le secteur de la salle est obligatoire (soit par sectorId, soit par sector)",
    path: ["sector"]
}) */.transform(data => {
    if (typeof data.sector === 'string') {
        let normalized = data.sector.trim().replace(/\s+/g, ' ');
        if (normalized.toLowerCase().includes("endoscopie")) {
            normalized = "Endoscopie";
        }
        data.sector = normalized;
    }
    return data;
});

// Type généré par zod
export type OperatingRoom = z.infer<typeof OperatingRoomSchema>;

// Schéma pour un secteur opératoire
export const OperatingSectorSchema = z.object({
    id: z.number().int().positive().optional(),
    name: z.string().min(1).max(100),
    colorCode: z.string().default('#000000'),
    isActive: z.boolean().default(true),
    description: z.string().optional(),
    rules: z.any().default({ maxRoomsPerSupervisor: 2 }),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    displayOrder: z.number().int().default(0).optional(), // Ajout du champ d'ordre
    siteId: z.string().optional(), // Ajout de la référence au site (optionnel pour l'instant)
    category: z.enum(Object.values(SECTOR_CATEGORY_TYPES) as [string, ...string[]]).default(SECTOR_CATEGORY_TYPES.STANDARD), // Utilisation des constantes
});

export type OperatingSector = z.infer<typeof OperatingSectorSchema>;

// Schéma pour une règle de supervision
export const SupervisionRuleSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    type: z.nativeEnum(SupervisionRuleType),
    isActive: z.boolean().default(true),
    value: z.number().int().min(1).max(10).optional(),
    conditions: z.any().default({}),
    sectorIds: z.array(z.number()).optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export type SupervisionRule = z.infer<typeof SupervisionRuleSchema>;

// Schéma pour un membre du personnel du bloc
export const BlocStaffAssignmentSchema = z.object({
    id: z.string().uuid().optional(),
    userId: z.number().int().positive(),
    userName: z.string().optional(),
    role: z.nativeEnum(BlocStaffRole),
    periods: z.array(z.nativeEnum(BlocPeriod)),
    notes: z.string().optional(),
});

export type BlocStaffAssignment = z.infer<typeof BlocStaffAssignmentSchema>;

// Schéma pour une vacation de bloc (demi-journée)
export const BlocVacationSchema = z.object({
    id: z.string().uuid().optional(),
    roomId: z.number().int().positive(),
    date: z.date(),
    period: z.nativeEnum(BlocPeriod),
    status: z.nativeEnum(VacationStatus).default(VacationStatus.OPEN),
    staff: z.array(BlocStaffAssignmentSchema).default([]),
    notes: z.string().optional(),
});

export type BlocVacation = z.infer<typeof BlocVacationSchema>;

// Schéma pour une assignation de salle  
export const BlocRoomAssignmentSchema = z.object({
    id: z.string().uuid().optional(),
    roomId: z.number().int().positive(),
    surgeonId: z.number().int().positive().optional(),
    date: z.date(),
    period: z.nativeEnum(BlocPeriod),
    morningVacation: BlocVacationSchema.optional(),
    afternoonVacation: BlocVacationSchema.optional(),
    notes: z.string().optional(),
});

export type BlocRoomAssignment = z.infer<typeof BlocRoomAssignmentSchema>;

// Schéma pour un superviseur de secteur
export const BlocSupervisorSchema = z.object({
    id: z.string().uuid().optional(),
    userId: z.string(),
    name: z.string(),
    sectorId: z.string().optional(),
    sectorIds: z.array(z.string()).default([]),
    roomIds: z.array(z.number()).default([]),
    role: z.string().default('SUPERVISOR'),
    periods: z.array(z.nativeEnum(BlocPeriod)).default([]),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export type BlocSupervisor = z.infer<typeof BlocSupervisorSchema>;

// Schéma pour un planning de jour
export const BlocDayPlanningSchema = z.object({
    id: z.string().uuid().optional(),
    date: z.date(),
    status: z.nativeEnum(BlocPlanningStatus).default(BlocPlanningStatus.DRAFT),
    attributions: z.array(BlocRoomAssignmentSchema),
    createdById: z.number().int().positive(),
    updatedById: z.number().int().positive().optional(),
    validatedById: z.number().int().positive().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    validatedAt: z.date().optional(),
    notes: z.string().optional(),
});

export type BlocDayPlanning = z.infer<typeof BlocDayPlanningSchema>;

// Schéma pour un conflit dans le planning
export const BlocPlanningConflictSchema = z.object({
    id: z.string().uuid().optional(),
    planningId: z.string().uuid(),
    roomAssignmentId: z.string().uuid().optional(),
    supervisorId: z.string().uuid().optional(),
    type: z.string(),
    message: z.string(),
    severity: z.enum(['ERROR', 'WARNING', 'INFO']),
    resolved: z.boolean().default(false),
    resolution: z.string().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export type BlocPlanningConflict = z.infer<typeof BlocPlanningConflictSchema>;

// Résultat de validation
export interface ValidationResult {
    isValid: boolean;
    conflicts: BlocPlanningConflict[];
}

// Contexte pour la recherche de plannings
export interface BlocPlanningSearchContext {
    startDate?: Date;
    endDate?: Date;
    status?: BlocPlanningStatus;
    createdBy?: number;
    sectorId?: number;
    roomId?: number;
    staffId?: number;
} 