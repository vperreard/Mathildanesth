import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, RecurrenceTypeTrame, TypeSemaineTrame, TrameRoleType as PrismaTrameRoleType } from '@prisma/client';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import type { AuthResult } from '@/lib/auth-client-utils';

import { prisma } from "@/lib/prisma";

// GET: Récupérer un template de trameModele spécifique par son ID
export async function GET(req: NextRequest, { params }: { params: { trameModeleId: string } }) {
    const { trameModeleId } = await params;
    console.log(`[API GET /trameModele-modeles/${trameModeleId}] Début du traitement.`);

    try {
        const authToken = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!authToken) {
            return NextResponse.json({ error: 'Non autorisé - Token manquant' }, { status: 401 });
        }
        const authResult: AuthResult = await verifyAuthToken(authToken);
        if (!authResult.authenticated) {
            return NextResponse.json({ error: authResult.error || 'Non autorisé - Token invalide' }, { status: 401 });
        }

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
            return NextResponse.json({ error: 'Modèle de trameModele non trouvé' }, { status: 404 });
        }

        return NextResponse.json(trameModele);
    } catch (error: any) {
        console.error(`Erreur lors de la récupération du template de trameModele ${trameModeleId}:`, error);
        return NextResponse.json({ error: 'Erreur interne du serveur.', details: error.message }, { status: 500 });
    }
}

// PUT: Mettre à jour un template de trameModele
export async function PUT(req: NextRequest, { params }: { params: { trameModeleId: string } }) {
    const { trameModeleId } = await params;
    console.log(`[API PUT /trameModele-modeles/${trameModeleId}] Début du traitement.`);

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
        console.log(`[API PUT /trameModele-modeles/${trameModeleId}] Données reçues:`, JSON.stringify(data, null, 2));

        // Validation pour joursSemaineActifs si fourni (ISO 8601: Lundi=1, ..., Dimanche=7)
        if (data.joursSemaineActifs !== undefined) { // Vérifier seulement si le champ est présent dans la requête PUT
            if (!Array.isArray(data.joursSemaineActifs) ||
                !data.joursSemaineActifs.every((d: any) => typeof d === 'number' && d >= 1 && d <= 7) ||
                new Set(data.joursSemaineActifs).size !== data.joursSemaineActifs.length // Vérifier les doublons
            ) {
                return NextResponse.json({ error: 'joursSemaineActifs doit être un tableau de nombres uniques entre 1 (Lundi) et 7 (Dimanche).' }, { status: 400 });
            }
        }

        // Validation pour le champ detailsJson si fourni
        let processedDetailsJson = undefined;
        if (data.detailsJson !== undefined) {
            // S'assurer que detailsJson est un objet valide pour PostgreSQL JSONB
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

                console.log(`[API PUT /trameModele-modeles/${trameModeleId}] detailsJson traité:`, JSON.stringify(processedDetailsJson, null, 2));
            } catch (jsonError) {
                console.error(`[API PUT /trameModele-modeles/${trameModeleId}] Erreur lors du traitement de detailsJson:`, jsonError);
                return NextResponse.json({ error: 'Le champ detailsJson doit être un objet JSON valide.' }, { status: 400 });
            }
        }

        // Vérifier si un autre template de trameModele avec le même nom existe (sauf celui-ci)
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
                return NextResponse.json({ error: 'Un autre template de trameModele avec ce nom existe déjà.' }, { status: 409 });
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

            // Utiliser la version traitée de detailsJson
            detailsJson: processedDetailsJson,
        };

        console.log(`[API PUT /trameModele-modeles/${trameModeleId}] Payload de mise à jour:`, JSON.stringify(updatePayload, null, 2));

        try {
            const updatedTrameModele = await prisma.trameModele.update({
                where: { id: parseInt(trameModeleId) },
                data: updatePayload,
            });

            console.log(`[API PUT /trameModele-modeles/${trameModeleId}] Mise à jour réussie, ID: ${updatedTrameModele.id}`);
            return NextResponse.json(updatedTrameModele);
        } catch (updateError: any) {
            console.error(`[API PUT /trameModele-modeles/${trameModeleId}] Erreur Prisma lors de la mise à jour:`, updateError);
            console.error(`Code d'erreur Prisma: ${updateError.code}`);
            console.error(`Message d'erreur Prisma: ${updateError.message}`);

            if (updateError.meta) {
                console.error(`Métadonnées d'erreur: ${JSON.stringify(updateError.meta)}`);
            }

            throw updateError; // Relancer l'erreur pour qu'elle soit traitée dans le catch principal
        }
    } catch (error: any) {
        console.error(`[API PUT /trameModele-modeles/${trameModeleId}] Erreur lors de la mise à jour:`, error);

        // Afficher la stack trace pour plus de détails
        if (error.stack) {
            console.error(`[API PUT /trameModele-modeles/${trameModeleId}] Stack trace:`, error.stack);
        }

        if (error.code === 'P2025') { // Record to update not found
            return NextResponse.json({ error: 'Modèle de trameModele non trouvé pour la mise à jour.' }, { status: 404 });
        }
        if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
            return NextResponse.json({ error: 'Un autre template de trameModele avec ce nom existe déjà.' }, { status: 409 });
        }

        // Détails supplémentaires pour le client dans la réponse
        const errorDetails = {
            message: error.message || 'Erreur interne du serveur.',
            code: error.code || 'UNKNOWN',
            meta: error.meta || {},
        };

        return NextResponse.json({
            error: 'Erreur interne du serveur.',
            details: errorDetails
        }, { status: 500 });
    }
}

// DELETE: Supprimer un template de trameModele
export async function DELETE(req: NextRequest, { params }: { params: { trameModeleId: string } }) {
    const { trameModeleId } = await params;
    console.log(`[API DELETE /trameModele-modeles/${trameModeleId}] Début du traitement.`);

    try {
        const authToken = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!authToken) {
            return NextResponse.json({ error: 'Non autorisé - Token manquant' }, { status: 401 });
        }
        const authResult: AuthResult = await verifyAuthToken(authToken);
        if (!authResult.authenticated || !authResult.role || !["ADMIN_TOTAL", "ADMIN_PARTIEL"].includes(authResult.role)) {
            return NextResponse.json({ error: authResult.error || 'Non autorisé ou droits insuffisants' }, { status: 401 });
        }

        // La suppression des AffectationModele et PersonnelRequisModele se fera en cascade grâce à onDelete: Cascade dans le schéma Prisma.
        await prisma.trameModele.delete({
            where: { id: parseInt(trameModeleId) },
        });

        return NextResponse.json({ message: 'Modèle de trameModele supprimé avec succès' }, { status: 200 });
    } catch (error: any) {
        console.error(`Erreur lors de la suppression du template de trameModele ${trameModeleId}:`, error);
        if (error.code === 'P2025') { // Record to delete not found
            return NextResponse.json({ error: 'Modèle de trameModele non trouvé pour la suppression.' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Erreur interne du serveur.', details: error.message }, { status: 500 });
    }
} 