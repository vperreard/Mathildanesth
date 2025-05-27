import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RulesConfiguration, FatigueConfig } from '@/types/rules';
import { getDefaultTemplates } from '@/lib/default-rule-modèles';

jest.mock('@/lib/prisma');


export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Récupérer tous les modèles
        const modèles = await prisma.rulesTemplate.findMany({
            orderBy: [
                { isDefault: 'desc' },
                { category: 'asc' },
                { name: 'asc' }
            ]
        });

        return NextResponse.json({ modèles });

    } catch (error) {
        console.error('Erreur lors de la récupération des modèles:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des modèles' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { name, description, category, rules, fatigueConfig, isDefault = false } = await request.json();

        // Seuls les super admins peuvent créer des modèles par défaut
        const canCreateDefault = session.user.email === 'admin@mathildanesth.fr' || session.user.role === 'SUPER_ADMIN';
        
        const modèle = await prisma.rulesTemplate.create({
            data: {
                name,
                description,
                category,
                rules,
                fatigueConfig,
                isDefault: isDefault && canCreateDefault,
                createdBy: session.user.id
            }
        });

        await prisma.activityLog.create({
            data: {
                userId: session.user.id,
                action: 'CREATE_RULES_TEMPLATE',
                details: {
                    templateName: name,
                    category
                }
            }
        });

        return NextResponse.json({ 
            message: 'Modèle créé avec succès',
            modèle 
        });

    } catch (error) {
        console.error('Erreur lors de la création du modèle:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la création du modèle' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { id, name, description, rules, fatigueConfig } = await request.json();

        // Vérifier que le modèle existe et n'est pas un modèle par défaut
        const existingTemplate = await prisma.rulesTemplate.findUnique({
            where: { id }
        });

        if (!existingTemplate) {
            return NextResponse.json(
                { error: 'Modèle non trouvé' },
                { status: 404 }
            );
        }

        if (existingTemplate.isDefault) {
            return NextResponse.json(
                { error: 'Les modèles par défaut ne peuvent pas être modifiés' },
                { status: 403 }
            );
        }

        const modèle = await prisma.rulesTemplate.update({
            where: { id },
            data: {
                name,
                description,
                rules,
                fatigueConfig,
                updatedAt: new Date()
            }
        });

        return NextResponse.json({ 
            message: 'Modèle mis à jour avec succès',
            modèle 
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour du modèle:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour du modèle' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'ID du modèle requis' },
                { status: 400 }
            );
        }

        const modèle = await prisma.rulesTemplate.findUnique({
            where: { id }
        });

        if (!modèle) {
            return NextResponse.json(
                { error: 'Modèle non trouvé' },
                { status: 404 }
            );
        }

        if (modèle.isDefault) {
            return NextResponse.json(
                { error: 'Les modèles par défaut ne peuvent pas être supprimés' },
                { status: 403 }
            );
        }

        await prisma.rulesTemplate.delete({
            where: { id }
        });

        return NextResponse.json({ 
            message: 'Modèle supprimé avec succès' 
        });

    } catch (error) {
        console.error('Erreur lors de la suppression du modèle:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la suppression du modèle' },
            { status: 500 }
        );
    }
}