import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    requireAdmin,
    logSecurityAction,
    AuthorizationError,
    AuthenticationError
} from '@/lib/auth/authorization';
import { auditService } from '@/services/auditService';

/**
 * GET /api/admin/leave-types
 * Récupère la liste de tous les paramètres de types de congés.
 * Réservé aux administrateurs.
 */
export async function GET(request: Request) {
    try {
        // 🔐 CORRECTION DU TODO CRITIQUE : Vérifications admin requises
        const session = await requireAdmin();
        
        // Logger l'action
        await auditService.logAction({
            action: 'READ_LEAVE_TYPES' as any,
            userId: session.user.id.toString(),
            entityId: 'all',
            entityType: 'leave_type_setting'
        });

        const leaveTypeSettings = await prisma.leaveTypeSetting.findMany({
            orderBy: { label: 'asc' },
        });

        return NextResponse.json(leaveTypeSettings);

    } catch (error) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        if (error instanceof AuthorizationError) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        console.error('Erreur API [GET /admin/leave-types]:', error);
        return NextResponse.json({ error: 'Erreur serveur lors de la récupération des types de congés.' }, { status: 500 });
    }
}

/**
 * POST /api/admin/leave-types
 * Crée un nouveau paramètre de type de congé.
 * Réservé aux administrateurs.
 */
export async function POST(request: Request) {
    try {
        // 🔐 CORRECTION DU TODO CRITIQUE : Vérifications admin requises
        const session = await requireAdmin();

        const body = await request.json();

        // Logger l'action
        await auditService.logAction({
            action: 'CREATE_LEAVE_TYPE' as any,
            userId: session.user.id.toString(),
            entityId: body.code || 'new',
            entityType: 'leave_type_setting',
            details: { code: body.code, label: body.label }
        });

        if (!body.code || !body.label) {
            return NextResponse.json({ error: 'Les champs code et label sont requis.' }, { status: 400 });
        }

        const existing = await prisma.leaveTypeSetting.findUnique({ where: { code: body.code } });
        if (existing) {
            return NextResponse.json({ error: `Le code '${body.code}' existe déjà.` }, { status: 409 });
        }

        const newLeaveTypeSetting = await prisma.leaveTypeSetting.create({
            data: {
                code: body.code,
                label: body.label,
                description: body.description,
                rules: body.rules ?? undefined,
                isActive: body.isActive !== undefined ? body.isActive : true,
                isUserSelectable: body.isUserSelectable !== undefined ? body.isUserSelectable : true,
            },
        });

        return NextResponse.json(newLeaveTypeSetting, { status: 201 });

    } catch (error) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        if (error instanceof AuthorizationError) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        console.error('Erreur API [POST /admin/leave-types]:', error);
        if ((error as any).code === 'P2002' && (error as any).meta?.target?.includes('code')) {
            return NextResponse.json({ error: 'Le code fourni existe déjà.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Erreur serveur lors de la création du type de congé.' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/leave-types
 * Met à jour un paramètre de type de congé.
 * Réservé aux administrateurs.
 */
export async function PUT(request: Request) {
    try {
        const session = await requireAdmin();

        const body = await request.json();
        const { id, ...updateData } = body;

        // Logger l'action
        await auditService.logAction({
            action: 'UPDATE_LEAVE_TYPE' as any,
            userId: session.user.id.toString(),
            entityId: String(id),
            entityType: 'leave_type_setting',
            details: { updateData }
        });

        if (!id) {
            return NextResponse.json({ error: 'L\'ID est requis pour la mise à jour.' }, { status: 400 });
        }

        const updatedLeaveTypeSetting = await prisma.leaveTypeSetting.update({
            where: { id: parseInt(String(id)) },
            data: updateData,
        });

        return NextResponse.json(updatedLeaveTypeSetting);

    } catch (error) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        if (error instanceof AuthorizationError) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        console.error('Erreur API [PUT /admin/leave-types]:', error);
        return NextResponse.json({ error: 'Erreur serveur lors de la mise à jour du type de congé.' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/leave-types
 * Supprime un paramètre de type de congé.
 * Réservé aux administrateurs.
 */
export async function DELETE(request: Request) {
    try {
        const session = await requireAdmin();

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'L\'ID est requis pour la suppression.' }, { status: 400 });
        }

        // Logger l'action
        await auditService.logAction({
            action: 'DELETE_LEAVE_TYPE' as any,
            userId: session.user.id.toString(),
            entityId: id,
            entityType: 'leave_type_setting'
        });

        await prisma.leaveTypeSetting.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ message: 'Type de congé supprimé avec succès.' });

    } catch (error) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        if (error instanceof AuthorizationError) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        console.error('Erreur API [DELETE /admin/leave-types]:', error);
        return NextResponse.json({ error: 'Erreur serveur lors de la suppression du type de congé.' }, { status: 500 });
    }
} 