import { NextResponse } from 'next/server';
import { analyticsService } from '@/modules/analytics/services/analyticsService';
import { z } from 'zod';

const querySchema = z.object({
    siteId: z.string().min(1, "Le siteId est requis."),
    startDate: z.string().datetime({ message: "La date de début doit être une date valide au format ISO." }),
    endDate: z.string().datetime({ message: "La date de fin doit être une date valide au format ISO." }),
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const rawParams = {
        siteId: searchParams.get('siteId'),
        startDate: searchParams.get('startDate'),
        endDate: searchParams.get('endDate'),
    };

    const parseResult = querySchema.safeParse(rawParams);

    if (!parseResult.success) {
        return NextResponse.json({ error: 'Paramètres de requête invalides', details: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { siteId, startDate, endDate } = parseResult.data;

    try {
        // Note: Il est crucial que analyticsService.getRoomUtilizationStats soit fonctionnel
        // et que les types Prisma (Period, OperatingRoom.type, OperatingSector.category) soient corrects.
        const stats = await analyticsService.getRoomUtilizationStats(
            siteId,
            new Date(startDate),
            new Date(endDate)
        );
        return NextResponse.json(stats);
    } catch (error) {
        console.error("[API /api/analytics/room-utilization] Erreur lors de la récupération des statistiques:", error);
        const errorMessage = 'Une erreur interne est survenue lors du traitement de votre demande.';
        if (error instanceof Error) {
            // Ne pas exposer les messages d'erreur internes détaillés au client en production.
            // Envisager un logging plus robuste et des messages d'erreur génériques pour le client.
            // errorMessage = error.message; // Potentiellement sensible
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// Handler OPTIONS pour CORS si l'API est appelée depuis un domaine différent (pas typiquement nécessaire pour les routes Next.js internes)
// export async function OPTIONS() {
//   return new NextResponse(null, {
//     status: 204, // No Content
//     headers: {
//       'Access-Control-Allow-Origin': '*', // Ou votre domaine spécifique
//       'Access-Control-Allow-Methods': 'GET, OPTIONS',
//       'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//     },
//   });
// } 