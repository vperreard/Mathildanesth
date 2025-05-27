import { PrismaClient } from '@prisma/client';
import { RuleV2 } from '../src/modules/dynamicRules/v2/types/ruleV2.types';
import { RulesConfiguration, defaultRulesConfiguration } from '../src/types/rules';

const prisma = new PrismaClient();

async function migrateRulesToV2() {
  console.log('🚀 Début de la migration des règles vers v2...');

  try {
    // 1. Récupérer la configuration existante
    const existingConfig = await prisma.systemConfig.findUnique({
      where: { key: 'PLANNING_RULES_CONFIG' }
    });

    const rulesConfig: RulesConfiguration = existingConfig?.value 
      ? JSON.parse(existingConfig.value as string)
      : defaultRulesConfiguration;

    // 2. Créer les règles v2 à partir de la configuration
    const rulesToCreate: Partial<RuleV2>[] = [];

    // Règles d'intervalle
    if (rulesConfig.intervalle.enabled) {
      rulesToCreate.push({
        name: 'Jours minimum entre gardes',
        description: `Au moins ${rulesConfig.intervalle.minJoursEntreGardes} jour(s) entre deux gardes`,
        type: 'CONSTRAINT',
        priority: 15,
        enabled: true,
        status: 'active',
        conditions: [
          {
            field: 'previous.type',
            operator: 'EQUALS',
            value: 'GUARD'
          },
          {
            field: 'daysSincePrevious',
            operator: 'LESS_THAN',
            value: rulesConfig.intervalle.minJoursEntreGardes
          }
        ],
        actions: [
          {
            type: 'PREVENT',
            target: 'assignment',
            message: `Repos de ${rulesConfig.intervalle.minJoursEntreGardes} jour(s) minimum entre les gardes`
          }
        ],
        tags: ['garde', 'repos', 'intervalle'],
        contexts: ['planning']
      });

      rulesToCreate.push({
        name: 'Maximum gardes par mois',
        description: `Maximum ${rulesConfig.intervalle.maxGardesMois} gardes par mois`,
        type: 'PLANNING',
        priority: 10,
        enabled: true,
        status: 'active',
        conditions: [
          {
            field: 'period',
            operator: 'EQUALS',
            value: 'month'
          },
          {
            field: 'planning.guardCount',
            operator: 'GREATER_THAN',
            value: rulesConfig.intervalle.maxGardesMois
          }
        ],
        actions: [
          {
            type: 'PREVENT',
            target: 'assignment',
            message: `Limite de ${rulesConfig.intervalle.maxGardesMois} gardes par mois atteinte`
          }
        ],
        tags: ['garde', 'limite', 'mensuel'],
        contexts: ['planning']
      });

      rulesToCreate.push({
        name: 'Maximum gardes consécutives',
        description: `Maximum ${rulesConfig.intervalle.maxGardesConsecutives} gardes consécutives`,
        type: 'CONSTRAINT',
        priority: 20,
        enabled: true,
        status: 'active',
        conditions: [
          {
            field: 'planning.consecutiveGuards',
            operator: 'GREATER_THAN_OR_EQUALS',
            value: rulesConfig.intervalle.maxGardesConsecutives
          }
        ],
        actions: [
          {
            type: 'PREVENT',
            target: 'assignment',
            message: `Maximum ${rulesConfig.intervalle.maxGardesConsecutives} gardes consécutives`
          }
        ],
        tags: ['garde', 'consécutif', 'limite'],
        contexts: ['planning']
      });
    }

    // Règles de supervision
    if (rulesConfig.supervision.enabled) {
      Object.entries(rulesConfig.supervision.maxSallesParMAR).forEach(([sector, maxRooms]) => {
        rulesToCreate.push({
          name: `Supervision ${sector}`,
          description: `Maximum ${maxRooms} salles par MAR dans le secteur ${sector}`,
          type: 'SUPERVISION',
          priority: 15,
          enabled: true,
          status: 'active',
          conditions: [
            {
              field: 'assignment.sector',
              operator: 'EQUALS',
              value: sector
            },
            {
              field: 'user.role',
              operator: 'EQUALS',
              value: 'MAR'
            },
            {
              field: 'assignment.roomCount',
              operator: 'GREATER_THAN',
              value: maxRooms
            }
          ],
          actions: [
            {
              type: 'PREVENT',
              target: 'assignment',
              message: `Maximum ${maxRooms} salles par MAR dans ce secteur`
            },
            {
              type: 'NOTIFY',
              target: 'admin',
              message: `Surcharge de supervision détectée dans le secteur ${sector}`
            }
          ],
          tags: ['supervision', 'MAR', sector.toLowerCase()],
          contexts: ['planning', 'bloc']
        });
      });

      if (rulesConfig.supervision.needSeniorMAR) {
        rulesToCreate.push({
          name: 'Présence MAR senior obligatoire',
          description: 'Au moins un MAR senior doit être présent',
          type: 'SUPERVISION',
          priority: 20,
          enabled: true,
          status: 'active',
          conditions: [
            {
              field: 'planning.seniorMARCount',
              operator: 'EQUALS',
              value: 0
            }
          ],
          actions: [
            {
              type: 'PREVENT',
              target: 'planning',
              message: 'Un MAR senior est requis'
            },
            {
              type: 'SUGGEST',
              target: 'planning',
              message: 'Ajouter un MAR senior à ce planning'
            }
          ],
          tags: ['supervision', 'senior', 'MAR'],
          contexts: ['planning']
        });
      }
    }

    // Règles de repos
    if (rulesConfig.minimumRestPeriod > 0) {
      rulesToCreate.push({
        name: 'Période de repos minimum',
        description: `${rulesConfig.minimumRestPeriod}h de repos minimum entre deux affectations`,
        type: 'CONSTRAINT',
        priority: 18,
        enabled: true,
        status: 'active',
        conditions: [
          {
            field: 'hoursSincePrevious',
            operator: 'LESS_THAN',
            value: rulesConfig.minimumRestPeriod
          }
        ],
        actions: [
          {
            type: 'PREVENT',
            target: 'assignment',
            message: `Repos de ${rulesConfig.minimumRestPeriod}h requis`
          }
        ],
        tags: ['repos', 'récupération'],
        contexts: ['planning']
      });
    }

    // Règles d'équité
    if (rulesConfig.equite.enabled) {
      rulesToCreate.push({
        name: 'Équilibrage des gardes',
        description: `Limite l'écart à ${rulesConfig.equite.maxEcartGardes} gardes entre utilisateurs`,
        type: 'ALLOCATION',
        priority: 5,
        enabled: true,
        status: 'active',
        conditions: [
          {
            field: 'team.guardDifference',
            operator: 'GREATER_THAN',
            value: rulesConfig.equite.maxEcartGardes
          }
        ],
        actions: [
          {
            type: 'SUGGEST',
            target: 'planning',
            message: 'Rééquilibrer la distribution des gardes'
          },
          {
            type: 'LOG',
            message: 'Déséquilibre de gardes détecté'
          }
        ],
        tags: ['équité', 'garde', 'équilibrage'],
        contexts: ['planning']
      });
    }

    // 3. Créer les règles dans la base de données
    console.log(`📝 Création de ${rulesToCreate.length} règles...`);

    for (const rule of rulesToCreate) {
      try {
        const createdRule = await prisma.planningRule.create({
          data: {
            id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: rule.name!,
            description: rule.description!,
            type: rule.type!,
            priority: rule.priority!,
            enabled: rule.enabled!,
            status: rule.status!,
            version: 1,
            createdBy: 'system-migration',
            updatedBy: 'system-migration',
            effectiveDate: new Date(),
            conditions: rule.conditions as any,
            actions: rule.actions as any,
            tags: rule.tags || [],
            contexts: rule.contexts || [],
            metadata: {
              source: 'v1-migration',
              migratedAt: new Date().toISOString()
            }
          }
        });

        console.log(`✅ Règle créée: ${createdRule.name}`);

        // Créer la version initiale
        await prisma.ruleVersion.create({
          data: {
            id: `${createdRule.id}-v1`,
            ruleId: createdRule.id,
            version: 1,
            changes: [],
            createdBy: 'system-migration',
            message: 'Migration depuis configuration v1',
            snapshot: JSON.stringify(createdRule)
          }
        });

      } catch (error) {
        console.error(`❌ Erreur lors de la création de la règle "${rule.name}":`, error);
      }
    }

    // 4. Créer les templates par défaut
    console.log('\n📋 Importation des templates par défaut...');
    
    const defaultTemplates = await prisma.systemConfig.findUnique({
      where: { key: 'RULE_TEMPLATES_V2' }
    });

    if (!defaultTemplates) {
      await prisma.systemConfig.create({
        data: {
          key: 'RULE_TEMPLATES_V2',
          value: JSON.stringify({
            templates: [
              'max-guards-week',
              'rest-after-guard',
              'min-senior-per-shift',
              'workload-balance',
              'leave-conflict-prevention'
            ],
            imported: true,
            importDate: new Date().toISOString()
          }),
          description: 'Templates de règles v2 importés',
          updatedBy: 'system-migration'
        }
      });
      console.log('✅ Templates par défaut configurés');
    }

    // 5. Marquer la migration comme complète
    await prisma.systemConfig.upsert({
      where: { key: 'RULES_V2_MIGRATION_COMPLETED' },
      update: {
        value: JSON.stringify({
          completed: true,
          date: new Date().toISOString(),
          rulesCreated: rulesToCreate.length
        }),
        updatedAt: new Date()
      },
      create: {
        key: 'RULES_V2_MIGRATION_COMPLETED',
        value: JSON.stringify({
          completed: true,
          date: new Date().toISOString(),
          rulesCreated: rulesToCreate.length
        }),
        description: 'Migration des règles vers v2 complétée',
        updatedBy: 'system-migration'
      }
    });

    console.log('\n✨ Migration terminée avec succès!');
    console.log(`📊 ${rulesToCreate.length} règles créées`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Vérifier si le script est exécuté directement
if (require.main === module) {
  migrateRulesToV2();
}

export { migrateRulesToV2 };