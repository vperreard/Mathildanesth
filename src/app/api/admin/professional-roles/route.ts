import { NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { checkUserRole, UserRole } from '@/lib/auth-utils';
import { ProfessionalRole } from '@prisma/client';

// GET /api/admin/professional-roles
export async function GET() {
    const authCheck = await checkUserRole(['ADMIN_TOTAL', 'ADMIN_PARTIEL'] as UserRole[]);

    if (!authCheck.hasRequiredRole) {
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 });
    }

    try {
        const roles = await prisma.$queryRaw`
            SELECT id, code, label, description, "isActive"
            FROM "ProfessionalRoleConfig"
            ORDER BY code ASC
        `;
        return NextResponse.json(roles);
    } catch (error) {
        logger.error("Erreur GET /api/admin/professional-roles:", error);
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
}

// POST /api/admin/professional-roles
export async function POST(request: Request) {
    const authCheck = await checkUserRole(['ADMIN_TOTAL'] as UserRole[]);

    if (!authCheck.hasRequiredRole) {
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 });
    }

    try {
        const body = await request.json();
        const { code, label, description, isActive } = body;

        // Validation
        if (!code || !label) {
            return new NextResponse(JSON.stringify({ message: 'Code et libellé sont obligatoires' }), { status: 400 });
        }

        if (!Object.values(ProfessionalRole).includes(code as ProfessionalRole)) {
            return new NextResponse(JSON.stringify({ message: 'Code de rôle invalide' }), { status: 400 });
        }

        // Vérifier si le code existe déjà
        const existingRole = await prisma.$queryRaw`
            SELECT id FROM "ProfessionalRoleConfig"
            WHERE code = ${code}
        `;

        if (existingRole && existingRole.length > 0) {
            return new NextResponse(JSON.stringify({ message: 'Ce code de rôle existe déjà' }), { status: 409 });
        }

        // Créer le rôle
        const newRole = await prisma.$executeRaw`
            INSERT INTO "ProfessionalRoleConfig" (id, code, label, description, "isActive", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), ${code}, ${label}, ${description || ''}, ${isActive !== undefined ? isActive : true}, NOW(), NOW())
            RETURNING *
        `;

        return new NextResponse(JSON.stringify(newRole), { status: 201 });
    } catch (error) {
        logger.error("Erreur POST /api/admin/professional-roles:", error);
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
} 