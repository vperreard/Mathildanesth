# Patterns et Anti-patterns

Ce document répertorie les patterns recommandés et les anti-patterns à éviter dans le code du projet.

## Patterns Recommandés

### Gestion d'État

✅ **Utiliser les hooks personnalisés pour l'état complexe**
```typescript
// Bon pattern
function useUserData(userId: string) {
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetchUserById(userId);
        setData(response);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId]);

  return { data, loading, error };
}
```

✅ **Context API pour l'état global partagé**
```typescript
// Bon pattern
export const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  // Valeur mémoïsée
  const value = useMemo(() => ({ user, setUser }), [user]);
  
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
```

### Gestion des Erreurs

✅ **Try/catch avec logger centralisé**
```typescript
// Bon pattern
try {
  await saveUserData(userData);
} catch (error) {
  logger.error('Erreur lors de la sauvegarde des données utilisateur', {
    error,
    userId: userData.id,
    context: 'UserForm'
  });
  showErrorNotification('Impossible de sauvegarder les données');
}
```

✅ **Early returns**
```typescript
// Bon pattern
function processUserData(userData: UserData | null): ProcessedData {
  if (!userData) {
    return { success: false, reason: 'NO_DATA' };
  }
  
  if (!userData.isValid) {
    return { success: false, reason: 'INVALID_DATA' };
  }
  
  // Traitement principal
  return { success: true, data: transformData(userData) };
}
```

### Performance

✅ **Mémoisation des calculs coûteux**
```typescript
// Bon pattern
const filteredItems = useMemo(() => {
  return items.filter(item => item.category === selectedCategory);
}, [items, selectedCategory]);
```

✅ **Chargement paresseux des composants lourds**
```typescript
// Bon pattern
const HeavyDataGrid = lazy(() => import('./components/HeavyDataGrid'));

function DataPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyDataGrid />
    </Suspense>
  );
}
```

### Structure des Composants

✅ **Composants de présentation vs logique**
```typescript
// Bon pattern - Composant de présentation
function UserCard({ user, onEdit }: UserCardProps) {
  return (
    <Card>
      <CardHeader>{user.name}</CardHeader>
      <CardContent>{user.email}</CardContent>
      <CardFooter>
        <Button onClick={() => onEdit(user.id)}>Modifier</Button>
      </CardFooter>
    </Card>
  );
}

// Bon pattern - Composant logique
function UserCardContainer({ userId }: { userId: string }) {
  const { data, loading } = useUserData(userId);
  const navigate = useNavigate();
  
  if (loading) return <Skeleton />;
  if (!data) return <ErrorState />;
  
  const handleEdit = (id: string) => navigate(`/users/${id}/edit`);
  
  return <UserCard user={data} onEdit={handleEdit} />;
}
```

### Gestion des Types / Cohérence des Données

✅ **Maintenir la cohérence des types entre les couches**

*   **Description:** Les fonctions (services, utilitaires) doivent clairement définir les types de leurs paramètres. Les appelants (hooks, composants) doivent respecter ces contrats. Effectuer les conversions de type (ex: `Date` vers chaîne ISO) uniquement aux limites externes de l'application (ex: juste avant un appel API `fetch`) ou lorsque c'est explicitement requis par la fonction appelée.
*   **Avantage:** Améliore la lisibilité, réduit les erreurs de type, facilite le débogage et la refactorisation.

```typescript
// Bon pattern

// Hook appelant un service
async function handleDateUpdate(dateObject: Date) {
  // Passer l'objet Date directement si le service l'attend
  await internalService.processDate(dateObject); 
}

// Service traitant la date et appelant une API externe
async function processDate(inputDate: Date) {
  // Logique utilisant les méthodes de l'objet Date
  if (isBefore(inputDate, new Date())) { 
    // ... 
  }

  // Conversion juste avant l'appel API externe qui attend une chaîne
  const isoDateString = inputDate.toISOString();
  await fetch('/external-api', { 
    method: 'POST', 
    body: JSON.stringify({ eventDate: isoDateString })
  });
}
```

