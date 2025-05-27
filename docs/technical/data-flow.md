# Guide des Flux de Données

Ce document présente les modèles de flux de données utilisés dans l'application, en expliquant comment l'information circule entre les composants, les services et les API.

## Architecture Générale

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Composants  │     │ React Query │     │    API      │     │  Services   │
│   React     │◄───►│    Cache    │◄───►│  Endpoints  │◄───►│  Backend    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   ▲
                                                                   │
                                                                   ▼
                                                            ┌─────────────┐     ┌─────────────┐
                                                            │ Cache Redis │◄───►│  Base de    │
                                                            │             │     │  Données    │
                                                            └─────────────┘     └─────────────┘
```

## Modèles de Flux de Données

### 1. Flux Unidirectionnel (Recommandé)

Ce modèle est privilégié pour la plupart des fonctionnalités de l'application.

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  Actions │────────▶│   Store  │────────▶│    UI    │
└──────────┘         └──────────┘         └──────────┘
      ▲                                         │
      │                                         │
      └─────────────────────────────────────────┘
      (Les interactions utilisateur déclenchent des actions)
```

**Mise en œuvre** :
```typescript
// Exemple avec zustand
import create from 'zustand';

// Définition du store
const useUserStore = create((set) => ({
  users: [],
  isLoading: false,
  error: null,
  
  // Actions
  fetchUsers: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/utilisateurs');
      set({ users: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  addUser: async (userData) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/utilisateurs', userData);
      set((state) => ({ 
        users: [...state.users, response.data],
        isLoading: false 
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
}));

// Utilisation dans un composant
function UserList() {
  const { users, isLoading, error, fetchUsers } = useUserStore();
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  // Rendu du composant
}
```

### 2. Flux Local avec Hooks React

Pour les états locaux de composants sans persistance globale.

```
┌──────────────┐      ┌──────────────┐
│  Composant   │◀────▶│   État local  │
│   Parent     │      │   (useState)  │
└──────────────┘      └──────────────┘
       ▲                      │
       │                      ▼
┌──────────────┐      ┌──────────────┐
│  Composant   │◀────▶│  Callback    │
│    Enfant    │      │  Props       │
└──────────────┘      └──────────────┘
```

**Mise en œuvre** :
```typescript
// Composant parent
function ParentComponent() {
  const [data, setData] = useState([]);
  
  const handleAddItem = useCallback((newItem) => {
    setData((prevData) => [...prevData, newItem]);
  }, []);
  
  return (
    <div>
      <ChildComponent onAddItem={handleAddItem} items={data} />
    </div>
  );
}

// Composant enfant
function ChildComponent({ onAddItem, items }) {
  const [inputValue, setInputValue] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onAddItem(inputValue);
    setInputValue('');
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <button type="submit">Ajouter</button>
      
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </form>
  );
}
```

### 3. Flux de Données avec API et Mise en Cache

Pour les données persistantes qui nécessitent des requêtes API.

```
┌────────────┐    ┌────────────┐    ┌────────────┐
│ Composant  │───▶│  Service   │───▶│    API     │
└────────────┘    └────────────┘    └────────────┘
       ▲                │                 │
       │                ▼                 │
       │           ┌────────────┐         │
       └───────────│   Cache    │◀────────┘
                   └────────────┘
```

