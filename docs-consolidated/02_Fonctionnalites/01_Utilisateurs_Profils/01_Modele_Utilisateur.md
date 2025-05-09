# Modèle Utilisateur

## Vue d'ensemble

Le système de gestion des utilisateurs forme la base de Mathildanesth. Il permet de gérer les profils des différents intervenants médicaux, leurs rôles, leurs préférences et leurs métriques de travail.

## Types d'utilisateurs

### Médecins Anesthésistes Réanimateurs (MARs)
- Profil senior avec expérience complète
- Profil junior avec niveau d'expérience variable
- Supervision possible selon le secteur et l'expérience
- Configuration du temps de travail personnalisable

### Infirmiers Anesthésistes (IADEs)
- Temps de travail variable (35h, 39h, 21h...)
- Configuration des horaires selon contrat
- Compétences spécifiques par spécialité

### Administrateurs
- MAR administrateur (supervision complète)
- IADE administrateur (gestion opérationnelle)
- Accès complet aux fonctionnalités de configuration

### Remplaçants
- Profils temporaires sans accès à l'application
- Gérés par les administrateurs
- Pris en compte dans les plannings générés

## Modèle de données

```typescript
// Modèle utilisateur principal
interface User {
  id: string;
  email: string;
  password: string; // Haché
  firstName: string;
  lastName: string;
  role: UserRole;
  type: 'MAR' | 'IADE' | 'ADMIN';
  isActive: boolean;
  specialties: string[]; // Spécialités maîtrisées
  experienceLevel: ExperienceLevel;
  preferences: UserPreferences;
  workConfiguration: WorkConfiguration;
  createdAt: Date;
  updatedAt: Date;
}

// Configuration de travail
interface WorkConfiguration {
  isFullTime: boolean;
  workPattern: WorkPattern;
  workingDays: number[]; // 0-6 pour lundi-dimanche
  alternateWeeks: boolean; // Alternance semaines paires/impaires
  alternateMonths: boolean; // Alternance mensuelle
  customSchedule: CustomScheduleConfig; // Configuration spécifique
  hoursPerWeek: number; // Ex: 35, 39, 21...
}

// Préférences utilisateur
interface UserPreferences {
  preferredSpecialties: PreferredItem[]; // Spécialités préférées avec score
  preferredRooms: PreferredItem[]; // Salles préférées avec score
  preferredDays: PreferredDay[]; // Jours préférés avec score
  preferredShifts: PreferredShift[]; // Types de garde préférés
  avoidConsecutiveDays: boolean; // Éviter jours consécutifs
  maxConsecutiveDays: number; // Max jours consécutifs acceptés
  notificationSettings: NotificationSettings;
  displayPreferences: DisplayPreferences;
}
```

## Fonctionnalités principales

### Gestion de profil
- Création et modification des profils utilisateurs
- Configuration du type de contrat (temps plein, mi-temps...)
- Définition des spécialités et niveaux d'expérience
- Ajout de préférences personnelles

### Configuration des jours travaillés
- Modèles prédéfinis (tous les jours, jours alternés)
- Configuration personnalisée (semaines paires/impaires)
- Alternance mensuelle
- Configurations spécifiques (demi-semaines, jours fixes)

### Préférences et contraintes
- Spécialités préférées
- Salles préférées
- Jours de la semaine préférés
- Types d'affectation préférés
- Contraintes personnelles (à éviter)

### Gestion des congés et quotas
- Calcul automatique des quotas en fonction du temps de travail
- Suivi des congés pris et restants
- Historique des absences et congés

## Implémentation actuelle

- **Statut** : Partiellement implémenté
- **Localisation** :
  - `src/modules/profiles/`
  - `src/app/utilisateurs/`
  - `prisma/schema.prisma` (modèle User)

La version actuelle gère les utilisateurs de base avec authentification, mais les fonctionnalités avancées de configuration du temps de travail sont en cours de développement.

## Prochaines étapes

1. Finalisation des profils MAR avec configuration complète des temps de travail
2. Implémentation des préférences avancées et de leur prise en compte dans l'algorithme de planning
3. Développement du système de compteurs avancés
4. Intégration des métriques de qualité de vie au travail 