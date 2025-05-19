import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthTokenServer, checkUserRole } from '@/lib/auth-server-utils';
import type { UserRole as AuthUserRole } from '@/lib/auth-client-utils';

const prisma = new PrismaClient();

// Définir les rôles autorisés pour cette route
const ALLOWED_ROLES_GET: AuthUserRole[] = ['ADMIN_TOTAL', 'ADMIN_PARTIEL', 'USER']; // Large pour l'instant
const ALLOWED_ROLES_POST: AuthUserRole[] = ['ADMIN_TOTAL', 'ADMIN_PARTIEL']; // Plus restrictif pour la création

export async function GET(request: NextRequest) {
    try {
        const token = await getAuthTokenServer();
        const { hasRequiredRole, user, error: authError } = await checkUserRole(ALLOWED_ROLES_GET, token);

        if (!hasRequiredRole || !user) {
            return NextResponse.json({ error: authError || 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const siteId = searchParams.get('siteId');

        const sectors = await prisma.operatingSector.findMany({
            where: siteId ? { siteId } : undefined,
            include: {
                site: true,
                rooms: {
                    orderBy: { displayOrder: 'asc' }
                }
            },
            orderBy: [
                { displayOrder: { sort: 'asc', nulls: 'last' } },
                { name: 'asc' }
            ]
        });

        return NextResponse.json(sectors);
    } catch (error) {
        console.error('Erreur lors de la récupération des secteurs opératoires:', error);
        return NextResponse.json({ error: 'Erreur lors de la récupération des secteurs opératoires' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = await getAuthTokenServer();
        const { hasRequiredRole, user, error: authError } = await checkUserRole(ALLOWED_ROLES_POST, token);

        if (!hasRequiredRole || !user) {
            return NextResponse.json({ error: authError || 'Non autorisé' }, { status: 401 });
        }

        const data = await request.json();
        const { name, siteId, description, colorCode, isActive, displayOrder, category, rules } = data;

        if (!name || !siteId) {
            return NextResponse.json({ error: 'Nom et site requis' }, { status: 400 });
        }

        const newSector = await prisma.operatingSector.create({
            data: {
                name,
                siteId,
                description,
                colorCode,
                isActive: isActive !== undefined ? isActive : true,
                displayOrder,
                category,
                rules: rules || {},
                // createdBy: user.id, // Si vous souhaitez tracer qui a créé le secteur
            },
            include: {
                site: true
            }
        });

        return NextResponse.json(newSector, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création du secteur:', error);
        return NextResponse.json({
            error: 'Erreur lors de la création du secteur',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        }, { status: 500 });
    }
}
