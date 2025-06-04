# Guide Architecture des Trames - Nouveau Système

## Vue d'ensemble

Le nouveau système de trames remplace l'ancienne architecture `BlocTramePlanning` par une approche modulaire et flexible basée sur trois modèles principaux :

- **TrameModele** : Définit le cadre temporel et la récurrence
- **AffectationModele** : Spécifie les activités pour chaque jour/période
- **PersonnelRequisModele** : Définit les besoins en personnel pour chaque affectation

## Architecture des Modèles

### 1. TrameModele

Modèle principal qui définit le cadre temporel et les règles de récurrence.

```typescript
model TrameModele {
  id                 Int                 @id @default(autoincrement())
  name               String              @unique
  description        String?
  siteId             String?
  isActive           Boolean             @default(true)
  dateDebutEffet     DateTime            // Date de début d'application
  dateFinEffet       DateTime?           // Date de fin (optionnelle)
  recurrenceType     RecurrenceTypeTrame @default(HEBDOMADAIRE)
  joursSemaineActifs Int[]               // [1,2,3,4,5] = Lun-Ven
  typeSemaine        TypeSemaineTrame    @default(TOUTES)
  roles              TrameRoleType[]     @default([TOUS])
  detailsJson        Json?               // Métadonnées flexibles
  affectations       AffectationModele[]
  site               Site?
}
```

**Propriétés clés :**
- `joursSemaineActifs` : Tableau des jours (1=Lundi, 7=Dimanche, format ISO 8601)
- `recurrenceType` : `AUCUNE` (unique) ou `HEBDOMADAIRE`
- `typeSemaine` : `TOUTES`, `PAIRES`, `IMPAIRES`

### 2. AffectationModele

Définit une activité spécifique pour un jour et une période donnés.

```typescript
model AffectationModele {
  id              Int                     @id @default(autoincrement())
  trameModeleId   Int
  activityTypeId  String                  // Lien vers ActivityType
  jourSemaine     DayOfWeek              // MONDAY, TUESDAY, etc.
  periode         Period                  // MATIN, APRES_MIDI, JOURNEE_ENTIERE
  typeSemaine     TypeSemaineTrame       // TOUTES, PAIRES, IMPAIRES
  operatingRoomId Int?                   // Salle d'opération (optionnel)
  priorite        Int                     @default(5)
  isActive        Boolean                 @default(true)
  detailsJson     Json?
  personnelRequis PersonnelRequisModele[]
}
```

### 3. PersonnelRequisModele

Spécifie les besoins en personnel pour une affectation.

```typescript
model PersonnelRequisModele {
  id                          Int                     @id @default(autoincrement())
  affectationModeleId         Int
  roleGenerique               String                  // "MAR", "IADE", "CHIRURGIEN"
  professionalRoleId          String?
  specialtyId                 Int?
  nombreRequis                Int                     @default(1)
  personnelHabituelUserId     Int?                    // Personnel habituel
  personnelHabituelSurgeonId  Int?
  personnelHabituelNomExterne String?
  notes                       String?
}
```

## API Endpoints

### Gestion des TrameModeles

#### GET /api/trame-modeles
Récupère la liste des modèles de trame.

**Paramètres de requête :**
- `siteId` : Filtrer par site
- `isActive` : Filtrer par statut actif
- `includeAffectations` : Inclure les affectations dans la réponse

#### POST /api/trame-modeles
Crée un nouveau modèle de trame.

**Corps de la requête :**
```json
{
  "name": "Trame Bloc Principal",
  "description": "Trame standard pour le bloc opératoire principal",
  "siteId": "site-123",
  "dateDebutEffet": "2024-01-01T00:00:00.000Z",
  "dateFinEffet": "2024-12-31T23:59:59.999Z",
  "recurrenceType": "HEBDOMADAIRE",
  "joursSemaineActifs": [1, 2, 3, 4, 5],
  "typeSemaine": "TOUTES",
  "isActive": true
}
```

#### GET /api/trame-modeles/[id]
Récupère un modèle de trame spécifique avec ses affectations.

#### PUT /api/trame-modeles/[id]
Met à jour un modèle de trame existant.

#### DELETE /api/trame-modeles/[id]
Supprime un modèle de trame (suppression en cascade des affectations et personnel requis).

### Gestion des Affectations

