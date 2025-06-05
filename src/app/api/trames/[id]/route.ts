import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { verifyAuthToken } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { headers } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { TrameAffectation, TramePeriod, TrameAssignment, TramePost } from '@prisma/client';

// Interface type pour le corps de la requête PUT, reflétant la structure imbriquée attendue.
// Ceci est une supposition, à ajuster en fonction de ce que le client envoie réellement.
interface TramePutRequestBody {
    name: string;
    description?: string | null;
    isActive?: boolean;
    startDate?: string; // Dates en string ISO, Prisma les convertira
    endDate?: string | null;

    periods?: Array<{
        id?: string;
        name: string;
        startTime: string;
        endTime: string;
        color: string;
        isActive?: boolean;
        isLocked?: boolean; // Ce champ est sur TramePeriod
        attributions?: Array<{
            id?: string;
            type: string;
            name: string;
            duration: number;
            isActive?: boolean;
            posts?: Array<{
                id?: string;
                type: string;
                name: string;
                required?: boolean;
                maxCount?: number;
                minCount?: number;
            }>;
        }>;
    }>;
}

// Helper function pour parser le body et gérer les erreurs
async function parseRequestBody(request: NextRequest) {
    try {
        return await request.json();
    } catch (error) {
        return null; // Retourne null si le parsing échoue
    }
}

// GET /api/trameModeles/[id] - Récupérer une trameModele spécifique
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        // Vérifier l'authentification
        const authResult = await verifyAuthToken();
        if (!authResult.authenticated) {
            const headersList = await headers();
            const userRole = headersList.get('x-user-role');
            if (process.env.NODE_ENV !== 'development' || userRole !== 'ADMIN_TOTAL') {
                return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
            }
            logger.info(`[DEV MODE] Authentification par en-tête uniquement pour GET /api/trameModeles/${id}`);
        }

        const trameModele = await prisma.trameAffectation.findUnique({
            where: { id },
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
                        id: true,
                        email: true
                    }
                }
            }
        });

        if (!trameModele) {
            return NextResponse.json({ error: 'TrameModele non trouvée' }, { status: 404 });
        }
        return NextResponse.json(trameModele);

    } catch (error) {
        logger.error(`Erreur lors de la récupération de la trameModele ${id}:`, error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la récupération de la trameModele' },
            { status: 500 }
        );
    }
}

