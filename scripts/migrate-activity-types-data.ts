#!/usr/bin/env ts-node

/**
 * Script de migration des données pour la séparation ActivityType/SectorType
 * 
 * Ce script migre les données existantes pour utiliser la nouvelle architecture
 * où les types d'activités (garde, consultation, etc.) sont séparés des secteurs géographiques
 */

import { PrismaClient } from '@prisma/client';
import { ActivityCategory, SectorCategory } from '../src/types/activityTypes';

const prisma = new PrismaClient();

interface MigrationReport {
  activityTypesCreated: number;
  assignmentsUpdated: number;
  errors: string[];
}

// Mapping des anciens types vers les nouvelles catégories d'activités
const ACTIVITY_TYPE_MAPPING: Record<string, {
  category: ActivityCategory;
  name: string;
  description: string;
  color: string;
  icon: string;
  defaultDurationHours: number;
  defaultPeriod: 'MATIN' | 'APRES_MIDI' | 'JOURNEE_ENTIERE';
}> = {
  'GARDE': {
    category: ActivityCategory.GARDE,
    name: 'Garde',
    description: 'Service de garde médicale',
    color: '#ef4444',
    icon: '🏥',
    defaultDurationHours: 24,
    defaultPeriod: 'JOURNEE_ENTIERE'
  },
  'ASTREINTE': {
    category: ActivityCategory.ASTREINTE,
    name: 'Astreinte',
    description: 'Service d\'astreinte médicale',
    color: '#f97316',
    icon: '📞',
    defaultDurationHours: 24,
    defaultPeriod: 'JOURNEE_ENTIERE'
  },
  'CONSULTATION': {
    category: ActivityCategory.CONSULTATION,
    name: 'Consultation',
    description: 'Consultation médicale',
    color: '#3b82f6',
    icon: '👨‍⚕️',
    defaultDurationHours: 4,
    defaultPeriod: 'MATIN'
  },
  'BLOC': {
    category: ActivityCategory.BLOC_OPERATOIRE,
    name: 'Bloc opératoire',
    description: 'Intervention en bloc opératoire',
    color: '#22c55e',
    icon: '🔧',
    defaultDurationHours: 8,
    defaultPeriod: 'JOURNEE_ENTIERE'
  },
  'BLOC_OPERATOIRE': {
    category: ActivityCategory.BLOC_OPERATOIRE,
    name: 'Bloc opératoire',
    description: 'Intervention en bloc opératoire',
    color: '#22c55e',
    icon: '🔧',
    defaultDurationHours: 8,
    defaultPeriod: 'JOURNEE_ENTIERE'
  }
};

// Secteurs par défaut à créer si ils n'existent pas
const DEFAULT_SECTORS = [
  {
    name: 'Standard',
    category: SectorCategory.STANDARD,
    description: 'Secteur opératoire standard',
    colorCode: '#3b82f6'
  },
  {
    name: 'Hyperaseptique',
    category: SectorCategory.HYPERASEPTIQUE,
    description: 'Secteur hyperaseptique pour chirurgie haute asepsie',
    colorCode: '#22c55e'
  },
  {
    name: 'Ophtalmologie',
    category: SectorCategory.OPHTALMOLOGIE,
    description: 'Secteur dédié à l\'ophtalmologie',
    colorCode: '#8b5cf6'
  },
  {
    name: 'Endoscopie',
    category: SectorCategory.ENDOSCOPIE,
    description: 'Secteur dédié à l\'endoscopie',
    colorCode: '#f97316'
  }
];

async function createDefaultActivityTypes(siteId?: string): Promise<Map<string, string>> {
  const activityTypeMap = new Map<string, string>();
  
  console.log('🔧 Création des types d\'activités par défaut...');
  
  for (const [key, config] of Object.entries(ACTIVITY_TYPE_MAPPING)) {
    try {
      // Vérifier si le type d'activité existe déjà
      const existing = await prisma.activityType.findFirst({
        where: {
          code: key,
          siteId: siteId || null
        }
      });
      
      if (existing) {
        activityTypeMap.set(key, existing.id);
        console.log(`  ✅ Type d'activité existant: ${config.name} (${key})`);
        continue;
      }
      
      // Créer le nouveau type d'activité
      const activityType = await prisma.activityType.create({
        data: {
          name: config.name,
          description: config.description,
          category: config.category,
          color: config.color,
          icon: config.icon,
          code: key,
          defaultDurationHours: config.defaultDurationHours,
          defaultPeriod: config.defaultPeriod,
          siteId: siteId || null,
          isActive: true
        }
      });
      
      activityTypeMap.set(key, activityType.id);
      console.log(`  ✅ Créé: ${config.name} (${key}) - ID: ${activityType.id}`);
      
    } catch (error) {
      console.error(`  ❌ Erreur création ${config.name}:`, error);
    }
  }
  
  return activityTypeMap;
}