**Mise en œuvre** :
```typescript
// Service avec mise en cache
export class PlanningService {
  private cache = new Map();
  private cacheExpiration = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  async getPlanningData(userId, date) {
    const cacheKey = `planning_${userId}_${date}`;
    
    // Vérifier si données en cache et valides
    if (this.cache.has(cacheKey)) {
      const expiration = this.cacheExpiration.get(cacheKey);
      if (expiration > Date.now()) {
        return this.cache.get(cacheKey);
      }
    }
    
    // Sinon, récupérer depuis l'API
    try {
      const response = await api.get(`/planning/${userId}`, { 
        params: { date }
      });
      
      // Mettre en cache
      this.cache.set(cacheKey, response.data);
      this.cacheExpiration.set(cacheKey, Date.now() + this.CACHE_TTL);
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du planning:', error);
      throw error;
    }
  }
  
  // Invalider le cache pour forcer un rafraîchissement
  invalidateCache(userId, date) {
    const cacheKey = `planning_${userId}_${date}`;
    this.cache.delete(cacheKey);
    this.cacheExpiration.delete(cacheKey);
  }
}

// Utilisation dans un hook personnalisé
function usePlanning(userId, date) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const planningService = useMemo(() => new PlanningService(), []);
  
  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      try {
        setLoading(true);
        const result = await planningService.getPlanningData(userId, date);
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [userId, date, planningService]);
  
  const refetch = useCallback(() => {
    planningService.invalidateCache(userId, date);
    // Puis relancer la requête
    setLoading(true);
    planningService.getPlanningData(userId, date)
      .then(result => {
        setData(result);
        setError(null);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [userId, date, planningService]);
  
  return { data, loading, error, refetch };
}
```

## Flux de Données Spécifiques

### Flux de l'Authentification

```
┌────────────┐    ┌────────────┐    ┌────────────┐
│  Login     │───▶│ Auth       │───▶│ API Login  │
│  Component │    │ Service    │    │ Endpoint   │
└────────────┘    └────────────┘    └────────────┘
                        │                 │
                        ▼                 │
                  ┌────────────┐         │
                  │ JWT Token  │◀────────┘
                  │ Storage    │
                  └────────────┘
                        │
                        ▼
                  ┌────────────┐
                  │ State      │
                  │ Update     │
                  └────────────┘
```

### Flux de la Gestion des Congés

```
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│ Demande   │──▶│ Validation│──▶│ Service   │──▶│ API       │
│ Congé UI  │   │ Client    │   │ Congés    │   │ Endpoint  │
└───────────┘   └───────────┘   └───────────┘   └───────────┘
                                      │               │
                                      ▼               │
                                ┌───────────┐        │
                                │ Store     │◀───────┘
                                │ Update    │
                                └───────────┘
                                      │
                                      ▼
                                ┌───────────┐
                                │ UI Update │
                                │ & Notifs  │
                                └───────────┘
```

### Flux de la Gestion des Plannings

```
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│ Édition   │──▶│ Validation│──▶│ Service   │──▶│ API       │
│ Planning  │   │ Conflits  │   │ Planning  │   │ Endpoint  │
└───────────┘   └───────────┘   └───────────┘   └───────────┘
      ▲                              │               │
      │                              ▼               │
      │                        ┌───────────┐        │
      │                        │ Store     │◀───────┘
      │                        │ Update    │
      └────────────────────────┤           │
                               └───────────┘
                                     │
                                     ▼
                               ┌───────────┐
                               │Notification│
                               │Service    │
                               └───────────┘
```

### Flux de Génération de Planning

Le générateur de planning implémente un flux de données complexe qui convertit des paramètres de génération, des règles de planning, et des informations sur les utilisateurs en un planning optimisé et validé.

```
┌────────────────┐    ┌──────────────────┐    ┌───────────────────┐
│  Paramètres de │    │ PlanningGenerator│    │  Affectations     │
│   Génération   │───▶│   (initialize)   │───▶│    générées       │
└────────────────┘    └──────────────────┘    └───────────────────┘
        │                      │                        │
        ▼                      ▼                        ▼
┌────────────────┐    ┌──────────────────┐    ┌───────────────────┐
│ Utilisateurs & │    │ Compteurs        │    │  Validation des   │
│    Congés      │───▶│ d'utilisateurs   │───▶│     règles        │
└────────────────┘    └──────────────────┘    └───────────────────┘
                               │                        │
                               ▼                        ▼
                      ┌──────────────────┐    ┌───────────────────┐
                      │ Eligibilité des  │    │   Résultat final  │
                      │  utilisateurs    │───▶│ (ValidationResult)│
                      └──────────────────┘    └───────────────────┘
```

