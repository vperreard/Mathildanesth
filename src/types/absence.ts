export type AbsenceStatus = 'REQUESTED' | 'VALIDATED' | 'REJECTED';
export type AbsenceType = 'LEAVE' | 'ILLNESS' | 'TRAINING' | 'OTHER';

export interface PlannedAbsence {
    id: number;
    userId: number;
    surgeonId?: number;
    startDate: Date;
    endDate: Date;
    type: AbsenceType;
    typeDetail?: string;
    impactPlanning: boolean;
    priority: number;
    comment?: string;
    status: AbsenceStatus;
    validatedById?: number;
    notify: boolean;
    importSource?: string;
    documents?: unknown[];
    createdAt: Date;
    updatedAt: Date;
}

export interface AbsenceCreateInput {
    userId: number;
    startDate: Date;
    endDate: Date;
    type: AbsenceType;
    typeDetail?: string;
    impactPlanning?: boolean;
    priority?: number;
    comment?: string;
    notify?: boolean;
}

export interface AbsenceUpdateInput {
    status?: AbsenceStatus;
    typeDetail?: string;
    impactPlanning?: boolean;
    priority?: number;
    comment?: string;
    notify?: boolean;
} 