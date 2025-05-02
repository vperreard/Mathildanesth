import { NextRequest, NextResponse } from 'next/server';
import { generateRecurringDates } from '@/modules/leaves/utils/recurringLeavesUtils';
import { getPublicHolidays } from '@/services/calendarService';

/**
 * POST /api/leaves/recurring/preview
 * Prévisualise les occurrences d'une demande de congés récurrente sans la sauvegarder
 */
export async function POST(request: NextRequest) {
    try {
        const recurringRequest = await request.json();

        // Vérifier que les champs requis sont présents
        if (!recurringRequest.patternStartDate || !recurringRequest.patternEndDate || !recurringRequest.recurrencePattern) {
            return NextResponse.json(
                { message: 'Données de récurrence incomplètes.' },
                { status: 400 }
            );
        }

        // Convertir les dates ISO en objets Date
        const patternStartDate = new Date(recurringRequest.patternStartDate);
        const patternEndDate = new Date(recurringRequest.patternEndDate);

        // Récupérer les jours fériés pour l'année en cours et la suivante
        const currentYear = new Date().getFullYear();
        const holidays = await getPublicHolidays(currentYear, currentYear + 1);

        // Générer les occurrences
        const { occurrences } = generateRecurringDates(
            {
                ...recurringRequest,
                patternStartDate,
                patternEndDate,
                id: 'preview',  // ID temporaire pour la prévisualisation
                isRecurring: true
            },
            { holidays }
        );

        return NextResponse.json(occurrences);
    } catch (error) {
        console.error('Erreur lors de la prévisualisation des occurrences récurrentes:', error);

        return NextResponse.json(
            { message: 'Erreur lors de la génération des occurrences.' },
            { status: 500 }
        );
    }
} 