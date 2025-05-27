import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma');


const prisma = prisma;

// GET /api/bloc-operatoire/gardes/vacations
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const trameId = searchParams.get('trameId');

        if (!trameId) {
            return NextResponse.json({ error: 'ID de tableau de service requis' }, { status: 400 });
        }

        // Récupérer les gardes/vacations pour une tableau de service spécifique
        const gardes/vacations = await prisma.blocAffectationHabituelle.findMany({
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

        return NextResponse.json(gardes/vacations);
    } catch (error) {
        console.error('Erreur lors de la récupération des gardes/vacations:', error);
        return NextResponse.json({ error: 'Erreur lors de la récupération des gardes/vacations' }, { status: 500 });
    }
}

// POST /api/bloc-operatoire/gardes/vacations
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
                details: 'Une salle d\'opération est requise pour les gardes/vacations de type BLOC_OPERATION'
            }, { status: 400 });
        }

        // Vérifier que la tableau de service existe
        const tableau de service = await prisma.blocTramePlanning.findUnique({
            where: { id: blocTramePlanningId }
        });

        if (!tableau de service) {
            return NextResponse.json({ error: 'Tableau de service non trouvée' }, { status: 404 });
        }

        // Créer l'garde/vacation
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
        console.error('Erreur lors de la création de l\'garde/vacation:', error);
        return NextResponse.json({
            error: 'Erreur lors de la création de l\'garde/vacation',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        }, { status: 500 });
    }
}

// DELETE /api/bloc-operatoire/gardes/vacations
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID d\'garde/vacation requis' }, { status: 400 });
        }

        // Vérifier que l'garde/vacation existe
        const garde/vacation = await prisma.blocAffectationHabituelle.findUnique({
            where: { id: parseInt(id) }
        });

        if (!garde/vacation) {
            return NextResponse.json({ error: 'Garde/Vacation non trouvée' }, { status: 404 });
        }

        // Supprimer l'garde/vacation
        await prisma.blocAffectationHabituelle.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true, message: 'Garde/Vacation supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'garde/vacation:', error);
        return NextResponse.json({
            error: 'Erreur lors de la suppression de l\'garde/vacation',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        }, { status: 500 });
    }
} 