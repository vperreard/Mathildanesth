import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma');


const prisma = prisma;

// GET /api/bloc-operatoire/affectations
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const trameId = searchParams.get('trameId');

        if (!trameId) {
            return NextResponse.json({ error: 'ID de trame requis' }, { status: 400 });
        }

        // Récupérer les affectations pour une trame spécifique
        const affectations = await prisma.blocAffectationHabituelle.findMany({
            where: {
                blocTramePlanningId: parseInt(trameId)
            },
            include: {
                user: true,
                surgeon: true,
                blocTramePlanning: {
                    include: {
                        site: true
                    }
                }
            },
            orderBy: [
                { jourSemaine: 'asc' },
                { periode: 'asc' }
            ]
        });

        return NextResponse.json(affectations);
    } catch (error) {
        console.error('Erreur lors de la récupération des affectations:', error);
        return NextResponse.json({ error: 'Erreur lors de la récupération des affectations' }, { status: 500 });
    }
}

// POST /api/bloc-operatoire/affectations
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const data = await request.json();
        const {
            blocTramePlanningId,
            userId,
            chirurgienId,
            jourSemaine,
            periode,
            typeSemaine,
            typeAffectation,
            roleInAffectation,
            operatingRoomId,
            specialiteChir
        } = data;

        // Validation des données
        if (!blocTramePlanningId || !jourSemaine || !periode || !typeSemaine || !typeAffectation) {
            return NextResponse.json({
                error: 'Données incomplètes',
                details: 'blocTramePlanningId, jourSemaine, periode, typeSemaine et typeAffectation sont requis'
            }, { status: 400 });
        }

        // Pour le type BLOC_OPERATION, une salle est requise
        if (typeAffectation === 'BLOC_OPERATION' && !operatingRoomId) {
            return NextResponse.json({
                error: 'Salle requise',
                details: 'Une salle d\'opération est requise pour les affectations de type BLOC_OPERATION'
            }, { status: 400 });
        }

        // Vérifier que la trame existe
        const trame = await prisma.blocTramePlanning.findUnique({
            where: { id: blocTramePlanningId }
        });

        if (!trame) {
            return NextResponse.json({ error: 'Trame non trouvée' }, { status: 404 });
        }

        // Créer l'affectation
        const newAffectation = await prisma.blocAffectationHabituelle.create({
            data: {
                blocTramePlanningId,
                userId,
                chirurgienId,
                jourSemaine,
                periode,
                typeSemaine,
                typeAffectation,
                roleInAffectation,
                operatingRoomId,
                specialiteChir,
                priorite: data.priorite || 5
            },
            include: {
                user: true,
                surgeon: true,
                blocTramePlanning: true
            }
        });

        return NextResponse.json(newAffectation, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création de l\'affectation:', error);
        return NextResponse.json({
            error: 'Erreur lors de la création de l\'affectation',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        }, { status: 500 });
    }
}

// DELETE /api/bloc-operatoire/affectations
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID d\'affectation requis' }, { status: 400 });
        }

        // Vérifier que l'affectation existe
        const affectation = await prisma.blocAffectationHabituelle.findUnique({
            where: { id: parseInt(id) }
        });

        if (!affectation) {
            return NextResponse.json({ error: 'Affectation non trouvée' }, { status: 404 });
        }

        // Supprimer l'affectation
        await prisma.blocAffectationHabituelle.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true, message: 'Affectation supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'affectation:', error);
        return NextResponse.json({
            error: 'Erreur lors de la suppression de l\'affectation',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        }, { status: 500 });
    }
} 