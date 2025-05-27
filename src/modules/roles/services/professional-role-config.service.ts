import { prisma } from '@/lib/prisma';
import { DisplayPreferences } from '../types/professional-role-config';

jest.mock('@/lib/prisma');


const prisma = prisma;

export class ProfessionalRoleConfigService {
    async updateDisplayPreferences(roleCode: string, preferences: DisplayPreferences) {
        return prisma.professionalRoleConfig.update({
            where: { code: roleCode },
            data: {
                displayPreferences: preferences,
                updatedAt: new Date(),
            },
        });
    }

    async getDisplayPreferences(roleCode: string) {
        const config = await prisma.professionalRoleConfig.findUnique({
            where: { code: roleCode },
        });
        return config?.displayPreferences as DisplayPreferences | null;
    }

    async getAllRolesWithPreferences() {
        return prisma.professionalRoleConfig.findMany({
            where: { isActive: true },
            orderBy: {
                code: 'asc',
            },
        });
    }
} 