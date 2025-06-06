# Modèles de Données - Mathildanesth

## Vue d'ensemble

Ce document décrit l'architecture des données et les modèles Prisma utilisés dans Mathildanesth pour la gestion des plannings médicaux.

## Schéma de Base de Données

### Entités Principales

#### 1. User - Utilisateurs du Système
```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  nom         String
  prenom      String
  role        Role     @default(USER)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  sites       UserSite[]
  leaves      Leave[]
  assignments AffectationModele[]
  permissions UserPermission[]
}
```

**Rôles disponibles :**
- `ADMIN_TOTAL` - Administration complète
- `ADMIN_PARTIEL` - Administration limitée
- `MAR` - Médecin Anesthésiste Réanimateur
- `IADE` - Infirmier Anesthésiste Diplômé d'État
- `CHIRURGIEN` - Chirurgien
- `USER` - Utilisateur standard

#### 2. TrameModele - Modèles de Tableaux de Service
```prisma
model TrameModele {
  id              String    @id @default(cuid())
  nom             String
  description     String?
  isActive        Boolean   @default(true)
  siteId          String
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  site            Site      @relation(fields: [siteId], references: [id])
  affectations    AffectationModele[]
  instances       TrameInstance[]
}
```

#### 3. AffectationModele - Modèles d'Affectation
```prisma
model AffectationModele {
  id              String        @id @default(cuid())
  trameModeleId   String
  userId          String?
  secteurId       String?
  salleId         String?
  dayOfWeek       Int          // 0-6 (Dimanche-Samedi)
  startTime       String       // Format HH:mm
  endTime         String       // Format HH:mm
  isRequired      Boolean      @default(true)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  // Relations
  trameModele     TrameModele  @relation(fields: [trameModeleId], references: [id])
  user            User?        @relation(fields: [userId], references: [id])
  secteur         Sector?      @relation(fields: [secteurId], references: [id])
  salle           OperatingRoom? @relation(fields: [salleId], references: [id])
}
```

#### 4. Leave - Demandes de Congés
```prisma
model Leave {
  id              String      @id @default(cuid())
  userId          String
  startDate       DateTime
  endDate         DateTime
  type            LeaveType
  status          LeaveStatus @default(PENDING)
  reason          String?
  isRecurring     Boolean     @default(false)
  recurringConfig Json?       // Configuration récurrence
  quotaUsed       Float       @default(0)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relations
  user            User        @relation(fields: [userId], references: [id])
  conflicts       LeaveConflict[]
  analytics       LeaveAnalytics[]
}
```

**Types de congés :**
- `ANNUAL` - Congés annuels
- `SICK` - Congés maladie
- `TRAINING` - Formation
- `SPECIAL` - Congés spéciaux
- `UNPAID` - Congés sans solde

**Statuts :**
- `PENDING` - En attente
- `APPROVED` - Approuvé
- `REJECTED` - Refusé
- `CANCELLED` - Annulé

#### 5. OperatingRoom - Salles d'Opération
```prisma
model OperatingRoom {
  id              String    @id @default(cuid())
  nom             String
  numero          String
  siteId          String
  secteurId       String
  type            RoomType  @default(STANDARD)
  isActive        Boolean   @default(true)
  capacity        Int       @default(1)
  specialties     String[]  // Spécialités supportées
  equipment       Json?     // Équipements disponibles
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  site            Site      @relation(fields: [siteId], references: [id])
  secteur         Sector    @relation(fields: [secteurId], references: [id])
  planning        BlocDayPlanning[]
  affectations    AffectationModele[]
}
```

**Types de salles :**
- `STANDARD` - Salle standard
- `HYPERASEPTIQUE` - Salle hyperaseptique
- `ENDOSCOPIE` - Salle endoscopie
- `URGENCES` - Salle urgences
- `AMBULATOIRE` - Salle ambulatoire

#### 6. BlocDayPlanning - Planning Quotidien
```prisma
model BlocDayPlanning {
  id              String        @id @default(cuid())
  date            DateTime
  siteId          String
  salleId         String
  assignments     Json          // Affectations de la journée
  status          PlanningStatus @default(DRAFT)
  validatedBy     String?
  validatedAt     DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  // Relations
  site            Site          @relation(fields: [siteId], references: [id])
  salle           OperatingRoom @relation(fields: [salleId], references: [id])
  conflicts       PlanningConflict[]
}
```

