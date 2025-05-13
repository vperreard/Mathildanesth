import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';
import { z } from 'zod';
import { headers } from 'next/headers';

// Schéma de validation pour les données entrantes
const reorderPayloadSchema = z.object({
    sitesOrder: z.array(z.object({
        // 'siteId' peut être un CUID ou la chaîne spéciale 'null' pour les non-assignés
        siteId: z.string(),
        orderedSectorIds: z.array(z.number().int().positive()),
    })),
});

export async function POST(request: NextRequest) {
    // Récupérer les en-têtes directement depuis l'objet request
    const userRole = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id'); // Optionnel, mais peut être utile

    // Logs pour déboguer ce qu'on récupère des en-têtes
    console.log("POST /api/sectors/reorder-by-site - Headers from middleware:");
    console.log(`  x-user-id: ${userId}`);
    console.log(`  x-user-role: ${userRole}`);

    // Vérification des permissions basée sur l'en-tête x-user-role
    // Autoriser ADMIN_TOTAL ou ADMIN_PARTIEL
    if (!userRole || (userRole !== Role.ADMIN_TOTAL && userRole !== Role.ADMIN_PARTIEL)) {
        console.error(`[AUTH FAIL VIA HEADER] Role check failed. User Role from header: ${userRole}, Required Roles: ${Role.ADMIN_TOTAL} or ${Role.ADMIN_PARTIEL}`);
        return NextResponse.json({ error: 'Non autorisé (vérification via en-tête)' }, { status: 401 });
    }

    // Optionnel: Vérifier userId si nécessaire pour la logique métier ou l'audit
    // const numericUserId = userId ? parseInt(userId, 10) : null;
    // if (!numericUserId) {
    //     console.error(`[AUTH FAIL VIA HEADER] User ID manquant ou invalide depuis l'en-tête.`);
    //     return NextResponse.json({ error: 'ID utilisateur invalide (vérification via en-tête)' }, { status: 401 });
    // }

    let payload;
    try {
        const rawPayload = await request.json();
        payload = reorderPayloadSchema.parse(rawPayload);
    } catch (error) {
        console.error("Erreur de validation du payload de réorganisation:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Données invalides', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Impossible de lire la requête' }, { status: 400 });
    }

    try {
        console.log("Début de la transaction de réorganisation des secteurs par site.", payload.sitesOrder);

        // Utiliser une transaction Prisma pour assurer l'atomicité
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const updatePromises: Promise<any>[] = [];

            for (const siteOrder of payload.sitesOrder) {
                const targetSiteId = siteOrder.siteId === 'null' ? null : siteOrder.siteId;

                // Vérifier si le siteId (s'il n'est pas null) existe réellement
                if (targetSiteId !== null) {
                    const siteExists = await tx.site.findUnique({
                        where: { id: targetSiteId },
                        select: { id: true } // Sélectionner seulement l'ID pour l'efficacité
                    });
                    if (!siteExists) {
                        // Si un site ID n'existe pas, on annule la transaction
                        throw new Error(`Le site avec l'ID ${targetSiteId} n'existe pas.`);
                    }
                }

                siteOrder.orderedSectorIds.forEach((sectorId, index) => {
                    console.log(`  Préparation MAJ: Secteur ${sectorId} -> Site ${targetSiteId}, Ordre ${index}`);
                    // Ajouter une promesse de mise à jour pour chaque secteur dans la liste
                    updatePromises.push(
                        tx.operatingSector.update({
                            where: { id: sectorId },
                            data: {
                                siteId: targetSiteId, // Met à jour le siteId (peut être null)
                                displayOrder: index, // Met à jour l'ordre d'affichage
                            },
                        })
                    );
                });
            }

            console.log(`Exécution de ${updatePromises.length} mises à jour dans la transaction...`);
            // Exécuter toutes les mises à jour en parallèle dans la transaction
            await Promise.all(updatePromises);
            console.log("Transaction de réorganisation terminée avec succès.");
        });

        return NextResponse.json({ message: 'Ordre des secteurs mis à jour avec succès' }, { status: 200 });

    } catch (error: any) {
        console.error("Erreur lors de la mise à jour de l'ordre des secteurs:", error);
        if (error.message.includes("n'existe pas")) {
            return NextResponse.json({ error: error.message }, { status: 404 }); // Not Found si un site ID est invalide
        }
        // Gérer d'autres erreurs potentielles (ex: erreur base de données)
        return NextResponse.json({ error: "Erreur serveur lors de la mise à jour de l'ordre des secteurs" }, { status: 500 });
    }
} 