// src/types/activityTypes.ts

/**
 * Catégories d'activités disponibles
 * Séparation claire entre types d'activités fonctionnelles et secteurs géographiques
 */
export enum ActivityCategory {
  BLOC_OPERATOIRE = 'BLOC_OPERATOIRE',
  CONSULTATION = 'CONSULTATION',
  GARDE = 'GARDE',
  ASTREINTE = 'ASTREINTE',
  REUNION = 'REUNION',
  FORMATION = 'FORMATION',
  ADMINISTRATIF = 'ADMINISTRATIF',
  AUTRE = 'AUTRE'
}

/**
 * Catégories de secteurs géographiques/techniques
 * Utilisées pour définir les caractéristiques des salles/espaces
 */
export enum SectorCategory {
  STANDARD = 'STANDARD',
  HYPERASEPTIQUE = 'HYPERASEPTIQUE',
  OPHTALMOLOGIE = 'OPHTALMOLOGIE',
  ENDOSCOPIE = 'ENDOSCOPIE'
}

/**
 * Période de la journée
 */
export enum Period {
  MATIN = 'MATIN',
  APRES_MIDI = 'APRES_MIDI',
  JOURNEE_ENTIERE = 'JOURNEE_ENTIERE'
}

/**
 * Interface pour un type d'activité
 * Représente une activité fonctionnelle (garde, consultation, etc.)
 */
export interface ActivityType {
  id: string;
  name: string;
  description?: string;
  category: ActivityCategory;
  color?: string;
  icon?: string;
  isActive: boolean;
  code: string;
  defaultDurationHours?: number;
  defaultPeriod?: Period;
  siteId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface pour un secteur opératoire
 * Représente une zone géographique/technique avec ses caractéristiques
 */
export interface OperatingSector {
  id: number;
  name: string;
  colorCode?: string;
  isActive: boolean;
  description?: string;
  rules?: Record<string, any>;
  displayOrder?: number;
  siteId?: string;
  category: SectorCategory;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface pour une salle d'opération
 * Combine secteur géographique et capacités techniques
 */
export interface OperatingRoom {
  id: number;
  name: string;
  number: string;
  description?: string;
  roomType: RoomType;
  capacity: number;
  isActive: boolean;
  displayOrder: number;
  colorCode?: string;
  supervisionRules?: Record<string, any>;
  allowedSpecialties: string[];
  siteId: string;
  operatingSectorId?: number;
  operatingSector?: OperatingSector;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Types de salles
 */
export enum RoomType {
  STANDARD = 'STANDARD',
  FIV = 'FIV',
  CONSULTATION = 'CONSULTATION'
}

/**
 * Données pour créer un nouveau type d'activité
 */
export interface CreateActivityTypeData {
  name: string;
  description?: string;
  category: ActivityCategory;
  color?: string;
  icon?: string;
  code: string;
  defaultDurationHours?: number;
  defaultPeriod?: Period;
  siteId?: string;
}

/**
 * Données pour créer un nouveau secteur
 */
export interface CreateSectorData {
  name: string;
  description?: string;
  category: SectorCategory;
  colorCode?: string;
  displayOrder?: number;
  siteId?: string;
  rules?: Record<string, any>;
}

/**
 * Données pour mettre à jour un type d'activité
 */
export interface UpdateActivityTypeData extends Partial<CreateActivityTypeData> {
  isActive?: boolean;
}

/**
 * Données pour mettre à jour un secteur
 */
export interface UpdateSectorData extends Partial<CreateSectorData> {
  isActive?: boolean;
}

/**
 * Statistiques sur l'utilisation des types d'activités
 */
export interface ActivityTypeStats {
  activityTypeId: string;
  activityTypeName: string;
  totalAssignments: number;
  activeAssignments: number;
  averageDuration?: number;
  mostUsedPeriod?: Period;
  usageByMonth: Record<string, number>;
}

/**
 * Statistiques sur l'utilisation des secteurs
 */
export interface SectorStats {
  sectorId: number;
  sectorName: string;
  totalRooms: number;
  activeRooms: number;
  utilization: number; // Pourcentage d'utilisation
  mostUsedRoom?: string;
  capacityUtilization: number;
}