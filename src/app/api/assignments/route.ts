import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Schéma de validation pour les paramètres de requête
const querySchema = z.object({
    start: z.string().datetime({ message: 'La date de début doit être une date ISO valide' }),
    end: z.string().datetime({ message: 'La date de fin doit être une date ISO valide' }),
});

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    // Validation des paramètres
    const validationResult = querySchema.safeParse({ start: startParam, end: endParam });

    if (!validationResult.success) {
        return NextResponse.json(
            { error: 'Paramètres de requête invalides', details: validationResult.error.errors },
            { status: 400 }
        );
    }

    const { start, end } = validationResult.data;

    try {
        // Convertir les chaînes en objets Date
        const startDate = new Date(start);
        const endDate = new Date(end);

        // Récupérer les affectations depuis la base de données
        const assignments = await prisma.assignment.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
                // Ajouter d'autres filtres si nécessaire (par exemple, par utilisateur, type...)
            },
            // Inclure les données utilisateur associées si nécessaire
            // include: {
            //     user: true,
            // }
        });

        return NextResponse.json({ assignments });

    } catch (error: any) {
        console.error('Erreur API [GET /api/assignments]:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la récupération des affectations.', details: error.message },
            { status: 500 }
        );
    }
}

// TODO: Implémenter les méthodes POST, PATCH, DELETE si nécessaire pour la sauvegarde, validation etc. 