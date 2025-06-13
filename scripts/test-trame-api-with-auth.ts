/**
 * Script de test des API TrameModele avec authentification simulée
 * Ce script teste directement les fonctions des routes sans passer par HTTP
 */

import { prisma } from '../src/lib/prisma';
import { logger } from '../src/lib/logger';

async function analyzeTrameModeleSystem() {
  console.log('🔍 Analyse du Système TrameModele\n');

  try {
    // 1. Analyser les TrameModeles existants
    console.log('📊 1. ANALYSE DES TRAME MODELES');
    const trameModeles = await prisma.trameModele.findMany({
      include: {
        site: true,
        affectations: {
          include: {
            personnelRequis: {
              include: {
                userHabituel: true,
                surgeonHabituel: true,
              },
            },
            activityType: true,
            operatingRoom: true,
          },
        },
        _count: {
          select: { affectations: true },
        },
      },
    });

    console.log(`\nNombre total de TrameModeles: ${trameModeles.length}`);

    for (const trame of trameModeles) {
      console.log(`\n📋 TrameModele: "${trame.name}" (ID: ${trame.id})`);
      console.log(`   - Site: ${trame.site.name}`);
      console.log(`   - Type récurrence: ${trame.typeRecurrence}`);
      console.log(`   - Active: ${trame.isActive ? '✅' : '❌'}`);
      console.log(
        `   - Jours actifs: ${trame.joursActifs ? trame.joursActifs.join(', ') : 'Aucun'}`
      );
      console.log(`   - Type semaine: ${trame.typeSemaine || 'Non défini'}`);
      console.log(`   - Nombre d'affectations: ${trame._count.affectations}`);

      // Analyser les problèmes de semaines paires/impaires
      const affectationsBySemaine = {
        ALL: trame.affectations.filter(a => a.typeSemaine === 'ALL').length,
        EVEN: trame.affectations.filter(a => a.typeSemaine === 'EVEN').length,
        ODD: trame.affectations.filter(a => a.typeSemaine === 'ODD').length,
      };

      console.log(`   - Répartition par type de semaine:`);
      console.log(`     • Toutes les semaines: ${affectationsBySemaine.ALL}`);
      console.log(`     • Semaines paires: ${affectationsBySemaine.EVEN}`);
      console.log(`     • Semaines impaires: ${affectationsBySemaine.ODD}`);

      // Détecter les incohérences
      if (affectationsBySemaine.EVEN > 0 && affectationsBySemaine.ODD === 0) {
        console.log(`   ⚠️  PROBLEME: Affectations paires sans impaires`);
      }
      if (affectationsBySemaine.ODD > 0 && affectationsBySemaine.EVEN === 0) {
        console.log(`   ⚠️  PROBLEME: Affectations impaires sans paires`);
      }
    }

    // 2. Analyser les AffectationModeles
    console.log('\n\n📊 2. ANALYSE DES AFFECTATIONS');
    const affectations = await prisma.affectationModele.findMany({
      include: {
        trameModele: true,
        activityType: true,
        operatingRoom: true,
        personnelRequis: {
          include: {
            userHabituel: true,
            surgeonHabituel: true,
          },
        },
      },
    });

    console.log(`\nNombre total d'affectations: ${affectations.length}`);

    // Analyser les conflits potentiels
    const conflictMap = new Map<string, any[]>();

    for (const affectation of affectations) {
      // Clé pour détecter les conflits : jour + période + salle + typeSemaine
      const conflictKey = `${affectation.jourSemaine}-${affectation.periode}-${affectation.operatingRoomId || 'NO_ROOM'}-${affectation.typeSemaine}`;

      if (!conflictMap.has(conflictKey)) {
        conflictMap.set(conflictKey, []);
      }
      conflictMap.get(conflictKey)!.push(affectation);
    }

    // Afficher les conflits
    console.log('\n🚨 CONFLITS POTENTIELS:');
    let conflictCount = 0;
    for (const [key, affectationsList] of conflictMap) {
      if (affectationsList.length > 1) {
        conflictCount++;
        console.log(`\n   Conflit #${conflictCount}: ${key}`);
        for (const aff of affectationsList) {
          console.log(`   - TrameModele: ${aff.trameModele.name}`);
          console.log(`     Activité: ${aff.activityType.name}`);
          console.log(`     Personnel: ${aff.personnelRequis.length} personne(s)`);
        }
      }
    }

    if (conflictCount === 0) {
      console.log('   ✅ Aucun conflit détecté');
    }

    // 3. Analyser l'utilisation du personnel
    console.log('\n\n📊 3. ANALYSE DU PERSONNEL');
    const personnelRequis = await prisma.personnelRequisModele.findMany({
      include: {
        userHabituel: true,
        surgeonHabituel: true,
        affectationModele: {
          include: {
            trameModele: true,
          },
        },
      },
    });

    console.log(`\nNombre total de postes requis: ${personnelRequis.length}`);

    // Compter par rôle
    const roleCount = personnelRequis.reduce(
      (acc, pr) => {
        acc[pr.roleGenerique] = (acc[pr.roleGenerique] || 0) + pr.nombreRequis;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log('\nRépartition par rôle:');
    for (const [role, count] of Object.entries(roleCount)) {
      console.log(`   - ${role}: ${count} postes`);
    }

    // Personnel non assigné
    const nonAssigne = personnelRequis.filter(
      pr => !pr.personnelHabituelUserId && !pr.personnelHabituelSurgeonId
    );
    console.log(`\n⚠️  Postes non assignés: ${nonAssigne.length}`);

    // 4. Problèmes identifiés
    console.log('\n\n🔴 PROBLEMES IDENTIFIES:');

    // Problème 1: Affectations avec typeSemaine non cohérent
    let problemCount = 1;
    const affectationsWithWrongWeekType = affectations.filter(a => {
      // Si la trame a un type de semaine défini, les affectations devraient avoir le même
      if (a.trameModele.typeSemaine && a.typeSemaine !== 'ALL') {
        return a.typeSemaine !== a.trameModele.typeSemaine;
      }
      return false;
    });

    if (affectationsWithWrongWeekType.length > 0) {
      console.log(
        `\n${problemCount++}. TYPE SEMAINE INCOHERENT: ${affectationsWithWrongWeekType.length} affectations ont un type de semaine différent de leur TrameModele`
      );
    }

    // Problème 2: TrameModeles sans affectations
    const trameSansAffectations = trameModeles.filter(t => t._count.affectations === 0);

    if (trameSansAffectations.length > 0) {
      console.log(
        `\n${problemCount++}. TRAMES VIDES: ${trameSansAffectations.length} TrameModeles n'ont aucune affectation`
      );
      for (const t of trameSansAffectations) {
        console.log(`   - ${t.name} (${t.typeSemaine || 'TOUTES'})`);
      }
    }

    // Problème 3: Jours actifs non respectés
    const joursActifsProblems = trameModeles.filter(t => {
      if (!t.joursActifs || t.joursActifs.length === 0) return false;
      return t.affectations.some(a => {
        const dayNumber =
          ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].indexOf(
            a.jourSemaine
          ) + 1;
        return !t.joursActifs.includes(dayNumber);
      });
    });

    if (joursActifsProblems.length > 0) {
      console.log(
        `\n${problemCount++}. JOURS ACTIFS NON RESPECTES: ${joursActifsProblems.length} TrameModeles ont des affectations sur des jours non actifs`
      );
    }

    // Problème 4: Affectations sans typeSemaine défini
    const affectationsSansType = affectations.filter(
      a => !a.typeSemaine || a.typeSemaine === 'ALL'
    );
    const pairImpairCount = affectations.filter(
      a => a.typeSemaine === 'EVEN' || a.typeSemaine === 'ODD'
    ).length;

    console.log(`\n${problemCount++}. REPARTITION TYPE SEMAINE:`);
    console.log(`   - Sans type spécifique (ALL): ${affectationsSansType.length}`);
    console.log(`   - Avec type Pair/Impair: ${pairImpairCount}`);
    console.log(
      `   - Ratio: ${pairImpairCount}/${affectations.length} (${Math.round((pairImpairCount / affectations.length) * 100)}%)`
    );

    // Problème 5: Personnel non assigné
    if (nonAssigne.length > 0) {
      console.log(
        `\n${problemCount++}. PERSONNEL NON ASSIGNE: ${nonAssigne.length}/${personnelRequis.length} postes sans affectation nominative`
      );
    }

    // 5. Recommandations
    console.log('\n\n💡 RECOMMANDATIONS PRELIMINAIRES:');
    console.log('\n1. SEMAINES PAIRES/IMPAIRES:');
    console.log('   - Implémenter un système de "cycles" plutôt que pair/impair');
    console.log('   - Permettre des rotations sur N semaines (2, 3, 4, etc.)');
    console.log('   - Visualisation calendaire avec numéros de semaine');

    console.log('\n2. ERGONOMIE:');
    console.log('   - Interface de type "calendrier mensuel" plutôt que grille hebdomadaire');
    console.log('   - Drag & drop entre semaines pour copier des plannings');
    console.log('   - Templates prédéfinis par spécialité');

    console.log('\n3. ARCHITECTURE:');
    console.log('   - Supprimer les champs dupliqués (active vs isActive)');
    console.log('   - Clarifier la hiérarchie TrameModele > AffectationModele');
    console.log('   - Ajouter un système de "PlanningInstance" pour les applications concrètes');

    console.log('\n4. FONCTIONNALITES MANQUANTES:');
    console.log('   - Gestion des remplacements ponctuels');
    console.log('   - Validation des contraintes réglementaires');
    console.log('   - Export/Import de plannings');
    console.log('   - Notifications de changements');
  } catch (error) {
    console.error("❌ Erreur lors de l'analyse:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter l'analyse
analyzeTrameModeleSystem()
  .then(() => {
    console.log('\n\n✅ Analyse terminée');
    console.log('\n📄 Le prompt pour Gemini a été sauvegardé dans:');
    console.log('   docs/05_reports/AUDIT_TRAME_MODELE_GEMINI_PROMPT.md');
    console.log('\nCopiez ce fichier et soumettez-le à Gemini pour un audit complet.');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
