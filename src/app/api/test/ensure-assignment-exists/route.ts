import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Vérifier si nous sommes en environnement de test
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.CYPRESS === 'true';

/**
 * POST /api/test/ensure-assignment-exists
 * S'assure qu'une affectation de test existe pour les tests E2E
 * Cet endpoint est uniquement disponible en environnement de test
 */
export async function POST(request: NextRequest) {
    // Vérifier l'environnement
    if (!isTestEnv) {
        console.error("Tentative d'accès à un endpoint de test en environnement de production");
        return NextResponse.json({ error: 'Endpoint disponible uniquement en environnement de test' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { id, userId, date, type, salle } = body;

        // Vérifier si l'affectation existe déjà
        const existingAssignment = await prisma.assignment.findUnique({
            where: { id }
        });

        if (existingAssignment) {
            // L'affectation existe déjà, renvoyer ses informations
            return NextResponse.json({
                message: 'L\'affectation existe déjà',
                assignment: existingAssignment
            });
        }

        // Créer une nouvelle affectation
        const newAssignment = await prisma.assignment.create({
            data: {
                id,
                userId,
                date: new Date(date),
                type,
                salle,
                heureDebut: '08:00',
                heureFin: '18:00'
            }
        });

        return NextResponse.json({
            message: 'Affectation créée avec succès',
            assignment: newAssignment
        }, { status: 201 });

    } catch (error: any) {
        console.error("Erreur lors de la création de l'affectation de test:", error);
        return NextResponse.json({
            error: 'Erreur lors de la création de l\'affectation de test',
            details: error.message
        }, { status: 500 });
    }
} 