**Implémentation**:

1. **Initialisation** : Le `PlanningGenerator` reçoit les paramètres, règles et utilisateurs
   ```typescript
   const generator = new PlanningGenerator(parameters, rulesConfig, fatigueConfig);
   await generator.initialize(personnel, existingAssignments);
   ```

2. **Compteurs par utilisateur** : Pour chaque utilisateur, le système maintient des compteurs de fatigue et d'affectations
   ```typescript
   // Structure des compteurs
   interface UserCounter {
     userId: string;
     gardes: { total: number, weekends: number, feries: number, noel: number };
     consultations: { total: number, matin: number, apresmidi: number };
     astreintes: { total: number, semaine: number, weekendFeries: number };
     fatigue: { score: number, lastUpdate: Date };
   }
   ```

3. **Génération d'affectations** : Le système génère les affectations par étapes
   ```typescript
   // Flux interne de génération
   this.generateGardes();
   this.generateAstreintes();
   this.generateConsultations();
   this.generateBlocs();
   ```

4. **Validation** : Vérification des règles métier et retour des résultats
   ```typescript
   const validationResult = this.validatePlanning();
   // Structure du résultat
   interface ValidationResult {
     valid: boolean;
     violations: RuleViolation[];
     metrics: { equiteScore: number, fatigueScore: number, satisfactionScore: number };
   }
   ```

La particularité de ce flux est l'utilisation de compteurs d'utilisateurs qui sont constamment mis à jour tout au long du processus de génération, permettant ainsi de suivre la fatigue et l'équité des affectations.

### Unification du type ShiftType

L'unification du type `ShiftType` dans `src/types/common.ts` a permis d'établir un flux de données cohérent pour les différents modules utilisant ce type :

```
┌──────────────────┐     ┌─────────────────┐
│ src/types/common │     │ Modules utilisant│
│    ShiftType     │────▶│    ShiftType    │
└──────────────────┘     └─────────────────┘
                                 │
                                 ▼
                          ┌─────────────────┐
                          │   Services &    │
                          │  Composants UI  │
                          └─────────────────┘
```

**Avantages** :
- Cohérence des données entre tous les modules
- Maintenance simplifiée (une seule définition à mettre à jour)
- Interopérabilité entre les modules (leaves, planning, etc.)
- Facilite l'évolution du système (ajout de nouveaux types)

**Impact sur le service de congés** :
```typescript
// Avant: Import depuis un module spécifique
import { ShiftType } from '../types/shift';

// Après: Import depuis le module commun
import { ShiftType } from '@/types/common';

// Utilisation cohérente dans les vérifications de conflit
export const checkLeaveConflicts = async (
  startDate: Date,
  endDate: Date,
  userId: string,
  // Les conflits peuvent concerner n'importe quel type de shift
  conflictingShiftTypes?: ShiftType[]
) => {
  // ...
};
```

## Bonnes Pratiques

### 1. Éviter les Cycles de Dépendance

❌ **À éviter**:
```
ComponentA ──▶ ServiceB ──▶ ComponentA
```

✅ **Recommandé**:
```
ComponentA ──▶ GlobalStore ◀── ComponentB
```

### 2. Minimiser les Props Drilling

❌ **À éviter**:
```
App ──▶ Page ──▶ Section ──▶ Subsection ──▶ Component
  (passing userData through all levels)
```

✅ **Recommandé**:
```
App ──▶ UserContext.Provider
          │
          ├───▶ Page
          │      │
          │      └───▶ Section
          │              │
          │              └───▶ Subsection
          │                       │
          └───────────────────────┘
          (using useContext in Component)
```

### 3. Séparation des Préoccupations

✅ **Recommandé**:
- Les composants UI ne devraient pas contenir de logique métier complexe
- Les services ne devraient pas manipuler directement le DOM
- La logique d'API devrait être isolée dans des services dédiés

