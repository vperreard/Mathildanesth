import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { getServerSession } from '@/lib/auth/migration-shim';
import { authOptions } from '@/lib/auth/migration-shim';
import { prisma } from '@/lib/prisma';
import { Attribution } from '@/types/attribution';


/**
 * POST /api/affectations/batch
 * Traite un lot d'affectations (création ou mise à jour)
 */
export async function POST(req: NextRequest) {
    try {
        // Vérification de l'authentification
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Vous devez être connecté pour effectuer cette action' },
                { status: 401 }
            );
        }

        // Vérification des permissions (seuls les admins et coordinateurs peuvent modifier massivement)
        const userRole = session.user.role;
        if (userRole !== 'ADMIN' && userRole !== 'COORDINATOR') {
            return NextResponse.json(
                { error: 'Vous n\'avez pas les droits nécessaires pour effectuer cette action' },
                { status: 403 }
            );
        }

        // Récupération des données
        const body = await req.json();
        const { attributions } = body as { attributions: Attribution[] };

        if (!attributions || !Array.isArray(attributions) || attributions.length === 0) {
            return NextResponse.json(
                { error: 'Aucune affectation valide n\'a été fournie' },
                { status: 400 }
            );
        }

        // Traitement par lots des affectations
        const results = await Promise.all(
            attributions.map(async (attribution) => {
                try {
                    // Préparation des données pour Prisma
                    const assignmentData = {
                        userId: attribution.userId,
                        date: new Date(attribution.date),
                        type: attribution.type,
                        shift: attribution.shift || null,
                        secteur: attribution.secteur || null,
                        salle: attribution.salle || null,
                        confirmed: attribution.confirmed || false,
                    };

                    // Si l'attribution a un ID, mise à jour, sinon création
                    if (attribution.id && attribution.id !== 'new') {
                        // Mise à jour d'une affectation existante
                        return await prisma.attribution.update({
                            where: { id: attribution.id },
                            data: assignmentData,
                        });
                    } else {
                        // Création d'une nouvelle affectation
                        return await prisma.attribution.create({
                            data: assignmentData,
                        });
                    }
                } catch (error: unknown) {
                    logger.error(`Erreur lors du traitement de l'affectation: ${error}`);
                    return { error: `Échec pour l'affectation de l'utilisateur ${attribution.userId}` };
                }
            })
        );

        // Vérification des erreurs
        const errors = results.filter(result => 'error' in result);
        if (errors.length > 0) {
            return NextResponse.json(
                {
                    message: 'Certaines affectations n\'ont pas pu être traitées',
                    errors,
                    successCount: results.length - errors.length
                },
                { status: 207 } // Multi-Status
            );
        }

        return NextResponse.json(
            {
                message: 'Toutes les affectations ont été traitées avec succès',
                count: results.length
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        logger.error('Erreur lors du traitement des affectations par lots:', { error: error });
        return NextResponse.json(
            { error: 'Une erreur est survenue lors du traitement des affectations' },
            { status: 500 }
        );
    }
} 