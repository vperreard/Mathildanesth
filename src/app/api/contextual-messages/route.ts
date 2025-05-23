import { NextRequest, NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client'; // Utiliser l'instance partagée
import { prisma } from '@/lib/prisma'; // Importation nommée
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Ajustez le chemin si nécessaire
import { createNotification } from '@/lib/notifications'; // Ajouté
import { NotificationType } from '@prisma/client'; // Ajouté
import { emitNewContextualMessage } from '@/lib/socket'; // Ajout pour WebSockets

// const prisma = new PrismaClient(); // Supprimé, on utilise l'instance importée

interface ContextualMessageInput {
    content: string;
    assignmentId?: string;
    contextDate?: string; // Attendu au format YYYY-MM-DD, sera converti en DateTime
    requestId?: string;
    parentId?: string;
}

// POST /api/contextual-messages
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || typeof session.user.id !== 'number' || typeof session.user.login !== 'string') {
        return NextResponse.json({ error: 'Non autorisé ou session invalide' }, { status: 401 });
    }
    const userId = session.user.id;
    const userLogin = session.user.login;

    try {
        const body = await req.json() as ContextualMessageInput;
        const { content, assignmentId, contextDate, requestId, parentId } = body;

        if (!content) {
            return NextResponse.json({ error: 'Le contenu du message est requis' }, { status: 400 });
        }

        if (!assignmentId && !contextDate && !requestId) {
            return NextResponse.json({ error: 'Un contexte (affectation, date ou requête) est requis' }, { status: 400 });
        }

        let parsedContextDate: Date | undefined = undefined;
        if (contextDate) {
            parsedContextDate = new Date(contextDate);
            if (isNaN(parsedContextDate.getTime())) {
                return NextResponse.json({ error: 'Format de date invalide pour contextDate. Utilisez YYYY-MM-DD.' }, { status: 400 });
            }
        }

        // TODO: Ajouter une vérification plus fine des permissions :
        // L'utilisateur a-t-il le droit de commenter cette affectation/date/requête ?
        // Exemple de logique à implémenter :
        // if (assignmentId) { // Vérifier si l'utilisateur peut commenter cette affectation }
        // else if (parsedContextDate) { // Vérifier si l'utilisateur peut commenter cette date }
        // else if (requestId) { // Vérifier si l'utilisateur peut commenter cette requête }
        // if (!hasPermission) return NextResponse.json({ error: 'Permissions insuffisantes pour commenter ce contexte' }, { status: 403 });

        const message = await prisma.contextualMessage.create({
            data: {
                content,
                authorId: userId,
                assignmentId: assignmentId || null,
                contextDate: parsedContextDate || null,
                requestId: requestId || null,
                parentId: parentId || null,
            },
            include: {
                author: {
                    select: { id: true, login: true, email: true },
                },
            },
        });

        // Émettre un événement WebSocket pour le nouveau message
        emitNewContextualMessage(message);

        const authorName = userLogin || 'Quelqu\'un';

        // Déclencher une notification si c'est une réponse
        if (parentId && message) {
            const parentMessage = await prisma.contextualMessage.findUnique({
                where: { id: parentId },
                select: { authorId: true }
            });

            if (parentMessage && parentMessage.authorId !== userId) { // Ne pas notifier si l'auteur se répond à lui-même
                let linkToMessage = '';
                if (message.assignmentId) {
                    linkToMessage = `/planning?assignmentId=${message.assignmentId}&contextMessageId=${message.id}`;
                } else if (message.requestId) {
                    linkToMessage = `/requetes?requestId=${message.requestId}&contextMessageId=${message.id}`;
                } else if (message.contextDate && message.contextDate instanceof Date) {
                    linkToMessage = `/calendar?date=${message.contextDate.toISOString().split('T')[0]}&contextMessageId=${message.id}`;
                }

                // Construction prudente du message de notification pour les réponses
                const replyMessagePreview = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
                const notificationForReplyMessage = `${authorName} a répondu à votre message : "${replyMessagePreview}"`;

                await createNotification({
                    userId: parentMessage.authorId,
                    type: NotificationType.NEW_CONTEXTUAL_MESSAGE,
                    message: notificationForReplyMessage,
                    link: linkToMessage,
                    triggeredByUserId: userId,
                    relatedAssignmentId: message.assignmentId || undefined,
                    relatedRequestId: message.requestId || undefined,
                    relatedContextualMessageId: message.id,
                });
            }
        } else if (message) {
            let notificationSent = false;
            // Construction prudente de l'aperçu du message pour les messages racines
            const rootMessagePreview = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');

            // 1. Gérer les notifications pour les messages racines liés à une affectation
            if (message.assignmentId) {
                const assignment = await prisma.assignment.findUnique({
                    where: { id: message.assignmentId },
                    select: {
                        userId: true,
                        // TODO: Inclure d'autres champs/relations pour identifier tous les participants d'une affectation (ex: team.members)
                    }
                });

                if (assignment && assignment.userId && assignment.userId !== userId) {
                    const linkToMessage = `/planning?assignmentId=${message.assignmentId}&contextMessageId=${message.id}`;
                    const notificationMsg = `${authorName} a posté un message sur une affectation : "${rootMessagePreview}"`;
                    await createNotification({
                        userId: assignment.userId,
                        type: NotificationType.NEW_CONTEXTUAL_MESSAGE,
                        message: notificationMsg,
                        link: linkToMessage,
                        triggeredByUserId: userId,
                        relatedAssignmentId: message.assignmentId,
                        relatedContextualMessageId: message.id,
                    });
                    notificationSent = true;
                }
                // TODO: Logique étendue pour notifier d'autres membres de l'équipe/affectation
            }

            // 2. Gérer les notifications pour les messages racines liés à une requête utilisateur
            if (message.requestId && !notificationSent) {
                const userRequest = await prisma.userRequest.findUnique({
                    where: { id: message.requestId },
                    select: { userId: true } // userId est l'initiateur de la requête
                });

                if (userRequest && userRequest.userId && userRequest.userId !== userId) {
                    const linkToMessage = `/requetes?requestId=${message.requestId}&contextMessageId=${message.id}`;
                    const notificationMsg = `${authorName} a commenté votre requête : "${rootMessagePreview}"`;
                    await createNotification({
                        userId: userRequest.userId,
                        type: NotificationType.NEW_CONTEXTUAL_MESSAGE,
                        message: notificationMsg,
                        link: linkToMessage,
                        triggeredByUserId: userId,
                        relatedRequestId: message.requestId,
                        relatedContextualMessageId: message.id,
                    });
                    // notificationSent = true; // Pas besoin si c'est le dernier bloc de notification conditionnel
                }
            }

            // 3. TODO: Gérer les notifications pour les messages racines liés à contextDate (si une logique de destinataires peut être établie)
            // 4. TODO: Gérer les mentions @utilisateur dans le contenu du message
        }

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création du message contextuel:', error);
        if (error instanceof SyntaxError && req.bodyUsed && (await req.text().catch(() => '') === '')) {
            // Gérer le cas où req.json() échoue car le corps est vide mais prétendu JSON
            return NextResponse.json({ error: 'Le corps de la requête est vide ou malformé.' }, { status: 400 });
        } else if (error instanceof SyntaxError) { // Erreur de parsing JSON
            return NextResponse.json({ error: 'Données JSON invalides' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
}

// GET /api/contextual-messages
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        // Pourrait être public pour certains contextes, ou nécessiter une simple authentification
        // Pour l'instant, on exige une session
        return NextResponse.json({
            error: 'Non autorisé: Vous devez être connecté pour accéder aux messages contextuels',
            code: 'AUTH_REQUIRED'
        }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('assignmentId');
    const contextDateStr = searchParams.get('contextDate'); // YYYY-MM-DD
    const requestId = searchParams.get('requestId');
    // const parentId = searchParams.get('parentId'); // Pour charger des fils spécifiques

    if (!assignmentId && !contextDateStr && !requestId) {
        return NextResponse.json({
            error: 'Un paramètre de contexte (assignmentId, contextDate, ou requestId) est requis',
            code: 'MISSING_CONTEXT'
        }, { status: 400 });
    }

    let contextQuery: any = {};
    if (assignmentId) {
        contextQuery.assignmentId = assignmentId;
    } else if (contextDateStr) {
        const parsedDate = new Date(contextDateStr);
        if (isNaN(parsedDate.getTime())) {
            return NextResponse.json({
                error: 'Format de date invalide pour contextDate. Utilisez YYYY-MM-DD.',
                code: 'INVALID_DATE_FORMAT'
            }, { status: 400 });
        }
        // Prisma attend une date exacte pour un champ Date, ou une plage pour DateTime
        // Pour filtrer sur un jour entier avec un champ DateTime, il faut une plage :
        // contextQuery.contextDate = {
        //   gte: new Date(parsedDate.setHours(0, 0, 0, 0)),
        //   lt: new Date(parsedDate.setHours(23, 59, 59, 999)),
        // };
        // Mais comme contextDate est @db.Date, une comparaison directe devrait suffire.
        contextQuery.contextDate = parsedDate;
    } else if (requestId) {
        contextQuery.requestId = requestId;
    }

    // Pour l'instant, on ne filtre pas par parentId pour récupérer tous les messages d'un contexte
    // La gestion des fils de discussion sera faite côté client ou dans une requête plus spécifique.

    try {
        // TODO: Ajouter une vérification des permissions de lecture pour ce contexte.
        // Similaire au POST, vérifier si l'utilisateur a le droit de voir les messages pour
        // assignmentId, contextDate, ou requestId.
        // if (assignmentId) { // Vérifier si l'utilisateur peut voir les messages de cette affectation }
        // else if (contextDateStr) { // Vérifier si l'utilisateur peut voir les messages pour cette date }
        // else if (requestId) { // Vérifier si l'utilisateur peut voir les messages pour cette requête }
        // if (!hasPermission) return NextResponse.json({ error: 'Permissions insuffisantes pour voir ces messages' }, { status: 403 });

        const messages = await prisma.contextualMessage.findMany({
            where: {
                ...contextQuery,
                parentId: null, // On récupère les messages racines (non-réponses)
            },
            include: {
                author: {
                    select: { id: true, login: true, email: true },
                },
                replies: { // Inclure les réponses directes
                    include: {
                        author: {
                            select: { id: true, login: true, email: true },
                        },
                        // On pourrait aussi inclure les réponses des réponses ici (replies: { include ...})
                        // mais cela peut devenir lourd. Une requête séparée pour les fils profonds est préférable.
                    },
                    orderBy: { createdAt: 'asc' }
                },
            },
            orderBy: { createdAt: 'desc' }, // Messages les plus récents en premier
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error('Erreur lors de la récupération des messages contextuels:', error);
        return NextResponse.json({
            error: 'Erreur interne du serveur',
            code: 'SERVER_ERROR'
        }, { status: 500 });
    }
}

// --- Helper pour la création de notifications (à placer dans un fichier de service/lib approprié) ---
/*
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client'; // Assurez-vous que l'enum est bien exportée ou accessible

interface NotificationCreationArgs {
    userId: number; // ID du destinataire de la notification
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    relatedData?: object; // Prisma attend Json, donc un objet est bien
    // Champs de relation spécifiques (optionnels)
    relatedLeaveId?: number;
    relatedAssignmentId?: string;
    // relatedRequestId?: string; // UserRequest.id est String, le modèle Notification a relatedRequestId: Int?
}

export async function createNotification(args: NotificationCreationArgs) {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId: args.userId,
                type: args.type,
                title: args.title,
                message: args.message,
                link: args.link,
                relatedData: args.relatedData || Prisma.JsonNull, // Ou undefined si le champ est optionnel et nullable
                relatedLeaveId: args.relatedLeaveId,
                relatedAssignmentId: args.relatedAssignmentId,
                // relatedRequestId: args.relatedRequestId, // Attention au type
            },
        });
        // TODO: Ici, après la création en BDD, émettre l'événement WebSocket
        // Exemple: global.io.to(socketRoomForUser(args.userId)).emit('new_notification', notification);
        return notification;
    } catch (error) {
        console.error("Erreur lors de la création de la notification en BDD:", error);
        // Gérer l'erreur (ex: la logger sans bloquer le flux principal)
        return null;
    }
}
*/ 