#### GET /api/trame-modeles/[id]/affectations
Récupère les affectations d'un modèle de trame.

#### POST /api/trame-modeles/[id]/affectations
Crée une nouvelle affectation avec personnel requis.

**Corps de la requête :**
```json
{
  "activityTypeId": "activity-123",
  "jourSemaine": "MONDAY",
  "periode": "MATIN",
  "typeSemaine": "TOUTES",
  "operatingRoomId": 1,
  "priorite": 5,
  "personnelRequis": [
    {
      "roleGenerique": "CHIRURGIEN",
      "nombreRequis": 1,
      "personnelHabituelSurgeonId": 42
    },
    {
      "roleGenerique": "IADE",
      "nombreRequis": 1
    }
  ]
}
```

### Application des Trames

#### POST /api/trame-modeles/[id]/apply
Applique un modèle de trame à une plage de dates.

**Corps de la requête :**
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "siteId": "site-123",
  "options": {
    "forceOverwrite": false,
    "skipExistingAssignments": true,
    "dryRun": false
  }
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Trame appliquée avec succès sur 22 jours",
  "planningsCreated": 22,
  "assignmentsCreated": 44,
  "errors": [],
  "warnings": ["Planning existant pour le 15/01/2024 - utilisez forceOverwrite pour écraser"]
}
```

#### GET /api/trame-modeles/[id]/apply
Prévisualise l'application d'une trame (dry run).

**Paramètres de requête :**
- `startDate` : Date de début
- `endDate` : Date de fin  
- `siteId` : ID du site

## Service d'Application des Trames

### TrameApplicationService

Le service `TrameApplicationService` gère l'application des modèles de trame aux plannings réels.

#### Méthode principale : applyTrameToDateRange

```typescript
async applyTrameToDateRange(
  trameModeleId: number,
  startDate: Date,
  endDate: Date,
  siteId: string,
  options: DateRangeOptions = {}
): Promise<ApplyTrameResult>
```

**Options disponibles :**
- `forceOverwrite` : Écrase les plannings existants
- `skipExistingAssignments` : Ignore les affectations existantes
- `includeInactive` : Inclut les affectations inactives
- `dryRun` : Mode simulation (pas de persistance)

#### Processus d'application

1. **Validation** : Vérification des paramètres et de la cohérence
2. **Génération des dates** : Calcul des dates applicables selon la récurrence
3. **Application par date** : Création des `BlocDayPlanning` et `BlocRoomAssignment`
4. **Gestion du personnel** : Création des `BlocStaffAssignment`

#### Gestion de la récurrence

Le service gère automatiquement :
- **Récurrence hebdomadaire** : Application selon `joursSemaineActifs`
- **Types de semaine** : Distinction semaines paires/impaires
- **Périodes d'effet** : Respect des dates de début/fin

## Migration depuis l'ancien système

### Script de migration

Le script `migrate-bloc-trame-to-modele.ts` permet de migrer les anciennes données.

```bash
# Migration en mode simulation
npm run migrate:trame-modeles --dry-run

# Migration réelle
npm run migrate:trame-modeles --force

# Migration avec logs détaillés
npm run migrate:trame-modeles --verbose
```

### Processus de migration

1. **Pré-vérifications** : Contrôle de l'état du système
2. **Mapping des données** : Conversion des anciens modèles
3. **Création des nouveaux modèles** : TrameModele → AffectationModele → PersonnelRequisModele
4. **Post-vérifications** : Contrôle d'intégrité

## Types TypeScript

### Interfaces principales

```typescript
interface TrameModeleWithRelations extends TrameModele {
  affectations: (AffectationModele & {
    activityType: ActivityType;
    operatingRoom: OperatingRoom | null;
    personnelRequis: PersonnelRequisModele[];
  })[];
}

interface ApplyTrameResult {
  success: boolean;
  message: string;
  planningsCreated: number;
  assignmentsCreated: number;
  errors: string[];
  warnings: string[];
}

