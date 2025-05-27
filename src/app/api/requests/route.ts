import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma, Role } from '@prisma/client';
import { verifyAuthToken, getAuthToken, UserJWTPayload } from '@/lib/auth-utils';

jest.mock('@/lib/prisma');


const prisma = prisma;

// Définir les statuts de requête utilisateur puisque l'importation ne fonctionne pas
enum UserRequestStatus {
    SUBMITTED = 'SUBMITTED',
    IN_PROGRESS = 'IN_PROGRESS',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    COMPLETED = 'COMPLETED',
    CANCELLED_BY_USER = 'CANCELLED_BY_USER'
}

// Récupérer les requêtes (pour l'utilisateur ou toutes pour l'admin)
export async function GET(req: NextRequest) {
    try {
        const token = await getAuthToken();
        if (!token) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const authResult = await verifyAuthToken(token);
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        const payload = authResult.user as Partial<UserJWTPayload>;
        let userIdNumber: number | undefined;

        if (payload.userId !== undefined) {
            userIdNumber = typeof payload.userId === 'string'
                ? parseInt(payload.userId, 10)
                : payload.userId;
        }

        if (userIdNumber === undefined || isNaN(userIdNumber)) {
            return NextResponse.json({ error: 'ID utilisateur invalide dans le token' }, { status: 400 });
        }

        const isAdmin = payload.role === 'ADMIN';
        const url = new URL(req.url);

        // Paramètres de filtrage
        const requestId = url.searchParams.get('id');
        const userId = url.searchParams.get('userId');
        const status = url.searchParams.get('status') as UserRequestStatus | null;
        const requestTypeId = url.searchParams.get('requestTypeId');
        const assignedToId = url.searchParams.get('assignedToId');

        // Si on demande une requête spécifique par ID
        if (requestId) {
            const request = await prisma.$queryRaw`
        SELECT ur.*, 
               u.id as "userId", u.nom as "userNom", u.prenom as "userPrenom", u.email as "userEmail", u.professional_role as "userRole",
               rt.id as "typeId", rt.name as "typeName", rt.description as "typeDescription",
               a.id as "assignedId", a.nom as "assignedNom", a.prenom as "assignedPrenom", a.email as "assignedEmail"
        FROM user_requests ur
        JOIN users u ON ur.user_id = u.id
        JOIN request_types rt ON ur.request_type_id = rt.id
        LEFT JOIN users a ON ur.assigned_to_id = a.id
        WHERE ur.id = ${requestId}
      `;

            // Formatage de la réponse
            const formattedRequest = Array.isArray(request) && request.length > 0 ? formatUserRequest(request[0]) : null;

            // Vérifier que l'utilisateur a le droit de voir cette requête
            if (!formattedRequest || (!isAdmin && formattedRequest.userId !== userIdNumber)) {
                return NextResponse.json({ error: 'Requête non trouvée ou accès non autorisé' }, { status: 404 });
            }

            return NextResponse.json(formattedRequest);
        }

        // Construction du filtre pour la requête SQL
        let whereClause = '';
        const params: any[] = [];

        // Si non admin, limiter aux requêtes de l'utilisateur
        if (!isAdmin) {
            whereClause = 'WHERE ur.user_id = ?';
            params.push(userIdNumber);
        } else {
            // Pour les admins, filtres supplémentaires optionnels
            const conditions: string[] = [];

            if (userId) {
                conditions.push('ur.user_id = ?');
                params.push(parseInt(userId, 10));
            }

            if (assignedToId) {
                conditions.push('ur.assigned_to_id = ?');
                params.push(parseInt(assignedToId, 10));
            }

            if (conditions.length > 0) {
                whereClause = 'WHERE ' + conditions.join(' AND ');
            }
        }

        // Filtres communs (admin et utilisateur normal)
        if (status) {
            if (whereClause === '') {
                whereClause = 'WHERE ur.status = ?';
            } else {
                whereClause += ' AND ur.status = ?';
            }
            params.push(status);
        }

        if (requestTypeId) {
            if (whereClause === '') {
                whereClause = 'WHERE ur.request_type_id = ?';
            } else {
                whereClause += ' AND ur.request_type_id = ?';
            }
            params.push(requestTypeId);
        }

        // Exécuter la requête SQL
        const rawRequests = await prisma.$queryRaw(
            Prisma.sql`
        SELECT ur.*, 
               u.id as "userId", u.nom as "userNom", u.prenom as "userPrenom", u.email as "userEmail", u.professional_role as "userRole",
               rt.id as "typeId", rt.name as "typeName", rt.description as "typeDescription",
               a.id as "assignedId", a.nom as "assignedNom", a.prenom as "assignedPrenom", a.email as "assignedEmail"
        FROM user_requests ur
        JOIN users u ON ur.user_id = u.id
        JOIN request_types rt ON ur.request_type_id = rt.id
        LEFT JOIN users a ON ur.assigned_to_id = a.id
        ${Prisma.raw(whereClause)}
        ORDER BY ur.updated_at DESC, ur.created_at DESC
      `
        );

        // Formater les résultats
        const formattedRequests = Array.isArray(rawRequests)
            ? rawRequests.map(request => formatUserRequest(request))
            : [];

        return NextResponse.json(formattedRequests);
    } catch (error) {
        console.error('Erreur lors de la récupération des requêtes:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// Helper pour formater les résultats bruts de requête SQL
function formatUserRequest(raw: any) {
    return {
        id: raw.id,
        title: raw.title,
        description: raw.description,
        status: raw.status,
        adminNotes: raw.admin_notes,
        userId: raw.user_id,
        requestTypeId: raw.request_type_id,
        assignedToId: raw.assigned_to_id,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
        resolvedAt: raw.resolved_at,
        user: raw.userId ? {
            id: raw.userId,
            nom: raw.userNom,
            prenom: raw.userPrenom,
            email: raw.userEmail,
            professionalRole: raw.userRole
        } : null,
        requestType: raw.typeId ? {
            id: raw.typeId,
            name: raw.typeName,
            description: raw.typeDescription
        } : null,
        assignedTo: raw.assignedId ? {
            id: raw.assignedId,
            nom: raw.assignedNom,
            prenom: raw.assignedPrenom,
            email: raw.assignedEmail
        } : null
    };
}

// Créer une nouvelle requête utilisateur
export async function POST(req: NextRequest) {
    try {
        const token = await getAuthToken();
        if (!token) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const authResult = await verifyAuthToken(token);
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        const payload = authResult.user as Partial<UserJWTPayload>;
        let userIdNumber: number | undefined;

        if (payload.userId !== undefined) {
            userIdNumber = typeof payload.userId === 'string'
                ? parseInt(payload.userId, 10)
                : payload.userId;
        }

        if (userIdNumber === undefined || isNaN(userIdNumber)) {
            return NextResponse.json({ error: 'ID utilisateur invalide dans le token' }, { status: 400 });
        }

        const { title, description, requestTypeId } = await req.json();

        // Validation des champs obligatoires
        if (!title || !description || !requestTypeId) {
            return NextResponse.json({
                error: 'Données manquantes. Le titre, la description et le type de requête sont obligatoires'
            }, { status: 400 });
        }

        // Vérifier si le type de requête existe et est actif
        const requestType = await prisma.$queryRaw`
      SELECT * FROM request_types WHERE id = ${requestTypeId}
    `;

        if (!Array.isArray(requestType) || requestType.length === 0) {
            return NextResponse.json({ error: 'Type de requête invalide ou inexistant' }, { status: 400 });
        }

        if (!requestType[0].is_active) {
            return NextResponse.json({ error: 'Ce type de requête n\'est plus disponible' }, { status: 400 });
        }

        // Créer la requête
        const result = await prisma.$executeRaw`
      INSERT INTO user_requests (id, title, description, user_id, request_type_id, status, created_at, updated_at)
      VALUES (gen_random_uuid(), ${title}, ${description}, ${userIdNumber}, ${requestTypeId}, ${UserRequestStatus.SUBMITTED}, NOW(), NOW())
      RETURNING *
    `;

        // Récupérer la requête nouvellement créée
        const [newRequest] = await prisma.$queryRaw`
      SELECT ur.*, 
             u.id as "userId", u.nom as "userNom", u.prenom as "userPrenom", u.email as "userEmail",
             rt.id as "typeId", rt.name as "typeName", rt.description as "typeDescription"
      FROM user_requests ur
      JOIN users u ON ur.user_id = u.id
      JOIN request_types rt ON ur.request_type_id = rt.id
      WHERE ur.user_id = ${userIdNumber}
      ORDER BY ur.created_at DESC
      LIMIT 1
    `;

        const formattedRequest = formatUserRequest(newRequest);

        // Créer une notification pour les administrateurs
        const admins = await prisma.$queryRaw`
      SELECT id FROM users WHERE role = 'ADMIN' AND actif = true
    `;

        if (Array.isArray(admins) && admins.length > 0) {
            for (const admin of admins) {
                // Vérifier que formattedRequest.user n'est pas null avant d'y accéder
                const userName = formattedRequest.user
                    ? `${formattedRequest.user.prenom} ${formattedRequest.user.nom}`
                    : 'Utilisateur inconnu';

                await prisma.notification.create({
                    data: {
                        userId: admin.id,
                        type: 'REQUESTS',
                        title: 'Nouvelle requête utilisateur',
                        message: `Une nouvelle requête "${title}" a été soumise par ${userName}`,
                        read: false,
                        createdBy: userIdNumber
                    }
                });
            }
        }

        return NextResponse.json(formattedRequest, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création de la requête:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// Mettre à jour une requête (statut, notes, etc.)
export async function PATCH(req: NextRequest) {
    try {
        const token = await getAuthToken();
        if (!token) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const authResult = await verifyAuthToken(token);
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        const payload = authResult.user as Partial<UserJWTPayload>;
        let userIdNumber: number | undefined;

        if (payload.userId !== undefined) {
            userIdNumber = typeof payload.userId === 'string'
                ? parseInt(payload.userId, 10)
                : payload.userId;
        }

        if (userIdNumber === undefined || isNaN(userIdNumber)) {
            return NextResponse.json({ error: 'ID utilisateur invalide dans le token' }, { status: 400 });
        }

        const isAdmin = payload.role === 'ADMIN';
        const { id, status, adminNotes, assignedToId } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'L\'ID de la requête est requis' }, { status: 400 });
        }

        // Récupérer la requête existante
        const existingRequestResult = await prisma.$queryRaw`
      SELECT ur.*, 
             u.id as "userId", u.nom as "userNom", u.prenom as "userPrenom", u.email as "userEmail",
             rt.id as "typeId", rt.name as "typeName", rt.description as "typeDescription"
      FROM user_requests ur
      JOIN users u ON ur.user_id = u.id
      JOIN request_types rt ON ur.request_type_id = rt.id
      WHERE ur.id = ${id}
    `;

        if (!Array.isArray(existingRequestResult) || existingRequestResult.length === 0) {
            return NextResponse.json({ error: 'Requête non trouvée' }, { status: 404 });
        }

        const existingRequest = existingRequestResult[0];

        // Vérifier les permissions
        const isOwner = existingRequest.user_id === userIdNumber;

        if (!isAdmin && !isOwner) {
            return NextResponse.json({ error: 'Vous n\'êtes pas autorisé à modifier cette requête' }, { status: 403 });
        }

        // Un utilisateur normal ne peut qu'annuler sa propre requête
        if (!isAdmin && status && status !== UserRequestStatus.CANCELLED_BY_USER) {
            return NextResponse.json({
                error: 'Vous ne pouvez que annuler votre requête, pas changer son statut'
            }, { status: 403 });
        }

        // Un utilisateur normal ne peut annuler que si la requête est en attente ou en cours
        if (!isAdmin &&
            status === UserRequestStatus.CANCELLED_BY_USER &&
            existingRequest.status !== UserRequestStatus.SUBMITTED &&
            existingRequest.status !== UserRequestStatus.IN_PROGRESS) {
            return NextResponse.json({
                error: 'Vous ne pouvez pas annuler une requête qui a déjà été traitée (approuvée, rejetée ou terminée)'
            }, { status: 403 });
        }

        // Préparation des données à mettre à jour
        const updateClauses: string[] = [];
        const updateParams: any[] = [];

        // Gestion du statut et de la date de résolution
        if (status) {
            updateClauses.push('status = ?');
            updateParams.push(status);

            // Si le statut passe à terminé, rejeté ou approuvé, mettre à jour la date de résolution
            if (
                status === UserRequestStatus.COMPLETED ||
                status === UserRequestStatus.REJECTED ||
                status === UserRequestStatus.APPROVED
            ) {
                updateClauses.push('resolved_at = NOW()');
            }
        }

        // Seul un admin peut ajouter des notes d'administration
        if (isAdmin && adminNotes !== undefined) {
            updateClauses.push('admin_notes = ?');
            updateParams.push(adminNotes);
        }

        // Seul un admin peut assigner la requête à quelqu'un
        if (isAdmin && assignedToId !== undefined) {
            if (assignedToId === null) {
                updateClauses.push('assigned_to_id = NULL');
            } else {
                const assignedToIdNumber = parseInt(assignedToId.toString(), 10);
                if (isNaN(assignedToIdNumber)) {
                    return NextResponse.json({ error: 'ID de l\'assigné invalide' }, { status: 400 });
                }
                updateClauses.push('assigned_to_id = ?');
                updateParams.push(assignedToIdNumber);
            }
        }

        // Mise à jour de la date de modification
        updateClauses.push('updated_at = NOW()');

        // Si aucune mise à jour à effectuer, renvoyer la requête existante
        if (updateClauses.length <= 1) { // Juste updated_at
            const formattedRequest = formatUserRequest(existingRequest);
            return NextResponse.json(formattedRequest);
        }

        // Construire la requête de mise à jour SQL
        const updateQuery = `
      UPDATE user_requests
      SET ${updateClauses.join(', ')}
      WHERE id = ?
      RETURNING *
    `;
        updateParams.push(id);

        // Exécuter la mise à jour
        await prisma.$executeRaw(Prisma.raw(updateQuery), ...updateParams);

        // Récupérer la requête mise à jour
        const updatedRequestResult = await prisma.$queryRaw`
      SELECT ur.*, 
             u.id as "userId", u.nom as "userNom", u.prenom as "userPrenom", u.email as "userEmail",
             rt.id as "typeId", rt.name as "typeName", rt.description as "typeDescription",
             a.id as "assignedId", a.nom as "assignedNom", a.prenom as "assignedPrenom", a.email as "assignedEmail"
      FROM user_requests ur
      JOIN users u ON ur.user_id = u.id
      JOIN request_types rt ON ur.request_type_id = rt.id
      LEFT JOIN users a ON ur.assigned_to_id = a.id
      WHERE ur.id = ${id}
    `;

        if (!Array.isArray(updatedRequestResult) || updatedRequestResult.length === 0) {
            return NextResponse.json({ error: 'Erreur lors de la mise à jour de la requête' }, { status: 500 });
        }

        const updatedRequest = formatUserRequest(updatedRequestResult[0]);

        // Créer une notification pour le propriétaire de la requête si son statut a changé
        // et que ce n'est pas lui qui fait la modification
        if (status && !isOwner) {
            let notificationMessage = '';

            switch (status) {
                case UserRequestStatus.IN_PROGRESS:
                    notificationMessage = `Votre requête "${updatedRequest.title}" est en cours de traitement.`;
                    break;
                case UserRequestStatus.APPROVED:
                    notificationMessage = `Votre requête "${updatedRequest.title}" a été approuvée.`;
                    break;
                case UserRequestStatus.REJECTED:
                    notificationMessage = `Votre requête "${updatedRequest.title}" a été rejetée.`;
                    break;
                case UserRequestStatus.COMPLETED:
                    notificationMessage = `Votre requête "${updatedRequest.title}" a été traitée et est maintenant terminée.`;
                    break;
            }

            if (notificationMessage) {
                await prisma.notification.create({
                    data: {
                        userId: existingRequest.user_id,
                        type: 'REQUESTS',
                        title: 'Mise à jour de votre requête',
                        message: notificationMessage,
                        read: false,
                        createdBy: userIdNumber
                    }
                });
            }
        }

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la requête:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
} 