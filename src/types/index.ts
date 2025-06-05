// Types communs pour l'application

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    role?: string;
    [key: string]: unknown; // Pour les propriétés additionnelles
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export type SortDirection = 'asc' | 'desc';

export interface SortOptions {
    field: string;
    direction: SortDirection;
}

export interface FilterOptions {
    [key: string]: unknown;
}

export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
    errors?: Record<string, string[]>;
}

// Export des nouveaux types Activity/Sector
export * from './activityTypes';
export * from './assignment'; 