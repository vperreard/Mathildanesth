import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';


// Récupérer une règle de planning par ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);

        // Vérifier l'authentification
        if (!session) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'ID invalide' },
                { status: 400 }
            );
        }

        const planningRule = await prisma.planningRule.findUnique({
            where: { id },
            include: {
                createdByUser: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true
                    }
                }
            }
        });

        if (!planningRule) {
            return NextResponse.json(
                { error: 'Règle de planning non trouvée' },
                { status: 404 }
            );
        }

        return NextResponse.json(planningRule);
    } catch (error) {
        console.error('Erreur lors de la récupération de la règle de planning:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération de la règle de planning' },
            { status: 500 }
        );
    }
}

// Mettre à jour une règle de planning
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);

        // Vérifier l'authentification et les droits d'admin
        if (!session || !session.user || !["ADMIN_TOTAL", "ADMIN_PARTIEL"].includes(session.user.role as string)) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'ID invalide' },
                { status: 400 }
            );
        }

        const data = await req.json();

        // Validation des données
        if (!data.name || !data.type) {
            return NextResponse.json(
                { error: 'Le nom et le type sont requis' },
                { status: 400 }
            );
        }

        // Valider le type
        const validTypes = ['bloc', 'garde', 'astreinte', 'consultation', 'autre'];
        if (!validTypes.includes(data.type)) {
            return NextResponse.json(
                { error: 'Type invalide. Valeurs valides: ' + validTypes.join(', ') },
                { status: 400 }
            );
        }

        // Vérifier si la règle existe
        const existingRule = await prisma.planningRule.findUnique({
            where: { id },
        });

        if (!existingRule) {
            return NextResponse.json(
                { error: 'Règle de planning non trouvée' },
                { status: 404 }
            );
        }

        // Mettre à jour la règle de planning
        const updatedRule = await prisma.planningRule.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                type: data.type,
                isActive: data.isActive,
                priority: data.priority,
                configuration: data.configuration,
            },
        });

        return NextResponse.json(updatedRule);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la règle de planning:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour de la règle de planning' },
            { status: 500 }
        );
    }
}

// Supprimer une règle de planning
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);

        // Vérifier l'authentification et les droits d'admin
        if (!session || !session.user || !["ADMIN_TOTAL", "ADMIN_PARTIEL"].includes(session.user.role as string)) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'ID invalide' },
                { status: 400 }
            );
        }

        // Vérifier si la règle existe
        const existingRule = await prisma.planningRule.findUnique({
            where: { id },
        });

        if (!existingRule) {
            return NextResponse.json(
                { error: 'Règle de planning non trouvée' },
                { status: 404 }
            );
        }

        // Supprimer la règle de planning
        await prisma.planningRule.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur lors de la suppression de la règle de planning:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la suppression de la règle de planning' },
            { status: 500 }
        );
    }
} 