### Tests

✅ **Tester les cas limites avec null/undefined**
```typescript
// Bon pattern
it('should handle null user properties gracefully', () => {
  // Utiliser le cast explicite pour les tests
  const userWithNullProps = {
    ...user,
    name: null as unknown as string
  };
  
  render(<UserComponent user={userWithNullProps} />);
  
  // Vérifier que le composant gère le cas correctement
  expect(screen.getByText('Utilisateur inconnu')).toBeInTheDocument();
});

it('should handle undefined objects', () => {
  // Tester avec un objet complètement undefined
  render(<UserComponent user={undefined} />);
  
  // Vérifier que le comportement de secours est activé
  expect(screen.getByText('Aucun utilisateur')).toBeInTheDocument();
});
```

✅ **Tests de tri et filtrage qui vérifient le comportement plutôt que l'implémentation**
```typescript
// Bon pattern
it('should maintain filters when changing sort criteria', () => {
  render(<DataTable data={mockData} />);
  
  // Appliquer un filtre
  const filterInput = screen.getByPlaceholderText('Filtrer...');
  fireEvent.change(filterInput, { target: { value: 'test' } });
  
  // Vérifier que le filtre est appliqué
  expect(filterInput).toHaveValue('test');
  
  // Appliquer un tri
  const sortButton = screen.getByRole('button', { name: /Trier/i });
  fireEvent.click(sortButton);
  
  // Vérifier que le filtre est maintenu
  expect(filterInput).toHaveValue('test');
  expect(screen.getByText('test-item')).toBeInTheDocument();
});
```

### Gestion des congés et des conflits

✅ **Utiliser le service de détection de conflits pour toutes les demandes**
```typescript
// Bon pattern : Vérification systématique des conflits
async function submitLeaveRequest(request: LeaveRequest) {
  const conflicts = await conflictDetectionService.checkConflicts(request);
  
  if (conflicts.hasBlockingConflicts()) {
    return { success: false, conflicts: conflicts.getBlockingConflicts() };
  }
  
  if (conflicts.hasWarnings()) {
    // Gérer les avertissements
  }
  
  // Continuer le traitement
}
```

❌ **Implémenter des vérifications ad hoc pour les conflits**
```typescript
// Mauvais pattern : Logique de vérification dispersée
async function submitLeaveRequest(request: LeaveRequest) {
  // Vérifications de dates directement ici
  // Vérifications d'équipe directement ici
  // Autres vérifications spécifiques...
}
```

✅ **Enrichir les règles de conflit via la configuration centrale**
```typescript
// Bon pattern : Configuration centralisée
const conflictRules: ConflictRules = {
  minimumTeamPresence: {
    enabled: true,
    threshold: 0.5,
    severity: ConflictSeverity.WARNING
  },
  // Autres règles...
};

conflictDetectionService.setRules(conflictRules);
```

❌ **Hardcoder les seuils et règles de conflit**
```typescript
// Mauvais pattern : Valeurs en dur
if (teamPresenceRatio < 0.5) {
  // Logique en dur
}
```

## Anti-patterns à Éviter

### Gestion d'État

❌ **État géré à plusieurs endroits**
```typescript
// Mauvais pattern
function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  // ...
}

function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  // ...
}
```

❌ **Mise à jour directe du state sans fonction**
```typescript
// Mauvais pattern
const [items, setItems] = useState<Item[]>([]);

function handleAddItem(newItem: Item) {
  items.push(newItem); // Mutation directe!
  setItems(items);
}
```

### Gestion des Erreurs

❌ **Catch silencieux sans traitement**
```typescript
// Mauvais pattern
try {
  await api.saveData(data);
} catch (error) {
  // Silence total, pas de log, pas de notification
  console.log('Error:', error); // Log insuffisant
}
```

❌ **Messages d'erreur non spécifiques**
```typescript
// Mauvais pattern
try {
  await fetchData();
} catch (error) {
  showError('Une erreur est survenue'); // Trop générique
}
```

