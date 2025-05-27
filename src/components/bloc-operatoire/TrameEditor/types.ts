import { DayOfWeek, Period, TypeSemaineTrame, ActivityType, OperatingRoom, Surgeon, User } from '@prisma/client';

// Types de base pour l'éditeur de trames
export interface TrameEditorConfig {
    weekStart: Date;
    viewMode: 'week' | 'biweek' | 'month';
    showConflicts: boolean;
    enableDragDrop: boolean;
    autoSave: boolean;
}

// Types pour les affectations dans l'éditeur
export interface EditorAffectation {
    id?: number;
    trameModeleId: number;
    activityTypeId: string;
    jourSemaine: DayOfWeek;
    periode: Period;
    typeSemaine: TypeSemaineTrame;
    operatingRoomId?: number;
    priorite: number;
    isActive: boolean;
    detailsJson?: any;

    // Relations enrichies pour l'UI
    activityType?: ActivityType;
    operatingRoom?: OperatingRoom;
    personnelRequis?: EditorPersonnelRequis[];

    // Props UI temporaires
    isSelected?: boolean;
    isDragging?: boolean;
    hasConflict?: boolean;
    conflictDetails?: ConflictDetail[];
}

export interface EditorPersonnelRequis {
    id?: number;
    affectationModeleId?: number;
    roleGenerique: string;
    professionalRoleId?: string;
    specialtyId?: number;
    nombreRequis: number;
    personnelHabituelUserId?: number;
    personnelHabituelSurgeonId?: number;
    personnelHabituelNomExterne?: string;
    notes?: string;

    // Relations pour l'UI
    userHabituel?: User;
    surgeonHabituel?: Surgeon;
    isAssigned?: boolean;
    isAvailable?: boolean;
}

export interface ConflictDetail {
    type: 'personnel' | 'room' | 'rule' | 'availability';
    severity: 'error' | 'warning' | 'info';
    message: string;
    affectedIds: number[];
    suggestedActions?: string[];
}

// Types pour le drag & drop
export interface DragItem {
    id: string;
    type: 'affectation' | 'personnel' | 'template';
    data: EditorAffectation | EditorPersonnelRequis | any;
    source: {
        jourSemaine: DayOfWeek;
        periode: Period;
        roomId?: number;
    };
}

export interface DropTarget {
    jourSemaine: DayOfWeek;
    periode: Period;
    roomId?: number;
    accepts: string[];
    isValid: boolean;
    conflictLevel?: 'none' | 'warning' | 'error';
}

// Types pour la grille hebdomadaire
export interface GridCell {
    jourSemaine: DayOfWeek;
    periode: Period;
    roomId?: number;
    affectations: EditorAffectation[];
    isDropTarget: boolean;
    isHighlighted: boolean;
    conflictLevel?: 'none' | 'warning' | 'error';
}

export interface WeeklyGridData {
    weekStart: Date;
    weekEnd: Date;
    days: DayOfWeek[];
    periods: Period[];
    rooms: OperatingRoom[];
    grid: GridCell[][];
}

// Types pour les filtres
export interface TrameEditorFilters {
    roomIds: number[];
    activityTypeIds: string[];
    personnelIds: number[];
    typeSemaine: TypeSemaineTrame[];
    showInactive: boolean;
    showConflicts: boolean;
    searchTerm?: string;
}

// Types pour les actions d'édition
export type TrameEditorAction =
    | { type: 'ADD_AFFECTATION'; payload: EditorAffectation }
    | { type: 'UPDATE_AFFECTATION'; payload: { id: number; updates: Partial<EditorAffectation> } }
    | { type: 'DELETE_AFFECTATION'; payload: { id: number } }
    | { type: 'MOVE_AFFECTATION'; payload: { id: number; target: DropTarget } }
    | { type: 'DUPLICATE_AFFECTATION'; payload: { id: number; target: DropTarget } }
    | { type: 'APPLY_TEMPLATE'; payload: { templateId: number; target: DropTarget[] } }
    | { type: 'CLEAR_CONFLICTS'; payload: { affectationIds: number[] } }
    | { type: 'VALIDATE_AFFECTATIONS'; payload: EditorAffectation[] };

// Types pour l'état de l'éditeur
export interface TrameEditorState {
    config: TrameEditorConfig;
    gridData: WeeklyGridData;
    affectations: EditorAffectation[];
    selectedAffectations: number[];
    dragState: {
        isDragging: boolean;
        dragItem?: DragItem;
        dropTarget?: DropTarget;
    };
    filters: TrameEditorFilters;
    conflicts: ConflictDetail[];
    loading: boolean;
    saving: boolean;
    error?: string;
    unsavedChanges: boolean;
}

// Types pour les couleurs et thèmes
export interface ActivityTypeColor {
    activityTypeId: string;
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    hoverColor: string;
}

export interface RoomColor {
    roomId: number;
    backgroundColor: string;
    borderColor: string;
}

export interface ThemeColors {
    activityTypes: ActivityTypeColor[];
    rooms: RoomColor[];
    conflicts: {
        error: string;
        warning: string;
        info: string;
    };
    dragDrop: {
        dragging: string;
        validTarget: string;
        invalidTarget: string;
    };
}

// Hooks et utilitaires
export interface UseTrameEditorOptions {
    trameModeleId?: number;
    weekStart?: Date;
    autoSave?: boolean;
    enableValidation?: boolean;
}

export interface UseDragDropOptions {
    onDragStart?: (item: DragItem) => void;
    onDragEnd?: (item: DragItem, target?: DropTarget) => void;
    onDrop?: (item: DragItem, target: DropTarget) => void;
    canDrop?: (item: DragItem, target: DropTarget) => boolean;
} 