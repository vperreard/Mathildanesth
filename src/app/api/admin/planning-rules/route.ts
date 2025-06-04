import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RulesConfiguration, FatigueConfig, defaultRulesConfiguration, defaultFatigueConfig } from '@/types/rules';

// Clé pour stocker la configuration dans la base de données
const CONFIG_KEY = 'PLANNING_RULES_CONFIG';
const FATIGUE_CONFIG_KEY = 'FATIGUE_CONFIG';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Récupérer la configuration depuis la base de données
        const [rulesConfig, fatigueConfig] = await Promise.all([
            prisma.systemConfig.findUnique({
                where: { key: CONFIG_KEY }
            }),
            prisma.systemConfig.findUnique({
                where: { key: FATIGUE_CONFIG_KEY }
            })
        ]);

        return NextResponse.json({
            rules: rulesConfig?.value ? JSON.parse(rulesConfig.value as string) : defaultRulesConfiguration,
            fatigueConfig: fatigueConfig?.value ? JSON.parse(fatigueConfig.value as string) : defaultFatigueConfig
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des règles:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération de la configuration' },
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

        const { rules, fatigueConfig } = await request.json();

        // Valider les données
        if (!rules || !fatigueConfig) {
            return NextResponse.json(
                { error: 'Données invalides' },
                { status: 400 }
            );
        }

        // Sauvegarder en base de données
        await Promise.all([
            prisma.systemConfig.upsert({
                where: { key: CONFIG_KEY },
                update: {
                    value: JSON.stringify(rules),
                    updatedAt: new Date(),
                    updatedBy: session.user.id
                },
                create: {
                    key: CONFIG_KEY,
                    value: JSON.stringify(rules),
                    description: 'Configuration des règles de génération de planning',
                    updatedBy: session.user.id
                }
            }),
            prisma.systemConfig.upsert({
                where: { key: FATIGUE_CONFIG_KEY },
                update: {
                    value: JSON.stringify(fatigueConfig),
                    updatedAt: new Date(),
                    updatedBy: session.user.id
                },
                create: {
                    key: FATIGUE_CONFIG_KEY,
                    value: JSON.stringify(fatigueConfig),
                    description: 'Configuration du système de fatigue',
                    updatedBy: session.user.id
                }
            })
        ]);

        // Log l'activité
        await prisma.activityLog.create({
            data: {
                userId: session.user.id,
                action: 'UPDATE_PLANNING_RULES',
                details: {
                    message: 'Mise à jour des règles de planning',
                    changes: {
                        rules: Object.keys(rules),
                        fatigueEnabled: fatigueConfig.enabled
                    }
                }
            }
        });

        return NextResponse.json({
            message: 'Configuration mise à jour avec succès',
            rules,
            fatigueConfig
        });

    } catch (error) {
        console.error('Erreur lors de la sauvegarde des règles:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la sauvegarde de la configuration' },
            { status: 500 }
        );
    }
}

// Export des règles pour validation
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { action } = await request.json();

        if (action === 'export') {
            // Exporter la configuration actuelle
            const [rulesConfig, fatigueConfig] = await Promise.all([
                prisma.systemConfig.findUnique({
                    where: { key: CONFIG_KEY }
                }),
                prisma.systemConfig.findUnique({
                    where: { key: FATIGUE_CONFIG_KEY }
                })
            ]);

            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                exportedBy: session.user.email,
                rules: rulesConfig?.value ? JSON.parse(rulesConfig.value as string) : defaultRulesConfiguration,
                fatigueConfig: fatigueConfig?.value ? JSON.parse(fatigueConfig.value as string) : defaultFatigueConfig
            };

            return NextResponse.json(exportData, {
                headers: {
                    'Content-Disposition': `attachment; filename="planning-rules-${new Date().toISOString().split('T')[0]}.json"`
                }
            });
        }

        if (action === 'validate') {
            // Valider que les règles sont cohérentes
            const { rules } = await request.json();
            const validationErrors = validateRules(rules);

            if (validationErrors.length > 0) {
                return NextResponse.json({
                    valid: false,
                    errors: validationErrors
                });
            }

            return NextResponse.json({
                valid: true,
                message: 'Règles valides'
            });
        }

        return NextResponse.json(
            { error: 'Action non reconnue' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Erreur dans l\'action:', error);
        return NextResponse.json(
            { error: 'Erreur lors du traitement' },
            { status: 500 }
        );
    }
}

// Fonction de validation des règles
function validateRules(rules: RulesConfiguration): string[] {
    const errors: string[] = [];

    // Validation des intervalles
    if (rules.intervalle.minJoursEntreGardes < 1) {
        errors.push('Le nombre minimum de jours entre gardes doit être au moins 1');
    }

    if (rules.intervalle.maxGardesMois < 1) {
        errors.push('Le nombre maximum de gardes par mois doit être au moins 1');
    }

    if (rules.intervalle.maxGardesConsecutives < 1) {
        errors.push('Le nombre maximum de gardes consécutives doit être au moins 1');
    }

    // Validation de la supervision
    Object.entries(rules.supervision.maxSallesParMAR).forEach(([sector, max]) => {
        if (max < 1 || max > 5) {
            errors.push(`Le nombre de salles pour le secteur ${sector} doit être entre 1 et 5`);
        }
    });

    // Validation des périodes de repos
    if (rules.minimumRestPeriod < 8 || rules.minimumRestPeriod > 24) {
        errors.push('La période de repos minimum doit être entre 8 et 24 heures');
    }

    // Validation de l'équité
    if (rules.equite.poidsGardesWeekend < 1 || rules.equite.poidsGardesWeekend > 3) {
        errors.push('Le poids des gardes de weekend doit être entre 1 et 3');
    }

    return errors;
}