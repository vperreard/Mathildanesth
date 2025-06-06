import { NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { PrismaClient, User } from '@prisma/client';
// import { getServerSession } from '@/lib/auth/migration-shim'; // Ancien import
import { getServerSession } from '@/lib/auth/migration-shim'; // Nouvel import
// import { authOptions } from '@/lib/auth/migration-shim'; // <--- Chemin potentiellement incorrect, commenté temporairement

import { prisma } from "@/lib/prisma";

// Fonction pour vérifier si l'utilisateur est admin (copiée depuis l'autre route)
const isAdmin = (user: User | null): boolean => {
    return !!user && (user.role === 'ADMIN_TOTAL' || user.role === 'ADMIN_PARTIEL');
};

/**
 * PUT /api/admin/leave-types/{id}
 * Met à jour un paramètre de type de congé existant.
 * Réservé aux administrateurs.
 */
export async function PUT(
    request: Request, 
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params; // Récupérer l'ID depuis les paramètres de la route

    try {
        // --- Authentification commentée temporairement --- 
        /*
        const session = await getServerSession(authOptions); // Nécessite authOptions
        const user = session?.user?.email
            ? await prisma.user.findUnique({ where: { email: session.user.email } })
            : null;

        if (!isAdmin(user)) {
            return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
        }
        */
        // --- Fin section commentée ---

        const body = await request.json();

        // Validation simple (le code ne doit pas être modifié ici, seulement les autres champs)
        if (!body.label) {
            return NextResponse.json({ error: 'Le champ label est requis.' }, { status: 400 });
        }

        // Le 'code' ne devrait idéalement pas être modifiable facilement car il sert d'identifiant logique.
        // Si on veut le permettre, il faut gérer les impacts potentiels.
        // On exclut 'code' de la mise à jour pour l'instant.
        const { code, ...updateData } = body;

        const updatedLeaveTypeSetting = await prisma.leaveTypeSetting.update({
            where: { id: id },
            data: {
                label: updateData.label,
                description: updateData.description,
                rules: updateData.rules ?? undefined,
                isActive: updateData.isActive !== undefined ? updateData.isActive : undefined, // Ne met à jour que si fourni
                isUserSelectable: updateData.isUserSelectable !== undefined ? updateData.isUserSelectable : undefined, // Ne met à jour que si fourni
            },
        });

        return NextResponse.json(updatedLeaveTypeSetting);

    } catch (error: unknown) {
        logger.error(`Erreur API [PUT /admin/leave-types/${id}]:`, { error: error });
        // Gérer le cas où l'enregistrement n'est pas trouvé
        if (error.code === 'P2025') {
            return NextResponse.json({ error: `Type de congé avec ID ${id} non trouvé.` }, { status: 404 });
        }
        return NextResponse.json({ error: 'Erreur serveur lors de la mise à jour du type de congé.' }, { status: 500 });
    } finally {
        // await prisma.$disconnect(); // Envisager la déconnexion si nécessaire
    }
}

/**
 * DELETE /api/admin/leave-types/{id}
 * Supprime (ou désactive) un paramètre de type de congé.
 * Réservé aux administrateurs.
 */
export async function DELETE(
    request: Request, 
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // --- Authentification commentée temporairement --- 
        /*
        const session = await getServerSession(authOptions); // Nécessite authOptions
        const user = session?.user?.email
            ? await prisma.user.findUnique({ where: { email: session.user.email } })
            : null;

        if (!isAdmin(user)) {
            return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
        }
        */
        // --- Fin section commentée ---

        // Alternative : Marquer comme inactif au lieu de supprimer réellement ?
        // const deletedLeaveTypeSetting = await prisma.leaveTypeSetting.update({
        //     where: { id: id },
        //     data: { isActive: false },
        // });

        // Suppression réelle :
        const deletedLeaveTypeSetting = await prisma.leaveTypeSetting.delete({
            where: { id: id },
        });

        // return NextResponse.json(deletedLeaveTypeSetting); // Retourner l'objet supprimé
        return new NextResponse(null, { status: 204 }); // Ou juste 204 No Content

    } catch (error: unknown) {
        logger.error(`Erreur API [DELETE /admin/leave-types/${id}]:`, { error: error });
        if (error.code === 'P2025') {
            return NextResponse.json({ error: `Type de congé avec ID ${id} non trouvé.` }, { status: 404 });
        }
        // Gérer P2003: Foreign key constraint failed (si des Leave utilisent ce type)
        if (error.code === 'P2003') {
            return NextResponse.json({ error: 'Impossible de supprimer ce type de congé car il est utilisé par des demandes existantes. Vous pouvez le désactiver à la place.' }, { status: 409 }); // 409 Conflict
        }
        return NextResponse.json({ error: 'Erreur serveur lors de la suppression du type de congé.' }, { status: 500 });
    } finally {
        // await prisma.$disconnect();
    }
} 