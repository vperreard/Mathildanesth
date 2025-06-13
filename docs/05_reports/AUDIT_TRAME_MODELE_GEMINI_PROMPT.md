# Audit Complet du Système TrameModele - Prompt pour Gemini

## Contexte

Je développe une application de gestion des plannings médicaux pour les équipes d'anesthésie. J'ai implémenté un système de "TrameModele" (modèles de planning) mais je rencontre plusieurs problèmes importants.

## Description du Système Actuel

### 1. Structure de Données (Prisma Schema)

```prisma
model TrameModele {
  id               Int                   @id @default(autoincrement())
  name             String
  description      String?
  siteId           Int
  site             Site                  @relation(fields: [siteId], references: [id])
  typeRecurrence   TypeRecurrenceTrame
  isActive         Boolean               @default(true)
  joursActifs      Int[]                 @default([])
  typeSemaine      TypeSemaineTrame?
  dateDebut        DateTime?
  dateFin          DateTime?
  affectations     AffectationModele[]
  createdAt        DateTime              @default(now())
  updatedAt        DateTime              @updatedAt
}

model AffectationModele {
  id                    Int                      @id @default(autoincrement())
  trameModeleId         Int
  trameModele           TrameModele              @relation(fields: [trameModeleId], references: [id], onDelete: Cascade)
  activityTypeId        Int
  activityType          ActivityType             @relation(fields: [activityTypeId], references: [id])
  jourSemaine           DayOfWeek
  periode               Period
  typeSemaine           TypeSemaineTrame         @default(ALL)
  operatingRoomId       Int?
  operatingRoom         OperatingRoom?           @relation(fields: [operatingRoomId], references: [id])
  priorite              Int                      @default(5)
  isActive              Boolean                  @default(true)
  active                Boolean                  @default(true)
  notes                 String?
  detailsJson           Json?
  personnelRequis       PersonnelRequisModele[]
  createdAt             DateTime                 @default(now())
  updatedAt             DateTime                 @updatedAt
}

model PersonnelRequisModele {
  id                         Int                    @id @default(autoincrement())
  affectationModeleId        Int
  affectationModele          AffectationModele      @relation(fields: [affectationModeleId], references: [id], onDelete: Cascade)
  roleGenerique              String
  nombreRequis               Int                    @default(1)
  specialtyId                Int?
  specialty                  Specialty?             @relation(fields: [specialtyId], references: [id])
  professionalRoleConfigId   Int?
  professionalRoleConfig     ProfessionalRoleConfig? @relation(fields: [professionalRoleConfigId], references: [id])
  personnelHabituelUserId    Int?
  userHabituel               User?                  @relation(fields: [personnelHabituelUserId], references: [id])
  personnelHabituelSurgeonId Int?
  surgeonHabituel            Surgeon?               @relation(fields: [personnelHabituelSurgeonId], references: [id])
  notes                      String?
  createdAt                  DateTime               @default(now())
  updatedAt                  DateTime               @updatedAt
}

enum TypeSemaineTrame {
  ALL    // Toutes les semaines
  EVEN   // Semaines paires
  ODD    // Semaines impaires
}

enum DayOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}

enum Period {
  MORNING
  AFTERNOON
  FULL_DAY
  GUARD
  ON_CALL
}
```

### 2. Interface Utilisateur Actuelle

L'interface se compose de :

- Une grille de planning (TrameGridEditor) avec les jours en colonnes et les salles en lignes
- Des cellules cliquables pour ajouter/modifier des affectations
- Un système de drag & drop pour déplacer les affectations
- Des modales pour créer/éditer les affectations avec sélection du personnel

### 3. Problèmes Rencontrés

#### A. Problèmes de Semaines Paires/Impaires

- **Incohérence**: Le système ne gère pas correctement l'alternance semaine paire/impaire
- **Confusion**: Les utilisateurs ne comprennent pas comment définir des plannings alternés
- **Bug**: Les affectations "semaine paire" apparaissent parfois en semaine impaire
- **Manque de visualisation**: Impossible de voir clairement quelle semaine est paire ou impaire

#### B. Problèmes d'Ergonomie

- **Navigation complexe**: Trop de clics pour créer une simple affectation
- **Manque de vue d'ensemble**: Difficile de voir le planning complet sur un mois
- **Duplication fastidieuse**: Pas de moyen simple de dupliquer un planning d'une semaine à l'autre
- **Validation insuffisante**: Possibilité de créer des conflits (même personne à deux endroits)

#### C. Problèmes de Performance

- **Lenteur**: Le chargement de la grille est lent avec beaucoup d'affectations
- **Mises à jour**: Les modifications ne se reflètent pas toujours immédiatement
- **Synchronisation**: Problèmes de synchronisation entre utilisateurs

#### D. Problèmes Fonctionnels

- **Rigidité**: Difficile de gérer les exceptions (congés, remplacements)
- **Manque de templates**: Pas de possibilité de sauvegarder des "modèles types" de semaine
- **Historique absent**: Pas de traçabilité des modifications
- **Application limitée**: Difficile d'appliquer une trame sur une période donnée

### 4. Besoins des Utilisateurs

Les équipes médicales ont besoin de :

1. **Simplicité**: Créer rapidement un planning hebdomadaire standard
2. **Flexibilité**: Gérer facilement les rotations (semaine A/B, garde 1 week-end sur 3, etc.)
3. **Visibilité**: Voir clairement qui travaille quand sur plusieurs semaines
4. **Réutilisabilité**: Dupliquer et adapter des plannings existants
5. **Fiabilité**: Éviter les erreurs de planning (doublons, absences non couvertes)

### 5. Questions pour l'Audit

1. **Architecture**: Le modèle de données actuel est-il adapté ? Quelles améliorations proposez-vous ?

2. **Semaines Paires/Impaires**: Comment mieux gérer ce concept ? Faut-il repenser complètement l'approche ?

3. **Interface**: Quelle serait l'interface idéale pour ce type de planning médical ?

4. **Performance**: Comment optimiser le système pour gérer des centaines d'affectations ?

5. **Fonctionnalités**: Quelles fonctionnalités essentielles manquent ?

6. **Migration**: Si des changements majeurs sont nécessaires, comment migrer les données existantes ?

### 6. Exemples de Cas d'Usage Problématiques

1. **Rotation sur 3 semaines**: Un MAR fait les gardes 1 week-end sur 3. Impossible à configurer actuellement.

2. **Remplacement ponctuel**: Dr X est absent le 15 janvier, Dr Y le remplace. Pas de mécanisme pour ça.

3. **Planning mixte**: Une IADE travaille lundi/mardi semaine A et jeudi/vendredi semaine B. Trop complexe à configurer.

4. **Visualisation mensuelle**: Voir qui est de garde chaque week-end du mois. Vue non disponible.

## Attentes de l'Audit

J'attends de votre audit :

1. **Analyse critique** du système actuel avec identification précise des failles
2. **Recommandations concrètes** pour améliorer l'architecture
3. **Proposition d'interface** plus intuitive et efficace
4. **Solution pour les semaines paires/impaires** qui soit claire et sans bug
5. **Plan de migration** si refonte nécessaire
6. **Exemples de code** ou schémas pour illustrer vos propositions

## Informations Techniques Supplémentaires

- **Stack**: Next.js 14, TypeScript, PostgreSQL, Prisma
- **Utilisateurs**: ~50-100 professionnels de santé par établissement
- **Contraintes**: Doit respecter la réglementation du travail médical française
- **Performance cible**: Chargement < 2 secondes, mise à jour temps réel

Merci de fournir un audit détaillé avec des recommandations pratiques et réalisables.
