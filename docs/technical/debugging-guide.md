# Guide de Débogage

Ce document fournit des stratégies pour identifier et résoudre les problèmes courants dans l'application.

## Problèmes Courants et Solutions

### 1. Erreurs de rendu React

#### Symptômes
- Écran blanc
- Erreur "Cannot read property 'X' of undefined/null"
- Boucle de rendu infinie

#### Diagnostic
```typescript
// Ajoutez des logs stratégiques
console.log('Component rendering with props:', props);
console.log('State values:', someState);

// Utilisez les Error Boundaries pour capturer les erreurs
<ErrorBoundary>
  <ProblematicComponent />
</ErrorBoundary>
```

#### Solutions
1. **Écran blanc ou erreur React dans la console**
   - Vérifiez les valeurs nulles/undefined avec des gardes
   ```typescript
   // Bon pattern
   {user && <UserProfile data={user} />}
   ```
   
2. **Boucle de rendu infinie**
   - Vérifiez les dépendances de `useEffect`
   ```typescript
   // Problématique - Dépendance manquante
   useEffect(() => {
     fetchData(userId);
   }, []); // userId manquant!
   
   // Correct
   useEffect(() => {
     fetchData(userId);
   }, [userId]);
   ```

3. **Erreurs liées aux refs**
   - Assurez-vous que les refs sont initialisées correctement
   ```typescript
   // Bon pattern avec initialisation sécurisée
   const elementRef = useRef<HTMLDivElement | null>(null);
   ```

### 2. Problèmes d'état

#### Symptômes
- Les mises à jour d'état ne sont pas appliquées
- Les données affichées sont périmées
- Le composant ne se met pas à jour

#### Diagnostic
```typescript
// Utilisez des logs avant/après mise à jour
console.log('Before update:', currentState);
setMyState(newValue);
console.log('After setState called:', myState); // N'affichera pas la nouvelle valeur!

// Utilisez useEffect pour voir quand l'état change réellement
useEffect(() => {
  console.log('State actually changed to:', myState);
}, [myState]);
```

#### Solutions
1. **État non mis à jour immédiatement**
   - Utilisez le callback de mise à jour pour les états dépendants
   ```typescript
   // Problématique - l'ancienne valeur pourrait être utilisée
   setCounter(counter + 1);
   setCounter(counter + 1); // Peut utiliser la même valeur de base
   
   // Correct - Utilisation de la fonction de mise à jour
   setCounter(prev => prev + 1);
   setCounter(prev => prev + 1);
   ```

2. **Objets mutés directement**
   - Utilisez des mises à jour immuables
   ```typescript
   // Problématique - Mutation directe
   const newTodos = todos;
   newTodos[0].completed = true; // Mutation!
   setTodos(newTodos); // React ne détecte pas le changement
   
   // Correct - Création d'une nouvelle référence
   setTodos(todos.map((todo, index) => 
     index === 0 ? { ...todo, completed: true } : todo
   ));
   ```

3. **Mises à jour d'état dans des composants non montés**
   - Utilisez un drapeau de montage
   ```typescript
   useEffect(() => {
     let isMounted = true;
     
     fetchData().then(result => {
       if (isMounted) {
         setData(result);
       }
     });
     
     return () => { isMounted = false; };
   }, []);
   ```

### 3. Problèmes de performance

#### Symptômes
- Interface lente ou saccadée
- Utilisation élevée du CPU
- Warnings "component is updating too many times"

#### Diagnostic
```typescript
// Utilisez React DevTools Profiler pour identifier les rendus excessifs
// Utilisez des logs avec horodatage pour mesurer les opérations
console.time('operation-label');
expensiveOperation();
console.timeEnd('operation-label');
```

#### Solutions
1. **Rendus inutiles**
   - Utilisez `React.memo` pour éviter les rendus inutiles
   ```typescript
   // Mémoisation de composant
   const MemoizedComponent = React.memo(MyComponent, (prevProps, nextProps) => {
     return prevProps.id === nextProps.id; // Rendre uniquement si id change
   });
   ```

2. **Calculs coûteux à chaque rendu**
   - Utilisez `useMemo` et `useCallback`
   ```typescript
   // Mémoisation de valeur calculée
   const filteredItems = useMemo(() => {
     return items.filter(item => item.category === activeCategory);
   }, [items, activeCategory]);
   
   // Mémoisation de fonction
   const handleClick = useCallback(() => {
     complexOperation(param1, param2);
   }, [param1, param2]);
   ```

