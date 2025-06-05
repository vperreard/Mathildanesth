import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
// import { prisma } from '@/lib/prisma'; // Utiliser l'instance partagée
import { prisma } from '@/lib/prisma'; // Importation nommée
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/authOptions'; // Ajustez le chemin si nécessaire
import { createNotification } from '@/lib/notifications'; // Ajouté
import { NotificationType } from '@prisma/client'; // Ajouté
import { emitNewContextualMessage } from '@/lib/socket'; // Ajout pour WebSockets
import {
  requireMessagePermission,
  logSecurityAction,
  AuthorizationError,
  AuthenticationError,
} from '@/lib/auth/authorization';

// const prisma = prisma; // Supprimé, on utilise l'instance importée

interface ContextualMessageInput {
  content: string;
  assignmentId?: string;
  contextDate?: string; // Attendu au format YYYY-MM-DD, sera converti en DateTime
  requestId?: string;
  parentId?: string;
}

// Fonction pour vérifier les permissions contextuelles
async function verifyContextPermissions(
  userId: number,
  assignmentId?: string,
  contextDate?: string,
  requestId?: string,
  action: 'read' | 'write' = 'write'
): Promise<boolean> {
  try {
    // Récupérer l'utilisateur pour vérifier son rôle
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return false;
    }

    // Les admins ont accès à tout
    const isAdmin = ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(user.role);
    if (isAdmin) {
      return true;
    }

    if (assignmentId) {
      // Vérifier si l'utilisateur peut accéder à cette affectation
      const attribution = await prisma.attribution.findUnique({
        where: { id: assignmentId },
        select: { userId: true },
      });

      // L'utilisateur peut accéder à ses propres affectations
      return attribution?.userId === userId;
    }

    if (requestId) {
      // Vérifier si l'utilisateur peut accéder à cette requête
      const userRequest = await prisma.userRequest.findUnique({
        where: { id: requestId },
        select: { userId: true },
      });

      // L'utilisateur peut accéder à ses propres requêtes
      return userRequest?.userId === userId;
    }

    if (contextDate) {
      // Pour les messages liés à une date
      if (action === 'read') {
        // Lecture : tous les utilisateurs peuvent lire les messages publics d'une date
        return true;
      } else {
        // Écriture : seuls les utilisateurs ayant une affectation ce jour peuvent écrire
        const hasAssignmentOnDate = await prisma.attribution.findFirst({
          where: {
            userId: userId,
            startDate: {
              lte: new Date(contextDate),
            },
            endDate: {
              gte: new Date(contextDate),
            },
          },
        });
        return !!hasAssignmentOnDate;
      }
    }

    return false;
  } catch (error) {
    logger.error('Erreur lors de la vérification des permissions contextuelles:', error);
    return false;
  }
}

