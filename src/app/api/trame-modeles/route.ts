import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, RecurrenceTypeTrame, TypeSemaineTrame, DayOfWeek, TrameRoleType } from '@prisma/client';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import type { AuthResult } from '@/lib/auth-client-utils';

const prisma = new PrismaClient();

// POST: Créer un nouveau modèle de trame
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
        console.log("[API /api/trame-modeles POST] Received data:", JSON.stringify(data, null, 2));

        // Validation des données requises
        if (!data.name || !data.dateDebutEffet || !data.joursSemaineActifs || !data.recurrenceType || !data.typeSemaine) {
            console.error("[API /api/trame-modeles POST] Validation failed. Missing required fields. Name:", data.name, "dateDebutEffet:", data.dateDebutEffet, "joursSemaineActifs:", data.joursSemaineActifs, "recurrenceType:", data.recurrenceType, "typeSemaine:", data.typeSemaine);
            return NextResponse.json(
                { error: 'Les champs name, dateDebutEffet, joursSemaineActifs, recurrenceType et typeSemaine sont requis.' },
                { status: 400 }
            );
        }

        // Validation de joursSemaineActifs (ISO 8601: Lundi=1, ..., Dimanche=7)
        if (!Array.isArray(data.joursSemaineActifs) ||
            !data.joursSemaineActifs.every((d: any) => typeof d === 'number' && d >= 1 && d <= 7) ||
            new Set(data.joursSemaineActifs).size !== data.joursSemaineActifs.length // Vérifier les doublons
        ) {
            return NextResponse.json({ error: 'joursSemaineActifs doit être un tableau de nombres uniques entre 1 (Lundi) et 7 (Dimanche).' }, { status: 400 });
        }

        // Validation pour le champ roles (optionnel, mais si fourni, doit être correct)
        /* console.log("[API /api/trame-modeles POST] Validating roles. PrismaTrameRoleType:", PrismaTrameRoleType); // Ajout du log
        if (data.roles) {
            if (!Array.isArray(data.roles)) {
                return NextResponse.json({ error: 'Le champ roles doit être un tableau.' }, { status: 400 });
            }
            // Vérifier si PrismaTrameRoleType est un objet et a des valeurs avant de l'utiliser
            if (PrismaTrameRoleType && typeof PrismaTrameRoleType === 'object' && Object.keys(PrismaTrameRoleType).length > 0) {
                if (!data.roles.every((role: any) => Object.values(PrismaTrameRoleType).includes(role))) {
                    return NextResponse.json(
                        { error: `Le champ roles contient des valeurs invalides. Roles valides: ${Object.values(PrismaTrameRoleType).join(', ')}.` },
                        { status: 400 }
                    );
                }
            } else {
                // Si PrismaTrameRoleType n'est pas disponible comme attendu, logguer une erreur et potentiellement rejeter la requête
                // ou la traiter avec une validation plus souple si c'est un cas connu (mais dangereux).
                console.error("[API /api/trame-modeles POST] PrismaTrameRoleType n'est pas défini ou est vide. Impossible de valider les rôles correctement.");
                // Pour l'instant, on va retourner une erreur pour indiquer ce problème.
                return NextResponse.json({ error: "Erreur interne: Impossible de valider les types de rôles." }, { status: 500 });
            }
        } */

        // Vérifier l'unicité du nom de la trame
        const existingTrame = await prisma.trameModele.findUnique({
            where: { name: data.name },
        });
        if (existingTrame) {
            console.error(`[API /api/trame-modeles POST] Trame with name '${data.name}' already exists.`);
            return NextResponse.json({ error: 'Un modèle de trame avec ce nom existe déjà.' }, { status: 409 });
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
        };
        console.log("[API /api/trame-modeles POST] Prisma create payload (sans roles pour test):", JSON.stringify(createPayload, null, 2));

        const trameModele = await prisma.trameModele.create({
            data: createPayload,
        });

        return NextResponse.json(trameModele, { status: 201 });
    } catch (error: any) {
        console.error('Erreur lors de la création du modèle de trame:', error);
        if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
            return NextResponse.json({ error: 'Un modèle de trame avec ce nom existe déjà.' }, { status: 409 });
        }
        // Log plus détaillé de l'erreur originale si possible
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("[API /api/trame-modeles POST] Full error details:", errorMessage, error instanceof Error ? error.stack : '');
        return NextResponse.json({ error: 'Erreur interne du serveur lors de la création du modèle de trame.', details: errorMessage }, { status: 500 });
    }
}

// GET: Lister tous les modèles de trame
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

        let where: any = {};
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
    } catch (error: any) {
        console.error('Erreur lors de la récupération des modèles de trame:', error);
        return NextResponse.json({ error: 'Erreur interne du serveur lors de la récupération des modèles de trame.', details: error.message }, { status: 500 });
    }
} 