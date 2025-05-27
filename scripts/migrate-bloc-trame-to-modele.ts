#!/usr/bin/env ts-node

/**
 * Script de migration des anciens BlocTramePlanning vers les nouveaux TrameModele
 * 
 * Ce script migre les données existantes du système de trames de bloc opératoire
 * vers la nouvelle architecture TrameModele/AffectationModele/PersonnelRequisModele
 * 
 * Usage: npm run migrate:trame-modeles [--dry-run] [--force]
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { format } from 'date-fns';

interface MigrationResult {
  success: boolean;
  trameModelesMigrated: number;
  affectationsMigrated: number;
  personnelRequisMigrated: number;
  errors: string[];
  warnings: string[];
}

interface MigrationOptions {
  dryRun: boolean;
  force: boolean;
  verbose: boolean;
}

class TrameMigrationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Migration complète des trames de bloc vers le nouveau modèle
   */
  async migrateAllTrames(options: MigrationOptions): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      trameModelesMigrated: 0,
      affectationsMigrated: 0,
      personnelRequisMigrated: 0,
      errors: [],
      warnings: []
    };

    try {
      console.log('🚀 Début de la migration des trames de bloc...');
      
      if (options.dryRun) {
        console.log('🔍 Mode simulation activé - aucune donnée ne sera modifiée');
      }

      // 1. Vérifier l'état du système avant migration
      const preCheck = await this.performPreMigrationChecks();
      if (!preCheck.canProceed) {
        result.errors.push(...preCheck.errors);
        return result;
      }

      // 2. Récupérer toutes les anciennes trames (si elles existent)
      // Note: Cette partie dépend de l'existence d'un ancien modèle BlocTramePlanning
      // qui n'est pas présent dans le schéma actuel, donc on simule pour l'exemple
      const anciennesTrames = await this.getAnciennesTrames();
      
      if (anciennesTrames.length === 0) {
        result.warnings.push('Aucune ancienne trame trouvée à migrer');
        result.success = true;
        return result;
      }

      console.log(`📋 ${anciennesTrames.length} anciennes trames trouvées`);

      // 3. Migrer chaque trame
      for (const ancienneTrame of anciennesTrames) {
        try {
          if (options.verbose) {
            console.log(`⚙️  Migration de la trame: ${ancienneTrame.name}`);
          }

          const migrationResult = await this.migrateTrameIndividuelle(
            ancienneTrame,
            options
          );

          result.trameModelesMigrated += migrationResult.trameCreated ? 1 : 0;
          result.affectationsMigrated += migrationResult.affectationsCreated;
          result.personnelRequisMigrated += migrationResult.personnelCreated;
          result.warnings.push(...migrationResult.warnings);

        } catch (error) {
          const errorMsg = `Erreur lors de la migration de la trame ${ancienneTrame.name}: ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      // 4. Vérifications post-migration
      if (!options.dryRun && result.errors.length === 0) {
        const postCheck = await this.performPostMigrationChecks();
        result.warnings.push(...postCheck.warnings);
      }

      result.success = result.errors.length === 0;
      
      console.log('\n📊 Résumé de la migration:');
      console.log(`✅ TrameModeles migrés: ${result.trameModelesMigrated}`);
      console.log(`📋 Affectations créées: ${result.affectationsMigrated}`);
      console.log(`👥 Personnel requis créé: ${result.personnelRequisMigrated}`);
      console.log(`⚠️  Avertissements: ${result.warnings.length}`);
      console.log(`❌ Erreurs: ${result.errors.length}`);

      return result;

    } catch (error) {
      result.errors.push(`Erreur générale de migration: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    }
  }

  /**
   * Vérifications avant migration
   */
  private async performPreMigrationChecks(): Promise<{
    canProceed: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Vérifier que les nouveaux modèles existent
      const trameModelesCount = await this.prisma.trameModele.count();
      console.log(`📈 ${trameModelesCount} TrameModeles existants dans le nouveau système`);

      // Vérifier les types d'activité disponibles
      const activityTypesCount = await this.prisma.activityType.count();
      if (activityTypesCount === 0) {
        errors.push('Aucun type d\'activité disponible - veuillez en créer avant la migration');
      }

      // Vérifier les salles d'opération disponibles
      const operatingRoomsCount = await this.prisma.operatingRoom.count();
      if (operatingRoomsCount === 0) {
        warnings.push('Aucune salle d\'opération trouvée - certaines affectations pourraient échouer');
      }

      // Vérifier les sites disponibles
      const sitesCount = await this.prisma.site.count();
      if (sitesCount === 0) {
        errors.push('Aucun site disponible - veuillez en créer avant la migration');
      }

    } catch (error) {
      errors.push(`Erreur lors des vérifications pré-migration: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      canProceed: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Récupère les anciennes trames à migrer
   * Note: Cette fonction est un placeholder car le modèle BlocTramePlanning
   * n'existe pas dans le schéma actuel
   */
  private async getAnciennesTrames(): Promise<any[]> {
    // Simulation d'anciennes trames pour démonstration
    // Dans un vrai scénario, ceci ferait appel à l'ancien modèle
    
    // Essayer de récupérer les données depuis les TrameAffectation existantes
    const tramesAffectation = await this.prisma.trameAffectation.findMany({
      include: {
        periods: {
          include: {
            assignments: {
              include: {
                posts: true
              }
            }
          }
        }
      }
    });

    // Convertir les TrameAffectation en format migration
    return tramesAffectation.map(trame => ({
      id: trame.id,
      name: trame.name,
      description: trame.description,
      isActive: trame.isActive,
      startDate: trame.startDate,
      endDate: trame.endDate,
      // Simulation de données de récurrence
      recurrenceType: 'HEBDOMADAIRE',
      joursSemaineActifs: [1, 2, 3, 4, 5], // Lundi à Vendredi par défaut
      typeSemaine: 'TOUTES',
      periods: trame.periods
    }));
  }

  /**
   * Migre une trame individuelle
   */
  private async migrateTrameIndividuelle(
    ancienneTrame: any,
    options: MigrationOptions
  ): Promise<{
    trameCreated: boolean;
    affectationsCreated: number;
    personnelCreated: number;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    let affectationsCreated = 0;
    let personnelCreated = 0;

    if (options.dryRun) {
      // Simulation pour dry run
      return {
        trameCreated: true,
        affectationsCreated: ancienneTrame.periods?.length || 0,
        personnelCreated: ancienneTrame.periods?.reduce((acc: number, period: any) => 
          acc + (period.assignments?.reduce((sum: number, assignment: any) => 
            sum + (assignment.posts?.length || 0), 0) || 0), 0) || 0,
        warnings
      };
    }

    // Créer le nouveau TrameModele
    const trameModele = await this.prisma.trameModele.create({
      data: {
        name: ancienneTrame.name,
        description: ancienneTrame.description,
        isActive: ancienneTrame.isActive,
        dateDebutEffet: ancienneTrame.startDate,
        dateFinEffet: ancienneTrame.endDate,
        recurrenceType: ancienneTrame.recurrenceType || 'HEBDOMADAIRE',
        joursSemaineActifs: ancienneTrame.joursSemaineActifs || [1, 2, 3, 4, 5],
        typeSemaine: ancienneTrame.typeSemaine || 'TOUTES',
        detailsJson: {
          migratedFrom: 'TrameAffectation',
          originalId: ancienneTrame.id,
          migrationDate: new Date().toISOString()
        }
      }
    });

    // Migrer les périodes et affectations
    if (ancienneTrame.periods) {
      for (const period of ancienneTrame.periods) {
        for (const assignment of period.assignments || []) {
          try {
            const affectationResult = await this.createAffectationFromAssignment(
              trameModele.id,
              assignment,
              options
            );
            
            if (affectationResult.created) {
              affectationsCreated++;
              personnelCreated += affectationResult.personnelCreated;
            }
            
            warnings.push(...affectationResult.warnings);
            
          } catch (error) {
            warnings.push(`Erreur lors de la création de l'affectation ${assignment.name}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }
    }

    return {
      trameCreated: true,
      affectationsCreated,
      personnelCreated,
      warnings
    };
  }

  /**
   * Crée une AffectationModele à partir d'un ancien assignment
   */
  private async createAffectationFromAssignment(
    trameModeleId: number,
    assignment: any,
    options: MigrationOptions
  ): Promise<{
    created: boolean;
    personnelCreated: number;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    let personnelCreated = 0;

    // Essayer de trouver un ActivityType correspondant
    const activityType = await this.prisma.activityType.findFirst({
      where: {
        OR: [
          { name: { contains: assignment.name, mode: 'insensitive' } },
          { code: assignment.type }
        ]
      }
    });

    if (!activityType) {
      warnings.push(`Aucun type d'activité trouvé pour ${assignment.name}, création d'un type générique`);
      
      // Créer un type d'activité générique
      const newActivityType = await this.prisma.activityType.create({
        data: {
          name: assignment.name,
          code: `MIGRATED_${assignment.id}`,
          description: `Migré depuis ${assignment.name}`,
          category: 'BLOC_OPERATOIRE'
        }
      });

      // Utiliser le nouveau type créé
      const affectation = await this.createAffectationModele(
        trameModeleId,
        newActivityType.id,
        assignment
      );

      personnelCreated = await this.createPersonnelRequisFromPosts(
        affectation.id,
        assignment.posts || []
      );

      return { created: true, personnelCreated, warnings };
    }

    // Créer l'affectation avec le type d'activité existant
    const affectation = await this.createAffectationModele(
      trameModeleId,
      activityType.id,
      assignment
    );

    personnelCreated = await this.createPersonnelRequisFromPosts(
      affectation.id,
      assignment.posts || []
    );

    return { created: true, personnelCreated, warnings };
  }

  /**
   * Crée une AffectationModele
   */
  private async createAffectationModele(
    trameModeleId: number,
    activityTypeId: string,
    assignment: any
  ) {
    // Mapper vers les nouveaux enums
    const jourSemaine = this.mapToNewDayOfWeek(assignment.dayOfWeek || 'MONDAY');
    const periode = this.mapToNewPeriod(assignment.period || 'MATIN');

    return await this.prisma.affectationModele.create({
      data: {
        trameModeleId,
        activityTypeId,
        jourSemaine,
        periode,
        typeSemaine: 'TOUTES',
        priorite: 5,
        isActive: true,
        detailsJson: {
          migratedFrom: 'TrameAssignment',
          originalData: assignment
        }
      }
    });
  }

  /**
   * Crée PersonnelRequisModele à partir des posts
   */
  private async createPersonnelRequisFromPosts(
    affectationModeleId: number,
    posts: any[]
  ): Promise<number> {
    let created = 0;

    for (const post of posts) {
      await this.prisma.personnelRequisModele.create({
        data: {
          affectationModeleId,
          roleGenerique: this.mapToRoleGenerique(post.type),
          nombreRequis: post.maxCount || 1,
          notes: `Migré depuis post ${post.name}`
        }
      });
      created++;
    }

    return created;
  }

  /**
   * Mappings vers les nouveaux enums
   */
  private mapToNewDayOfWeek(oldValue: string): string {
    const mapping: { [key: string]: string } = {
      'MONDAY': 'MONDAY',
      'TUESDAY': 'TUESDAY',
      'WEDNESDAY': 'WEDNESDAY',
      'THURSDAY': 'THURSDAY',
      'FRIDAY': 'FRIDAY',
      'SATURDAY': 'SATURDAY',
      'SUNDAY': 'SUNDAY'
    };
    return mapping[oldValue] || 'MONDAY';
  }

  private mapToNewPeriod(oldValue: string): string {
    const mapping: { [key: string]: string } = {
      'MATIN': 'MATIN',
      'APRES_MIDI': 'APRES_MIDI',
      'JOURNEE_ENTIERE': 'JOURNEE_ENTIERE'
    };
    return mapping[oldValue] || 'MATIN';
  }

  private mapToRoleGenerique(oldType: string): string {
    const mapping: { [key: string]: string } = {
      'MAR': 'MAR',
      'IADE': 'IADE',
      'CHIRURGIEN': 'CHIRURGIEN'
    };
    return mapping[oldType] || 'MAR';
  }

  /**
   * Vérifications post-migration
   */
  private async performPostMigrationChecks(): Promise<{
    warnings: string[];
  }> {
    const warnings: string[] = [];

    try {
      const stats = {
        trameModeles: await this.prisma.trameModele.count(),
        affectations: await this.prisma.affectationModele.count(),
        personnelRequis: await this.prisma.personnelRequisModele.count()
      };

      console.log(`📊 Statistiques post-migration:`);
      console.log(`   TrameModeles: ${stats.trameModeles}`);
      console.log(`   AffectationModeles: ${stats.affectations}`);
      console.log(`   PersonnelRequisModeles: ${stats.personnelRequis}`);

      // Vérifier l'intégrité des données
      const orphanedAffectations = await this.prisma.affectationModele.count({
        where: {
          trameModele: {
            is: null
          }
        }
      });

      if (orphanedAffectations > 0) {
        warnings.push(`${orphanedAffectations} affectations orphelines détectées`);
      }

    } catch (error) {
      warnings.push(`Erreur lors des vérifications post-migration: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { warnings };
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Script principal
async function main() {
  const args = process.argv.slice(2);
  const options: MigrationOptions = {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  console.log('🏥 Migration des trames de bloc opératoire');
  console.log('==========================================\n');

  const migrationService = new TrameMigrationService();

  try {
    const result = await migrationService.migrateAllTrames(options);

    if (result.success) {
      console.log('✅ Migration terminée avec succès !');
    } else {
      console.log('⚠️  Migration terminée avec des erreurs :');
      result.errors.forEach(error => console.log(`   ❌ ${error}`));
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️  Avertissements :');
      result.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
    }

    process.exit(result.success ? 0 : 1);

  } catch (error) {
    console.error('💥 Erreur fatale de migration:', error);
    process.exit(1);
  } finally {
    await migrationService.disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

export { TrameMigrationService, MigrationOptions, MigrationResult };