3. **Données volumineuses**
   - Utilisez la virtualisation pour les longues listes
   ```typescript
   import { FixedSizeList } from 'react-window';
   
   function VirtualizedList({ items }) {
     const Row = ({ index, style }) => (
       <div style={style}>
         {items[index].name}
       </div>
     );
     
     return (
       <FixedSizeList
         height={500}
         width="100%"
         itemCount={items.length}
         itemSize={35}
       >
         {Row}
       </FixedSizeList>
     );
   }
   ```

### 4. Problèmes de requêtes API

#### Symptômes
- Données non chargées
- Erreurs de requête dans la console
- Absence de gestion des états de chargement

#### Diagnostic
```typescript
// Log des requêtes et des réponses
console.log('Request payload:', requestData);
try {
  const response = await api.post('/endpoint', requestData);
  console.log('Response:', response.data);
} catch (error) {
  console.error('API Error:', error.response?.data || error.message);
}
```

#### Solutions
1. **Erreurs HTTP**
   - Implémenter une gestion d'erreur adaptée
   ```typescript
   // Utiliser try/catch avec des messages d'erreur appropriés
   try {
     await api.post('/endpoint', data);
   } catch (error) {
     if (error.response?.status === 401) {
       notifyUser('Votre session a expiré. Veuillez vous reconnecter.');
     } else if (error.response?.status === 403) {
       notifyUser('Vous n\'avez pas les droits suffisants pour cette action.');
     } else {
       notifyUser('Une erreur est survenue. Veuillez réessayer plus tard.');
       errorLoggingService.logError(error);
     }
   }
   ```

2. **Requêtes dupliquées**
   - Utiliser une clé de déduplication ou un token d'annulation
   ```typescript
   // Utilisation d'un token d'annulation
   useEffect(() => {
     const controller = new AbortController();
     const signal = controller.signal;
     
     fetchData(params, signal).catch(error => {
       if (error.name !== 'AbortError') {
         console.error(error);
       }
     });
     
     return () => controller.abort();
   }, [params]);
   ```

3. **Problèmes de synchronisation de données**
   - Utilisez SWR ou React Query pour la gestion de cache
   ```typescript
   // Avec SWR
   const { data, error, isValidating, mutate } = useSWR(
     `/api/utilisateurs/${userId}`,
     fetcher,
     { refreshInterval: 30000 }
   );
   ```

### 5. Problèmes de formulaires

#### Symptômes
- Soumission multiple du même formulaire
- Données non validées correctement
- Comportement inattendu des champs contrôlés

#### Diagnostic
```typescript
// Loguer les valeurs du formulaire à chaque étape clé
console.log('Initial values:', initialValues);
console.log('Form submission:', formValues);
console.log('Validation errors:', errors);
```

#### Solutions
1. **Soumissions multiples**
   - Utiliser un état de soumission
   ```typescript
   const [isSubmitting, setIsSubmitting] = useState(false);
   
   const handleSubmit = async (e) => {
     e.preventDefault();
     if (isSubmitting) return;
     
     setIsSubmitting(true);
     try {
       await submitForm(data);
       // Traitement réussi
     } catch (error) {
       // Gestion d'erreur
     } finally {
       setIsSubmitting(false);
     }
   };
   
   return (
     <button 
       type="submit" 
       disabled={isSubmitting} 
       onClick={handleSubmit}
     >
       {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
     </button>
   );
   ```

2. **Problèmes de validation**
   - Utilisez une bibliothèque de validation robuste
   ```typescript
   // Validation avec zod
   const formSchema = z.object({
     email: z.string().email('Email invalide'),
     password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères')
   });
   
   const { register, handleSubmit, formState: { errors } } = useForm({
     resolver: zodResolver(formSchema)
   });
   ```

3. **Champs contrôlés vs non contrôlés**
   - Soyez cohérent dans l'approche
   ```typescript
   // Champ contrôlé (recommandé pour la plupart des cas)
   const [value, setValue] = useState('');
   
   return (
     <input
       value={value}
       onChange={(e) => setValue(e.target.value)}
     />
   );
   ```

### 6. Problèmes de logique métier / Intégration inter-couches

#### Symptômes
- Comportement inattendu malgré un code apparemment correct.
- Erreurs silencieuses ou difficiles à tracer dans les appels de fonctions entre différentes parties de l'application (ex: Hooks appelant des Services).

#### Diagnostic
- Vérifier méticuleusement les types de données passés entre les couches.
- Ajouter des logs juste avant l'appel de la fonction problématique et au début de la fonction elle-même pour comparer les données reçues.
- Examiner attentivement les signatures des fonctions (types des paramètres, type de retour).

