import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emitUpdatedContextualMessage, emitDeletedContextualMessage } from '@/lib/socket';
import {
    requireMessagePermission,
    AuthorizationError,
    AuthenticationError
} from '@/lib/auth/authorization';
import { auditService } from '@/services/auditService';

interface ContextualMessageUpdateInput {
    content: string;
}

// PUT /api/contextual-messages/[messageId]
export async function PUT(req: NextRequest, { params }: { params: { messageId: string } }) {
    try {
        // 🔐 Vérification des permissions de modification de message
        const session = await requireMessagePermission('update');
        const userId = session.user.id;
        const { messageId } = await Promise.resolve(params);

        if (!messageId) {
            return NextResponse.json({ error: 'ID du message manquant' }, { status: 400 });
        }

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
        if (messageToUpdate.authorId !== userId && !['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Vous n\'êtes pas autorisé à modifier ce message' }, { status: 403 });
        }

        // Logger l'action de mise à jour
        await auditService.logAction({
            action: 'UPDATE_CONTEXTUAL_MESSAGE' as any,
            userId: session.user.id.toString(),
            entityId: messageId,
            entityType: 'contextual_message',
            details: {
                authorId: messageToUpdate.authorId,
                userRole: session.user.role
            }
        });

        const updatedMessage = await prisma.contextualMessage.update({
            where: { id: messageId },
            data: {
                content,
                updatedAt: new Date(),
            },
            include: {
                author: {
                    select: { id: true, login: true, email: true },
                },
            },
        });

        emitUpdatedContextualMessage(updatedMessage);

        return NextResponse.json(updatedMessage, { status: 200 });
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        if (error instanceof AuthorizationError) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        console.error('Erreur lors de la mise à jour du message contextuel:', error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: 'Données JSON invalides' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
}

// DELETE /api/contextual-messages/[messageId]
export async function DELETE(req: NextRequest, { params }: { params: { messageId: string } }) {
    try {
        // 🔐 CORRECTION DU TODO CRITIQUE : Vérification du rôle administrateur
        const session = await requireMessagePermission('delete');
        const userId = session.user.id;

        const { messageId } = params;

        if (!messageId) {
            return NextResponse.json({ error: 'ID du message manquant' }, { status: 400 });
        }

        const messageToDelete = await prisma.contextualMessage.findUnique({
            where: { id: messageId },
        });

        if (!messageToDelete) {
            return NextResponse.json({ error: 'Message non trouvé' }, { status: 404 });
        }

        // Vérifier si l'utilisateur est l'auteur OU un administrateur
        if (messageToDelete.authorId !== userId && !['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Vous n\'êtes pas autorisé à supprimer ce message' }, { status: 403 });
        }

        // Logger l'action de suppression
        await auditService.logAction({
            action: 'DELETE_CONTEXTUAL_MESSAGE' as any,
            userId: session.user.id.toString(),
            entityId: messageId,
            entityType: 'contextual_message',
            details: {
                authorId: messageToDelete.authorId,
                userRole: session.user.role,
                contextInfo
            }
        });

        // Collecter les informations de contexte avant suppression pour l'événement WebSocket
        const contextInfo = {
            assignmentId: messageToDelete.assignmentId || undefined,
            contextDate: messageToDelete.contextDate || undefined,
            requestId: messageToDelete.requestId || undefined
        };

        await prisma.contextualMessage.delete({
            where: { id: messageId },
        });

        emitDeletedContextualMessage(messageId, contextInfo);

        return NextResponse.json({ message: 'Message supprimé avec succès' }, { status: 200 });
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        if (error instanceof AuthorizationError) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        console.error('Erreur lors de la suppression du message contextuel:', error);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
} 