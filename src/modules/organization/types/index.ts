/**
 * Types pour l'organisation et les départements
 */

export interface Department {
    id: string;
    name: string;
    code?: string;
    description?: string;
    managerId?: string;
    parentId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Team {
    id: string;
    name: string;
    departmentId: string;
    leaderId?: string;
    members: string[]; // IDs des utilisateurs
    createdAt?: Date;
    updatedAt?: Date;
}

export interface OrganizationUnit {
    id: string;
    name: string;
    type: 'department' | 'team' | 'service';
    parentId?: string;
    managerId?: string;
    members?: string[];
} 