// POST /api/contextual-messages
export async function POST(req: NextRequest) {
  try {
    // 🔐 Vérification des permissions de création de message
    const session = await requireMessagePermission('create');
    const userId = session.user.id;
    const userLogin = session.user.login;

    const body = (await req.json()) as ContextualMessageInput;
    const { content, assignmentId, contextDate, requestId, parentId } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Le contenu du message est requis' }, { status: 400 });
    }

    // Validation : au moins un contexte doit être fourni
    if (!assignmentId && !contextDate && !requestId && !parentId) {
      return NextResponse.json(
        {
          error:
            'Un contexte (assignmentId, contextDate, requestId, ou parentId) est requis pour créer un message',
        },
        { status: 400 }
      );
    }

    let parsedContextDate: Date | null = null;
    if (contextDate) {
      parsedContextDate = new Date(contextDate);
      if (isNaN(parsedContextDate.getTime())) {
        return NextResponse.json(
          { error: 'Format de date invalide pour contextDate. Utilisez YYYY-MM-DD.' },
          { status: 400 }
        );
      }
    }

    // Vérifications de permissions fines
    const hasPermission = await verifyContextPermissions(
      userId,
      assignmentId,
      contextDate,
      requestId,
      'write'
    );
    if (!hasPermission && !['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(session.user.role)) {
      logSecurityAction(
        session.user.id,
        'DENIED_CONTEXTUAL_MESSAGE_CREATE',
        `context:${assignmentId || contextDate || requestId}`
      );
      return NextResponse.json(
        { error: 'Permissions insuffisantes pour commenter ce contexte' },
        { status: 403 }
      );
    }

    logSecurityAction(
      session.user.id,
      'CREATE_CONTEXTUAL_MESSAGE',
      `context:${assignmentId || contextDate || requestId}`
    );

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

    const authorName = userLogin || "Quelqu'un";

    // Déclencher une notification si c'est une réponse
    if (parentId && message) {
      const parentMessage = await prisma.contextualMessage.findUnique({
        where: { id: parentId },
        select: { authorId: true },
      });

      if (parentMessage && parentMessage.authorId !== userId) {
        // Ne pas notifier si l'auteur se répond à lui-même
        let linkToMessage = '';
        if (message.assignmentId) {
          linkToMessage = `/planning?assignmentId=${message.assignmentId}&contextMessageId=${message.id}`;
        } else if (message.requestId) {
          linkToMessage = `/requetes?requestId=${message.requestId}&contextMessageId=${message.id}`;
        } else if (message.contextDate && message.contextDate instanceof Date) {
          linkToMessage = `/calendrier?date=${message.contextDate.toISOString().split('T')[0]}&contextMessageId=${message.id}`;
        }

        // Construction prudente du message de notification pour les réponses
        const replyMessagePreview =
          message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
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
      const rootMessagePreview =
        message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');

      // 1. Gérer les notifications pour les messages racines liés à une affectation
      if (message.assignmentId) {
        const attribution = await prisma.attribution.findUnique({
          where: { id: message.assignmentId },
          select: {
            userId: true,
            // Possibilité d'inclure d'autres champs/relations pour identifier tous les participants d'une affectation
          },
        });

        if (attribution && attribution.userId && attribution.userId !== userId) {
          const linkToMessage = `/planning?assignmentId=${message.assignmentId}&contextMessageId=${message.id}`;
          const notificationMsg = `${authorName} a posté un message sur une affectation: "${rootMessagePreview}"`;
          await createNotification({
            userId: attribution.userId,
            type: NotificationType.NEW_CONTEXTUAL_MESSAGE,
            message: notificationMsg,
            link: linkToMessage,
            triggeredByUserId: userId,
            relatedAssignmentId: message.assignmentId,
            relatedContextualMessageId: message.id,
          });
          notificationSent = true;
        }
        // Logique étendue pour notifier d'autres membres de l'équipe/affectation si nécessaire
      }

      // 2. Gérer les notifications pour les messages racines liés à une requête utilisateur
      if (message.requestId && !notificationSent) {
        const userRequest = await prisma.userRequest.findUnique({
          where: { id: message.requestId },
          select: { userId: true }, // userId est l'initiateur de la requête
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
        }
      }

      // 3. Gérer les notifications pour les messages racines liés à contextDate (logique future)
      // 4. Gérer les mentions @utilisateur dans le contenu du message (logique future)
    }

    // Ici, après la création en BDD, émettre l'événement WebSocket
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    logger.error('Erreur lors de la création du message contextuel:', error);
    if (error instanceof SyntaxError && req.bodyUsed && (await req.text().catch(() => '')) === '') {
      return NextResponse.json(
        { error: 'Le corps de la requête est vide ou malformé.' },
        { status: 400 }
      );
    } else if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Données JSON invalides' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

// GET /api/contextual-messages
export async function GET(req: NextRequest) {
  try {
    // 🔐 Vérification des permissions de lecture de messages
    const session = await requireMessagePermission('read');
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('assignmentId');
    const contextDateStr = searchParams.get('contextDate'); // YYYY-MM-DD
    const requestId = searchParams.get('requestId');

    if (!assignmentId && !contextDateStr && !requestId) {
      return NextResponse.json(
        {
          error: 'Un paramètre de contexte (assignmentId, contextDate, ou requestId) est requis',
          code: 'MISSING_CONTEXT',
        },
        { status: 400 }
      );
    }

    // Vérifications de permissions de lecture
    const hasPermission = await verifyContextPermissions(
      userId,
      assignmentId || undefined,
      contextDateStr || undefined,
      requestId || undefined,
      'read'
    );
    if (!hasPermission && !['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(session.user.role)) {
      logSecurityAction(
        session.user.id,
        'DENIED_CONTEXTUAL_MESSAGE_READ',
        `context:${assignmentId || contextDateStr || requestId}`
      );
      return NextResponse.json(
        { error: 'Permissions insuffisantes pour voir ces messages' },
        { status: 403 }
      );
    }

    logSecurityAction(
      session.user.id,
      'READ_CONTEXTUAL_MESSAGES',
      `context:${assignmentId || contextDateStr || requestId}`
    );

    const contextQuery: any = {};
    if (assignmentId) {
      contextQuery.assignmentId = assignmentId;
    } else if (contextDateStr) {
      const parsedDate = new Date(contextDateStr);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          {
            error: 'Format de date invalide pour contextDate. Utilisez YYYY-MM-DD.',
            code: 'INVALID_DATE_FORMAT',
          },
          { status: 400 }
        );
      }
      contextQuery.contextDate = parsedDate;
    } else if (requestId) {
      contextQuery.requestId = requestId;
    }

    const messages = await prisma.contextualMessage.findMany({
      where: {
        ...contextQuery,
        parentId: null, // On récupère les messages racines (non-réponses)
      },
      include: {
        author: {
          select: { id: true, login: true, email: true },
        },
        replies: {
          // Inclure les réponses directes
          include: {
            author: {
              select: { id: true, login: true, email: true },
            },
            // On pourrait aussi inclure les réponses des réponses ici (replies: { include ...})
            // mais cela peut devenir lourd. Une requête séparée pour les fils profonds est préférable.
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' }, // Messages les plus récents en premier
    });

    return NextResponse.json(messages);
  } catch (error) {
    logger.error('Erreur lors de la récupération des messages contextuels:', error);
    return NextResponse.json(
      {
        error: 'Erreur interne du serveur',
        code: 'SERVER_ERROR',
      },
      { status: 500 }
    );
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
    // relatedRequestId?: string; // UserRequest.id est String, le template Notification a relatedRequestId: Int?
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
        logger.error("Erreur lors de la création de la notification en BDD:", error);
        // Gérer l'erreur (ex: la logger sans bloquer le flux principal)
        return null;
    }
}
*/
