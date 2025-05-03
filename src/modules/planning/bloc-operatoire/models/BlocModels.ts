import { z } from 'zod';

// Enum pour les périodes de la journée
export enum BlocPeriod {
    MORNING = 'MORNING',
    AFTERNOON = 'AFTERNOON',
    FULL_DAY = 'FULL_DAY',
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
    // Accepter soit sectorId comme nombre ou secteur comme chaîne
    sectorId: z.number().optional(),
    sector: z.string().optional(),
    colorCode: z.string().optional().default('#000000'),
    isActive: z.boolean().optional().default(true),
    supervisionRules: z.record(z.any()).optional().default({}),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional()
}).refine(data => {
    // Au moins l'un des deux (sectorId ou sector) doit être présent
    return data.sectorId !== undefined || data.sector !== undefined;
}, {
    message: "Le secteur de la salle est obligatoire (soit par sectorId, soit par sector)",
    path: ["sector"]
}).transform(data => {
    // Normaliser le nom du secteur si présent
    if (typeof data.sector === 'string') {
        // Normaliser les espaces
        let normalized = data.sector.trim().replace(/\s+/g, ' ');

        // Traitement spécial pour Endoscopie
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
    morningVacation: BlocVacationSchema.optional(),
    afternoonVacation: BlocVacationSchema.optional(),
    notes: z.string().optional(),
});

export type BlocRoomAssignment = z.infer<typeof BlocRoomAssignmentSchema>;

// Schéma pour un planning de jour
export const BlocDayPlanningSchema = z.object({
    id: z.string().uuid().optional(),
    date: z.date(),
    status: z.nativeEnum(BlocPlanningStatus).default(BlocPlanningStatus.DRAFT),
    assignments: z.array(BlocRoomAssignmentSchema),
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