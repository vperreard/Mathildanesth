# Breaking Changes - Système de validation des dates

Ce document détaille les changements majeurs apportés au système de validation des dates dans l'application Mathildanesth. Ces modifications pourraient nécessiter des ajustements dans votre code existant.

## Résumé des modifications

Le système de validation des dates a été entièrement refondu pour offrir une solution plus robuste, plus flexible et plus complète. Les principales modifications incluent:

1. **Centralisation de la validation**: Toute la logique de validation est désormais centralisée dans un hook React unique `useDateValidation`
2. **Nouvelles fonctionnalités spécifiques**: Ajout de fonctions dédiées pour les congés, les gardes et la détection de conflits
3. **Gestion améliorée du contexte**: Suivi des jours utilisés, des conflits et autres informations de contexte
4. **API unifiée**: Interface cohérente pour toutes les validations de dates

## Changements majeurs

| Fonctionnalité | Avant | Maintenant |
|----------------|-------|------------|
| Validation de dates | Dispersée dans plusieurs composants | Centralisée dans `useDateValidation` |
| Gestion des erreurs | Spécifique à chaque composant | Système unifié avec types d'erreurs standardisés |
| Détection de conflits | Implémentée séparément dans chaque module | Fonction unique `detectConflicts` réutilisable |
| Règles métier | Duplication de code entre composants | Options de validation configurables |

## Détails des breaking changes

### 1. Remplacement des fonctions de validation existantes

**Avant**:
```typescript
// Dans le composant LeaveForm
const validateDates = () => {
  // Logique de validation spécifique
};

// Dans le composant ShiftAssignment
const isValidAssignment = () => {
  // Autre logique de validation
};
```

**Maintenant**:
```typescript
import { useDateValidation } from '../hooks/useDateValidation';

// Dans n'importe quel composant
const { validateDate, validateDateRange, validateLeaveRequest, validateShiftAssignment } = useDateValidation();

// Utilisation unifiée
const isValid = validateLeaveRequest(start, end, userId, options);
```

### 2. Modification de la structure des erreurs

**Avant**:
```typescript
const [errors, setErrors] = useState({
  startDate: '',
  endDate: ''
});

// Affichage des erreurs
{errors.startDate && <span className="error">{errors.startDate}</span>}
```

**Maintenant**:
```typescript
const { hasError, getErrorMessage, getErrorType } = useDateValidation();

// Affichage des erreurs
{hasError('startDate') && (
  <span className="error">{getErrorMessage('startDate')}</span>
)}

// Possibilité de réagir au type d'erreur
if (getErrorType('startDate') === DateValidationErrorType.PAST_DATE) {
  // Traitement spécifique
}
```

### 3. Nouvelle gestion du contexte de validation

**Avant**:
```typescript
// Variables d'état séparées
const [usedDays, setUsedDays] = useState(0);
const [remainingDays, setRemainingDays] = useState(25);
```

**Maintenant**:
```typescript
const { setContext, context } = useDateValidation();

// Définir le contexte
setContext({ usedDays: 10 });

// Accéder au contexte mis à jour après validation
console.log(context.remainingDays);
console.log(context.conflicts);
```

### 4. Changement des noms de champs pour les erreurs

Les erreurs sont désormais stockées avec des noms de champs basés sur une convention standardisée:

- `leave_start_${userId}`, `leave_end_${userId}` pour les congés
- `shift_${shiftType}_${userId}` pour les gardes
- `conflict_${type}_${userId}` pour les conflits

## Migration depuis l'ancien système

### Étape 1: Importer le nouveau hook

```typescript
import { useDateValidation, DateValidationErrorType } from '../hooks/useDateValidation';
```

### Étape 2: Remplacer les fonctions de validation existantes

Identifier toutes les fonctions de validation de dates dans vos composants et les remplacer par les appels correspondants au hook `useDateValidation`.

### Étape 3: Adapter l'affichage des erreurs

Remplacer l'accès direct aux erreurs par les fonctions `hasError`, `getErrorMessage` et `getErrorType`.

### Étape 4: Migrer la gestion du contexte

Remplacer les variables d'état séparées (jours utilisés, quota, etc.) par la gestion du contexte via `setContext` et `context`.

### Étape 5: Mettre à jour les identifiants de champs

S'assurer que les noms de champs correspondent à la nouvelle convention pour la vérification des erreurs.

## Exemples de migration

### Exemple 1: Formulaire de demande de congés

