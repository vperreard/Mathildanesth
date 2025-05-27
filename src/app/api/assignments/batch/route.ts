import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Attribution } from '@/types/attribution';

jest.mock('@/lib/prisma');


const prisma = prisma;

/**
 * POST /api/gardes/vacations/batch
 * Traite un lot d'gardes/vacations (création ou mise à jour)
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
                { error: 'Aucune garde/vacation valide n\'a été fournie' },
                { status: 400 }
            );
        }

        // Traitement par lots des gardes/vacations
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
                        // Mise à jour d'une garde/vacation existante
                        return await prisma.attribution.update({
                            where: { id: attribution.id },
                            data: assignmentData,
                        });
                    } else {
                        // Création d'une nouvelle garde/vacation
                        return await prisma.attribution.create({
                            data: assignmentData,
                        });
                    }
                } catch (error) {
                    console.error(`Erreur lors du traitement de l'garde/vacation: ${error}`);
                    return { error: `Échec pour l'garde/vacation de l'utilisateur ${attribution.userId}` };
                }
            })
        );

        // Vérification des erreurs
        const errors = results.filter(result => 'error' in result);
        if (errors.length > 0) {
            return NextResponse.json(
                {
                    message: 'Certaines gardes/vacations n\'ont pas pu être traitées',
                    errors,
                    successCount: results.length - errors.length
                },
                { status: 207 } // Multi-Status
            );
        }

        return NextResponse.json(
            {
                message: 'Toutes les gardes/vacations ont été traitées avec succès',
                count: results.length
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Erreur lors du traitement des gardes/vacations par lots:', error);
        return NextResponse.json(
            { error: 'Une erreur est survenue lors du traitement des gardes/vacations' },
            { status: 500 }
        );
    }
} 