## Gestion des Erreurs dans les Flux de Données

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Composant│──▶│ Service  │──▶│ API Call │──┐│ Réussite │
└──────────┘   └──────────┘   └──────────┘  │└──────────┘
                                           │
                                           ▼
                                      ┌──────────┐
                                      │ Échec    │
                                      └──────────┘
                                           │
                                           ▼
             ┌──────────┐            ┌──────────┐
             │ UI Error │◀───────────│ Error    │
             │ Display  │            │ Handling │
             └──────────┘            └──────────┘
                                           │
                                           ▼
                                      ┌──────────┐
                                      │ Logging  │
                                      │ Service  │
                                      └──────────┘
```

**Mise en œuvre**:
```typescript
// Service avec gestion d'erreur
async function fetchDataWithErrorHandling() {
  try {
    // 1. Tentative de récupération des données
    const response = await api.get('/data');
    return response.data;
  } catch (error) {
    // 2. Classification de l'erreur
    if (error.response) {
      // Erreur de réponse du serveur (4xx, 5xx)
      switch (error.response.status) {
        case 401:
          // 3. Action spécifique au type d'erreur
          authService.refreshToken().catch(() => {
            authService.logout();
            navigate('/login');
          });
          throw new Error('Session expirée, reconnexion en cours');
          
        case 403:
          throw new Error('Accès refusé - Permissions insuffisantes');
          
        case 404:
          throw new Error('Ressource non trouvée');
          
        case 500:
          throw new Error('Erreur serveur - Veuillez réessayer plus tard');
          
        default:
          throw new Error(`Erreur de requête: ${error.response.status}`);
      }
    } else if (error.request) {
      // Requête envoyée mais pas de réponse (problème réseau)
      throw new Error('Impossible de joindre le serveur, vérifiez votre connexion');
    } else {
      // Erreur de configuration de la requête
      throw new Error(`Erreur de configuration: ${error.message}`);
    }
  } finally {
    // 4. Nettoyage (si nécessaire)
    console.log('Requête terminée');
  }
}