#### Solutions

1.  **Incohérence des types de données entre les couches**
    - **Problème typique :** Passage de dates sérialisées (string) à des fonctions qui attendent des objets `Date`.
    - **Solution :** Maintenir la cohérence des types. Ne convertissez les types de données (ex: `Date` en chaîne ISO) qu'aux limites externes (ex: juste avant un appel `fetch` réel) ou lorsque la fonction appelée l'exige explicitement. Assurez-vous que les signatures des fonctions sont claires et respectées par les appelants.

    ```typescript
    // --- Anti-Pattern (dans un hook) ---
    const isoStartDate = myDateObject.toISOString();
    // Le service attend un objet Date !
    const result = await myService.processData(isoStartDate); 
    
    // --- Bon Pattern (dans un hook) ---
    // Passer l'objet Date directement si le service l'attend
    const result = await myService.processData(myDateObject); 
    
    // --- Bon Pattern (dans le service, si l'API externe attend une string) ---
    async function processData(dateObject: Date) {
      // ... logique interne avec dateObject ...
      const isoDate = dateObject.toISOString(); // Conversion juste avant l'appel API
      await fetch('/api/endpoint', { body: JSON.stringify({ date: isoDate }) }); 
    }
    ```

### 8. Débogage des Tests Cypress End-to-End

#### Symptômes
- Tests Cypress qui échouent de manière inattendue
- Tests inconsistants (parfois réussis, parfois échoués)
- Problèmes de synchronisation (éléments non trouvés, actions prématurées)
- Échec lors de CI mais succès en local

#### Diagnostic

```typescript
// Utiliser debug() pour arrêter l'exécution et inspecter
cy.get('.problematic-element').debug().click();

// Utiliser pause() pour arrêter l'exécution et permettre une inspection manuelle
cy.pause();

// Afficher les logs détaillés
Cypress.config('debugMode', true);

// Capture d'écran manuelle à un point précis
cy.screenshot('debug-screenshot');
```

#### Solutions

1. **Problèmes de synchronisation**
   - Utilisez les assertions explicites au lieu des timeouts
   ```typescript
   // À éviter
   cy.wait(2000);
   cy.get('button').click();
   
   // Privilégier
   cy.get('button').should('be.visible').click();
   ```

2. **Sélection d'éléments instable**
   - Utilisez des attributs `data-cy` dédiés et stables
   ```typescript
   // À éviter
   cy.get('.btn.primary.large').click();
   
   // Privilégier
   cy.get('[data-cy=submit-button]').click();
   ```

3. **Défaillances en CI mais pas en local**
   - Examinez les vidéos et captures d'écran générées en CI
   - Vérifiez les différences de configuration (résolution, délais)
   - Ajoutez des assertions plus robustes
   ```typescript
   cy.get('[data-cy=form]', { timeout: 10000 }).should('be.visible');
   ```

4. **Détection et résolution des stubs et mocks défectueux**
   - Vérifiez que les interceptions correspondent aux requêtes réelles
   ```typescript
   // Vérifier que l'interception est bien appelée
   cy.intercept('POST', '/api/leave').as('leaveSubmit');
   cy.get('[data-cy=submit-button]').click();
   cy.wait('@leaveSubmit').then(interception => {
     console.log('Intercepted request:', interception.request);
     console.log('Intercepted response:', interception.response);
   });
   ```

5. **Tests de données instables**
   - Utilisez la réinitialisation de base de données avant chaque test
   ```typescript
   beforeEach(() => {
     cy.task('resetTestDatabase');
     cy.task('seedTestData', { fixtures: ['users', 'leaves'] });
   });
   ```

6. **Problèmes d'authentification et de session**
   - Utilisez des commandes comme `cy.loginByApi()` pour contourner l'UI
   - Vérifiez la persistance des cookies et du localStorage
   ```typescript
   cy.getCookie('session').should('exist');
   cy.window().its('localStorage.authToken').should('exist');
   ```

7. **Audit d'accessibilité et performance échouent**
   - Examinez les rapports détaillés générés
   ```bash
   # Ouvrir les rapports d'accessibilité
   open cypress/reports/a11y/
   
   # Examiner les rapports de performance
   open cypress/reports/lighthouse/
   ```
   - Ajustez les seuils ou corrigez les problèmes selon le contexte

8. **Tests qui prennent trop de temps**
   - Utilisez des raccourcis comme `cy.loginByApi()` plutôt que UI
   - Limitez l'étendue des tests (tester une fonctionnalité, pas un flow complet)
   - Optimisez les fixtures et les seeds de données

