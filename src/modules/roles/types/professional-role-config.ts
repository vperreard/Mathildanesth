import { ProfessionalRoleConfig } from '@prisma/client';

export interface DisplayPreferences {
    color?: string;
    icon?: string;
    order?: number;
    visibility?: {
        calendar?: boolean;
        dashboard?: boolean;
        planning?: boolean;
    };
    customFields?: Record<string, unknown>;
}

export interface ProfessionalRoleConfigWithPreferences extends ProfessionalRoleConfig {
    displayPreferences: DisplayPreferences | null;
} 