interface DateRangeOptions {
  forceOverwrite?: boolean;
  skipExistingAssignments?: boolean;
  includeInactive?: boolean;
  dryRun?: boolean;
}
```

## Bonnes pratiques

### 1. Création de trames

- **Nommage** : Utilisez des noms descriptifs et uniques
- **Récurrence** : Privilégiez `HEBDOMADAIRE` pour les trames régulières
- **Dates d'effet** : Définissez toujours une `dateDebutEffet`, `dateFinEffet` optionnelle
- **Sites** : Associez les trames à un site spécifique quand possible

### 2. Gestion des affectations

- **Types d'activité** : Utilisez les `ActivityType` existants ou créez-en de nouveaux
- **Personnel requis** : Spécifiez le personnel habituel quand disponible
- **Priorités** : Utilisez la priorité pour gérer les conflits

### 3. Application des trames

- **Prévisualisation** : Utilisez toujours `dryRun=true` avant l'application réelle
- **Gestion des conflits** : Configurez `forceOverwrite` et `skipExistingAssignments` selon le besoin
- **Plages de dates** : Limitez les plages à des périodes raisonnables (< 1 an)

### 4. Surveillance et monitoring

- **Logs** : Surveillez les logs d'application pour détecter les erreurs
- **Métriques** : Suivez le nombre de plannings et affectations créés
- **Alertes** : Configurez des alertes pour les échecs d'application

## Exemples d'utilisation

### Exemple 1 : Trame simple du lundi au vendredi

```json
{
  "name": "Trame Standard Semaine",
  "recurrenceType": "HEBDOMADAIRE",
  "joursSemaineActifs": [1, 2, 3, 4, 5],
  "typeSemaine": "TOUTES",
  "affectations": [
    {
      "jourSemaine": "MONDAY",
      "periode": "MATIN",
      "activityTypeId": "chirurgie-generale",
      "operatingRoomId": 1
    }
  ]
}
```

### Exemple 2 : Trame alternée (semaines paires seulement)

```json
{
  "name": "Trame Alternée Paires",
  "recurrenceType": "HEBDOMADAIRE", 
  "joursSemaineActifs": [1, 3, 5],
  "typeSemaine": "PAIRES",
  "affectations": [
    {
      "jourSemaine": "MONDAY",
      "periode": "JOURNEE_ENTIERE",
      "typeSemaine": "PAIRES",
      "activityTypeId": "chirurgie-specialisee"
    }
  ]
}
```

### Exemple 3 : Application avec options

```typescript
const result = await trameService.applyTrameToDateRange(
  123,
  new Date('2024-01-01'),
  new Date('2024-01-31'),
  'site-hopital-a',
  {
    forceOverwrite: false,
    skipExistingAssignments: true,
    dryRun: false
  }
);

if (result.success) {
  console.log(`${result.planningsCreated} plannings créés`);
} else {
  console.error('Erreurs:', result.errors);
}
```

## Dépannage

### Erreurs courantes

1. **"Modèle de trame non trouvé"**
   - Vérifiez l'ID du modèle
   - Assurez-vous que le modèle est actif

2. **"Aucune date applicable trouvée"**
   - Vérifiez les `joursSemaineActifs`
   - Contrôlez la période d'effet (`dateDebutEffet`/`dateFinEffet`)
   - Vérifiez le `typeSemaine` vs la plage de dates

3. **"Affectation existante pour la salle"**
   - Utilisez `skipExistingAssignments: true` ou `forceOverwrite: true`
   - Vérifiez les conflits de planning existants

4. **"Aucun type d'activité trouvé"**
   - Créez les `ActivityType` nécessaires
   - Vérifiez les IDs des types d'activité

### Logs de diagnostic

```typescript
// Activer les logs détaillés
const result = await trameService.applyTrameToDateRange(
  trameId, startDate, endDate, siteId, 
  { dryRun: true } // Prévisualisation pour diagnostic
);

console.log('Diagnostic:', {
  applicableDates: result.planningsCreated,
  potentialAssignments: result.assignmentsCreated,
  warnings: result.warnings
});
```

## Évolutions futures

### Fonctionnalités prévues

1. **Templates de trames** : Modèles pré-configurés
2. **Validation avancée** : Règles métier complexes
3. **Import/Export** : Sauvegarde et partage de trames
4. **Historique** : Suivi des modifications et applications
5. **Notifications** : Alertes lors des applications/échecs

### Extensibilité

L'architecture modulaire permet d'ajouter facilement :
- Nouveaux types de récurrence
- Règles de validation personnalisées  
- Intégrations avec systèmes externes
- Workflows d'approbation