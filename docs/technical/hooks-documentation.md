# Documentation technique des hooks de gestion des congés

Cette documentation présente les hooks personnalisés développés pour la gestion des demandes de congés. Ces hooks facilitent la validation des dates et la détection des conflits potentiels.

## Table des matières

1. [useLeaveValidation](#useleavevalidation)
   - [Objectif et responsabilités](#objectif-et-responsabilités-useleavevalidation)
   - [Paramètres d'entrée et valeurs de retour](#paramètres-dentrée-et-valeurs-de-retour-useleavevalidation)
   - [Dépendances](#dépendances-useleavevalidation)
   - [Exemples d'utilisation](#exemples-dutilisation-useleavevalidation)
   - [Cas limites et gestion](#cas-limites-et-gestion-useleavevalidation)

2. [useConflictDetection](#useconflictdetection)
   - [Objectif et responsabilités](#objectif-et-responsabilités-useconflictdetection)
   - [Paramètres d'entrée et valeurs de retour](#paramètres-dentrée-et-valeurs-de-retour-useconflictdetection)
   - [Dépendances](#dépendances-useconflictdetection)
   - [Exemples d'utilisation](#exemples-dutilisation-useconflictdetection)
   - [Cas limites et gestion](#cas-limites-et-gestion-useconflictdetection)

---

## useLeaveValidation

### Objectif et responsabilités (useLeaveValidation)

Le hook `useLeaveValidation` étend le hook `useDateValidation` pour ajouter des fonctionnalités spécifiques à la validation des demandes de congés. Il permet de :

- Valider les dates de début et fin de congés
- Vérifier le respect des quotas de congés disponibles
- Contrôler la conformité avec les règles métier (délais de préavis, périodes d'exclusion, etc.)
- Générer des messages d'erreur contextuels pour l'utilisateur
- Maintenir un contexte de validation avec des informations sur les jours utilisés/restants

### Paramètres d'entrée et valeurs de retour (useLeaveValidation)

#### Fonction du hook

```typescript
export function useLeaveValidation() {
  // ...
  return {
    validateLeaveRequest,
    hasError,
    getErrorMessage,
    getErrorType,
    resetErrors,
    context: localContext,
    setContext
  };
}
```

#### Fonction `validateLeaveRequest`

```typescript
validateLeaveRequest(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
  userId: string,
  options: DateValidationOptions = {}
): boolean
```

**Paramètres :**
- `start` : Date de début des congés (objet Date, chaîne de caractères ou null/undefined)
- `end` : Date de fin des congés (objet Date, chaîne de caractères ou null/undefined)
- `userId` : Identifiant de l'utilisateur demandant le congé
- `options` : Options de validation
  - `required` : Indique si les dates sont obligatoires (par défaut: true)
  - `allowPastDates` : Autorise les dates passées (par défaut: false)
  - `minAdvanceNotice` : Délai minimum de préavis en jours (par défaut: 1)
  - `disallowWeekends` : Interdit les congés le weekend (par défaut: false)
  - `availableDaysPerYear` : Quota annuel de jours de congés
  - `blackoutPeriods` : Périodes d'exclusion où les congés sont interdits

**Valeur de retour :**
- `boolean` : Indique si la demande est valide (`true`) ou non (`false`)

#### Autres fonctions

- `hasError(fieldName: string): boolean` : Vérifie si un champ a une erreur
- `getErrorMessage(fieldName: string): string | null` : Récupère le message d'erreur d'un champ
- `getErrorType(fieldName: string): DateValidationErrorType | null` : Récupère le type d'erreur
- `resetErrors(): void` : Réinitialise toutes les erreurs
- `context` : Contexte de validation (jours utilisés, restants, etc.)
- `setContext(context: Partial<ValidationContext>): void` : Définit le contexte de validation

### Dépendances (useLeaveValidation)

- `useDateValidation` : Hook de base pour la validation des dates
- `useState`, `useCallback` de React
- Fonctions utilitaires:
  - `normalizeDate` : Normalise une chaîne ou un objet Date
  - `calculateDurationInDays` : Calcule la durée en jours
  - `calculateBusinessDays` : Calcule la durée en jours ouvrables
  - `isInBlackoutPeriod` : Vérifie si une date est dans une période d'exclusion

### Exemples d'utilisation (useLeaveValidation)

#### Exemple basique

```typescript
import { useLeaveValidation } from '../hooks/useLeaveValidation';

const LeaveForm = ({ userId }) => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  
  const {
    validateLeaveRequest,
    hasError,
    getErrorMessage,
    resetErrors
  } = useLeaveValidation();
  
  const handleSubmit = () => {
    const isValid = validateLeaveRequest(startDate, endDate, userId, {
      availableDaysPerYear: 30
    });
    
    if (isValid) {
      // Soumettre la demande
    }
  };
  
  return (
    <form>
      <div>
        <label>Date de début</label>
        <input 
          type="date"
          onChange={(e) => setStartDate(e.target.value)}
        />
        {hasError(`leave_start_${userId}`) && (
          <span className="error">{getErrorMessage(`leave_start_${userId}`)}</span>
        )}
      </div>
      
      <div>
        <label>Date de fin</label>
        <input 
          type="date"
          onChange={(e) => setEndDate(e.target.value)}
        />
        {hasError(`leave_end_${userId}`) && (
          <span className="error">{getErrorMessage(`leave_end_${userId}`)}</span>
        )}
      </div>
      
      <button type="button" onClick={handleSubmit}>Soumettre</button>
    </form>
  );
};
```

#### Exemple avec contexte de validation

```typescript
const { validateLeaveRequest, context, setContext } = useLeaveValidation();

// Définir le contexte (par exemple, jours déjà utilisés)
useEffect(() => {
  setContext({
    usedDays: 15 // L'utilisateur a déjà utilisé 15 jours de congés
  });
}, [setContext]);

// Valider la demande (ne permet que 30 jours par an)
const isValid = validateLeaveRequest(startDate, endDate, userId, {
  availableDaysPerYear: 30
});

// Accéder aux détails du contexte
console.log(`Jours restants: ${context.remainingDays}`);
```

### Cas limites et gestion (useLeaveValidation)

1. **Dates manquantes ou invalides**
   - Si les dates sont requises et manquantes, des erreurs appropriées sont générées
   - Les chaînes de dates sont normalisées en objets Date, avec validation du format

2. **Dates dans le passé**
   - Par défaut, les dates passées sont refusées
   - Ce comportement peut être modifié avec l'option `allowPastDates`

3. **Date de fin avant la date de début**
   - Génère une erreur sur les deux champs de dates
   - Le message d'erreur indique clairement le problème

4. **Dépassement du quota de congés**
   - Vérifie si la durée demandée dépasse les jours restants
   - Prend en compte les jours déjà utilisés via le contexte
   - Génère une erreur avec les détails (jours demandés vs. disponibles)

5. **Périodes d'exclusion (blackout)**
   - Vérifie si la demande se situe pendant une période où les congés sont interdits
   - Retourne les détails des périodes concernées en cas de conflit

---

## useConflictDetection

### Objectif et responsabilités (useConflictDetection)

Le hook `useConflictDetection` permet de détecter et gérer les conflits potentiels lors d'une demande de congés. Il offre les fonctionnalités suivantes :

- Vérification des conflits entre une demande de congés et d'autres événements
- Classification des conflits par type et sévérité
- Filtrage des conflits (bloquants, avertissements, informatifs)
- Résolution manuelle des conflits détectés
- Validation préliminaire des dates avant détection des conflits

### Paramètres d'entrée et valeurs de retour (useConflictDetection)

#### Fonction du hook

```typescript
export const useConflictDetection = ({
  userId
}: UseConflictDetectionProps): UseConflictDetectionReturn => {
  // ...
  return {
    conflicts,
    hasBlockingConflicts,
    loading,
    error,
    checkConflicts,
    getConflictsByType,
    getBlockingConflicts,
    getWarningConflicts,
    getInfoConflicts,
    resolveConflict,
    resetConflicts,
    validateDates
  };
};
```

**Paramètre d'entrée :**
- `userId` : Identifiant de l'utilisateur pour lequel vérifier les conflits

**Valeurs de retour :**
- `conflicts` : Liste des conflits détectés
- `hasBlockingConflicts` : Indique s'il existe des conflits bloquants
- `loading` : État de chargement lors de la vérification
- `error` : Erreur éventuelle lors de la vérification
- `checkConflicts` : Fonction pour vérifier les conflits
- `getConflictsByType` : Fonction pour filtrer les conflits par type
- `getBlockingConflicts` : Fonction pour obtenir les conflits bloquants
- `getWarningConflicts` : Fonction pour obtenir les conflits d'avertissement
- `getInfoConflicts` : Fonction pour obtenir les conflits informatifs
- `resolveConflict` : Fonction pour marquer un conflit comme résolu
- `resetConflicts` : Fonction pour réinitialiser tous les conflits
- `validateDates` : Fonction pour valider les dates avant vérification

#### Fonction `checkConflicts`

```typescript
checkConflicts(
  startDate: Date,
  endDate: Date,
  leaveId?: string
): Promise<ConflictCheckResult>
```

**Paramètres :**
- `startDate` : Date de début de la période à vérifier
- `endDate` : Date de fin de la période à vérifier
- `leaveId` : Identifiant de la demande de congés à exclure (optionnel)

**Valeur de retour :**
- `Promise<ConflictCheckResult>` : Résultat de la vérification des conflits
  - `hasBlockingConflicts` : Présence de conflits bloquants
  - `conflicts` : Liste des conflits détectés

### Dépendances (useConflictDetection)

- `useDateValidation` : Hook pour valider les dates avant vérification des conflits
- `useState`, `useCallback` de React
- Service de vérification des conflits : `checkLeaveConflicts`
- Types :
  - `LeaveConflict` : Structure des conflits
  - `ConflictType` : Types de conflit (USER_LEAVE_OVERLAP, TEAM_CAPACITY, etc.)
  - `ConflictSeverity` : Niveaux de sévérité (ERROR, WARNING, INFO)

### Exemples d'utilisation (useConflictDetection)

#### Exemple basique

```typescript
import { useConflictDetection } from '../hooks/useConflictDetection';

const LeaveRequestComponent = ({ userId }) => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  
  const {
    conflicts,
    hasBlockingConflicts,
    loading,
    error,
    checkConflicts,
    getBlockingConflicts,
    getWarningConflicts
  } = useConflictDetection({ userId });
  
  const handleDateChange = async () => {
    try {
      await checkConflicts(startDate, endDate);
    } catch (err) {
      console.error('Erreur lors de la vérification des conflits', err);
    }
  };
  
  return (
    <div>
      <div>
        <label>Date de début</label>
        <input 
          type="date"
          onChange={(e) => {
            setStartDate(new Date(e.target.value));
            handleDateChange();
          }}
        />
      </div>
      
      <div>
        <label>Date de fin</label>
        <input 
          type="date"
          onChange={(e) => {
            setEndDate(new Date(e.target.value));
            handleDateChange();
          }}
        />
      </div>
      
      {loading && <p>Vérification des conflits...</p>}
      
      {hasBlockingConflicts && (
        <div className="error-box">
          <h4>Conflits bloquants détectés :</h4>
          <ul>
            {getBlockingConflicts().map(conflict => (
              <li key={conflict.id}>{conflict.description}</li>
            ))}
          </ul>
        </div>
      )}
      
      {getWarningConflicts().length > 0 && (
        <div className="warning-box">
          <h4>Avertissements :</h4>
          <ul>
            {getWarningConflicts().map(conflict => (
              <li key={conflict.id}>{conflict.description}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

#### Exemple avec résolution de conflits

```typescript
const {
  conflicts,
  resolveConflict,
  getWarningConflicts
} = useConflictDetection({ userId });

// Afficher les conflits avec boutons de résolution
return (
  <div>
    <h3>Conflits d'avertissement</h3>
    <ul>
      {getWarningConflicts().map(conflict => (
        <li key={conflict.id}>
          {conflict.description}
          <button onClick={() => resolveConflict(conflict.id)}>
            Ignorer ce conflit
          </button>
        </li>
      ))}
    </ul>
  </div>
);
```

#### Exemple avec vérification avancée

```typescript
const {
  checkConflicts,
  validateDates
} = useConflictDetection({ userId });

const handleSubmit = async () => {
  // Valider les dates avant de vérifier les conflits
  if (!validateDates(startDate, endDate)) {
    setError('Dates invalides');
    return;
  }
  
  try {
    const result = await checkConflicts(startDate, endDate, leaveId);
    
    if (result.hasBlockingConflicts) {
      setError('Impossible de soumettre la demande : conflits bloquants détectés');
    } else if (result.conflicts.length > 0) {
      setShowWarning(true);
    } else {
      submitLeaveRequest();
    }
  } catch (err) {
    setError('Erreur lors de la vérification des conflits');
  }
};
```

### Cas limites et gestion (useConflictDetection)

1. **Dates invalides**
   - Le hook valide le format et la cohérence des dates avant de vérifier les conflits
   - Les dates invalides sont rejetées immédiatement, sans appel au service

2. **Erreurs du service de vérification**
   - Les erreurs du service sont capturées et exposées via la propriété `error`
   - L'état de chargement est correctement réinitialisé grâce au bloc `finally`

3. **Changements fréquents de dates**
   - Le hook gère efficacement les appels répétés à `checkConflicts`
   - Les états sont réinitialisés à chaque nouvelle vérification

4. **Résolution de conflits**
   - La fonction `resolveConflict` permet de gérer manuellement les conflits
   - L'état `hasBlockingConflicts` est mis à jour dynamiquement après résolution

5. **Types de conflits multiples**
   - Le hook offre des fonctions de filtrage pour traiter différemment les types de conflits :
     - `getBlockingConflicts` : Conflits bloquants (ERROR)
     - `getWarningConflicts` : Conflits d'avertissement (WARNING)
     - `getInfoConflicts` : Conflits d'information (INFO) 