#### Outils de Diagnostic Avancés

1. **Mode open de Cypress**
   ```bash
   npx cypress open
   ```

2. **Exécution d'un test spécifique**
   ```bash
   npx cypress run --spec "cypress/e2e/chemin/vers/test.spec.ts"
   ```

3. **Activation des logs de débogage**
   ```typescript
   // Dans le test
   Cypress.config('verbose', true);
   
   // En ligne de commande
   DEBUG=cypress:* npx cypress run
   ```

4. **Inspection des rapports**
   ```bash
   # Génération des rapports
   npm run cypress:reports
   
   # Ouvrir le rapport
   open cypress/reports/mocha/report.html
   ```

### 9. Problèmes spécifiques des tests responsives et multi-navigateurs

#### Symptômes
- Tests qui fonctionnent sur un navigateur mais pas sur d'autres
- Comportements différents selon la taille d'écran
- Échecs uniquement sur certaines résolutions

#### Diagnostic

```typescript
// Logs spécifiques à la résolution courante
cy.viewport('iphone-6').then(() => {
  cy.log(`Testing on resolution: ${Cypress.config('viewportWidth')}x${Cypress.config('viewportHeight')}`);
});

// Capture d'écran avec indication de la résolution
cy.screenshot(`debug-${Cypress.config('viewportWidth')}x${Cypress.config('viewportHeight')}`);
```

#### Solutions

1. **Tests échouant sur un navigateur spécifique**
   - Utilisez des conditions spécifiques au navigateur
   ```typescript
   if (Cypress.browser.name === 'chrome') {
     // Tests spécifiques à Chrome
   } else if (Cypress.browser.name === 'firefox') {
     // Tests spécifiques à Firefox
   }
   ```

2. **Problèmes de mise en page responsive**
   - Utilisez la commande personnalisée pour tester sur différents viewports
   ```typescript
   // Tester un même flow sur plusieurs résolutions
   ['mobile', 'tablet', 'desktop'].forEach(device => {
     it(`fonctionne sur ${device}`, () => {
       cy.viewportDevice(device);
       // Effectuer les actions de test
     });
   });
   ```

3. **Comportements d'interface inconsistants**
   - Rendez les tests adaptatifs à la résolution
   ```typescript
   cy.viewportDevice('mobile');
   
   // Sur mobile, vérifier le menu hamburger
   cy.get('[data-cy=mobile-menu-button]').should('be.visible').click();
   cy.get('[data-cy=nav-menu]').should('be.visible');
   
   cy.viewportDevice('desktop');
   
   // Sur desktop, le menu est toujours visible
   cy.get('[data-cy=nav-menu]').should('be.visible');
   cy.get('[data-cy=mobile-menu-button]').should('not.exist');
   ```

## Outils de Débogage

### React DevTools
1. Installez l'extension dans votre navigateur
2. Utilisez l'onglet Components pour inspecter la hiérarchie et les props
3. Utilisez l'onglet Profiler pour identifier les problèmes de performance

```bash
# Installation en ligne de commande
npm install -g react-devtools
```

### Inspecteur réseau
1. Ouvrez les DevTools du navigateur (F12)
2. Allez dans l'onglet Network
3. Filtrez par XHR/Fetch pour voir uniquement les requêtes API
4. Analysez les requêtes, les codes de réponse et les délais

### Redux DevTools (si utilisé)
1. Installez l'extension dans votre navigateur
2. Suivez les actions dispatched et les changements d'état
3. Utilisez la fonction "time travel" pour revenir à des états précédents

## Journalisation (Logging)

### Configuration du logger
```typescript
// Niveaux de log par environnement
const logLevel = process.env.NODE_ENV === 'production' 
  ? 'error' 
  : 'debug';

// Utilisation du logger
logger.debug('Information détaillée pour le développement');
logger.info('Information générale');
logger.warn('Avertissement');
logger.error('Erreur critique', { 
  errorCode: 'AUTH_FAILED',
  context: { userId, attemptTime: new Date() }
});
```

### Format de log recommandé
```typescript
logger.log({
  level: 'error',
  message: 'Description claire du problème',
  context: {
    component: 'UserAuthentication',
    action: 'login',
    userId: user.id,
  },
  error: {
    name: error.name,
    message: error.message,
    stack: error.stack,
  },
  timestamp: new Date().toISOString()
});
```

## Ressources Additionnelles

1. [Déboguer dans React DevTools](https://reactjs.org/blog/2019/08/15/new-react-devtools.html)
2. [Common React Errors](https://reactjs.org/docs/error-boundaries.html)
3. [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools/) 