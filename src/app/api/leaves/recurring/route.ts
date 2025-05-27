import { NextRequest, NextResponse } from 'next/server';
import { generateRecurringDates } from '@/modules/leaves/utils/recurringLeavesUtils';
import { getPublicHolidays } from '@/modules/calendar/services/calendarService';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/conges/recurrents
 * Crée une nouvelle demande de congés récurrente et génère ses occurrences
 */
export async function POST(request: NextRequest) {
    try {
        const recurringRequest = await request.json();

        // Vérifier que les champs requis sont présents
        if (!recurringRequest.patternStartDate || !recurringRequest.patternEndDate ||
            !recurringRequest.recurrencePattern || !recurringRequest.userId) {
            return NextResponse.json(
                { message: 'Données de récurrence incomplètes.' },
                { status: 400 }
            );
        }

        // Convertir les dates ISO en objets Date
        const patternStartDate = new Date(recurringRequest.patternStartDate);
        const patternEndDate = new Date(recurringRequest.patternEndDate);

        // Générer un ID unique pour cette demande récurrente
        const recurrenceId = recurringRequest.id || uuidv4();

        // Récupérer les jours fériés pour l'année en cours et la suivante
        const currentYear = new Date().getFullYear();
        const holidays = await getPublicHolidays(currentYear, currentYear + 1);

        // Marquer cette demande comme récurrente
        const completeRequest = {
            ...recurringRequest,
            id: recurrenceId,
            patternStartDate,
            patternEndDate,
            isRecurring: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Générer les occurrences
        const { occurrences } = generateRecurringDates(
            completeRequest,
            { holidays }
        );

        // Dans une vraie application, on sauvegarderait ici la demande récurrente
        // et chaque occurrence dans la base de données
        const savedRequest = {
            ...completeRequest,
            generatedOccurrences: occurrences
        };

        return NextResponse.json(savedRequest);
    } catch (error) {
        console.error('Erreur lors de la création de la demande récurrente:', error);

        return NextResponse.json(
            { message: 'Erreur lors de la création de la demande récurrente.' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/conges/recurrents
 * Récupère les demandes de congés récurrentes d'un utilisateur
 */
export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { message: 'Le paramètre userId est requis.' },
                { status: 400 }
            );
        }

        // Dans une vraie application, on récupérerait ici les demandes 
        // de congés récurrentes de la base de données

        // Pour cet exemple, on retourne une liste vide
        return NextResponse.json([]);
    } catch (error) {
        console.error('Erreur lors de la récupération des demandes récurrentes:', error);

        return NextResponse.json(
            { message: 'Erreur lors de la récupération des demandes récurrentes.' },
            { status: 500 }
        );
    }
} 