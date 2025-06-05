import { User } from "./user";
import { Surgeon } from "./surgeon";

// Enums pour remplacer ceux de Prisma
export enum DayOfWeek {
    MONDAY = "MONDAY",
    TUESDAY = "TUESDAY",
    WEDNESDAY = "WEDNESDAY",
    THURSDAY = "THURSDAY",
    FRIDAY = "FRIDAY",
    SATURDAY = "SATURDAY",
    SUNDAY = "SUNDAY"
}

export enum DayPeriod {
    MORNING = "MORNING",
    AFTERNOON = "AFTERNOON",
    EVENING = "EVENING",
    NIGHT = "NIGHT",
    ALL_DAY = "ALL_DAY"
}

export enum TrameType {
    WEEKLY = "WEEKLY",
    BIWEEKLY = "BIWEEKLY",
    MONTHLY = "MONTHLY",
    CUSTOM = "CUSTOM"
}

export enum WeekType {
    ALL = "ALL",
    EVEN = "EVEN",
    ODD = "ODD"
}

// Interface Location simplifiée
export interface Location {
    id: number;
    name: string;
    code?: string;
    address?: string;
    city?: string;
    type?: string;
}

export interface RegularAssignment {
    id: number;
    trameId?: number | null;
    userId?: number | null;
    surgeonId?: number | null;
    locationId?: number | null;
    dayOfWeek: DayOfWeek;
    period: DayPeriod;
    weekType: WeekType;
    startDate: Date;
    endDate?: Date | null;
    assignmentType: string;
    specialty?: string | null;
    priority: number;
    details: RegularAssignmentDetails;
    createdAt: Date;
    updatedAt: Date;
    trameModele?: TrameModele | null;
    user?: User | null;
    surgeon?: Surgeon | null;
    location?: Location | null;
    attributions?: unknown[]; // Type à préciser lors de l'implémentation complète
}

export interface RegularAssignmentDetails {
    service?: string;
    room?: string;
    comment?: string;
    duration?: number;
    [key: string]: unknown; // Autres propriétés spécifiques
}

export interface TrameModele {
    id: number;
    name: string;
    description?: string | null;
    type: TrameType;
    startDate: Date;
    endDate?: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    regularAssignments?: RegularAssignment[];
}

export type RegularAssignmentFormData = Omit<RegularAssignment, "id" | "createdAt" | "updatedAt" | "trameModele" | "user" | "surgeon" | "location" | "attributions">;

export type TemplateDefinition = {
    name: string;
    description?: string;
    type: TrameType;
    attributions: Array<Omit<RegularAssignment, "id" | "trameId" | "createdAt" | "updatedAt" | "trameModele" | "user" | "surgeon" | "location" | "attributions">>;
}; 