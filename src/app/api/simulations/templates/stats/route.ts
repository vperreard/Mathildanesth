import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Type pour les statistiques
interface TemplateUsageStats {
    templateId: string;
    templateName: string;
    usageCount: number;
    lastUsed: string | null;
}

interface CategoryStats {
    category: string;
    count: number;
    percentage: number;
}

// Route pour obtenir les statistiques des templates de simulation
export async function GET() {
    try {
        // Vérifier l'authentification
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Récupérer tous les templates
        const totalTemplates = await prisma.simulationTemplate.count();

        // Récupérer le nombre total d'utilisations
        const simulationsCount = await prisma.simulationScenario.count({
            where: {
                templateId: {
                    not: null,
                },
            },
        });

        // Récupérer les templates les plus utilisés
        const mostUsedTemplates = await prisma.simulationTemplate.findMany({
            select: {
                id: true,
                name: true,
                _count: {
                    select: {
                        scenarios: true,
                    },
                },
                scenarios: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                    select: {
                        createdAt: true,
                    },
                },
            },
            orderBy: {
                scenarios: {
                    _count: 'desc',
                },
            },
            take: 5,
        });

        // Récupérer les templates récemment utilisés
        const recentlyUsedTemplates = await prisma.simulationTemplate.findMany({
            where: {
                scenarios: {
                    some: {},
                },
            },
            select: {
                id: true,
                name: true,
                _count: {
                    select: {
                        scenarios: true,
                    },
                },
                scenarios: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                    select: {
                        createdAt: true,
                    },
                },
            },
            orderBy: {
                scenarios: {
                    _max: {
                        createdAt: 'desc',
                    },
                },
            },
            take: 5,
        });

        // Récupérer la distribution par catégorie
        const categoriesRaw = await prisma.simulationTemplate.groupBy({
            by: ['category'],
            _count: true,
        });

        // Formater les données pour la réponse
        const formattedMostUsed: TemplateUsageStats[] = mostUsedTemplates.map((template) => ({
            templateId: template.id,
            templateName: template.name,
            usageCount: template._count.scenarios,
            lastUsed: template.scenarios[0]?.createdAt.toISOString() || null,
        }));

        const formattedRecentlyUsed: TemplateUsageStats[] = recentlyUsedTemplates.map((template) => ({
            templateId: template.id,
            templateName: template.name,
            usageCount: template._count.scenarios,
            lastUsed: template.scenarios[0]?.createdAt.toISOString() || null,
        }));

        const categoryBreakdown: CategoryStats[] = categoriesRaw.map((cat) => {
            const category = cat.category || 'Non catégorisé';
            return {
                category,
                count: cat._count,
                percentage: Math.round((cat._count / totalTemplates) * 100),
            };
        });

        return NextResponse.json({
            totalTemplates,
            totalUsage: simulationsCount,
            mostUsedTemplates: formattedMostUsed,
            recentlyUsed: formattedRecentlyUsed,
            categoryBreakdown,
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
} 