async function createDefaultSectors(siteId?: string): Promise<void> {
  console.log('🏢 Création des secteurs par défaut...');
  
  for (const sectorConfig of DEFAULT_SECTORS) {
    try {
      // Vérifier si le secteur existe déjà
      const existing = await prisma.operatingSector.findFirst({
        where: {
          name: sectorConfig.name,
          siteId: siteId || null
        }
      });
      
      if (existing) {
        console.log(`  ✅ Secteur existant: ${sectorConfig.name}`);
        continue;
      }
      
      // Créer le nouveau secteur
      const sector = await prisma.operatingSector.create({
        data: {
          name: sectorConfig.name,
          category: sectorConfig.category,
          description: sectorConfig.description,
          colorCode: sectorConfig.colorCode,
          isActive: true,
          displayOrder: DEFAULT_SECTORS.indexOf(sectorConfig),
          siteId: siteId || null
        }
      });
      
      console.log(`  ✅ Créé: ${sectorConfig.name} - ID: ${sector.id}`);
      
    } catch (error) {
      console.error(`  ❌ Erreur création ${sectorConfig.name}:`, error);
    }
  }
}

async function migrateAssignments(activityTypeMap: Map<string, string>): Promise<number> {
  console.log('📋 Migration des affectations...');
  
  let updatedCount = 0;
  
  // Récupérer toutes les affectations avec un type string
  const assignments = await prisma.assignment.findMany({
    where: {
      type: { not: null },
      activityTypeId: null
    }
  });
  
  console.log(`  📊 ${assignments.length} affectations à migrer`);
  
  for (const assignment of assignments) {
    try {
      if (!assignment.type) continue;
      
      // Normaliser le type pour correspondre à nos mappings
      const normalizedType = assignment.type.toUpperCase();
      const activityTypeId = activityTypeMap.get(normalizedType);
      
      if (activityTypeId) {
        await prisma.assignment.update({
          where: { id: assignment.id },
          data: { activityTypeId }
        });
        updatedCount++;
        
        if (updatedCount % 100 === 0) {
          console.log(`  📈 ${updatedCount} affectations mises à jour...`);
        }
      } else {
        console.warn(`  ⚠️ Type non mappé: ${assignment.type} (Assignment ID: ${assignment.id})`);
      }
      
    } catch (error) {
      console.error(`  ❌ Erreur mise à jour assignment ${assignment.id}:`, error);
    }
  }
  
  return updatedCount;
}

async function generateMigrationReport(): Promise<MigrationReport> {
  const report: MigrationReport = {
    activityTypesCreated: 0,
    assignmentsUpdated: 0,
    errors: []
  };
  
  try {
    // Compter les types d'activités
    report.activityTypesCreated = await prisma.activityType.count();
    
    // Compter les affectations avec activityTypeId
    report.assignmentsUpdated = await prisma.assignment.count({
      where: { activityTypeId: { not: null } }
    });
    
  } catch (error) {
    report.errors.push(`Erreur génération rapport: ${error}`);
  }
  
  return report;
}

async function main() {
  console.log('🚀 Début de la migration ActivityType/SectorType');
  console.log('================================================');
  
  try {
    // 1. Créer les types d'activités par défaut
    const activityTypeMap = await createDefaultActivityTypes();
    
    // 2. Créer les secteurs par défaut
    await createDefaultSectors();
    
    // 3. Migrer les affectations existantes
    const updatedAssignments = await migrateAssignments(activityTypeMap);
    
    // 4. Générer le rapport
    const report = await generateMigrationReport();
    
    console.log('');
    console.log('📊 RAPPORT DE MIGRATION');
    console.log('=======================');
    console.log(`✅ Types d'activités total: ${report.activityTypesCreated}`);
    console.log(`✅ Affectations mises à jour: ${updatedAssignments}`);
    console.log(`✅ Affectations avec activityTypeId: ${report.assignmentsUpdated}`);
    
    if (report.errors.length > 0) {
      console.log(`❌ Erreurs: ${report.errors.length}`);
      report.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('');
    console.log('🎉 Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Vérifier les arguments de ligne de commande
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

if (isDryRun) {
  console.log('🔍 Mode DRY RUN - Aucune modification ne sera effectuée');
  console.log('Utilisez sans --dry-run pour exécuter la migration réelle');
  process.exit(0);
}

// Exécuter la migration
main().catch(console.error);