### Performance

❌ **Recalculs inutiles à chaque rendu**
```typescript
// Mauvais pattern
function UserList({ users }) {
  // Recalculé à chaque rendu
  const sortedUsers = users.sort((a, b) => a.name.localeCompare(b.name));
  
  return (
    <ul>
      {sortedUsers.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

❌ **Props spread sans contrôle**
```typescript
// Mauvais pattern
function Button(props) {
  // Tous les props sont passés, y compris des props inconnus
  return <button {...props} />;
}
```

### Structure du Code

❌ **Composants trop complexes**
```typescript
// Mauvais pattern
function MegaComponent() {
  // 200+ lignes de code avec 10+ états, 15+ effets
  // et plusieurs responsabilités mélangées
}
```

❌ **Duplication de code entre composants**
```typescript
// Mauvais pattern - Logique dupliquée
function UserList() {
  const [isLoading, setIsLoading] = useState(true);
  // Logique de chargement dupliquée...
}

function ProductList() {
  const [isLoading, setIsLoading] = useState(true);
  // Même logique de chargement...
}
```

### Gestion des Types / Cohérence des Données

❌ **Conversion prématurée des types**

*   **Description:** Convertir des objets (ex: `Date`) en leur représentation sérialisée (ex: chaîne ISO) avant de les passer à des fonctions internes qui attendent l'objet original.
*   **Problème:** Cela masque le type réel attendu par la fonction appelée, peut introduire des erreurs si la fonction interne dépend des méthodes de l'objet original, et rend le débogage plus difficile.

```typescript
// Mauvais pattern
async function handleDateUpdate(dateObject: Date) {
  const isoDateString = dateObject.toISOString();
  // internalService.processDate attend un objet Date !
  await internalService.processDate(isoDateString); 
}
```

❌ **Conversions de type implicites et non vérifiées**
```typescript
// Mauvais pattern
function processDates(startDateStr: string, endDateStr: string) {
  const startDate = new Date(startDateStr); // Peut créer une date invalide
  const endDate = new Date(endDateStr);     // Aucune vérification n'est effectuée
  
  return calculateDateDiff(startDate, endDate);
}
```

### Définition des Types

❌ **Types dupliqués ou incohérents**

Le système contient actuellement un problème critique concernant la définition multiple du type `ShiftType` dans différents fichiers, ce qui crée des incohérences potentielles :

```typescript
// src/types/assignment.ts
export enum ShiftType {
  MATIN = 'MATIN',            // Vacation 8h-13h
  APRES_MIDI = 'APRES_MIDI',  // Vacation 13h30-18h30
  GARDE_24H = 'GARDE_24H',    // Garde 8h-8h+1
  ASTREINTE = 'ASTREINTE'     // Astreinte 8h-8h+1
}

// src/types/shift.ts
export enum ShiftType {
  JOUR = "JOUR",
  NUIT = "NUIT",
  GARDE_WEEKEND = "GARDE_WEEKEND",
  ASTREINTE_SEMAINE = "ASTREINTE_SEMAINE",
  ASTREINTE_WEEKEND = "ASTREINTE_WEEKEND",
  URGENCE = "URGENCE",
  CONSULTATION = "CONSULTATION",
}
```

Ce pattern conduit à :
- Erreurs de typage lors de la compilation
- Confusion sur quelle définition utiliser
- Risque de bug lors de l'exécution si les mauvaises valeurs sont utilisées

✅ **Solution recommandée : Unification des types**
```typescript
// Définir un seul emplacement pour ShiftType
// Par exemple, src/types/common.ts
export enum ShiftType {
  // Fusion des valeurs nécessaires avec documentation
  MATIN = 'MATIN',                    // Vacation 8h-13h
  APRES_MIDI = 'APRES_MIDI',          // Vacation 13h30-18h30
  GARDE_24H = 'GARDE_24H',            // Garde 8h-8h+1 en semaine  
  GARDE_WEEKEND = 'GARDE_WEEKEND',    // Garde pendant le weekend
  ASTREINTE_SEMAINE = 'ASTREINTE_SEMAINE', // Astreinte en semaine
  ASTREINTE_WEEKEND = 'ASTREINTE_WEEKEND', // Astreinte le weekend
  URGENCE = 'URGENCE',                // Garde d'urgence
  CONSULTATION = 'CONSULTATION',      // Consultation spéciale
}

