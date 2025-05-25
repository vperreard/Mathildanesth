import { NextRequest, NextResponse } from 'next/server';
// Importer Prisma Client (adapter le chemin si nécessaire)
import { prisma } from '@/lib/prisma';
// Importer les types Prisma directement
import { LeaveStatus, LeaveType as PrismaLeaveType } from '@prisma/client';
// Importer l'enum locale si elle est encore utilisée ailleurs, mais pas pour l'interaction DB
// import { LeaveType } from '@/modules/leaves/types/leave';
// Supposer que ces fonctions existent ou les commenter/supprimer
// import { calculateLeaveCountedDays } from '@/modules/leaves/services/leaveCalculator';
// import { getUserWorkSchedule } from '@/modules/profiles/services/profileService';
import {
    requireLeavePermission,
    logSecurityAction,
    AuthorizationError,
    AuthenticationError
} from '@/lib/auth/authorization';

// Interface attendue par le frontend (similaire à celle dans page.tsx)
interface UserFrontend {
    id: number;
    firstName: string;
    lastName: string;
    prenom: string;
    nom: string;
}

interface LeaveWithUserFrontend {
    id: string;
    startDate: string;
    endDate: string;
    status: LeaveStatus;
    type: PrismaLeaveType;
    typeCode?: string | null;
    reason?: string | null;
    createdAt: string;
    updatedAt: string;
    userId: number;
    user: UserFrontend;
}

// Mapping du code (string) vers l'enum Prisma LeaveType pour la compatibilité
const mapCodeToLeaveType = (code: string): PrismaLeaveType => {
    const mappings: Record<string, PrismaLeaveType> = {
        'ANNUAL': PrismaLeaveType.ANNUAL,
        'RECOVERY': PrismaLeaveType.RECOVERY,
        'TRAINING': PrismaLeaveType.TRAINING,
        'SICK': PrismaLeaveType.SICK,
        'MATERNITY': PrismaLeaveType.MATERNITY,
        'SPECIAL': PrismaLeaveType.SPECIAL,
        'UNPAID': PrismaLeaveType.UNPAID,
        'OTHER': PrismaLeaveType.OTHER,
    };

    return mappings[code] || PrismaLeaveType.OTHER;
};

/**
 * GET /api/leaves?userId=123
 * Récupère les congés d'un utilisateur.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        console.log(`[API /api/leaves] Requête GET reçue pour userId: ${userId}`);

        if (!userId) {
            return NextResponse.json({ error: 'Le paramètre userId est manquant' }, { status: 400 });
        }

        // 🔐 CORRECTION DU TODO CRITIQUE : Vérifier les permissions de l'utilisateur
        const session = await requireLeavePermission('read', userId);
        logSecurityAction(session.user.id, 'READ_LEAVES', `user:${userId}`);

        const userIdInt = parseInt(userId, 10);
        if (isNaN(userIdInt)) {
            return NextResponse.json({ error: 'Le paramètre userId doit être un nombre valide' }, { status: 400 });
        }

        // --- Logique Prisma activée ---
        const leaves = await prisma.leave.findMany({
            where: {
                userId: userIdInt,
            },
            include: { // Inclure les données utilisateur
                user: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                    }
                }
            },
            orderBy: {
                startDate: 'desc',
            },
        });

        // Fonction adaptateur pour uniformiser les champs nom/prenom
        const adaptUserFields = (user: any) => {
            if (!user) return null;

            return {
                ...user,
                firstName: user.firstName || user.prenom,
                lastName: user.lastName || user.nom,
                prenom: user.prenom || user.firstName,
                nom: user.nom || user.lastName
            };
        };

        // Mapper les résultats directement vers le type final
        const formattedLeaves: LeaveWithUserFrontend[] = leaves
            .map(leave => {
                if (!leave.user) {
                    console.error(`Utilisateur non trouvé pour le congé ID: ${leave.id}`);
                    return null; // Marquer pour filtrage
                }

                // Adapter les données utilisateur
                const adaptedUser = adaptUserFields(leave.user);

                // S'assurer que les valeurs de nom et prénom ne sont jamais undefined
                const firstName = adaptedUser.firstName || adaptedUser.prenom || '(Prénom non défini)';
                const lastName = adaptedUser.lastName || adaptedUser.nom || '(Nom non défini)';

                // Créer l'objet formaté
                const formattedLeave: LeaveWithUserFrontend = {
                    id: String(leave.id), // Convertir l'ID en string
                    startDate: leave.startDate.toISOString(),
                    endDate: leave.endDate.toISOString(),
                    // Assurer la conversion explicite vers les types enum attendus
                    status: leave.status as LeaveStatus,
                    type: leave.type as PrismaLeaveType,
                    typeCode: leave.typeCode,
                    reason: leave.reason,
                    createdAt: leave.createdAt.toISOString(),
                    updatedAt: leave.updatedAt.toISOString(),
                    userId: leave.userId,
                    user: {
                        id: adaptedUser.id,
                        firstName: firstName,
                        lastName: lastName,
                        // Ajouter également les noms originaux pour compatibilité
                        prenom: firstName,
                        nom: lastName
                    }
                };
                return formattedLeave;
            })
            .filter((leave): leave is LeaveWithUserFrontend => leave !== null); // Filtrer les nulls

        return NextResponse.json(formattedLeaves);

    } catch (error) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        if (error instanceof AuthorizationError) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        console.error(`[API /api/leaves] Erreur lors de la récupération des congés:`, error);
        return NextResponse.json({ error: 'Erreur serveur lors de la récupération des congés.' }, { status: 500 });
    }
}

/**
 * POST /api/leaves
 * Crée une nouvelle demande de congé.
 */
