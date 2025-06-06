import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/auth-utils';
import { headers } from 'next/headers';

interface RoomSectorUpdate {
    id: number;
    sectorId: number | null; // Permettre de désassigner un secteur
}

export async function POST(request: NextRequest) {
    try {
        const authResult = await verifyAuthToken();
        const headersList = await headers();
        const userRole = headersList.get('x-user-role');

        if (!authResult.authenticated && !(process.env.NODE_ENV === 'development' && userRole === 'ADMIN_TOTAL')) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }
        if (process.env.NODE_ENV === 'development' && userRole === 'ADMIN_TOTAL') {
            logger.info('[DEV MODE] Authentification par en-tête pour POST /api/operating-rooms/batch-update-sector');
        }

        const body = await request.json();
        const { rooms } = body as { rooms: RoomSectorUpdate[] }; // Typage explicite

        if (!rooms || !Array.isArray(rooms)) {
            return NextResponse.json({ error: 'Les données sont invalides: le champ \'rooms\' doit être un tableau.' }, { status: 400 });
        }

        if (rooms.length === 0) {
            return NextResponse.json({ message: 'Aucune salle à mettre à jour.' }, { status: 200 });
        }

        logger.info(`[API] Début de la mise à jour groupée des secteurs pour ${rooms.length} salles. Données reçues:`, rooms);

        const updatePromises = rooms.map(async (roomUpdate) => {
            if (typeof roomUpdate.id !== 'number' || (typeof roomUpdate.sectorId !== 'number' && roomUpdate.sectorId !== null)) {
                logger.warn('[API] Mise à jour de salle ignorée - données invalides:', roomUpdate);
                // Retourner une promesse résolue pour ne pas bloquer Promise.all
                // Ou envisager de retourner une erreur spécifique pour cette salle
                return { id: roomUpdate.id, status: 'skipped', error: 'Invalid data format' };
            }
            try {
                const updatedRoom = await prismaClient.operatingRoom.update({
                    where: { id: roomUpdate.id },
                    data: { sectorId: roomUpdate.sectorId },
                });
                logger.info(`[API] Salle ID ${updatedRoom.id} mise à jour avec sectorId: ${updatedRoom.sectorId}`);
                return { id: updatedRoom.id, status: 'success' };
            } catch (error: unknown) {
                logger.error(`[API] Erreur lors de la mise à jour de la salle ID ${roomUpdate.id}:`, { error: error });
                // Retourner une promesse résolue avec un statut d'erreur pour cette salle spécifique
                return { id: roomUpdate.id, status: 'error', error: (error as Error).message };
            }
        });

        const results = await Promise.all(updatePromises);

        const successfulUpdates = results.filter(r => r.status === 'success').length;
        const failedUpdates = results.filter(r => r.status === 'error');
        const skippedUpdates = results.filter(r => r.status === 'skipped');

        logger.info(`[API] Mise à jour groupée terminée. ${successfulUpdates} salles mises à jour avec succès.`);
        if (failedUpdates.length > 0) {
            logger.warn(`[API] ${failedUpdates.length} salles n\'ont pas pu être mises à jour:`, failedUpdates);
        }
        if (skippedUpdates.length > 0) {
            logger.warn(`[API] ${skippedUpdates.length} mises à jour de salles ignorées (données invalides):`, skippedUpdates);
        }

        if (failedUpdates.length > 0) {
            // Si une ou plusieurs erreurs, renvoyer un statut partiel ou d'erreur
            // Pour l'instant, on considère que si au moins une màj a réussi, c'est un succès partiel
            // mais on renvoie les erreurs pour que le client puisse les traiter.
            return NextResponse.json({
                success: successfulUpdates > 0,
                message: `${successfulUpdates} salles mises à jour avec succès. ${failedUpdates.length} erreurs. ${skippedUpdates.length} ignorées.`,
                details: results // Renvoyer tous les résultats pour un debogage client plus fin
            }, { status: failedUpdates.length === rooms.length ? 500 : 207 }); // 207 Multi-Status si succès partiel
        }

        return NextResponse.json({
            success: true,
            message: `${successfulUpdates} salles mises à jour avec succès. ${skippedUpdates.length} ignorées.`,
            details: results
        }, { status: 200 });

    } catch (error: unknown) {
        logger.error('[API] Erreur majeure lors de la mise à jour groupée des secteurs des salles:', { error: error });
        return NextResponse.json(
            { error: 'Erreur majeure lors de la mise à jour groupée des secteurs des salles', details: (error as Error).message },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { roomIds, sectorId } = await request.json();

        if (!Array.isArray(roomIds)) {
            return NextResponse.json(
                { error: 'roomIds doit être un tableau' },
                { status: 400 }
            );
        }

        const updatedRooms = await prisma.operatingRoom.updateMany({
            where: {
                id: {
                    in: roomIds
                }
            },
            data: {
                operatingSectorId: sectorId || null
            }
        });

        return NextResponse.json(updatedRooms);
    } catch (error: unknown) {
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour des salles' },
            { status: 500 }
        );
    }
} 