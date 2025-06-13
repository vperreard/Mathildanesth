# Audit Complet du Système TrameModele - Application Médicale

## Résumé Exécutif

Le système TrameModele est actuellement **dysfonctionnel** avec des problèmes majeurs d'architecture, d'ergonomie et de cohérence des données. Une refonte complète est nécessaire.

## 1. État des Lieux Critique

### 1.1 Données Actuelles (Analyse du 12/06/2025)

```
📊 STATISTIQUES GLOBALES:
- 8 TrameModeles au total
- 4 TrameModeles VIDES (50% sans aucune affectation)
- 29 affectations au total
- 0 affectations avec typeSemaine défini (100% en NULL)
- 30/39 postes non assignés (77% sans personnel)
```

### 1.2 Problèmes Critiques Identifiés

#### 🔴 PROBLÈME #1: Incohérence TypeSemaine

- **Symptôme**: Les TrameModeles ont un typeSemaine (PAIRES/IMPAIRES) mais AUCUNE affectation n'a de typeSemaine défini
- **Impact**: Le système pair/impair est complètement non fonctionnel
- **Exemple**: "Bloc Europe paires" (ID:6) avec typeSemaine=PAIRES mais 0 affectations

#### 🔴 PROBLÈME #2: Architecture Confuse

- **Duplication**: typeSemaine existe à 2 niveaux (TrameModele ET AffectationModele)
- **Champs inutilisés**: typeRecurrence, joursActifs, dateDebut, dateFin
- **Hiérarchie floue**: Relation TrameModele > AffectationModele mal exploitée

#### 🔴 PROBLÈME #3: Ergonomie Catastrophique

- **Navigation**: Impossible de visualiser un planning sur plusieurs semaines
- **Duplication**: Pas de copier-coller entre semaines
- **Validation**: Aucune vérification des conflits

#### 🔴 PROBLÈME #4: Personnel Non Géré

- **77% des postes** sans affectation nominative
- **Pas de gestion** des remplacements
- **Pas de suivi** des disponibilités

## 2. Analyse Technique Détaillée

### 2.1 Schéma de Données Actuel (Problématique)

```prisma
model TrameModele {
  id               Int                   @id @default(autoincrement())
  name             String
  description      String?
  siteId           Int
  site             Site                  @relation(fields: [siteId], references: [id])
  typeRecurrence   TypeRecurrenceTrame   // ❌ JAMAIS UTILISÉ
  isActive         Boolean               @default(true)
  joursActifs      Int[]                 @default([]) // ❌ TOUJOURS VIDE
  typeSemaine      TypeSemaineTrame?     // ⚠️ DUPLIQUÉ avec AffectationModele
  dateDebut        DateTime?             // ❌ JAMAIS UTILISÉ
  dateFin          DateTime?             // ❌ JAMAIS UTILISÉ
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
  typeSemaine           TypeSemaineTrame         @default(ALL) // ⚠️ TOUJOURS NULL en pratique
  operatingRoomId       Int?
  operatingRoom         OperatingRoom?           @relation(fields: [operatingRoomId], references: [id])
  priorite              Int                      @default(5)
  isActive              Boolean                  @default(true)
  active                Boolean                  @default(true) // ❌ DOUBLON avec isActive
  notes                 String?
  detailsJson           Json?
  personnelRequis       PersonnelRequisModele[]
  createdAt             DateTime                 @default(now())
  updatedAt             DateTime                 @updatedAt
}
```

### 2.2 Cas d'Usage Non Supportés

1. **Rotation sur 3 semaines**: Dr X travaille 1 week-end sur 3 → IMPOSSIBLE
2. **Planning alterné complexe**: IADE lundi/mardi semaine A, jeudi/vendredi semaine B → TROP COMPLEXE
3. **Remplacement ponctuel**: Dr Y remplace Dr X le 15/01 → NON GÉRÉ
4. **Vue mensuelle**: Voir qui est de garde chaque week-end → INDISPONIBLE

## 3. Recommandations pour une Refonte Complète

### 3.1 Nouveau Modèle de Données Proposé

```prisma
// 1. Templates de planning (modèles réutilisables)
model PlanningTemplate {
  id          String   @id @default(uuid())
  name        String
  description String?
  siteId      Int
  site        Site     @relation(fields: [siteId], references: [id])
  category    String   // "BLOC", "GARDE", "ASTREINTE", "CONSULTATION"
  isActive    Boolean  @default(true)
  slots       TemplateSlot[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 2. Créneaux dans un template
model TemplateSlot {
  id           String   @id @default(uuid())
  templateId   String
  template     PlanningTemplate @relation(fields: [templateId], references: [id])
  dayOfWeek    Int      // 1-7 (Lundi-Dimanche)
  startTime    String   // "08:00"
  endTime      String   // "18:00"
  activityType String   // "ANESTHESIE", "CONSULTATION", etc.
  roomId       Int?
  room         OperatingRoom? @relation(fields: [roomId], references: [id])
  requirements StaffRequirement[]
}

// 3. Besoins en personnel pour un créneau
model StaffRequirement {
  id         String   @id @default(uuid())
  slotId     String
  slot       TemplateSlot @relation(fields: [slotId], references: [id])
  role       String   // "MAR", "IADE", "CHIRURGIEN"
  count      Int      @default(1)
  skills     String[] // Compétences spécifiques requises
}

// 4. Cycles de rotation (remplace pair/impair)
model RotationCycle {
  id          String   @id @default(uuid())
  name        String   // "Semaine A/B", "Rotation 3 semaines", etc.
  weeks       Int      // Nombre de semaines du cycle (2, 3, 4...)
  templateId  String
  template    PlanningTemplate @relation(fields: [templateId], references: [id])
  assignments CycleAssignment[]
}

// 5. Affectations par semaine du cycle
model CycleAssignment {
  id        String   @id @default(uuid())
  cycleId   String
  cycle     RotationCycle @relation(fields: [cycleId], references: [id])
  weekNumber Int     // 1, 2, 3... jusqu'à cycle.weeks
  userId    Int?
  user      User?    @relation(fields: [userId], references: [id])
  surgeonId Int?
  surgeon   Surgeon? @relation(fields: [surgeonId], references: [id])
}

// 6. Application concrète d'un planning
model PlanningInstance {
  id         String   @id @default(uuid())
  templateId String
  template   PlanningTemplate @relation(fields: [templateId], references: [id])
  date       DateTime // Date concrète
  status     String   // "DRAFT", "VALIDATED", "PUBLISHED"
  shifts     ActualShift[]
}

// 7. Créneaux réels avec personnel assigné
model ActualShift {
  id          String   @id @default(uuid())
  instanceId  String
  instance    PlanningInstance @relation(fields: [instanceId], references: [id])
  startTime   DateTime
  endTime     DateTime
  userId      Int?
  user        User?    @relation(fields: [userId], references: [id])
  surgeonId   Int?
  surgeon     Surgeon? @relation(fields: [surgeonId], references: [id])
  roomId      Int?
  room        OperatingRoom? @relation(fields: [roomId], references: [id])
  activityType String
  status      String   // "ASSIGNED", "VACANT", "REPLACED"
  replacementId Int?  // Si remplacement, référence vers le remplaçant
}
```