export async function POST(request: NextRequest) {
    try {
        // 🔐 Vérifier les permissions de création de congé
        const session = await requireLeavePermission('create');

        const body = await request.json();
        console.log('[API /leaves POST] Corps de la requête reçu:', JSON.stringify(body, null, 2));

        const { userId, startDate, endDate, typeCode, reason } = body;

        // 🔐 Vérifier que l'utilisateur peut créer ce congé (pour lui-même ou admin)
        await requireLeavePermission('create', userId);
        logSecurityAction(session.user.id, 'CREATE_LEAVE', `user:${userId}`, { typeCode, startDate, endDate });

        console.log('[API /leaves POST] Valeurs extraites:', {
            userId,
            startDate,
            endDate,
            typeCode,
            reason,
            userIdType: typeof userId,
            startDateType: typeof startDate,
            endDateType: typeof endDate,
            typeCodeType: typeof typeCode
        });

        // --- Validation des données --- 
        if (!userId || !startDate || !endDate || !typeCode) {
            console.log('[API /leaves POST] Validation échouée:', {
                hasUserId: !!userId,
                hasStartDate: !!startDate,
                hasEndDate: !!endDate,
                hasTypeCode: !!typeCode
            });
            return NextResponse.json({ error: 'Données manquantes (userId, startDate, endDate, typeCode sont requis)' }, { status: 400 });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return NextResponse.json({ error: 'Format de date invalide.' }, { status: 400 });
        }

        if (end < start) {
            return NextResponse.json({ error: 'La date de fin ne peut être antérieure à la date de début.' }, { status: 400 });
        }

        // Convertir le typeCode en type Prisma
        const leaveType = mapCodeToLeaveType(typeCode);

        const userIdInt = parseInt(String(userId), 10); // Assurer que userId est un Int
        if (isNaN(userIdInt)) {
            return NextResponse.json({ error: 'Format userId invalide.' }, { status: 400 });
        }

        // Valeur par défaut pour les jours comptés, à remplacer par le vrai calcul
        const countedDays = 1;

        // --- Création en base de données --- 
        try {
            const newLeave = await prisma.leave.create({
                data: {
                    userId: userIdInt,
                    startDate: start,
                    endDate: end,
                    // Utiliser le type convertit depuis mapCodeToLeaveType
                    type: leaveType,
                    typeCode: typeCode,
                    status: LeaveStatus.PENDING,
                    reason: reason ?? null,
                    countedDays: countedDays,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            nom: true,
                            prenom: true,
                        }
                    }
                },
            });

            console.log('[API /leaves POST] Données utilisateur récupérées:', JSON.stringify({
                userId: userIdInt,
                userIncluded: !!newLeave.user,
                userData: newLeave.user
            }, null, 2));

            // Adapter les données utilisateur pour s'assurer de la cohérence firstName/lastName
            const adaptUserFields = (user: any) => {
                if (!user) return null;

                return {
                    ...user,
                    firstName: user.firstName || user.prenom,
                    lastName: user.lastName || user.nom,
                    prenom: user.prenom || user.firstName,
                    nom: user.nom || user.lastName
                };
            };

            // S'assurer que les valeurs de nom et prénom ne sont jamais undefined
            const adaptedUser = adaptUserFields(newLeave.user);
            console.log('[API /leaves POST] Utilisateur adapté:', JSON.stringify(adaptedUser, null, 2));

            const firstName = adaptedUser?.prenom || adaptedUser?.firstName || '(Prénom non défini)';
            const lastName = adaptedUser?.nom || adaptedUser?.lastName || '(Nom non défini)';

            // Retourner une réponse formatée
            const formattedLeave = {
                id: String(newLeave.id),
                startDate: newLeave.startDate.toISOString(),
                endDate: newLeave.endDate.toISOString(),
                status: newLeave.status,
                type: newLeave.type,
                typeCode: newLeave.typeCode,
                reason: newLeave.reason,
                createdAt: newLeave.createdAt.toISOString(),
                updatedAt: newLeave.updatedAt.toISOString(),
                userId: newLeave.userId,
                user: {
                    id: adaptedUser?.id || userIdInt,
                    firstName,
                    lastName,
                    // Ajouter également les noms originaux pour compatibilité complète
                    prenom: firstName,
                    nom: lastName
                }
            };

            console.log('[API /leaves POST] Congé créé avec succès:', JSON.stringify(formattedLeave, null, 2));
            return NextResponse.json(formattedLeave, { status: 201 }); // 201 Created
        } catch (error) {
            console.error('[API /leaves POST] Erreur lors de la création du congé:', error);
            return NextResponse.json({ error: "Erreur lors de la création du congé dans la base de données." }, { status: 500 });
        }

    } catch (error) {
        console.error('[API /leaves POST] Erreur générale:', error);
        return NextResponse.json({ error: 'Erreur serveur lors de la création de la demande de congé.' }, { status: 500 });
    }
}

// Ajouter d'autres méthodes (PUT, DELETE) si nécessaire pour modifier/annuler
// export async function PUT(request: NextRequest) { ... } // ou /api/leaves/[id]
// export async function DELETE(request: NextRequest) { ... } // ou /api/leaves/[id] 