#### 7. PlanningRule - Règles de Gestion
```prisma
model PlanningRule {
  id              String      @id @default(cuid())
  name            String
  description     String
  type            RuleType
  conditions      Json        // Conditions d'application
  constraints     Json        // Contraintes à vérifier
  severity        RuleSeverity @default(WARNING)
  isActive        Boolean     @default(true)
  siteId          String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relations
  site            Site?       @relation(fields: [siteId], references: [id])
  violations      RuleViolation[]
}
```

**Types de règles :**
- `SUPERVISION` - Règles de supervision
- `WORKLOAD` - Charge de travail
- `COMPETENCE` - Compétences requises
- `SCHEDULE` - Contraintes horaires
- `QUOTA` - Gestion quotas

**Niveaux de sévérité :**
- `INFO` - Information
- `WARNING` - Avertissement
- `ERROR` - Erreur
- `CRITICAL` - Critique

## Relations et Contraintes

### Contraintes d'Intégrité

1. **Utilisateur-Site** : Un utilisateur peut être affecté à plusieurs sites
2. **Affectation-Modèle** : Une affectation appartient à un seul modèle de trame
3. **Congés-Utilisateur** : Les congés sont liés à un utilisateur unique
4. **Planning-Salle** : Un planning quotidien concerne une salle spécifique
5. **Règles-Site** : Les règles peuvent être globales ou spécifiques à un site

### Index de Performance

```sql
-- Index pour les requêtes fréquentes
CREATE INDEX idx_user_role_site ON "User"(role, siteId);
CREATE INDEX idx_leave_user_date ON "Leave"(userId, startDate, endDate);
CREATE INDEX idx_planning_date_site ON "BlocDayPlanning"(date, siteId);
CREATE INDEX idx_rule_active_type ON "PlanningRule"(isActive, type);
```

## Gestion des Quotas

### Modèle LeaveQuota
```prisma
model LeaveQuota {
  id              String    @id @default(cuid())
  userId          String
  year            Int
  type            LeaveType
  allocated       Float     // Quota alloué
  used            Float     @default(0) // Quota utilisé
  remaining       Float     // Quota restant
  carriedOver     Float     @default(0) // Report année précédente
  transferredIn   Float     @default(0) // Transfert reçu
  transferredOut  Float     @default(0) // Transfert donné
  
  // Relations
  user            User      @relation(fields: [userId], references: [id])
  
  @@unique([userId, year, type])
}
```

## Gestion des Conflits

### Modèle PlanningConflict
```prisma
model PlanningConflict {
  id              String            @id @default(cuid())
  planningId      String
  type            ConflictType
  severity        ConflictSeverity
  description     String
  affectedUsers   String[]          // IDs utilisateurs affectés
  suggestedFix    Json?             // Suggestion de résolution
  status          ConflictStatus    @default(ACTIVE)
  resolvedAt      DateTime?
  
  // Relations
  planning        BlocDayPlanning   @relation(fields: [planningId], references: [id])
}
```

## Audit et Logs

### Modèle AuditLog
```prisma
model AuditLog {
  id              String    @id @default(cuid())
  userId          String?
  action          String    // CREATE, UPDATE, DELETE
  entity          String    // Table concernée
  entityId        String    // ID de l'entité
  oldValues       Json?     // Anciennes valeurs
  newValues       Json?     // Nouvelles valeurs
  ipAddress       String?
  userAgent       String?
  createdAt       DateTime  @default(now())
  
  // Relations
  user            User?     @relation(fields: [userId], references: [id])
}
```

## Migration et Versioning

### Stratégie de Migration
1. **Versioning sémantique** des schémas
2. **Migrations réversibles** quand possible
3. **Sauvegarde automatique** avant migration
4. **Tests de migration** sur environnement de staging
5. **Rollback plan** pour chaque migration

### Scripts de Seed
- `seed-users.ts` - Utilisateurs de test
- `seed-sites.ts` - Sites et salles
- `seed-rules.ts` - Règles de base
- `seed-quotas.ts` - Quotas par défaut

## Optimisations Performances

### Stratégies de Cache
1. **Redis** - Cache des sessions et données fréquentes
2. **Prisma** - Cache des requêtes répétitives
3. **Application** - Memoization des calculs lourds

### Requêtes Optimisées
- **Pagination cursor-based** pour grandes listes
- **Includes sélectifs** selon besoins
- **Agrégations** en base de données
- **Lazy loading** pour relations complexes

---

*Documentation mise à jour : Juin 2025*