// Puis importer depuis ce fichier unique
import { ShiftType } from '@/types/common';
```

### Séparation des Responsabilités

## Réutilisation du Code

### Composants UI

Réutilisez les composants UI existants plutôt que d'en créer de nouveaux :

1. Utilisez les composants de base de `src/components/ui/`
2. Vérifiez les patterns d'utilisation dans les composants existants
3. Respectez la hiérarchie de style et les tokens de design

### Hooks

Utilisez les hooks existants :

1. `useAuth` - Authentification et autorisations
2. `useErrorHandler` - Gestion des erreurs
3. `useDateValidation` - Validation de dates
4. `useNotifications` - Système de notifications
5. `usePreferences` - Préférences utilisateur
6. `useUnsavedChanges` - Détection des changements non sauvegardés
7. `useRuleViolations` - Vérification des violations de règles

### Services

Utilisez toujours les services existants pour les opérations métier :

1. `trameAffectationService` - Gestion des trames
2. `planningService` - Génération de planning
3. `userService` - Gestion des utilisateurs
4. `notificationService` - Notifications
5. `errorLoggingService` - Journalisation des erreurs

## Dépannage Courant

### Problèmes de Rendu React

Si un composant ne se met pas à jour correctement :
- Vérifiez les dépendances des hooks useEffect/useMemo/useCallback
- Utilisez React DevTools pour inspecter l'arbre de composants
- Vérifiez les clés dans les listes

### Problèmes de Performance

Si l'application est lente :
- Utilisez React.memo pour éviter les rendus inutiles
- Évitez les calculs lourds dans le corps des composants
- Utilisez useMemo pour les calculs coûteux
- Vérifiez les boucles inefficaces

### Problèmes d'API

Si les appels API échouent :
- Vérifiez le format des données envoyées
- Utilisez les intercepteurs pour le débogage
- Vérifiez la gestion des erreurs
- Confirmez l'authentification/tokens 

### Tests

❌ **Tests incomplets qui ne vérifient pas les cas limites**
```typescript
// Mauvais pattern
it('should render user data', () => {
  // Ne teste que le cas nominal
  render(<UserComponent user={mockUser} />);
  
  // Vérifie uniquement le cas où toutes les données sont présentes
  expect(screen.getByText(mockUser.name)).toBeInTheDocument();
  // Aucun test pour null, undefined, ou données partielles
});
```

❌ **Tests fragiles dépendant de l'implémentation interne**
```typescript
// Mauvais pattern
it('should sort data', () => {
  render(<DataTable data={mockData} />);
  
  // Accède directement à l'état interne
  expect(component.instance().state.sortDirection).toBe('asc');
  
  // Vérifie l'existence d'une classe CSS spécifique
  expect(screen.getByTestId('sort-icon').classList.contains('asc')).toBe(true);
});
```

❌ **Tests sans asserts explicites**
```typescript
// Mauvais pattern
it('should handle filtering', () => {
  render(<FilterableList items={items} />);
  
  // Applique un filtre mais ne vérifie pas le résultat
  fireEvent.change(screen.getByLabelText('Filter'), { target: { value: 'test' } });
  // Pas d'assertion pour vérifier que le filtrage a bien fonctionné
}); 

## Tests

### Tests unitaires
- ✅ **Tester une seule unité à la fois** - Chaque test unitaire doit se concentrer sur une fonctionnalité spécifique.
- ✅ **Utiliser des mocks pour les dépendances** - Isoler l'unité testée en mockant ses dépendances.
- ✅ **Tests déterministes** - Les tests doivent donner le même résultat à chaque exécution.
- ✅ **Nommer clairement les tests** - Le nom du test doit décrire ce qui est testé et le comportement attendu.
- ❌ **Dépendances entre tests** - Les tests ne doivent pas dépendre de l'exécution d'autres tests.
- ❌ **Tests trop complexes** - Si un test est difficile à comprendre, il est probablement trop complexe.

