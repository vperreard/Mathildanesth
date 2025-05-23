import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Ajustez le chemin si nécessaire
import { Role } from '@prisma/client'; // Ajouté pour référence au type Role
import { emitUpdatedContextualMessage, emitDeletedContextualMessage } from '@/lib/socket'; // Ajout pour WebSockets

interface ContextualMessageUpdateInput {
    content: string;
}

// PUT /api/contextual-messages/[messageId]
export async function PUT(req: NextRequest, { params }: { params: { messageId: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || typeof session.user.id !== 'number') {
        return NextResponse.json({ error: 'Non autorisé ou session invalide' }, { status: 401 });
    }
    const userId = session.user.id;
    const { messageId } = await Promise.resolve(params);

    if (!messageId) {
        return NextResponse.json({ error: 'ID du message manquant' }, { status: 400 });
    }

    try {
        const body = await req.json() as ContextualMessageUpdateInput;
        const { content } = body;

        if (!content) {
            return NextResponse.json({ error: 'Le contenu du message est requis pour la mise à jour' }, { status: 400 });
        }

        const messageToUpdate = await prisma.contextualMessage.findUnique({
            where: { id: messageId },
        });

        if (!messageToUpdate) {
            return NextResponse.json({ error: 'Message non trouvé' }, { status: 404 });
        }

        // Vérifier si l'utilisateur est l'auteur OU un administrateur
        // session.user.role est défini dans authOptions et provient du modèle User Prisma
        if (messageToUpdate.authorId !== userId && session.user.role !== Role.ADMIN_TOTAL) {
            return NextResponse.json({ error: 'Vous n\'êtes pas autorisé à modifier ce message' }, { status: 403 });
        }

        const updatedMessage = await prisma.contextualMessage.update({
            where: { id: messageId },
            data: {
                content,
                updatedAt: new Date(), // Mettre à jour explicitement la date de modification
            },
            include: {
                author: {
                    select: { id: true, login: true, email: true },
                },
            },
        });

        // Émettre un événement WebSocket pour la mise à jour du message
        emitUpdatedContextualMessage(updatedMessage);

        return NextResponse.json(updatedMessage, { status: 200 });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du message contextuel:', error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: 'Données JSON invalides' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
}

// DELETE /api/contextual-messages/[messageId]
export async function DELETE(req: NextRequest, { params }: { params: { messageId: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || typeof session.user.id !== 'number') {
        return NextResponse.json({ error: 'Non autorisé ou session invalide' }, { status: 401 });
    }
    const userId = session.user.id;
    // TODO: Ajouter la vérification du rôle administrateur ici
    // const userRoles = session.user.roles; // Supposant que les rôles sont dans la session

    const { messageId } = params;

    if (!messageId) {
        return NextResponse.json({ error: 'ID du message manquant' }, { status: 400 });
    }

    try {
        const messageToDelete = await prisma.contextualMessage.findUnique({
            where: { id: messageId },
        });

        if (!messageToDelete) {
            return NextResponse.json({ error: 'Message non trouvé' }, { status: 404 });
        }

        // Vérifier si l'utilisateur est l'auteur OU un administrateur
        // session.user.role est défini dans authOptions et provient du modèle User Prisma
        if (messageToDelete.authorId !== userId && session.user.role !== Role.ADMIN_TOTAL) {
            return NextResponse.json({ error: 'Vous n\'êtes pas autorisé à supprimer ce message' }, { status: 403 });
        }

        // Collecter les informations de contexte avant suppression pour l'événement WebSocket
        const contextInfo = {
            assignmentId: messageToDelete.assignmentId || undefined,
            contextDate: messageToDelete.contextDate || undefined,
            requestId: messageToDelete.requestId || undefined
        };

        // Gérer la suppression des réponses : Pour l'instant, suppression simple.
        // Si les réponses doivent être conservées, il faudrait les ré-attacher ou les marquer.
        // Exemple: marquer les réponses comme orphelines ou les supprimer en cascade (configurer dans le schéma Prisma)
        // await prisma.contextualMessage.updateMany({
        //     where: { parentId: messageId },
        //     data: { parentId: null }, // ou une autre logique
        // });

        await prisma.contextualMessage.delete({
            where: { id: messageId },
        });

        // Émettre un événement WebSocket pour la suppression du message
        emitDeletedContextualMessage(messageId, contextInfo);

        return NextResponse.json({ message: 'Message supprimé avec succès' }, { status: 200 }); // Ou 204 No Content
    } catch (error) {
        console.error('Erreur lors de la suppression du message contextuel:', error);
        // Gérer les erreurs spécifiques de Prisma (ex: contrainte de clé étrangère si la suppression en cascade n'est pas configurée)
        // if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') { 
        //     return NextResponse.json({ error: 'Impossible de supprimer le message car il a des réponses. Supprimez d\'abord les réponses.' }, { status: 409 });
        // }
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
} 