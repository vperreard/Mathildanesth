import { PrismaClient } from '@prisma/client';
import { defaultRuleTemplates } from '../src/lib/default-rule-templates';

const prisma = new PrismaClient();

async function seedDefaultRules() {
  console.log('🚀 Création des règles par défaut du système...\n');

  try {
    // 1. Règles de validation des gardes
    const gardeRules = [
      {
        name: 'Intervalle minimum entre gardes',
        description: 'Assure un repos minimum de 3 jours entre deux gardes de 24h',
        type: 'validation',
        priority: 90,
        status: 'active',
        conditions: {
          type: 'group',
          operator: 'AND',
          conditions: [
            {
              field: 'assignment.type',
              operator: 'equals',
              value: 'GARDE_24H'
            },
            {
              field: 'user.lastGuardDate',
              operator: 'greater',
              value: 'date.minus(3days)'
            }
          ]
        },
        actions: [
          {
            type: 'validate',
            parameters: {
              severity: 'error',
              message: 'Un minimum de 3 jours est requis entre deux gardes de 24h',
              violationType: 'MIN_INTERVAL'
            }
          }
        ],
        createdBy: 'system'
      },
      {
        name: 'Garde minimale week-end',
        description: 'Assure la présence d\'au moins 2 seniors les week-ends',
        type: 'generation',
        priority: 85,
        status: 'active',
        conditions: {
          type: 'group',
          operator: 'AND',
          conditions: [
            {
              field: 'date.dayOfWeek',
              operator: 'in',
              value: [0, 6] // Dimanche, Samedi
            },
            {
              field: 'planning.seniorCount',
              operator: 'less',
              value: 2
            }
          ]
        },
        actions: [
          {
            type: 'assign',
            parameters: {
              assignmentType: 'GARDE',
              shiftType: 'GARDE_24H',
              userCriteria: {
                experience: 'senior',
                available: true
              },
              count: 2
            }
          }
        ],
        createdBy: 'system'
      }
    ];

    // 2. Règles de fatigue
    const fatigueRules = [
      {
        name: 'Limite de fatigue critique',
        description: 'Bloque les affectations si le score de fatigue dépasse le seuil critique',
        type: 'validation',
        priority: 95,
        status: 'active',
        conditions: {
          field: 'metrics.fatigueScore',
          operator: 'greater',
          value: 80
        },
        actions: [
          {
            type: 'validate',
            parameters: {
              severity: 'error',
              message: 'Score de fatigue critique atteint. Repos obligatoire.',
              violationType: 'FATIGUE'
            }
          }
        ],
        createdBy: 'system'
      },
      {
        name: 'Alerte fatigue élevée',
        description: 'Avertit quand le score de fatigue est élevé',
        type: 'validation',
        priority: 70,
        status: 'active',
        conditions: {
          field: 'metrics.fatigueScore',
          operator: 'between',
          value: [60, 80]
        },
        actions: [
          {
            type: 'validate',
            parameters: {
              severity: 'warning',
              message: 'Attention: Score de fatigue élevé',
              violationType: 'FATIGUE_WARNING'
            }
          }
        ],
        createdBy: 'system'
      }
    ];

    // 3. Règles de congés
    const leaveRules = [
      {
        name: 'Limite congés période critique',
        description: 'Limite le nombre de congés simultanés pendant les périodes critiques',
        type: 'validation',
        priority: 80,
        status: 'active',
        conditions: {
          type: 'group',
          operator: 'AND',
          conditions: [
            {
              field: 'leave.type',
              operator: 'equals',
              value: 'CONGE_ANNUEL'
            },
            {
              field: 'date.period',
              operator: 'in',
              value: ['NOEL', 'NOUVEL_AN', 'ETE']
            },
            {
              field: 'planning.leaveCount',
              operator: 'greater',
              value: 2
            }
          ]
        },
        actions: [
          {
            type: 'validate',
            parameters: {
              severity: 'warning',
              message: 'Période critique: nombre de congés simultanés élevé',
              violationType: 'CRITICAL_PERIOD'
            }
          },
          {
            type: 'notify',
            parameters: {
              suggestion: 'Considérez une période alternative pour maintenir la couverture'
            }
          }
        ],
        createdBy: 'system'
      },
      {
        name: 'Validation quota congés',
        description: 'Vérifie que le quota de congés n\'est pas dépassé',
        type: 'validation',
        priority: 90,
        status: 'active',
        conditions: {
          type: 'group',
          operator: 'AND',
          conditions: [
            {
              field: 'leave.duration',
              operator: 'greater',
              value: 0
            },
            {
              field: 'metrics.remainingQuota',
              operator: 'less',
              value: 'leave.duration'
            }
          ]
        },
        actions: [
          {
            type: 'validate',
            parameters: {
              severity: 'error',
              message: 'Quota de congés insuffisant',
              violationType: 'QUOTA_EXCEEDED'
            }
          }
        ],
        createdBy: 'system'
      }
    ];

    // 4. Règles bloc opératoire
    const blocRules = [
      {
        name: 'Supervision salles spécialisées',
        description: 'Assure la présence de praticiens qualifiés pour les salles spécialisées',
        type: 'validation',
        priority: 85,
        status: 'active',
        conditions: {
          type: 'group',
          operator: 'AND',
          conditions: [
            {
              field: 'assignment.location',
              operator: 'contains',
              value: ['Neurochirurgie', 'Cardiologie', 'Chirurgie vasculaire']
            },
            {
              field: 'user.specialty',
              operator: 'not_equals',
              value: 'assignment.requiredSpecialty'
            }
          ]
        },
        actions: [
          {
            type: 'validate',
            parameters: {
              severity: 'error',
              message: 'Spécialité requise non correspondante',
              violationType: 'SPECIALTY_MISMATCH'
            }
          }
        ],
        createdBy: 'system'
      },
      {
        name: 'Ratio supervision junior/senior',
        description: 'Maintient un équilibre entre juniors et seniors',
        type: 'generation',
        priority: 75,
        status: 'active',
        conditions: {
          type: 'group',
          operator: 'AND',
          conditions: [
            {
              field: 'planning.juniorRatio',
              operator: 'greater',
              value: 0.5
            },
            {
              field: 'assignment.type',
              operator: 'equals',
              value: 'BLOC'
            }
          ]
        },
        actions: [
          {
            type: 'assign',
            parameters: {
              assignmentType: 'BLOC',
              userCriteria: {
                experience: 'senior',
                available: true
              },
              priority: 'high'
            }
          }
        ],
        createdBy: 'system'
      }
    ];

    // 5. Règles d'équité
    const equityRules = [
      {
        name: 'Équilibrage des gardes',
        description: 'Favorise les praticiens avec moins de gardes',
        type: 'generation',
        priority: 60,
        status: 'active',
        conditions: {
          field: 'assignment.type',
          operator: 'equals',
          value: 'GARDE'
        },
        actions: [
          {
            type: 'assign',
            parameters: {
              userCriteria: {
                sortBy: 'gardeCount',
                order: 'asc',
                available: true
              }
            }
          }
        ],
        createdBy: 'system'
      }
    ];

    // Créer toutes les règles
    const allRules = [
      ...gardeRules,
      ...fatigueRules,
      ...leaveRules,
      ...blocRules,
      ...equityRules
    ];

    for (const rule of allRules) {
      const existing = await prisma.planningRule.findFirst({
        where: { name: rule.name }
      });

      if (!existing) {
        const created = await prisma.planningRule.create({
          data: {
            ...rule,
            conditions: rule.conditions as any,
            actions: rule.actions as any,
            metadata: {
              category: rule.type === 'validation' ? 'Validation' : 'Génération',
              tags: [],
              isDefault: true
            }
          }
        });

        // Créer les métriques associées
        await prisma.ruleMetrics.create({
          data: {
            ruleId: created.id,
            executionCount: 0,
            successCount: 0,
            failureCount: 0,
            avgExecutionTime: 0,
            impactScore: 0
          }
        });

        console.log(`✅ Règle créée: ${rule.name}`);
      } else {
        console.log(`⏭️  Règle existante: ${rule.name}`);
      }
    }

    // Créer également les templates par défaut
    console.log('\n📋 Création des modèles de règles...\n');
    
    for (const template of defaultRuleTemplates) {
      const existing = await prisma.planningRuleTemplate.findFirst({
        where: { name: template.name }
      });

      if (!existing) {
        await prisma.planningRuleTemplate.create({
          data: template
        });
        console.log(`✅ Modèle créé: ${template.name}`);
      } else {
        console.log(`⏭️  Modèle existant: ${template.name}`);
      }
    }

    console.log('\n✅ Règles et modèles par défaut créés avec succès!');
    console.log(`📊 Total: ${allRules.length} règles, ${defaultRuleTemplates.length} modèles`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des règles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDefaultRules().catch(console.error);