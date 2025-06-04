# Documentation Technique: Module de Gestion des Congés

## Architecture

Le module de gestion des congés est structuré en trois couches principales:

1. **Interface utilisateur** (`/src/modules/conges/components/`)
   - Formulaires de demande et de consultation
   - Composants de visualisation des soldes

2. **Logique métier** (`/src/modules/conges/hooks/`, `/src/services/`)
   - Calcul des jours de congés
   - Règles de gestion des soldes
   - Détection de conflits

3. **Couche de données** (`/src/pages/api/conges/`)
   - API REST pour l'interaction avec la base de données Prisma
   - Validation des données
   - Gestion des transactions

## Analyse détaillée des API

### GET /api/conges/balance

#### Fonctionnement interne

1. Le handler récupère le `userId` et optionnellement l'`year` de la requête
2. Il charge les configurations de types de congés depuis `LeaveTypeSetting`
3. Pour chaque type, il construit un objet de solde en:
   - Récupérant l'allocation initiale du type (`defaultAllowance`) ou de `LeaveBalance.initialAllowance`
   - Ajoutant les reports de l'année précédente (`LeaveBalance.carriedOver`)
   - Ajoutant/soustrayant les transferts entre types via `QuotaTransfer`
   - Soustrayant les congés déjà pris via `Leave` (où `status` = `APPROVED`)
   - Calculant un solde prévisionnel en tenant compte des congés en attente

#### Algorithme de calcul du solde

```typescript
// Pseudo-code simplifié
const balance = {
  typeCode: leaveType.code,
  typeName: leaveType.label,
  allowance: leaveBalance?.initialAllowance ?? leaveType.defaultAllowance,
  carryOver: leaveBalance?.carriedOver ?? 0,
  
  // Transferts entre types
  transferredIn: quotaTransfers.filter(t => t.targetType === leaveType.code).reduce(...),
  transferredOut: quotaTransfers.filter(t => t.sourceType === leaveType.code).reduce(...),
  
  // Jours pris (approuvés)
  taken: leaves
    .filter(l => l.status === 'APPROVED' && l.leaveTypeCode === leaveType.code)
    .reduce((total, leave) => total + leave.countedDays, 0),
  
  // Jours en attente
  pending: leaves
    .filter(l => l.status === 'PENDING' && l.leaveTypeCode === leaveType.code)
    .reduce((total, leave) => total + leave.countedDays, 0),
    
  // Solde disponible
  balance: allowance + carryOver + transferredIn - transferredOut - taken
};
```

### POST /api/conges/batch

Cette API permet de créer plusieurs demandes de congés en une seule requête, avec validation et détection de conflits.

#### Détection de conflits

La logique de détection de conflits s'exécute pour chaque demande de congé et vérifie:

1. Si l'utilisateur a déjà des congés approuvés ou en attente qui se chevauchent avec la nouvelle demande
2. Pour les congés approuvés, le conflit est bloquant (erreur 409)
3. Pour les congés en attente, un avertissement est émis mais la création est autorisée

```typescript
// Pseudo-code simplifié de la détection de conflit
const conflictingLeaves = await prisma.leave.findMany({
  where: {
    userId: userId,
    NOT: { status: 'REFUSED' },
    OR: [
      // Cas 1: La demande existante englobe entièrement la nouvelle
      { 
        startDate: { lte: newLeave.startDate },
        endDate: { gte: newLeave.endDate }
      },
      // Cas 2: La nouvelle demande englobe une existante
      {
        startDate: { gte: newLeave.startDate },
        endDate: { lte: newLeave.endDate }
      },
      // Cas 3: Chevauchement partiel (début)
      {
        startDate: { lte: newLeave.endDate },
        endDate: { gte: newLeave.endDate }
      },
      // Cas 4: Chevauchement partiel (fin)
      {
        startDate: { lte: newLeave.startDate },
        endDate: { gte: newLeave.startDate }
      }
    ]
  }
});

if (conflictingLeaves.some(leave => leave.status === 'APPROVED')) {
  throw new ConflictError('Cette demande de congé est en conflit avec un congé approuvé');
}
```

#### Mise à jour des soldes

Lorsqu'un congé est créé avec le statut `APPROVED`, le système met à jour automatiquement le solde correspondant:

```typescript
// Pseudo-code pour la mise à jour du solde
if (newLeave.status === 'APPROVED') {
  await prisma.leaveBalance.updateMany({
    where: {
      userId: newLeave.userId,
      leaveTypeCode: newLeave.leaveTypeCode,
      year: new Date(newLeave.startDate).getFullYear()
    },
    data: {
      used: { increment: newLeave.countedDays }
    }
  });
}
```

## Hook useLeaveCalculation

Ce hook essentiel gère le calcul précis des jours de congés à décompter.

### Paramètres d'entrée

- `startDate`: Date de début du congé
- `endDate`: Date de fin du congé
- `workSchedule`: Planning de travail de l'utilisateur (optionnel, chargé automatiquement si non fourni)
- `options`: Options de calcul
  - `countHalfDays`: Indique si le congé comporte des demi-journées
  - `halfDayPeriod`: Période de la demi-journée ('AM' ou 'PM')

