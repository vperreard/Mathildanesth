import { prisma } from '@/lib/prisma';
import { Prisma, NotificationType } from '@prisma/client';
import { io } from '@/lib/socket'; // Importer l'instance io

jest.mock('@/lib/prisma');


// Assurez-vous que NotificationType est bien exporté/accessible
// Si ce n'est pas le cas, il faudra l'importer depuis là où il est défini, ou le redéfinir ici.

interface NotificationCreationArgs {
    userId: number; // ID du destinataire de la notification
    type: NotificationType;
    message: string;
    link?: string;
    // relatedData?: Prisma.InputJsonValue; // Commenté pour l'instant
    triggeredByUserId?: number;
    // Champs ID pour les relations optionnelles
    // relatedLeaveId?: number; // Commenté pour l'instant
    relatedAssignmentId?: string;
    relatedRequestId?: string;
    relatedContextualMessageId?: string; // ID du message contextuel lié
}

/**
 * Crée une notification en base de données et la retourne.
 * Émet également un événement WebSocket si l'instance io est disponible.
 */
export async function createNotification(args: NotificationCreationArgs) {
    try {
        const notificationData: Prisma.NotificationCreateInput = {
            user: { connect: { id: args.userId } },
            type: args.type,
            message: args.message,
        };

        if (args.link) {
            notificationData.link = args.link;
        }

        // Gérer les relations optionnelles
        if (args.triggeredByUserId) {
            notificationData.triggeredByUser = { connect: { id: args.triggeredByUserId } };
        }
        if (args.relatedAssignmentId) {
            notificationData.relatedAssignment = { connect: { id: args.relatedAssignmentId } };
        }
        if (args.relatedRequestId) {
            notificationData.relatedRequest = { connect: { id: args.relatedRequestId } };
        }
        if (args.relatedContextualMessageId) {
            // Assurez-vous que le nom de la relation dans le schéma est bien "relatedContextualMessage"
            // et que le client Prisma est à jour.
            notificationData.relatedContextualMessage = { connect: { id: args.relatedContextualMessageId } };
        }

        const notification = await prisma.notification.create({
            data: notificationData,
            include: {
                user: { select: { id: true, login: true } },
                triggeredByUser: { select: { id: true, login: true } },
                relatedAssignment: true, // Inclure l'affectation liée si elle existe
                relatedRequest: true,    // Inclure la requête liée si elle existe
                relatedContextualMessage: { // Inclure le message contextuel lié
                    include: {
                        author: { select: { id: true, login: true } } // Inclure l'auteur du message
                    }
                },
            }
        });

        // Émettre un événement WebSocket vers l'utilisateur destinataire
        if (io && notification) {
            const roomName = socketRoomForUser(args.userId);
            io.to(roomName).emit('new_notification', notification);
            console.log(`Notification émise via WebSocket vers la salle ${roomName} pour l'utilisateur ${args.userId}`);
        } else if (!io) {
            console.warn("L'instance io de Socket.IO n'est pas disponible. Impossible d'émettre la notification WebSocket.");
        }
        // Pas besoin de 'else' pour notification null, car une erreur serait levée par prisma.notification.create

        return notification;
    } catch (error) {
        console.error("Erreur détaillée lors de la création de la notification:", error);
        // Gérer l'erreur (ex: la logger sans bloquer le flux principal, ou la relancer)
        // Pour l'instant, on retourne null, mais une gestion plus robuste est conseillée.
        return null;
    }
}

// Helper pour déterminer la "room" socket.io pour un utilisateur
function socketRoomForUser(userId: number): string {
    return `user_${userId}`;
} 