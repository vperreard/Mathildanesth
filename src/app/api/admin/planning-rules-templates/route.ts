import { NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RulesConfiguration, FatigueConfig } from '@/types/rules';
import { getDefaultTemplates } from '@/lib/default-rule-templates';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Récupérer tous les templates
        const templates = await prisma.rulesTemplate.findMany({
            orderBy: [
                { isDefault: 'desc' },
                { category: 'asc' },
                { name: 'asc' }
            ]
        });

        return NextResponse.json({ templates });

    } catch (error) {
        logger.error('Erreur lors de la récupération des templates:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des templates' },
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

        // Seuls les super admins peuvent créer des templates par défaut
        const canCreateDefault = session.user.email === 'admin@mathildanesth.fr' || session.user.role === 'SUPER_ADMIN';
        
        const template = await prisma.rulesTemplate.create({
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
            template 
        });

    } catch (error) {
        logger.error('Erreur lors de la création du template:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la création du template' },
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

        // Vérifier que le template existe et n'est pas un template par défaut
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
                { error: 'Les templates par défaut ne peuvent pas être modifiés' },
                { status: 403 }
            );
        }

        const template = await prisma.rulesTemplate.update({
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
            template 
        });

    } catch (error) {
        logger.error('Erreur lors de la mise à jour du template:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour du template' },
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
                { error: 'ID du template requis' },
                { status: 400 }
            );
        }

        const template = await prisma.rulesTemplate.findUnique({
            where: { id }
        });

        if (!template) {
            return NextResponse.json(
                { error: 'Modèle non trouvé' },
                { status: 404 }
            );
        }

        if (template.isDefault) {
            return NextResponse.json(
                { error: 'Les templates par défaut ne peuvent pas être supprimés' },
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
        logger.error('Erreur lors de la suppression du template:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la suppression du template' },
            { status: 500 }
        );
    }
}