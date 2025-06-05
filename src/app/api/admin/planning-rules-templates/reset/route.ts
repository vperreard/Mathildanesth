import { NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDefaultTemplates } from '@/lib/default-rule-templates';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        
        // Seuls les super admins peuvent réinitialiser les templates
        if (!session?.user || session.user.email !== 'admin@mathildanesth.fr') {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { action } = await request.json();

        if (action === 'reset-defaults') {
            // Récupérer les templates par défaut
            const defaultTemplates = getDefaultTemplates();
            
            // Réinitialiser chaque template par défaut
            for (const template of defaultTemplates) {
                await prisma.rulesTemplate.upsert({
                    where: {
                        name_isDefault: {
                            name: template.name,
                            isDefault: true
                        }
                    },
                    update: {
                        description: template.description || '',
                        category: template.category,
                        rules: template.rules,
                        fatigueConfig: template.fatigueConfig,
                        updatedAt: new Date()
                    },
                    create: {
                        name: template.name,
                        description: template.description || '',
                        category: template.category,
                        rules: template.rules,
                        fatigueConfig: template.fatigueConfig,
                        isDefault: true,
                        createdBy: session.user.id
                    }
                });
            }

            await prisma.activityLog.create({
                data: {
                    userId: session.user.id,
                    action: 'RESET_DEFAULT_TEMPLATES',
                    details: {
                        message: 'Réinitialisation des templates par défaut',
                        count: defaultTemplates.length
                    }
                }
            });

            return NextResponse.json({
                message: 'Modèles par défaut réinitialisés avec succès',
                count: defaultTemplates.length
            });
        }

        if (action === 'backup-current') {
            // Créer une sauvegarde de la configuration actuelle
            const currentConfig = await prisma.systemConfig.findMany({
                where: {
                    key: { in: ['PLANNING_RULES_CONFIG', 'FATIGUE_CONFIG'] }
                }
            });

            const backupName = `Backup - ${new Date().toLocaleDateString('fr-FR')}`;
            
            const rules = currentConfig.find(c => c.key === 'PLANNING_RULES_CONFIG')?.value || {};
            const fatigueConfig = currentConfig.find(c => c.key === 'FATIGUE_CONFIG')?.value || {};

            await prisma.rulesTemplate.create({
                data: {
                    name: backupName,
                    description: 'Sauvegarde automatique de la configuration actuelle',
                    category: 'CUSTOM',
                    rules: rules,
                    fatigueConfig: fatigueConfig,
                    isDefault: false,
                    createdBy: session.user.id
                }
            });

            return NextResponse.json({
                message: 'Configuration actuelle sauvegardée comme template',
                name: backupName
            });
        }

        return NextResponse.json(
            { error: 'Action non reconnue' },
            { status: 400 }
        );

    } catch (error: unknown) {
        logger.error('Erreur lors de la réinitialisation:', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { error: 'Erreur lors de la réinitialisation' },
            { status: 500 }
        );
    }
}