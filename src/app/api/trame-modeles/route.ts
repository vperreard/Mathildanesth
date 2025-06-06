import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { PrismaClient, RecurrenceTypeTrame, TypeSemaineTrame, DayOfWeek, TrameRoleType } from '@prisma/client';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import type { AuthResult } from '@/lib/auth-client-utils';

import { prisma } from "@/lib/prisma";

// POST: Créer un nouveau template de trameModele
export async function POST(req: NextRequest) {
    try {
        const authToken = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!authToken) {
            return NextResponse.json({ error: 'Non autorisé - Token manquant' }, { status: 401 });
        }

        const authResult: AuthResult = await verifyAuthToken(authToken);
        if (!authResult.authenticated || !authResult.role || !["ADMIN_TOTAL", "ADMIN_PARTIEL"].includes(authResult.role)) {
            return NextResponse.json({ error: authResult.error || 'Non autorisé ou droits insuffisants' }, { status: 401 });
        }

        const data = await req.json();
        logger.info("[API /api/trameModele-modeles POST] Received data:", JSON.stringify(data, null, 2));

        // Validation des données requises
        if (!data.name || !data.dateDebutEffet || !data.joursSemaineActifs || !data.recurrenceType || !data.typeSemaine) {
            logger.error("[API /api/trameModele-modeles POST] Validation failed. Missing required fields. Name:", data.name, "dateDebutEffet:", data.dateDebutEffet, "joursSemaineActifs:", data.joursSemaineActifs, "recurrenceType:", data.recurrenceType, "typeSemaine:", data.typeSemaine);
            return NextResponse.json(
                { error: 'Les champs name, dateDebutEffet, joursSemaineActifs, recurrenceType et typeSemaine sont requis.' },
                { status: 400 }
            );
        }

        // Validation de joursSemaineActifs (ISO 8601: Lundi=1, ..., Dimanche=7)
        if (!Array.isArray(data.joursSemaineActifs) ||
            !data.joursSemaineActifs.every((d: unknown) => typeof d === 'number' && d >= 1 && d <= 7) ||
            new Set(data.joursSemaineActifs).size !== data.joursSemaineActifs.length // Vérifier les doublons
        ) {
            return NextResponse.json({ error: 'joursSemaineActifs doit être un tableau de nombres uniques entre 1 (Lundi) et 7 (Dimanche).' }, { status: 400 });
        }

        // Validation pour le champ roles (optionnel, mais si fourni, doit être correct)
        /* logger.info("[API /api/trameModele-modeles POST] Validating roles. PrismaTrameRoleType:", PrismaTrameRoleType); // Ajout du log
        if (data.roles) {
            if (!Array.isArray(data.roles)) {
                return NextResponse.json({ error: 'Le champ roles doit être un tableau.' }, { status: 400 });
            }
            // Vérifier si PrismaTrameRoleType est un objet et a des valeurs avant de l'utiliser
            if (PrismaTrameRoleType && typeof PrismaTrameRoleType === 'object' && Object.keys(PrismaTrameRoleType).length > 0) {
                if (!data.roles.every((role: unknown) => Object.values(PrismaTrameRoleType).includes(role))) {
                    return NextResponse.json(
                        { error: `Le champ roles contient des valeurs invalides. Roles valides: ${Object.values(PrismaTrameRoleType).join(', ')}.` },
                        { status: 400 }
                    );
                }
            } else {
                // Si PrismaTrameRoleType n'est pas disponible comme attendu, logguer une erreur et potentiellement rejeter la requête
                // ou la traiter avec une validation plus souple si c'est un cas connu (mais dangereux).
                logger.error("[API /api/trameModele-modeles POST] PrismaTrameRoleType n'est pas défini ou est vide. Impossible de valider les rôles correctement.");
                // Pour l'instant, on va retourner une erreur pour indiquer ce problème.
                return NextResponse.json({ error: "Erreur interne: Impossible de valider les types de rôles." }, { status: 500 });
            }
        } */

        // Vérifier l'unicité du nom de la trameModele
        const existingTrame = await prisma.trameModele.findUnique({
            where: { name: data.name },
        });
        if (existingTrame) {
            logger.error(`[API /api/trameModele-modeles POST] TrameModele with name '${data.name}' already exists.`);
            return NextResponse.json({ error: 'Un template de trameModele avec ce nom existe déjà.' }, { status: 409 });
        }

        // Traitement du champ detailsJson
        let processedDetailsJson = null;
        if (data.detailsJson !== undefined) {
            try {
                // Si c'est déjà un objet JavaScript, on le laisse tel quel
                if (typeof data.detailsJson === 'object' && data.detailsJson !== null) {
                    processedDetailsJson = data.detailsJson;
                }
                // Si c'est une chaîne JSON, on la parse
                else if (typeof data.detailsJson === 'string') {
                    processedDetailsJson = JSON.parse(data.detailsJson);
                }
                // Si c'est autre chose, on le convertit en chaîne puis en objet
                else {
                    processedDetailsJson = JSON.parse(JSON.stringify(data.detailsJson));
                }

                logger.info(`[API /api/trameModele-modeles POST] detailsJson traité:`, JSON.stringify(processedDetailsJson, null, 2));
            } catch (jsonError: unknown) {
                logger.error(`[API /api/trameModele-modeles POST] Erreur lors du traitement de detailsJson:`, jsonError);
                return NextResponse.json({ error: 'Le champ detailsJson doit être un objet JSON valide.' }, { status: 400 });
            }
        }

        const createPayload = {
            name: data.name,
            description: data.description || null,
            siteId: data.siteId || null,
            isActive: data.isActive !== undefined ? data.isActive : true,
            dateDebutEffet: new Date(data.dateDebutEffet),
            dateFinEffet: data.dateFinEffet ? new Date(data.dateFinEffet) : null,
            recurrenceType: data.recurrenceType as RecurrenceTypeTrame,
            joursSemaineActifs: data.joursSemaineActifs, // Doit être un tableau d'entiers
            typeSemaine: data.typeSemaine as TypeSemaineTrame,
            // roles: (data.roles && Array.isArray(data.roles) && data.roles.length > 0 && PrismaTrameRoleType && typeof PrismaTrameRoleType === 'object') // S'assurer que PrismaTrameRoleType est valide
            //     ? data.roles.filter((r: PrismaTrameRoleType) => Object.values(PrismaTrameRoleType).includes(r)) as PrismaTrameRoleType[]
            //     : [PrismaTrameRoleType && typeof PrismaTrameRoleType === 'object' && PrismaTrameRoleType.TOUS ? PrismaTrameRoleType.TOUS : 'TOUS' as PrismaTrameRoleType], // Fallback plus robuste
            // Temporairement, on ne sauvegarde pas les roles pour voir si le reste fonctionne

            // Utiliser la version traitée de detailsJson
            detailsJson: processedDetailsJson,
        };
        logger.info("[API /api/trameModele-modeles POST] Prisma create payload (sans roles pour test):", JSON.stringify(createPayload, null, 2));

        const trameModele = await prisma.trameModele.create({
            data: createPayload,
        });

        return NextResponse.json(trameModele, { status: 201 });
    } catch (error: unknown) {
        logger.error('[API /api/trameModele-modeles POST] Erreur lors de la création du template de trameModele:', { error: error });

        // Afficher la stack trace pour plus de détails
        if (error.stack) {
            logger.error('[API /api/trameModele-modeles POST] Stack trace:', error.stack);
        }

        if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
            return NextResponse.json({ error: 'Un template de trameModele avec ce nom existe déjà.' }, { status: 409 });
        }

        // Détails supplémentaires pour le client dans la réponse
        const errorDetails = {
            message: error.message || 'Erreur interne du serveur.',
            code: error.code || 'UNKNOWN',
            meta: error.meta || {},
        };

        // Log plus détaillé de l'erreur originale si possible
        logger.error("[API /api/trameModele-modeles POST] Détails de l'erreur:", errorDetails);

        return NextResponse.json({
            error: 'Erreur interne du serveur lors de la création du template de trameModele.',
            details: errorDetails
        }, { status: 500 });
    }
}