### Fonctionnement

1. Le hook récupère les jours fériés pour la période concernée
2. Il détermine les jours travaillés selon le planning de l'utilisateur
3. Il soustrait les weekends et jours fériés
4. Il applique la logique des demi-journées si nécessaire
5. Il calcule le nombre de jours décomptés

### Avantages

- Séparation propre des préoccupations (chargement des données vs. calcul)
- Réutilisable dans différents contextes (formulaire de création, validation, planification)
- Gestion automatique des états de chargement et d'erreur

## Utilitaires d'assertion pour les tests

Pour résoudre les problèmes de typage entre Jest et TypeScript, nous avons créé un ensemble d'utilitaires d'assertion personnalisés dans `src/tests/utils/assertions.ts`.

### Problème adressé

Les matchers Jest-DOM comme `toBeInTheDocument()` ou `toHaveBeenCalled()` ne sont pas correctement reconnus par TypeScript, malgré les définitions de types importées dans `src/types/jest-dom.d.ts`.

### Solution

Nous avons encapsulé les assertions problématiques dans des fonctions utilitaires:

```typescript
export function expectToBeInDocument(element: HTMLElement | null | undefined): void {
    // @ts-ignore - Le type existe dans jest-dom mais TypeScript ne le reconnaît pas
    expect(element).toBeInTheDocument();
}

export function expectToHaveBeenCalled(mockFn: MockFn): void {
    // @ts-ignore
    expect(mockFn).toHaveBeenCalled();
}

export function objectContaining<T>(obj: T): T {
    // @ts-ignore
    return expect.objectContaining(obj);
}
```

### Utilisation

Au lieu d'utiliser directement les assertions Jest, on utilise les fonctions utilitaires:

```typescript
// Avant (erreurs de typage)
expect(element).toBeInTheDocument();
expect(mockFn).toHaveBeenCalled();

// Après (typage correct)
expectToBeInDocument(element);
expectToHaveBeenCalled(mockFn);
```

## Exemples d'utilisation

### Demande de congé avec demi-journées

```typescript
const leaveForm = {
  userId: 123,
  typeCode: "ANNUAL",
  startDate: new Date("2024-07-01"),
  endDate: new Date("2024-07-01"), // Même jour pour une demi-journée
  isHalfDay: true,
  halfDayPeriod: "AM", // Matin uniquement
  reason: "Rendez-vous médical"
};

// Le hook calculera countedDays = 0.5 au lieu de 1
```

### Calcul avec jours fériés

```typescript
// Considérant que le 14 juillet est férié (dimanche)
// et le 15 juillet est jour férié reporté (lundi)
const leaveForm = {
  userId: 123,
  typeCode: "ANNUAL",
  startDate: new Date("2024-07-12"), // Vendredi
  endDate: new Date("2024-07-16"), // Mardi
  isHalfDay: false,
  reason: "Congés d'été"
};

// Le hook calculera:
// - Vendredi 12/07: 1 jour
// - Weekend 13-14/07: 0 jour
// - Lundi 15/07 (férié): 0 jour
// - Mardi 16/07: 1 jour
// Total: 2 jours décomptés au lieu de 5 jours naturels
```

## Tests d'intégration API

Nous avons implémenté des tests d'intégration pour les principales API du module de congés:

### Test de balance

`/src/tests/integration/api/conges/balance.test.ts` vérifie que:
- L'API retourne les bons soldes initiaux
- Les reports de l'année précédente sont correctement pris en compte
- Les transferts entre types de congés sont calculés
- Les jours pris et en attente sont correctement comptabilisés

### Test de détection de conflits

`/src/tests/integration/api/conges/conflict.test.ts` vérifie que:
- L'API détecte et rejette les chevauchements complets
- L'API détecte et rejette les chevauchements partiels (début/fin)
- L'API autorise les demandes sans conflit

### Test de mise à jour des soldes

`/src/tests/integration/api/conges/balanceUpdate.test.ts` vérifie que:
- Les soldes sont correctement mis à jour lors de la création d'un congé
- Les soldes sont correctement mis à jour lors de l'approbation d'un congé
- Les soldes sont correctement restaurés lors de l'annulation d'un congé

## Bonnes pratiques de test

Pour tester ce module:

1. **Tests unitaires**:
   - Mocker les services externes (`publicHolidayService`, etc.)
   - Utiliser les utilitaires d'assertion personnalisés pour éviter les erreurs de typage
   - Tester les cas limites (demi-journées, jours fériés, etc.)

2. **Tests d'intégration**:
   - Créer un environnement de test avec une base de données propre
   - Initialiser les données de test via Prisma
   - Tester le cycle complet (création, approbation, impact sur le solde)
   - Vérifier la détection de conflits

3. **Approche recommandée**:
   ```typescript
   // Exemple de test d'intégration pour la détection de conflits
   it('devrait détecter un conflit entre deux congés', async () => {
     // 1. Préparation des données (via seedTestData())
     // 2. Création d'un congé existant
     // 3. Tentative de création d'un congé en conflit
     // 4. Vérification de l'erreur 409 Conflict
   });
   ``` 