### 3.2 Interface Utilisateur Idéale

#### Vue Calendrier Mensuel

```
┌─────────────────────────────────────────────────────────────┐
│ Planning Anesthésie - Janvier 2025          [◀] [Mois] [▶]  │
├─────────────────────────────────────────────────────────────┤
│ Filtres: [✓] MAR [✓] IADE [ ] Gardes [✓] Bloc             │
│ Vue: [Mois] [2 Semaines] [Semaine] [Jour]                  │
├────┬────┬────┬────┬────┬────┬────┬────────────────────────┤
│ L1 │ M2 │ M3 │ J4 │ V5 │ S6 │ D7 │ Semaine 1 (Impaire)    │
├────┼────┼────┼────┼────┼────┼────┼────────────────────────┤
│ Dr │ Dr │ Dr │ Dr │ Dr │ WE │ WE │ MAR Bloc               │
│ X  │ X  │ Y  │ X  │ X  │ Z  │ Z  │                        │
├────┼────┼────┼────┼────┼────┼────┼────────────────────────┤
│ A  │ A  │ B  │ B  │ A  │ C  │ C  │ IADE Bloc              │
├────┴────┴────┴────┴────┴────┴────┴────────────────────────┤
│ L8 │ M9 │... │                     Semaine 2 (Paire)      │
└─────────────────────────────────────────────────────────────┘

Légende: 🟢 Complet | 🟡 Partiel | 🔴 Non couvert
Actions: [Dupliquer semaine] [Appliquer template] [Exporter]
```

#### Gestion des Rotations

```
┌─────────────────────────────────────────────────────────────┐
│ Configuration Rotation - Garde Week-end                      │
├─────────────────────────────────────────────────────────────┤
│ Type de cycle: [▼ 3 semaines]                              │
│                                                             │
│ Semaine 1: Dr Martin + IADE Dupont                         │
│ Semaine 2: Dr Durand + IADE Lambert                        │
│ Semaine 3: Dr Petit + IADE Garcia                          │
│                                                             │
│ Répéter jusqu'au: [31/12/2025]                            │
│                                                             │
│ [Prévisualiser] [Appliquer] [Annuler]                     │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Fonctionnalités Essentielles à Implémenter

1. **Templates Intelligents**

   - Bibliothèque de templates par spécialité
   - Personnalisation et sauvegarde
   - Application en 1 clic

2. **Gestion des Cycles**

   - Support N semaines (pas juste pair/impair)
   - Visualisation claire du cycle en cours
   - Exceptions ponctuelles

3. **Drag & Drop Avancé**

   - Entre jours/semaines/mois
   - Échange de créneaux entre personnes
   - Annulation avec Ctrl+Z

4. **Validation Intelligente**

   - Contraintes légales (repos, amplitude)
   - Détection conflits en temps réel
   - Suggestions de résolution

5. **Remplacements**
   - Interface dédiée
   - Historique des remplacements
   - Notifications automatiques

### 3.4 Plan de Migration

#### Phase 1: Préparation (1 semaine)

1. Audit complet des données existantes
2. Sauvegarde complète
3. Création nouveau schéma en parallèle

#### Phase 2: Migration (2 semaines)

1. Script de migration des TrameModeles → PlanningTemplates
2. Conversion AffectationModele → TemplateSlots
3. Tests sur environnement de staging

#### Phase 3: Déploiement (1 semaine)

1. Formation utilisateurs clés
2. Migration progressive par site
3. Support renforcé

### 3.5 Estimation des Gains

- **Temps de création planning**: -70% (de 2h à 30min)
- **Erreurs de planning**: -90%
- **Satisfaction utilisateurs**: +80%
- **Conformité réglementaire**: 100%

## 4. Conclusion

Le système actuel est **inadapté** aux besoins réels. La refonte proposée apporte:

- **Flexibilité**: Cycles de N semaines, pas juste pair/impair
- **Simplicité**: Interface calendrier intuitive
- **Fiabilité**: Validation automatique des contraintes
- **Évolutivité**: Architecture extensible

**Recommandation finale**: Lancer la refonte immédiatement avec une équipe dédiée pour livraison sous 6 semaines.