**Avant**:
```typescript
function LeaveRequestForm() {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [errors, setErrors] = useState({});
  const [usedDays, setUsedDays] = useState(10);
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!startDate) {
      newErrors.startDate = 'La date de début est requise';
    } else if (startDate < new Date()) {
      newErrors.startDate = 'La date de début ne peut pas être dans le passé';
    }
    
    // Autres validations...
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Reste du composant...
}
```

**Maintenant**:
```typescript
function LeaveRequestForm() {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const userId = "user123"; // Identifiant de l'utilisateur
  
  const { 
    validateLeaveRequest, 
    hasError, 
    getErrorMessage, 
    setContext 
  } = useDateValidation();
  
  useEffect(() => {
    // Initialiser le contexte avec les jours déjà utilisés
    setContext({ usedDays: 10 });
  }, [setContext]);
  
  const validateForm = () => {
    return validateLeaveRequest(
      startDate,
      endDate,
      userId,
      {
        availableDaysPerYear: 25,
        minAdvanceNotice: 3,
        businessDaysOnly: true
      }
    );
  };
  
  // Reste du composant...
  return (
    <form>
      <div>
        <label>Date de début</label>
        <DatePicker value={startDate} onChange={setStartDate} />
        {hasError(`leave_start_${userId}`) && (
          <span className="error">{getErrorMessage(`leave_start_${userId}`)}</span>
        )}
      </div>
      {/* Reste du formulaire... */}
    </form>
  );
}
```

### Exemple 2: Affectation de garde

**Avant**:
```typescript
function ShiftAssignmentForm() {
  const [shiftDate, setShiftDate] = useState(null);
  const [shiftType, setShiftType] = useState('jour');
  const [errorMsg, setErrorMsg] = useState('');
  
  const validateShift = () => {
    if (!shiftDate) {
      setErrorMsg('La date est requise');
      return false;
    }
    
    // Vérifier si la date est dans une période de repos
    const isRestPeriod = checkRestPeriod(shiftDate);
    if (isRestPeriod) {
      setErrorMsg('Cette date est dans une période de repos obligatoire');
      return false;
    }
    
    setErrorMsg('');
    return true;
  };
  
  // Reste du composant...
}
```

**Maintenant**:
```typescript
function ShiftAssignmentForm() {
  const [shiftDate, setShiftDate] = useState(null);
  const [shiftType, setShiftType] = useState('jour');
  const userId = "user123";
  
  const { 
    validateShiftAssignment, 
    hasError, 
    getErrorMessage 
  } = useDateValidation();
  
  const validateShift = () => {
    // Récupérer les périodes de repos de l'API ou d'une source de données
    const restPeriods = getRestPeriods();
    
    return validateShiftAssignment(
      shiftDate,
      shiftType,
      userId,
      {
        blackoutPeriods: restPeriods
      }
    );
  };
  
  // Reste du composant...
  return (
    <form>
      <div>
        <label>Date de garde</label>
        <DatePicker value={shiftDate} onChange={setShiftDate} />
        {hasError(`shift_${shiftType}_${userId}`) && (
          <span className="error">{getErrorMessage(`shift_${shiftType}_${userId}`)}</span>
        )}
      </div>
      {/* Reste du formulaire... */}
    </form>
  );
}
```

## Impact sur les tests

Les tests qui interagissent directement avec les anciennes fonctions de validation devront être mis à jour pour utiliser le nouveau hook. Vous devrez peut-être également ajuster les assertions pour vérifier les erreurs via les nouvelles fonctions.

## Fonctionnalités obsolètes

Les fonctions et composants suivants sont désormais obsolètes et devraient être remplacés par les nouvelles API:

- `validateLeave()` dans le module congés
- `isValidDate()` dans les utilitaires communs
- `ShiftValidator` dans le module garde
- `ConflictChecker` dans le module planning

## Support et assistance

Pour toute question concernant la migration vers le nouveau système, veuillez contacter:

- **Équipe de développement**: dev-team@mathildanesth.fr
- **Documentation complète**: [Lien vers la documentation du hook](https://wiki.mathildanesth.fr/hooks/useDateValidation)
- **Canal Slack**: #date-validation-migration

Des sessions de formation sont prévues les 15 et 22 juin 2023 pour aider les équipes à migrer vers le nouveau système.

## Calendrier de déploiement

- **Phase 1 (Actuelle)**: Période de double fonctionnement - les deux systèmes coexistent
- **Phase 2 (Dans 1 mois)**: Dépréciation de l'ancien système - avertissements dans la console
- **Phase 3 (Dans 3 mois)**: Suppression de l'ancien système 