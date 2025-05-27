# Améliorations de Performance - Mathildanesth

## Vue d'ensemble

Ce document détaille toutes les optimisations de performance implémentées dans l'application Mathildanesth.

## 1. Optimisations de l'authentification

### Problème initial
- Page d'authentification : **10.3 secondes** de chargement
- API `/auth/me` appelée de manière répétitive sans cache

### Solutions implémentées

#### 1.1 Cache multi-niveaux pour `/auth/me`
```typescript
// Hiérarchie de cache :
1. Session NextAuth (immédiat)
2. Cache mémoire (30 secondes)
3. Cache Redis (5 minutes)
4. Base de données (fallback)
```

**Résultats :**
- Session NextAuth : < 5ms
- Cache mémoire : < 1ms
- Cache Redis : < 10ms
- Base de données : ~50-100ms

#### 1.2 Instance Prisma partagée
```typescript
// Avant : Nouvelle instance à chaque requête
const prisma = new PrismaClient();

// Après : Instance unique réutilisée
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});
```

#### 1.3 Optimisation des requêtes Prisma
```typescript
// Sélection minimale des champs
const user = await prisma.user.findUnique({
    where: { id: authResult.userId },
    select: {
        id: true,
        login: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        // Pas de relations inutiles
    },
});
```

## 2. Service de monitoring de performance

### PerformanceMonitoringService
Service complet pour tracker les métriques de performance en temps réel :

```typescript
// Utilisation simple
const duration = performanceMonitor.measureAsync('operation_name', async () => {
    // Code à mesurer
});

// Alertes automatiques si dégradation > 20%
performanceMonitor.setBaseline('operation_name', 100); // 100ms baseline
```

### API de monitoring
- `POST /api/monitoring/metrics` : Enregistrer des métriques
- `GET /api/monitoring/metrics` : Consulter les métriques (admin only)

### Dashboard de performance
Composant React pour visualiser les métriques en temps réel :
- Affichage des opérations les plus lentes
- Statistiques (moyenne, min, max, p95)
- Export des métriques en JSON

## 3. Optimisations des tests

### Problème initial
- 285 tests échouent sur 1395 (20% d'échec)
- Erreur systémique : "Response.json is not a function"
- Conflits entre polyfills

### Solutions implémentées

#### 3.1 Correction des polyfills
```javascript
// jest.polyfills.js - Wrapper pour Response avec méthode json()
class ResponseWrapper {
  async json() {
    if (this._response.json) {
      return this._response.json();
    }
    const text = await this._response.text();
    return JSON.parse(text);
  }
}
```

#### 3.2 Élimination des conflits de polyfills
- Suppression de la double définition de fetch dans jest.setup.js
- Centralisation des polyfills dans jest.polyfills.js

## 4. Optimisations du planning hebdomadaire

### À implémenter

#### 4.1 Virtualisation des événements
```typescript
// Utiliser react-window ou react-virtualized
import { FixedSizeList } from 'react-window';

// Afficher seulement les événements visibles
<FixedSizeList
  height={600}
  itemCount={events.length}
  itemSize={50}
>
  {({ index, style }) => (
    <EventComponent event={events[index]} style={style} />
  )}
</FixedSizeList>
```

#### 4.2 Pagination côté serveur
```typescript
// API avec pagination
GET /api/planning?page=1&limit=50&startDate=2024-01-01&endDate=2024-01-07

// Réponse
{
  data: [...],
  pagination: {
    page: 1,
    limit: 50,
    total: 200,
    hasNext: true
  }
}
```

#### 4.3 Optimistic updates
```typescript
// Mise à jour immédiate de l'UI
const handleDrop = async (event) => {
  // 1. Mise à jour optimiste
  updateUIOptimistically(event);
  
  try {
    // 2. Appel API
    await updateEvent(event);
  } catch (error) {
    // 3. Rollback si erreur
    rollbackUI(event);
  }
};
```

## 5. Métriques de performance cibles

### Objectifs
| Page/Opération | Actuel | Cible | Status |
|----------------|--------|-------|--------|
| Page d'auth | 10.3s | < 1s | 🟡 En cours |
| API /auth/me | 500ms | < 50ms | ✅ Optimisé |
| Planning hebdo | 6s | < 2s | 🔴 À faire |
| Chargement initial | 8s | < 3s | 🔴 À faire |

### Baselines établies
```typescript
// Opérations critiques
performanceMonitor.setBaseline('auth_me_api', 50);
performanceMonitor.setBaseline('planning_load', 2000);
performanceMonitor.setBaseline('leave_submit', 500);
```

## 6. Bonnes pratiques adoptées

### 6.1 Lazy Loading
- Composants lourds chargés à la demande
- Images optimisées avec next/image
- Routes dynamiques avec import()

### 6.2 Memoization
```typescript
// Utilisation de useMemo pour calculs coûteux
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(deps);
}, [deps]);

// React.memo pour composants purs
export default React.memo(Component);
```

### 6.3 Debouncing
```typescript
// Recherche avec debounce
const debouncedSearch = useMemo(
  () => debounce(handleSearch, 300),
  []
);
```

## 7. Outils de monitoring

### Browser DevTools
- Performance tab pour profiling
- Network tab pour analyser les requêtes
- Coverage tab pour code non utilisé

### Lighthouse
```bash
# Audit de performance
npm run build && npm run start
# Puis Lighthouse dans Chrome DevTools
```

### Bundle Analyzer
```bash
# Analyser la taille des bundles
npm run analyze
```

## 8. Prochaines étapes

1. **Implémenter la virtualisation** du planning hebdomadaire
2. **Ajouter Service Worker** pour cache offline
3. **Optimiser les images** avec formats modernes (WebP, AVIF)
4. **Code splitting** plus agressif
5. **Préchargement intelligent** des données
6. **Compression Brotli** sur le serveur

## 9. Scripts de performance

### Test de charge
```bash
# Simuler 100 utilisateurs simultanés
npm run test:load

# Benchmark des APIs critiques
npm run benchmark:api
```

### Monitoring continu
```bash
# Démarrer le monitoring
npm run monitoring:start

# Rapport quotidien
npm run performance:daily-report
```

## 10. Checklist de validation

- [ ] Toutes les pages chargent en < 2s
- [ ] Aucune requête API > 500ms
- [ ] Time to Interactive < 3s
- [ ] First Contentful Paint < 1s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Pas de memory leaks détectés
- [ ] Bundle size < 500KB (gzipped)