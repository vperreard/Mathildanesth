import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, RecurrenceTypeTrame, TypeSemaineTrame, TrameRoleType as PrismaTrameRoleType } from '@prisma/client';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import type { AuthResult } from '@/lib/auth-client-utils';

const prisma = new PrismaClient();

interface RouteParams {
    params: { trameModeleId: string };
}

// GET: Récupérer un modèle de trame spécifique par son ID
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const authToken = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!authToken) {
            return NextResponse.json({ error: 'Non autorisé - Token manquant' }, { status: 401 });
        }
        const authResult: AuthResult = await verifyAuthToken(authToken);
        if (!authResult.authenticated) {
            return NextResponse.json({ error: authResult.error || 'Non autorisé - Token invalide' }, { status: 401 });
        }

        const trameModeleId = params.trameModeleId;
        const trameModele = await prisma.trameModele.findUnique({
            where: { id: parseInt(trameModeleId) },
            include: {
                site: true,
                affectations: { // Inclure les affectations et leurs détails
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
                }
            }
        });

        if (!trameModele) {
            return NextResponse.json({ error: 'Modèle de trame non trouvé' }, { status: 404 });
        }

        return NextResponse.json(trameModele);
    } catch (error: any) {
        console.error(`Erreur lors de la récupération du modèle de trame ${params.trameModeleId}:`, error);
        return NextResponse.json({ error: 'Erreur interne du serveur.', details: error.message }, { status: 500 });
    }
}

// PUT: Mettre à jour un modèle de trame
export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const authToken = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!authToken) {
            return NextResponse.json({ error: 'Non autorisé - Token manquant' }, { status: 401 });
        }
        const authResult: AuthResult = await verifyAuthToken(authToken);
        if (!authResult.authenticated || !authResult.role || !["ADMIN_TOTAL", "ADMIN_PARTIEL"].includes(authResult.role)) {
            return NextResponse.json({ error: authResult.error || 'Non autorisé ou droits insuffisants' }, { status: 401 });
        }

        const trameModeleId = params.trameModeleId;
        const data = await req.json();

        // Validation pour joursSemaineActifs si fourni (ISO 8601: Lundi=1, ..., Dimanche=7)
        if (data.joursSemaineActifs !== undefined) { // Vérifier seulement si le champ est présent dans la requête PUT
            if (!Array.isArray(data.joursSemaineActifs) ||
                !data.joursSemaineActifs.every((d: any) => typeof d === 'number' && d >= 1 && d <= 7) ||
                new Set(data.joursSemaineActifs).size !== data.joursSemaineActifs.length // Vérifier les doublons
            ) {
                return NextResponse.json({ error: 'joursSemaineActifs doit être un tableau de nombres uniques entre 1 (Lundi) et 7 (Dimanche).' }, { status: 400 });
            }
        }

        // Validation pour le champ roles si fourni
        /* if (data.roles) {
            if (!Array.isArray(data.roles)) {
                return NextResponse.json({ error: 'Le champ roles doit être un tableau.' }, { status: 400 });
            }
            if (PrismaTrameRoleType && typeof PrismaTrameRoleType === 'object' && Object.keys(PrismaTrameRoleType).length > 0) {
                if (!data.roles.every((role: any) => Object.values(PrismaTrameRoleType).includes(role))) {
                    return NextResponse.json(
                        { error: `Le champ roles contient des valeurs invalides. Roles valides: ${Object.values(PrismaTrameRoleType).join(', ')}.` },
                        { status: 400 }
                    );
                }
            } else {
                console.error("[API /api/trame-modeles PUT] PrismaTrameRoleType n'est pas défini ou est vide. Impossible de valider les rôles correctement.");
                return NextResponse.json({ error: "Erreur interne: Impossible de valider les types de rôles." }, { status: 500 });
            }
        } */

        // Vérifier si un autre modèle de trame avec le même nom existe (sauf celui-ci)
        if (data.name) {
            const existingTrameWithName = await prisma.trameModele.findFirst({
                where: {
                    name: data.name,
                    NOT: {
                        id: parseInt(trameModeleId),
                    },
                },
            });
            if (existingTrameWithName) {
                return NextResponse.json({ error: 'Un autre modèle de trame avec ce nom existe déjà.' }, { status: 409 });
            }
        }

        const updatePayload = {
            name: data.name,
            description: data.description,
            siteId: data.siteId,
            isActive: data.isActive,
            dateDebutEffet: data.dateDebutEffet ? new Date(data.dateDebutEffet) : undefined,
            dateFinEffet: data.dateFinEffet ? new Date(data.dateFinEffet) : undefined,
            recurrenceType: data.recurrenceType as RecurrenceTypeTrame,
            joursSemaineActifs: data.joursSemaineActifs,
            typeSemaine: data.typeSemaine as TypeSemaineTrame | undefined,
            // roles: (data.roles && Array.isArray(data.roles) && data.roles.length > 0 && PrismaTrameRoleType && typeof PrismaTrameRoleType === 'object')
            //     ? data.roles.filter((r: PrismaTrameRoleType) => Object.values(PrismaTrameRoleType).includes(r)) as PrismaTrameRoleType[]
            //     : (data.roles === undefined) ? undefined : [PrismaTrameRoleType && typeof PrismaTrameRoleType === 'object' && PrismaTrameRoleType.TOUS ? PrismaTrameRoleType.TOUS : 'TOUS' as PrismaTrameRoleType],
            // Temporairement, on ne sauvegarde pas les roles pour voir si le reste fonctionne
        };

        const updatedTrameModele = await prisma.trameModele.update({
            where: { id: parseInt(trameModeleId) },
            data: updatePayload,
        });

        return NextResponse.json(updatedTrameModele);
    } catch (error: any) {
        console.error(`Erreur lors de la mise à jour du modèle de trame ${params.trameModeleId}:`, error);
        if (error.code === 'P2025') { // Record to update not found
            return NextResponse.json({ error: 'Modèle de trame non trouvé pour la mise à jour.' }, { status: 404 });
        }
        if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
            return NextResponse.json({ error: 'Un autre modèle de trame avec ce nom existe déjà.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Erreur interne du serveur.', details: error.message }, { status: 500 });
    }
}

// DELETE: Supprimer un modèle de trame
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const authToken = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!authToken) {
            return NextResponse.json({ error: 'Non autorisé - Token manquant' }, { status: 401 });
        }
        const authResult: AuthResult = await verifyAuthToken(authToken);
        if (!authResult.authenticated || !authResult.role || !["ADMIN_TOTAL", "ADMIN_PARTIEL"].includes(authResult.role)) {
            return NextResponse.json({ error: authResult.error || 'Non autorisé ou droits insuffisants' }, { status: 401 });
        }

        const trameModeleId = params.trameModeleId;

        // La suppression des AffectationModele et PersonnelRequisModele se fera en cascade grâce à onDelete: Cascade dans le schéma Prisma.
        await prisma.trameModele.delete({
            where: { id: parseInt(trameModeleId) },
        });

        return NextResponse.json({ message: 'Modèle de trame supprimé avec succès' }, { status: 200 });
    } catch (error: any) {
        console.error(`Erreur lors de la suppression du modèle de trame ${params.trameModeleId}:`, error);
        if (error.code === 'P2025') { // Record to delete not found
            return NextResponse.json({ error: 'Modèle de trame non trouvé pour la suppression.' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Erreur interne du serveur.', details: error.message }, { status: 500 });
    }
} 