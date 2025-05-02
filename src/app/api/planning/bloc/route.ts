import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
    getBlocPlanningByDate,
    createBlocPlanning,
    updateBlocPlanning,
    validateBlocPlanning
} from '@/modules/planning/bloc-operatoire/services/blocPlanningService';
import { ZodError } from 'zod';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date');

        if (!dateStr) {
            return NextResponse.json({ error: 'Date requise dans les paramètres de recherche' }, { status: 400 });
        }

        const date = new Date(dateStr);

        if (isNaN(date.getTime())) {
            return NextResponse.json({ error: 'Format de date invalide' }, { status: 400 });
        }

        const planning = await getBlocPlanningByDate(date);
        return NextResponse.json(planning);
    } catch (error) {
        console.error('Erreur lors de la récupération du planning du bloc:', error);
        return NextResponse.json({ error: 'Erreur lors de la récupération du planning du bloc' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const body = await request.json();

        // Valider le planning avant création
        const validationResult = await validateBlocPlanning(body);

        if (!validationResult.isValid) {
            return NextResponse.json({
                error: 'Planning invalide',
                conflicts: validationResult.conflicts
            }, { status: 400 });
        }

        const planning = await createBlocPlanning(body);
        return NextResponse.json(planning, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création du planning du bloc:', error);

        if (error instanceof ZodError) {
            return NextResponse.json({
                error: 'Données invalides',
                details: error.format()
            }, { status: 400 });
        }

        return NextResponse.json({ error: 'Erreur lors de la création du planning du bloc' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const body = await request.json();

        // Valider le planning avant mise à jour
        const validationResult = await validateBlocPlanning(body);

        if (!validationResult.isValid) {
            return NextResponse.json({
                error: 'Planning invalide',
                conflicts: validationResult.conflicts
            }, { status: 400 });
        }

        const planning = await updateBlocPlanning(body);
        return NextResponse.json(planning);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du planning du bloc:', error);

        if (error instanceof ZodError) {
            return NextResponse.json({
                error: 'Données invalides',
                details: error.format()
            }, { status: 400 });
        }

        return NextResponse.json({ error: 'Erreur lors de la mise à jour du planning du bloc' }, { status: 500 });
    }
} 