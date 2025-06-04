import { NextRequest, NextResponse } from 'next/server';
// Importer depuis le service existant
import { publicHolidayService } from '@/modules/leaves/services/publicHolidayService';
import { PublicHoliday } from '@/modules/leaves/types/public-holiday'; // Assurez-vous que ce type est correct
import { z } from 'zod';

// Schéma de validation pour l'année
const querySchema = z.object({
    // Utiliser coerce pour convertir directement en nombre
    year: z.coerce.number().int().min(1900).max(2100),
});

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const yearParam = searchParams.get('year');

    const validationResult = querySchema.safeParse({ year: yearParam });

    if (!validationResult.success) {
        return NextResponse.json(
            { error: 'Paramètre année invalide ou hors plage (1900-2100)', details: validationResult.error.errors },
            { status: 400 }
        );
    }

    const year = validationResult.data.year;

    try {
        // Utiliser l'instance singleton du service pour obtenir les jours fériés
        // getPublicHolidaysForYear tentera d'appeler l'API, échouera (car c'est cette même API),
        // puis utilisera le calcul local comme fallback.
        const holidays: PublicHoliday[] = await publicHolidayService.getPublicHolidaysForYear(year);

        // L'API renvoie maintenant les jours fériés calculés
        return NextResponse.json({ holidays });

    } catch (error: any) {
        console.error(`Erreur API [GET /api/jours-feries?year=${year}]:`, error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la récupération des jours fériés.', details: error.message },
            { status: 500 }
        );
    }
} 