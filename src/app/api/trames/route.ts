import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { getAuthTokenServer, checkUserRole } from '@/lib/auth-server-utils';
import type { UserRole as AuthUserRole } from '@/lib/auth-client-utils';
import { headers } from 'next/headers';

const ALLOWED_ROLES_TRAMES: AuthUserRole[] = ['ADMIN_TOTAL', 'ADMIN_PARTIEL']; // SUPER_ADMIN retiré

// GET /api/trameModeles - Récupérer toutes les trameModeles
export async function GET(request: NextRequest) {
    try {
        const token = await getAuthTokenServer();
        const { hasRequiredRole, user, error: authError } = await checkUserRole(ALLOWED_ROLES_TRAMES, token);

        if (!hasRequiredRole) {
            if (process.env.NODE_ENV === 'development') {
                const headersList = await headers();
                const devUserRole = headersList.get('x-user-role');
                if (devUserRole && ALLOWED_ROLES_TRAMES.includes(devUserRole as AuthUserRole)) {
                    logger.info('[DEV MODE] Authentification par en-tête pour GET /api/trameModeles après échec du token');
                } else {
                    return NextResponse.json({ error: authError || 'Non autorisé' }, { status: 401 });
                }
            } else {
                return NextResponse.json({ error: authError || 'Non autorisé' }, { status: 401 });
            }
        }

        const trameModeles = await prisma.trameAffectation.findMany({
            orderBy: { updatedAt: 'desc' },
            include: {
                periods: {
                    include: {
                        attributions: {
                            include: {
                                posts: true
                            }
                        }
                    }
                },
                user: {
                    select: {
                        nom: true, // Changé de name à nom
                        prenom: true, // Ajout de prenom
                        email: true
                    }
                }
            }
        });

        return NextResponse.json(trameModeles);
    } catch (error) {
        logger.error('Erreur lors de la récupération des trames:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la récupération des trameModeles' },
            { status: 500 }
        );
    }
}

// POST /api/trameModeles - Créer une nouvelle trameModele
export async function POST(request: NextRequest) {
    try {
        const token = await getAuthTokenServer();
        const { hasRequiredRole, user, error: authError } = await checkUserRole(ALLOWED_ROLES_TRAMES, token);

        if (!hasRequiredRole) {
            if (process.env.NODE_ENV === 'development') {
                const headersList = await headers();
                const devUserRole = headersList.get('x-user-role');
                if (devUserRole && ALLOWED_ROLES_TRAMES.includes(devUserRole as AuthUserRole)) {
                    logger.info('[DEV MODE] Authentification par en-tête pour POST /api/trameModeles après échec du token');
                } else {
                    return NextResponse.json({ error: authError || 'Non autorisé' }, { status: 401 });
                }
            } else {
                return NextResponse.json({ error: authError || 'Non autorisé' }, { status: 401 });
            }
        }

        const body = await request.json();

        // Assurer que startDate est une date valide
        const startDate = body.startDate ? new Date(body.startDate) : undefined;
        if (!startDate || isNaN(startDate.getTime())) {
            return NextResponse.json({ error: 'Le champ startDate est requis et doit être une date valide.' }, { status: 400 });
        }

        const endDate = body.endDate ? new Date(body.endDate) : undefined;
        if (endDate && isNaN(endDate.getTime())) {
            return NextResponse.json({ error: 'Le champ endDate doit être une date valide si fourni.' }, { status: 400 });
        }

        const trameId = uuidv4(); // Gardé car le template utilise @id @default(cuid()) mais on peut vouloir forcer l'ID

        const createData: any = {
            id: trameId, // ou laisser cuid() générer
            name: body.name,
            description: body.description,
            isActive: body.isActive ?? true, // Valeur par défaut si non fournie
            startDate: startDate,
            ...(endDate && { endDate: endDate }), // Inclure seulement si endDate est valide
            periods: {
                create: body.periods.map((period: any) => {
                    const periodId = uuidv4();
                    return {
                        id: periodId,
                        name: period.name,
                        startTime: period.startTime,
                        endTime: period.endTime,
                        color: period.color,
                        isActive: period.isActive,
                        // isLocked: period.isLocked, // isLocked n'est pas sur TramePeriod d'après le schéma récent
                        attributions: {
                            create: period.attributions.map((attribution: any) => {
                                const assignmentId = uuidv4();
                                return {
                                    id: assignmentId,
                                    type: attribution.type, // Assumant que 'type' est correct pour TrameAssignment
                                    name: attribution.name, // Assumant que 'name' est correct pour TrameAssignment
                                    duration: attribution.duration,
                                    isActive: attribution.isActive,
                                    posts: {
                                        create: attribution.posts.map((post: any) => {
                                            const postId = uuidv4();
                                            return {
                                                id: postId,
                                                type: post.type, // Assumant que 'type' est correct pour TramePost
                                                name: post.name, // Assumant que 'name' est correct pour TramePost
                                                required: post.required,
                                                maxCount: post.maxCount,
                                                minCount: post.minCount
                                            };
                                        })
                                    }
                                };
                            })
                        }
                    };
                })
            }
        };

        // Lier l'utilisateur créateur
        if (user && user.id && typeof user.id === 'number') {
            createData.user = { connect: { id: user.id } };
        } else if (body.createdBy && typeof body.createdBy === 'number') {
            // Logique de secours si l'ID utilisateur vient du body (moins sécurisé)
            createData.user = { connect: { id: body.createdBy } };
        } else {
            // Si aucun ID utilisateur n'est disponible, soit retourner une erreur, soit ne pas lier l'utilisateur.
            // Pour l'instant, on ne lie pas si aucun ID n'est trouvé.
            // Si createdBy est un champ obligatoire non nullable, il faudra gérer ce cas.
            // Le schéma actuel montre `createdBy   Int?` donc c'est optionnel.
        }

        const trameModele = await prisma.trameAffectation.create({
            data: createData,
            include: {
                periods: {
                    include: {
                        attributions: {
                            include: {
                                posts: true
                            }
                        }
                    }
                },
                user: {
                    select: {
                        nom: true, // Changé de name à nom
                        prenom: true, // Ajout de prenom
                        email: true
                    }
                }
            }
        });

        return NextResponse.json(trameModele, { status: 201 });
    } catch (error) {
        logger.error('Erreur lors de la création de la trameModele:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la création de la trameModele' },
            { status: 500 }
        );
    }
} 