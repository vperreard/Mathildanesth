import { NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

// Helper pour vérifier les rôles autorisés (ADMIN_TOTAL ou ADMIN_PARTIEL)
const hasRequiredRole = (): boolean => {
    const headersList = headers();
    const userRoleString = headersList.get('x-user-role');
    return !!userRoleString && ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(userRoleString);
};

// --- PUT : Modifier un chirurgien existant ---
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!hasRequiredRole()) {
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 });
    }

    const surgeonId = parseInt(params.id, 10);
    if (isNaN(surgeonId)) {
        return new NextResponse(JSON.stringify({ message: 'ID chirurgien invalide' }), { status: 400 });
    }

    try {
        const body = await request.json();
        // Retirer canDoPediatrics
        const { nom, prenom, status, userId, specialtyIds, email, phoneNumber } = body;

        // Validation basique
        if (!nom || !prenom) {
            return new NextResponse(JSON.stringify({ message: 'Nom et prénom sont obligatoires.' }), { status: 400 });
        }
        if (specialtyIds && (!Array.isArray(specialtyIds) || !specialtyIds.every(id => Number.isInteger(id)))) {
            return new NextResponse(JSON.stringify({ message: 'Le format des spécialités est invalide.' }), { status: 400 });
        }
        // Optionnel: validation email/phoneNumber

        const updatedSurgeon = await prisma.surgeon.update({
            where: { id: surgeonId },
            data: {
                nom,
                prenom,
                status: status || 'ACTIF',
                userId: userId === undefined ? undefined : (userId && !isNaN(parseInt(userId)) ? parseInt(userId) : null),
                email: email === undefined ? undefined : (email || null),
                phoneNumber: phoneNumber === undefined ? undefined : (phoneNumber || null),
                specialties: specialtyIds
                    ? { set: specialtyIds.map((id: number) => ({ id })) }
                    : undefined,
            },
            include: {
                specialties: { select: { id: true, name: true } }
            }
        });

        return NextResponse.json(updatedSurgeon);

    } catch (error: unknown) {
        if (error.code === 'P2025') { // Code d'erreur Prisma pour enregistrement non trouvé
            return new NextResponse(JSON.stringify({ message: 'Chirurgien non trouvé' }), { status: 404 });
        }
        logger.error(`Erreur PUT /api/chirurgiens/${surgeonId}:`, error instanceof Error ? error : new Error(String(error)));
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
}

// --- DELETE : Supprimer un chirurgien ---
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!hasRequiredRole()) {
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 });
    }

    const surgeonId = parseInt(params.id, 10);
    if (isNaN(surgeonId)) {
        return new NextResponse(JSON.stringify({ message: 'ID chirurgien invalide' }), { status: 400 });
    }

    try {
        await prisma.surgeon.delete({
            where: { id: surgeonId },
        });
        return new NextResponse(null, { status: 204 }); // No Content

    } catch (error: unknown) {
        if (error.code === 'P2025') { // Code d'erreur Prisma pour enregistrement non trouvé
            return new NextResponse(JSON.stringify({ message: 'Chirurgien non trouvé' }), { status: 404 });
        }
        logger.error(`Erreur DELETE /api/chirurgiens/${surgeonId}:`, error instanceof Error ? error : new Error(String(error)));
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
} 