### Tests d'intégration
- ✅ **Tester les interactions entre composants** - Vérifier que les différents modules fonctionnent correctement ensemble.
- ✅ **Structure en 3 parties** - Arranger (setup), Agir (exécuter), Affirmer (vérifier) pour organiser clairement les tests.
- ✅ **Cibler les points d'intégration critiques** - Comme l'interaction entre hooks, services et composants.
- ✅ **Utiliser des mocks partiels** - Ne mocker que les parties externes au sous-système testé.
- ✅ **Tests isolés et indépendants** - Chaque test d'intégration doit pouvoir s'exécuter indépendamment.
- ❌ **Tester tout d'un coup** - Les tests d'intégration doivent rester ciblés sur des interactions spécifiques.
- ❌ **Dépendre de l'état global** - Éviter les tests qui dépendent d'un état global difficile à contrôler.
- ❌ **Ignorer le nettoyage** - Toujours réinitialiser l'état et les mocks après chaque test.

### Exemple de test d'intégration
```typescript
// Test d'intégration entre useConflictDetection et useDateValidation
describe('Integration useConflictDetection avec useDateValidation', () => {
  beforeEach(() => {
    // Réinitialisation des mocks avant chaque test
    jest.clearAllMocks();
  });

  it('devrait vérifier les conflits et gérer la validation des dates', async () => {
    // 1. ARRANGER: Configuration des mocks et du contexte
    // Configurer le mock de useDateValidation
    (useDateValidation as jest.Mock).mockImplementation(() => ({
      validateDate: jest.fn(() => true),
      validateDateRange: jest.fn(() => true),
      hasError: jest.fn(() => false),
      getErrorMessage: jest.fn(() => null),
      resetErrors: jest.fn()
    }));
    
    // Configurer le mock du service
    (checkLeaveConflicts as jest.Mock).mockResolvedValue({
      conflicts: [],
      hasBlockingConflicts: false
    });
    
    // Initialiser le hook
    const { result } = renderHook(() => useConflictDetection({ userId }));
    
    // 2. AGIR: Exécuter la fonction à tester
    await act(async () => {
      await result.current.checkConflicts(startDate, endDate);
    });
    
    // 3. AFFIRMER: Vérifier les résultats
    // Vérifier que le service a été appelé avec les bons paramètres
    expect(checkLeaveConflicts).toHaveBeenCalledWith(
      startDate,
      endDate,
      userId,
      undefined
    );
    
    // Test du cas alternatif avec validation échouée
    jest.clearAllMocks();
    (useDateValidation as jest.Mock).mockImplementation(() => ({
      validateDate: jest.fn().mockReturnValueOnce(false),
      validateDateRange: jest.fn(),
      hasError: jest.fn().mockReturnValue(true),
      getErrorMessage: jest.fn().mockReturnValue('Date invalide'),
      resetErrors: jest.fn()
    }));
    
    // Tester directement la fonction de validation
    const isValid = result.current.validateDates(startDate, endDate);
    expect(isValid).toBe(false);
  });
});
```

### Tests E2E
- ✅ **Se concentrer sur les parcours utilisateur critiques** - Tester les flux complets les plus importants.
- ✅ **Utiliser des données de test réalistes** - Les données doivent être représentatives des cas réels.
- ✅ **Exécuter dans un environnement similaire à la prod** - Pour détecter les problèmes d'intégration.
- ❌ **Tests E2E fragiles** - Éviter les sélecteurs CSS trop spécifiques ou des délais d'attente arbitraires.
- ❌ **Trop de tests E2E** - Privilégier les tests unitaires et d'intégration quand c'est possible.

// ... existing code ... 