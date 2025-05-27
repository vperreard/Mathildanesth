import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { Assignment } from '@/types/assignment';

const prisma = new PrismaClient();

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
        const { assignments } = body as { assignments: Assignment[] };

        if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
            return NextResponse.json(
                { error: 'Aucune affectation valide n\'a été fournie' },
                { status: 400 }
            );
        }

        // Traitement par lots des affectations
        const results = await Promise.all(
            assignments.map(async (assignment) => {
                try {
                    // Préparation des données pour Prisma
                    const assignmentData = {
                        userId: assignment.userId,
                        date: new Date(assignment.date),
                        type: assignment.type,
                        shift: assignment.shift || null,
                        secteur: assignment.secteur || null,
                        salle: assignment.salle || null,
                        confirmed: assignment.confirmed || false,
                    };

                    // Si l'assignment a un ID, mise à jour, sinon création
                    if (assignment.id && assignment.id !== 'new') {
                        // Mise à jour d'une affectation existante
                        return await prisma.assignment.update({
                            where: { id: assignment.id },
                            data: assignmentData,
                        });
                    } else {
                        // Création d'une nouvelle affectation
                        return await prisma.assignment.create({
                            data: assignmentData,
                        });
                    }
                } catch (error) {
                    console.error(`Erreur lors du traitement de l'affectation: ${error}`);
                    return { error: `Échec pour l'affectation de l'utilisateur ${assignment.userId}` };
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
    } catch (error) {
        console.error('Erreur lors du traitement des affectations par lots:', error);
        return NextResponse.json(
            { error: 'Une erreur est survenue lors du traitement des affectations' },
            { status: 500 }
        );
    }
} 