// Utilisation dans un composant
function DataComponent() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setLoading(true);
    
    fetchDataWithErrorHandling()
      .then(result => {
        setData(result);
        setError(null);
      })
      .catch(err => {
        setError(err.message);
        
        // 5. Journalisation des erreurs
        errorLoggingService.logError({
          component: 'DataComponent',
          error: err,
          context: { action: 'fetchData' }
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);
  
  // 6. UI adaptative basée sur l'état
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message={error} />;
  if (!data) return <EmptyState />;
  
  return <DataDisplay data={data} />;
}
```

## Résumé des Meilleures Pratiques

1. **Privilégier le flux unidirectionnel** pour la prévisibilité et la maintenabilité
2. **Centraliser la logique métier** dans des services réutilisables
3. **Utiliser la mise en cache** pour optimiser les performances 
4. **Implémenter une gestion d'erreur robuste** à tous les niveaux
5. **Séparer UI et logique métier** pour améliorer la testabilité
6. **Documenter les flux de données complexes** avec des diagrammes 

## Système Centralisé de Validation des Dates

L'application a mis en place un système centralisé de validation des dates via le hook `useDateValidation`, qui normalise la validation des dates à travers tous les modules.

### Flux de Validation de Dates

```
┌───────────┐    ┌───────────────┐    ┌───────────────┐
│ Composant │───▶│useDateValidation│───▶│  Fonction de  │
│   UI      │    │     Hook      │    │  Validation   │
└───────────┘    └───────────────┘    └───────────────┘
       ▲                │                     │
       │                ▼                     ▼
       │          ┌───────────────┐    ┌───────────────┐
       └──────────│ État d'erreur │    │   Utilitaires │
                  │  de dates     │    │    de dates   │
                  └───────────────┘    └───────────────┘
```

**Implémentation dans les Formulaires** :

```typescript
// Exemple d'intégration dans un formulaire de congé
function LeaveRequestForm() {
  // 1. Initialisation du hook de validation de dates
  const {
    validateDate,
    validateDateRange,
    hasError,
    getErrorMessage,
    resetErrors
  } = useDateValidation();
  
  // 2. État local pour les dates
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  // 3. Gestionnaire de changement de date avec validation
  const handleStartDateChange = (date: Date | null) => {
    resetErrors();
    
    // 4. Validation individuelle lors de la saisie
    if (date && !validateDate(date, 'startDate', { allowPastDates: false })) {
      // La date est invalide, un message d'erreur est disponible via getErrorMessage('startDate')
    }
    
    setStartDate(date);
    
    // 5. Validation de la plage si les deux dates sont définies
    if (date && endDate) {
      validateDateRange(date, endDate, {
        maxDays: 30,
        allowWeekends: false
      });
    }
  };
  
  // 6. Validation avant soumission du formulaire
  const handleSubmit = () => {
    resetErrors();
    
    // Valider à nouveau la plage complète
    if (startDate && endDate && validateDateRange(startDate, endDate)) {
      // Continuer avec la soumission
      submitLeaveRequest({ startDate, endDate, ...otherData });
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <DatePicker
        selected={startDate}
        onChange={handleStartDateChange}
        // ...
      />
      {hasError('startDate') && (
        <ErrorMessage>{getErrorMessage('startDate')}</ErrorMessage>
      )}
      
      {/* ... Reste du formulaire ... */}
    </form>
  );
}
```

### Intégration avec la Détection de Conflits

Le système de validation des dates a été intégré au hook `useConflictDetection`, créant un flux de données en deux étapes pour la validation:

```
┌───────────────────┐
│ Formulaire Congés │
└───────────────────┘
          │
          ▼
┌───────────────────┐     ┌───────────────────┐
│ useDateValidation  │────▶│useConflictDetection│
│ (validité formelle)│     │(validité métier)  │
└───────────────────┘     └───────────────────┘
          │                         │
          ▼                         ▼
┌───────────────────┐     ┌───────────────────┐
│Feedback Validation│     │Feedback Conflits  │
│  (format date)    │     │  (chevauchement)  │
└───────────────────┘     └───────────────────┘
```

**Avantages** :
- Séparation des préoccupations: validation formelle (format, limites) vs validation métier (conflits)
- Feedback immédiat à l'utilisateur
- Réduction des appels API inutiles (pour les dates formellement invalides)
- Cohérence des validations dans toute l'application

# Flux de données dans le module de congés

## Vue d'ensemble

Le module de congés utilise un flux de données bien défini pour assurer la cohérence et la fiabilité des opérations. Ce document détaille les interactions entre les différents composants et services.

## Diagramme général du flux de données

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Composants │     │    Hooks    │     │  Services   │     │  Stockage   │
│      UI     │────>│  Personnali-│────>│  Métier     │────>│  (Prisma /  │
│             │<────│     sés     │<────│             │<────│    API)     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       ^                   ^                   ^                   ^
       |                   |                   |                   |
       ▼                   ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Bus d'événements (EventBus)                       │
└─────────────────────────────────────────────────────────────────────────┘
       ^                   ^                   ^                   ^
       |                   |                   |                   |
       ▼                   ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Module     │     │  Module     │     │  Module     │     │  Module     │
│ Calendrier  │     │  Planning   │     │ Notification│     │ Statistiques│
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

## Flux de création d'une demande de congés

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│ LeaveForm   │     │   useLeave   │     │leaveService │     │   Prisma    │
│ Component   │────>│     Hook     │────>│             │────>│  Database   │
└─────────────┘     └──────────────┘     └─────────────┘     └─────────────┘
       │                   │                    │                   │
       │                   │                    │                   │
       │                   ▼                    │                   │
       │            ┌──────────────┐            │                   │
       │────────────│useValidation │            │                   │
       │            │     Hook     │            │                   │
       │            └──────────────┘            │                   │
       │                   │                    │                   │
       │                   ▼                    │                   │
       │            ┌──────────────┐            │                   │
       └───────────>│useConflict   │────────────┘                   │
                    │Detection Hook│                                │
                    └──────────────┘                                │
                           │                                        │
                           ▼                                        │
                    ┌──────────────┐                                │
                    │useLeaveQuota │────────────────────────────────┘
                    │     Hook     │
                    └──────────────┘
```

## Flux d'approbation d'une demande

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│LeaveApproval│     │   useLeave   │     │leaveService │     │   Prisma    │
│ Component   │────>│     Hook     │────>│             │────>│  Database   │
└─────────────┘     └──────────────┘     └─────────────┘     └─────────────┘
                            │                    │                   │
                            │                    │                   │
                            ▼                    ▼                   │
                    ┌──────────────┐     ┌─────────────┐            │
                    │LeavePermissio│     │EventBus     │            │
                    │nService      │     │(publish)    │            │
                    └──────────────┘     └─────────────┘            │
                                                │                    │
                                                ▼                    │
┌─────────────┐                         ┌─────────────┐             │
│Notification │                         │LeaveToPlan- │             │
│Service      │<────────────────────────│ningService  │<────────────┘
└─────────────┘                         └─────────────┘
       │
       ▼
┌─────────────┐
│Email/Push   │
│Notifications│
└─────────────┘
```

## Détection de conflits

```
┌──────────────────┐     ┌──────────────────┐
│useConflictDetecti│     │leaveService      │
│on Hook           │────>│(checkConflicts)  │
└──────────────────┘     └──────────────────┘
                                  │
                                  ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ConflictStore     │<────│Prisma (Existing  │     │CalendarService   │
│(State)           │     │Leaves Query)     │────>│(Other Events)    │
└──────────────────┘     └──────────────────┘     └──────────────────┘
       │                                                   │
       └───────────────────────────────────────────────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │ConflictResolution│
                      │Algorithm         │
                      └──────────────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │ConflictCheckResul│
                      │t                 │
                      └──────────────────┘
```

## Système de notifications

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│leaveService      │     │EventBus          │     │NotificationEvent │
│(Actions)         │────>│(publish)         │────>│Service           │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                                          │
                                                          ▼
                                                 ┌──────────────────┐
                                                 │NotificationServic│
                                                 │e                 │
                                                 └──────────────────┘
                                                      │        │
                     ┌─────────────────────────────────┘        │
                     │                                          │
                     ▼                                          ▼
           ┌──────────────────┐                       ┌──────────────────┐
           │Database          │                       │Email/Push        │
           │(Notifications)   │                       │Notifications     │
           └──────────────────┘                       └──────────────────┘
                     │
                     ▼
           ┌──────────────────┐
           │useLeaveNotificati│
           │ons Hook          │
           └──────────────────┘
                     │
                     ▼
           ┌──────────────────┐
           │NotificationCenter│
           │Component         │
           └──────────────────┘
```

## Calcul des quotas

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│useLeaveQuota     │     │quotaService      │     │Prisma Database   │
│Hook              │────>│                  │────>│                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
       │                           │                        │
       │                           │                        │
       │                           ▼                        │
       │                  ┌──────────────────┐              │
       │                  │WorkScheduleServic│<─────────────┘
       │                  │e                 │
       │                  └──────────────────┘
       │                           │
       │                           │
       │                           ▼
       │                  ┌──────────────────┐
       └─────────────────>│QuotaCalculator  │
                          │                  │
                          └──────────────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │LeaveBalance      │
                          │                  │
                          └──────────────────┘
```

## Intégration entre modules via le bus d'événements

Le bus d'événements est au cœur de l'architecture d'intégration :

```
┌───────────────────────────────────────────────────────────────┐
│                     EventBusService                            │
├───────────────┬───────────────┬───────────────┬───────────────┤
│ LEAVE_CREATED │ LEAVE_APPROVED│ LEAVE_REJECTED│ LEAVE_CANCELED│
└───────────────┴───────────────┴───────────────┴───────────────┘
         │               │               │               │
         ▼               ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Calendar      │ │ Planning      │ │ Notification  │ │ Statistics    │
│ Module        │ │ Module        │ │ Module        │ │ Module        │
└───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘
```

## Exemples de cas d'utilisation

### 1. Soumission d'une demande de congés

1. L'utilisateur remplit le formulaire `LeaveRequestForm`
2. Le hook `useLeave` valide les entrées avec `useLeaveValidation`
3. La détection de conflits est effectuée via `useConflictDetection`
4. La vérification des quotas est effectuée via `useLeaveQuota`
5. Si valide, la demande est soumise via `leaveService.submitLeaveRequest()`
6. Le service sauvegarde la demande dans la base de données
7. Un événement `LEAVE_CREATED` est publié via `EventBusService`
8. Le `NotificationEventService` crée une notification pour les approbateurs
9. L'utilisateur est redirigé vers la vue de confirmation

### 2. Approbation d'une demande

1. L'administrateur voit les demandes en attente dans `LeaveApprovalList`
2. L'administrateur sélectionne une demande à approuver
3. Le hook `useLeave` vérifie les permissions via `LeavePermissionService`
4. La demande est approuvée via `leaveService.approveLeave()`
5. Le service met à jour le statut de la demande en base de données
6. Un événement `LEAVE_APPROVED` est publié via `EventBusService`
7. Les modules abonnés réagissent à cet événement :
   - `LeaveToPlanningService` met à jour le planning
   - `NotificationService` notifie l'employé de l'approbation
   - Le module de statistiques met à jour les compteurs

## Conclusion

Cette architecture de flux de données permet une séparation claire des responsabilités et facilite l'intégration entre les différents modules tout en maintenant un couplage faible. Le bus d'événements est l'élément central qui assure la communication entre les différentes parties du système sans créer de dépendances directes.

# Flux optimisé des données de congés

## Récupération des données avec React Query

1. Le composant React appelle un hook personnalisé (par exemple `useLeavesList`)
2. React Query vérifie si les données sont dans le cache client
   - Si les données sont fraîches (< staleTime) : retourne les données du cache
   - Si les données sont périmées mais disponibles : retourne les données du cache et déclenche une requête en arrière-plan
   - Si les données ne sont pas en cache : déclenche une requête et affiche un état de chargement

3. La requête est envoyée à l'API si nécessaire
4. L'API vérifie d'abord dans le cache Redis
   - Si les données sont en cache : retourne les données cachées
   - Sinon : interroge la base de données, met en cache le résultat, puis retourne les données

5. React Query met en cache les données côté client
6. Les données sont affichées dans le composant

### Mutations et invalidation de cache

1. Le composant appelle un hook de mutation (par exemple `useSaveLeave`)
2. La mutation est envoyée à l'API
3. L'API traite la mutation et met à jour la base de données
4. L'API invalide les entrées concernées dans le cache Redis
5. La réponse est retournée au client
6. React Query invalide les requêtes concernées dans le cache client
7. Les composants sont mis à jour avec les nouvelles données

## Optimisations clés

### Côté Client (React)

1. **React Query** : Configuration optimisée de staleTime, gcTime, et stratégies de retry
2. **Debounce** : Limitation des requêtes pendant la saisie de filtres
3. **Prefetching** : Préchargement des données fréquemment consultées
4. **Invalidation ciblée** : Invalidation précise du cache après les mutations

```jsx
// Exemple d'utilisation de React Query optimisé
const { data, isLoading } = useLeavesList({ 
  status: LeaveStatus.APPROVED 
}, {
  staleTime: 5 * 60 * 1000, // 5 minutes
  placeholderData: previousPageData // Maintient les données entre les pages
});
```

### Côté Serveur (Node.js/Next.js)

1. **Cache Redis** : Mise en cache des requêtes fréquentes avec TTL adaptés
2. **Stratégies d'invalidation** : Invalidation précise du cache lors des mutations
3. **Requêtes optimisées** : Sélection uniquement des champs nécessaires
4. **Compression** : Réduction de la taille des payloads

```typescript
// Exemple de stratégie d'invalidation sur une API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    const leaveId = req.query.id as string;
    const updatedLeave = await leaveService.updateLeave(leaveId, req.body);
    
    // Invalidation ciblée du cache Redis
    await redis.del(`leave:detail:${leaveId}`);
    await redis.del(`user:leaves:${updatedLeave.userId}`);
    
    return res.status(200).json(updatedLeave);
  }
}
```

## Performances et Métriques

Les optimisations mises en place permettent:

1. **Réduction des requêtes réseau** : Jusqu'à 90% de requêtes en moins
2. **Temps de réponse améliorés** : Chargement instantané des données en cache
3. **Expérience utilisateur fluide** : Interface réactive même avec de grandes quantités de données
4. **Réduction de la charge serveur** : Moins de requêtes à la base de données

## Diagramme de séquence

```
┌─────────┐          ┌───────────┐          ┌──────┐          ┌─────────┐          ┌────┐
│Component│          │React Query│          │ API  │          │   Redis │          │ DB │
└────┬────┘          └─────┬─────┘          └──┬───┘          └────┬────┘          └─┬──┘
     │    useLeavesList    │                   │                   │                 │
     │ ───────────────────>│                   │                   │                 │
     │                     │                   │                   │                 │
     │                     │ check cache       │                   │                 │
     │                     │ ───┐              │                   │                 │
     │                     │    │              │                   │                 │
     │                     │ <──┘              │                   │                 │
     │                     │                   │                   │                 │
     │                     │ if not in cache   │                   │                 │
     │                     │ ─────────────────>│                   │                 │
     │                     │                   │                   │                 │
     │                     │                   │ check Redis cache │                 │
     │                     │                   │ ─────────────────>│                 │
     │                     │                   │                   │                 │
     │                     │                   │                   │ if not in cache │
     │                     │                   │                   │ ───────────────>│
     │                     │                   │                   │                 │
     │                     │                   │                   │ query result    │
     │                     │                   │                   │ <───────────────│
     │                     │                   │                   │                 │
     │                     │                   │                   │ cache result    │
     │                     │                   │                   │ ───┐            │
     │                     │                   │                   │    │            │
     │                     │                   │                   │ <──┘            │
     │                     │                   │                   │                 │
     │                     │                   │ cached result     │                 │
     │                     │                   │ <─────────────────│                 │
     │                     │                   │                   │                 │
     │                     │ API response      │                   │                 │
     │                     │ <─────────────────│                   │                 │
     │                     │                   │                   │                 │
     │                     │ cache result      │                   │                 │
     │                     │ ───┐              │                   │                 │
     │                     │    │              │                   │                 │
     │                     │ <──┘              │                   │                 │
     │                     │                   │                   │                 │
     │ cached data         │                   │                   │                 │
     │ <───────────────────│                   │                   │                 │
     │                     │                   │                   │                 │
┌────┴────┐          ┌─────┴─────┐          ┌──┴───┐          ┌────┴────┐          ┌─┴──┐
│Component│          │React Query│          │ API  │          │   Redis │          │ DB │
└─────────┘          └───────────┘          └──────┘          └─────────┘          └────┘
```

## Bonnes Pratiques

1. **Toujours utiliser React Query** pour les opérations de données
2. **Configurer les staleTime appropriés** selon la nature des données
3. **Implémenter le debounce** pour les filtres et recherches
4. **Prévoir des stratégies d'invalidation ciblées** pour les mutations
5. **Surveiller les performances** avec les outils de mesure intégrés