// GET: Lister tous les templates de trameModele
export async function GET(req: NextRequest) {
    try {
        const authToken = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!authToken) {
            return NextResponse.json({ error: 'Non autorisé - Token manquant' }, { status: 401 });
        }
        const authResult: AuthResult = await verifyAuthToken(authToken);
        if (!authResult.authenticated) {
            return NextResponse.json({ error: authResult.error || 'Non autorisé - Token invalide' }, { status: 401 });
        }

        const { searchParams } = req.nextUrl;
        const siteId = searchParams.get('siteId');
        const isActive = searchParams.get('isActive');
        const includeAffectations = searchParams.get('includeAffectations') === 'true';

        const where: any = {};
        if (siteId) {
            where.siteId = siteId;
        }
        if (isActive === 'true') {
            where.isActive = true;
        } else if (isActive === 'false') {
            where.isActive = false;
        }

        const trameModeles = await prisma.trameModele.findMany({
            where,
            include: {
                site: true, // Toujours inclure le site pour l'affichage du nom
                affectations: includeAffectations ? {
                    include: {
                        activityType: true,
                        operatingRoom: true,
                        personnelRequis: {
                            include: {
                                professionalRoleConfig: true,
                                specialty: true,
                                userHabituel: true,
                                surgeonHabituel: true
                            }
                        }
                    }
                } : false,
            },
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json(trameModeles);
    } catch (error: unknown) {
        logger.error('Erreur lors de la récupération des templates de trameModele:', { error: error });
        return NextResponse.json({ error: 'Erreur interne du serveur lors de la récupération des templates de trameModele.', details: error.message }, { status: 500 });
    }
} 