// PUT /api/trameModeles/[id] - Mettre à jour une trameModele spécifique
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: trameIdToUpdate } = await Promise.resolve(params);
    try {
        const authResult = await verifyAuthToken();
        if (!authResult.authenticated) {
            const headersList = await headers();
            const userRole = headersList.get('x-user-role');
            if (process.env.NODE_ENV !== 'development' || userRole !== 'ADMIN_TOTAL') {
                return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
            }
            logger.info(`[DEV MODE] Authentification par en-tête pour PUT /api/trameModeles/${trameIdToUpdate}`);
        }

        const body = await parseRequestBody(request) as TramePutRequestBody | null;
        if (!body) {
            return NextResponse.json({ error: 'Corps de la requête invalide ou vide' }, { status: 400 });
        }

        logger.info(`[API PUT /api/trameModeles/${trameIdToUpdate}] Body reçu:`, JSON.stringify(body, null, 2));

        const updatedTrame = await prisma.$transaction(async (tx) => {
            // Exclure les champs non modifiables directement et le champ version qui n'existe pas
            const trameUpdateData: Partial<Omit<TrameAffectation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>> = {};

            if (body.name !== undefined) trameUpdateData.name = body.name;
            if (body.description !== undefined) trameUpdateData.description = body.description;
            if (body.isActive !== undefined) trameUpdateData.isActive = body.isActive;
            if (body.startDate !== undefined) trameUpdateData.startDate = new Date(body.startDate);
            if (body.endDate !== undefined) trameUpdateData.endDate = body.endDate ? new Date(body.endDate) : null;

            // 1. Mettre à jour les champs de base de la trameModele
            await tx.trameAffectation.update({
                where: { id: trameIdToUpdate },
                data: trameUpdateData,
            });

            // Récupérer la trameModele actuelle avec toutes ses relations
            const existingTrameWithRelations = await tx.trameAffectation.findUnique({
                where: { id: trameIdToUpdate },
                include: {
                    periods: { include: { attributions: { include: { posts: true } } } }
                }
            });

            if (!existingTrameWithRelations) {
                throw new Error('TrameModele non trouvée après la mise à jour initiale.');
            }

            // 2. Gérer les périodes
            // Créer une map des périodes existantes pour faciliter la recherche
            const existingPeriodsMap = new Map(
                existingTrameWithRelations.periods.map(period => [period.id, period])
            );

            // Traiter les périodes reçues dans le corps de la requête
            if (body.periods && Array.isArray(body.periods)) {
                for (const periodData of body.periods) {
                    if (periodData.id && existingPeriodsMap.has(periodData.id)) {
                        // Période existante à mettre à jour
                        const periodId = periodData.id;
                        await tx.tramePeriod.update({
                            where: { id: periodId },
                            data: {
                                name: periodData.name,
                                startTime: periodData.startTime,
                                endTime: periodData.endTime,
                                color: periodData.color,
                                isActive: periodData.isActive ?? true,
                                isLocked: periodData.isLocked ?? false
                            }
                        });

                        // 3. Gérer les attributions de cette période
                        if (periodData.attributions && Array.isArray(periodData.attributions)) {
                            // Créer une map des attributions existants pour cette période
                            const existingAssignmentsMap = new Map(
                                existingPeriodsMap.get(periodId)?.attributions.map(attribution => [attribution.id, attribution]) || []
                            );

                            for (const assignmentData of periodData.attributions) {
                                if (assignmentData.id && existingAssignmentsMap.has(assignmentData.id)) {
                                    // Attribution existant à mettre à jour
                                    const assignmentId = assignmentData.id;
                                    await tx.trameAssignment.update({
                                        where: { id: assignmentId },
                                        data: {
                                            type: assignmentData.type,
                                            name: assignmentData.name,
                                            duration: assignmentData.duration,
                                            isActive: assignmentData.isActive ?? true
                                        }
                                    });

                                    // 4. Gérer les posts de cet attribution
                                    if (assignmentData.posts && Array.isArray(assignmentData.posts)) {
                                        // Créer une map des posts existants pour cet attribution
                                        const existingPostsMap = new Map(
                                            existingAssignmentsMap.get(assignmentId)?.posts.map(post => [post.id, post]) || []
                                        );

                                        for (const postData of assignmentData.posts) {
                                            if (postData.id && existingPostsMap.has(postData.id)) {
                                                // Post existant à mettre à jour
                                                await tx.tramePost.update({
                                                    where: { id: postData.id },
                                                    data: {
                                                        type: postData.type,
                                                        name: postData.name,
                                                        required: postData.required ?? false,
                                                        maxCount: postData.maxCount ?? 1,
                                                        minCount: postData.minCount ?? 0
                                                    }
                                                });
                                            } else {
                                                // Nouveau post à créer
                                                await tx.tramePost.create({
                                                    data: {
                                                        id: postData.id || uuidv4(),
                                                        type: postData.type,
                                                        name: postData.name,
                                                        required: postData.required ?? false,
                                                        maxCount: postData.maxCount ?? 1,
                                                        minCount: postData.minCount ?? 0,
                                                        assignmentId: assignmentId
                                                    }
                                                });
                                            }
                                        }

                                        // Supprimer les posts qui ne sont plus dans la requête
                                        const postIdsToKeep = assignmentData.posts
                                            .filter(p => p.id)
                                            .map(p => p.id as string);

                                        for (const [postId, post] of existingPostsMap.entries()) {
                                            if (!postIdsToKeep.includes(postId)) {
                                                await tx.tramePost.delete({
                                                    where: { id: postId }
                                                });
                                            }
                                        }
                                    }
                                } else {
                                    // Nouvel attribution à créer
                                    const newAssignmentId = assignmentData.id || uuidv4();
                                    await tx.trameAssignment.create({
                                        data: {
                                            id: newAssignmentId,
                                            type: assignmentData.type,
                                            name: assignmentData.name,
                                            duration: assignmentData.duration,
                                            isActive: assignmentData.isActive ?? true,
                                            periodId: periodId,
                                            posts: {
                                                create: assignmentData.posts?.map(postData => ({
                                                    id: postData.id || uuidv4(),
                                                    type: postData.type,
                                                    name: postData.name,
                                                    required: postData.required ?? false,
                                                    maxCount: postData.maxCount ?? 1,
                                                    minCount: postData.minCount ?? 0
                                                })) || []
                                            }
                                        }
                                    });
                                }
                            }

                            // Supprimer les attributions qui ne sont plus dans la requête
                            const assignmentIdsToKeep = periodData.attributions
                                .filter(a => a.id)
                                .map(a => a.id as string);

                            for (const [assignmentId, attribution] of existingAssignmentsMap.entries()) {
                                if (!assignmentIdsToKeep.includes(assignmentId)) {
                                    await tx.trameAssignment.delete({
                                        where: { id: assignmentId }
                                    });
                                }
                            }
                        }
                    } else {
                        // Nouvelle période à créer
                        const newPeriodId = periodData.id || uuidv4();
                        await tx.tramePeriod.create({
                            data: {
                                id: newPeriodId,
                                name: periodData.name,
                                startTime: periodData.startTime,
                                endTime: periodData.endTime,
                                color: periodData.color,
                                isActive: periodData.isActive ?? true,
                                isLocked: periodData.isLocked ?? false,
                                trameId: trameIdToUpdate,
                                attributions: {
                                    create: periodData.attributions?.map(assignmentData => ({
                                        id: assignmentData.id || uuidv4(),
                                        type: assignmentData.type,
                                        name: assignmentData.name,
                                        duration: assignmentData.duration,
                                        isActive: assignmentData.isActive ?? true,
                                        posts: {
                                            create: assignmentData.posts?.map(postData => ({
                                                id: postData.id || uuidv4(),
                                                type: postData.type,
                                                name: postData.name,
                                                required: postData.required ?? false,
                                                maxCount: postData.maxCount ?? 1,
                                                minCount: postData.minCount ?? 0
                                            })) || []
                                        }
                                    })) || []
                                }
                            }
                        });
                    }
                }

                // Supprimer les périodes qui ne sont plus dans la requête
                const periodIdsToKeep = body.periods
                    .filter(p => p.id)
                    .map(p => p.id as string);

                for (const [periodId, period] of existingPeriodsMap.entries()) {
                    if (!periodIdsToKeep.includes(periodId)) {
                        await tx.tramePeriod.delete({
                            where: { id: periodId }
                        });
                    }
                }
            }

            // Retourner la trameModele mise à jour avec toutes ses relations
            return tx.trameAffectation.findUnique({
                where: { id: trameIdToUpdate },
                include: {
                    periods: { include: { attributions: { include: { posts: true } } } },
                    user: { select: { id: true, email: true } }
                }
            });
        });

        if (!updatedTrame) {
            return NextResponse.json({ error: 'Échec de la mise à jour de la trameModele ou trameModele non trouvée après transaction' }, { status: 404 });
        }

        logger.info(`[API PUT /api/trameModeles/${trameIdToUpdate}] Mise à jour effectuée.`);
        return NextResponse.json(updatedTrame);

    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json({ error: `TrameModele avec ID ${trameIdToUpdate} non trouvée.` }, { status: 404 });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            logger.error(`Erreur Prisma lors de la mise à jour de la trameModele ${trameIdToUpdate}:`, error.message, error.code, error.meta);
            return NextResponse.json({ error: 'Erreur base de données lors de la mise à jour.', details: error.message }, { status: 500 });
        }
        logger.error(`Erreur générique lors de la mise à jour de la trameModele ${trameIdToUpdate}:`, error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la mise à jour de la trameModele.', details: error.message || 'Erreur inconnue' },
            { status: 500 }
        );
    }
}

// DELETE /api/trameModeles/[id] - Supprimer une trameModele spécifique
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const authResult = await verifyAuthToken();
        if (!authResult.authenticated) {
            const headersList = await headers();
            const userRole = headersList.get('x-user-role');
            if (process.env.NODE_ENV !== 'development' || userRole !== 'ADMIN_TOTAL') {
                return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
            }
            logger.info(`[DEV MODE] Authentification par en-tête uniquement pour DELETE /api/trameModeles/${id}`);
        }

        const existingTrame = await prisma.trameAffectation.findUnique({ where: { id } });
        if (!existingTrame) {
            return NextResponse.json({ error: 'TrameModele non trouvée pour la suppression' }, { status: 404 });
        }

        await prisma.trameAffectation.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'TrameModele supprimée avec succès' }, { status: 200 });

    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'TrameModele non trouvée pour la suppression' }, { status: 404 });
        }
        logger.error(`Erreur lors de la suppression de la trameModele ${id}:`, error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la suppression de la trameModele' },
            { status: 500 }
        );
    }
} 