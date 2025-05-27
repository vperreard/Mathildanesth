import { AssignmentSwapEventType, sendAssignmentSwapNotification } from '@/lib/assignment-notification-utils';
import { PrismaClient, AssignmentSwapStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';

const prisma = prisma;

jest.mock('@/lib/prisma');

describe('Tests d\'intégration des échanges d\'affectations avec notifications', () => {
    // Configuration de test
    let initiatorUserId: number;
    let targetUserId: number;
    let proposedAssignmentId: string;
    let requestedAssignmentId: string;
    let swapRequestId: string;

    // Nettoyage avant les tests
    beforeAll(async () => {
        // Créer deux utilisateurs de test
        const user1 = await prisma.user.create({
            data: {
                email: `test-initiator-${uuidv4()}@example.com`,
                password: 'password123',
                firstName: 'Test',
                lastName: 'Initiator',
                role: 'UTILISATEUR'
            }
        });

        const user2 = await prisma.user.create({
            data: {
                email: `test-target-${uuidv4()}@example.com`,
                password: 'password123',
                firstName: 'Test',
                lastName: 'Target',
                role: 'UTILISATEUR'
            }
        });

        initiatorUserId = user1.id;
        targetUserId = user2.id;

        // Créer deux affectations
        const assignment1 = await prisma.assignment.create({
            data: {
                userId: initiatorUserId,
                date: new Date(),
                type: 'REGULAR',
                shift: 'MORNING',
                confirmed: true
            }
        });

        const assignment2 = await prisma.assignment.create({
            data: {
                userId: targetUserId,
                date: new Date(),
                type: 'REGULAR',
                shift: 'AFTERNOON',
                confirmed: true
            }
        });

        proposedAssignmentId = assignment1.id;
        requestedAssignmentId = assignment2.id;
    });

    // Nettoyage après les tests
    afterAll(async () => {
        // Suppression des données de test
        await prisma.notification.deleteMany({
            where: {
                OR: [
                    { userId: initiatorUserId },
                    { userId: targetUserId }
                ]
            }
        });

        await prisma.assignmentSwapRequest.deleteMany({
            where: {
                OR: [
                    { initiatorUserId },
                    { targetUserId }
                ]
            }
        });

        await prisma.assignment.deleteMany({
            where: {
                id: { in: [proposedAssignmentId, requestedAssignmentId] }
            }
        });

        await prisma.user.deleteMany({
            where: {
                id: { in: [initiatorUserId, targetUserId] }
            }
        });

        await prisma.$disconnect();
    });

    test('Devrait créer une demande d\'échange et envoyer une notification', async () => {
        // Créer une demande d'échange
        const swapRequest = await prisma.assignmentSwapRequest.create({
            data: {
                initiatorUserId,
                proposedAssignmentId,
                targetUserId,
                requestedAssignmentId,
                status: AssignmentSwapStatus.PENDING,
                message: 'Demande d\'échange de test'
            }
        });

        swapRequestId = swapRequest.id;

        // Envoyer une notification
        const notification = await sendAssignmentSwapNotification(
            targetUserId,
            AssignmentSwapEventType.SWAP_REQUESTED,
            swapRequestId,
            initiatorUserId
        );

        // Vérifier la notification
        expect(notification).not.toBeNull();
        if (notification) {
            expect(notification.userId).toBe(targetUserId);
            expect(notification.triggeredByUserId).toBe(initiatorUserId);
            expect(notification.relatedRequestId).toBe(swapRequestId);
            expect(notification.isRead).toBe(false);
        }

        // Récupérer la notification depuis la base de données
        const savedNotification = await prisma.notification.findFirst({
            where: {
                userId: targetUserId,
                relatedRequestId: swapRequestId
            }
        });

        expect(savedNotification).not.toBeNull();
        expect(savedNotification?.type).toBe('ASSIGNMENT_SWAP_REQUEST_RECEIVED');
    });

    test('Devrait accepter une demande d\'échange et envoyer une notification', async () => {
        // Mettre à jour le statut de la demande d'échange
        const updatedSwapRequest = await prisma.assignmentSwapRequest.update({
            where: { id: swapRequestId },
            data: {
                status: AssignmentSwapStatus.ACCEPTED,
                responseMessage: 'Demande acceptée'
            }
        });

        expect(updatedSwapRequest.status).toBe(AssignmentSwapStatus.ACCEPTED);

        // Envoyer une notification à l'initiateur
        const notification = await sendAssignmentSwapNotification(
            initiatorUserId,
            AssignmentSwapEventType.SWAP_ACCEPTED,
            swapRequestId,
            targetUserId
        );

        // Vérifier la notification
        expect(notification).not.toBeNull();
        if (notification) {
            expect(notification.userId).toBe(initiatorUserId);
            expect(notification.triggeredByUserId).toBe(targetUserId);
            expect(notification.relatedRequestId).toBe(swapRequestId);
        }

        // Récupérer la notification depuis la base de données
        const savedNotification = await prisma.notification.findFirst({
            where: {
                userId: initiatorUserId,
                relatedRequestId: swapRequestId,
                type: 'ASSIGNMENT_SWAP_REQUEST_ACCEPTED'
            }
        });

        expect(savedNotification).not.toBeNull();
    });

    test('Devrait marquer une notification comme lue', async () => {
        // Récupérer l'ID de la notification
        const notification = await prisma.notification.findFirst({
            where: {
                userId: targetUserId,
                relatedRequestId: swapRequestId
            }
        });

        expect(notification).not.toBeNull();
        if (!notification) return;

        // Marquer comme lue
        await prisma.notification.update({
            where: { id: notification.id },
            data: { isRead: true }
        });

        // Vérifier que la notification est bien marquée comme lue
        const updatedNotification = await prisma.notification.findUnique({
            where: { id: notification.id }
        });

        expect(updatedNotification).not.toBeNull();
        expect(updatedNotification?.isRead).toBe(true);
    });
}); 