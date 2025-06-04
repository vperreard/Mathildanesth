import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeRuleMetrics() {
  console.log('🚀 Initialisation des métriques pour les règles v2...');

  try {
    // 1. Récupérer toutes les règles qui n'ont pas encore de métriques
    const rulesWithoutMetrics = await prisma.planningRule.findMany({
      where: {
        metrics: null
      },
      select: {
        id: true,
        name: true
      }
    });

    console.log(`📊 ${rulesWithoutMetrics.length} règles sans métriques trouvées`);

    // 2. Créer les métriques initiales pour chaque règle
    for (const rule of rulesWithoutMetrics) {
      try {
        await prisma.ruleMetrics.create({
          data: {
            ruleId: rule.id,
            evaluationCount: 0,
            averageExecutionTime: 0,
            successRate: 0,
            impactedUsersCount: 0,
            violationCount: 0
          }
        });

        console.log(`✅ Métriques créées pour: ${rule.name}`);
      } catch (error) {
        // Si les métriques existent déjà, on continue
        if (error.code === 'P2002') {
          console.log(`ℹ️  Métriques déjà existantes pour: ${rule.name}`);
        } else {
          console.error(`❌ Erreur pour ${rule.name}:`, error);
        }
      }
    }

    // 3. Initialiser quelques données de démonstration pour les règles actives
    const activeRules = await prisma.planningRule.findMany({
      where: {
        status: 'active',
        enabled: true
      },
      include: {
        metrics: true
      }
    });

    console.log(`\n📈 Génération de données de démonstration pour ${activeRules.length} règles actives...`);

    for (const rule of activeRules) {
      if (rule.metrics) {
        // Générer des métriques aléatoires mais réalistes
        const baseEvaluations = Math.floor(Math.random() * 10000) + 1000;
        const successRate = 0.7 + Math.random() * 0.25; // Entre 70% et 95%
        const violations = Math.floor(baseEvaluations * (1 - successRate));
        
        await prisma.ruleMetrics.update({
          where: { id: rule.metrics.id },
          data: {
            evaluationCount: baseEvaluations,
            averageExecutionTime: Math.floor(Math.random() * 50) + 5, // Entre 5ms et 55ms
            successRate: successRate,
            lastEvaluatedAt: new Date(),
            impactedUsersCount: Math.floor(Math.random() * 50) + 10,
            violationCount: violations
          }
        });

        console.log(`📊 Métriques mises à jour pour: ${rule.name}`);
      }
    }

    // 4. Créer un log d'activité pour l'initialisation
    await prisma.systemConfig.upsert({
      where: { key: 'RULE_METRICS_INITIALIZED' },
      update: {
        value: JSON.stringify({
          initialized: true,
          date: new Date().toISOString(),
          rulesCount: rulesWithoutMetrics.length,
          activeRulesWithData: activeRules.length
        }),
        updatedAt: new Date(),
        updatedBy: 1 // System user
      },
      create: {
        key: 'RULE_METRICS_INITIALIZED',
        value: JSON.stringify({
          initialized: true,
          date: new Date().toISOString(),
          rulesCount: rulesWithoutMetrics.length,
          activeRulesWithData: activeRules.length
        }),
        description: 'Initialisation des métriques des règles v2',
        updatedBy: 1 // System user
      }
    });

    console.log('\n✨ Initialisation des métriques terminée!');
    console.log(`📊 Résumé:`);
    console.log(`   - ${rulesWithoutMetrics.length} métriques créées`);
    console.log(`   - ${activeRules.length} règles avec données de démonstration`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Script pour générer des métriques périodiques (peut être appelé par un cron job)
async function updateRuleMetrics() {
  console.log('🔄 Mise à jour des métriques...');

  try {
    const activeRules = await prisma.planningRule.findMany({
      where: {
        status: 'active',
        enabled: true
      },
      include: {
        metrics: true
      }
    });

    for (const rule of activeRules) {
      if (rule.metrics) {
        // Simuler des évaluations supplémentaires
        const newEvaluations = Math.floor(Math.random() * 100) + 10;
        const currentSuccessRate = rule.metrics.successRate || 0.8;
        const variability = (Math.random() - 0.5) * 0.1; // ±5% de variation
        const newSuccessRate = Math.max(0.5, Math.min(1, currentSuccessRate + variability));
        
        await prisma.ruleMetrics.update({
          where: { id: rule.metrics.id },
          data: {
            evaluationCount: { increment: newEvaluations },
            successRate: newSuccessRate,
            violationCount: { increment: Math.floor(newEvaluations * (1 - newSuccessRate)) },
            lastEvaluatedAt: new Date(),
            // Recalculer la moyenne du temps d'exécution
            averageExecutionTime: rule.metrics.averageExecutionTime * 0.9 + (Math.random() * 20 + 10) * 0.1
          }
        });
      }
    }

    console.log(`✅ ${activeRules.length} métriques mises à jour`);

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  }
}

// Vérifier si le script est exécuté directement
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'update') {
    updateRuleMetrics().then(() => prisma.$disconnect());
  } else {
    initializeRuleMetrics();
  }
}

export { initializeRuleMetrics, updateRuleMetrics };